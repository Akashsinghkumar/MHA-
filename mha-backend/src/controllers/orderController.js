import prisma from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { createGatewayOrder, verifyGatewaySignature } from '../services/paymentService.js';
import { processOrderMlmRewards } from '../services/mlmService.js';
import { sendEmail } from '../services/notificationService.js';

export async function createOrder(req, res, next) {
  try {
    const { shippingAddress, addressId, paymentMethod, couponCode } = req.body;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: true },
    });
    if (cartItems.length === 0) {
      throw new AppError('Your cart is empty', 400);
    }

    let subtotal = 0;
    const orderItemsData = cartItems.map((item) => {
      const price = Number(item.product.offerPrice);
      const lineTotal = price * item.quantity;
      subtotal += lineTotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        price,
        subtotal: lineTotal,
      };
    });

    let discountAmount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.trim().toUpperCase() },
      });
      if (
        coupon &&
        coupon.isActive &&
        (!coupon.expiryDate || coupon.expiryDate > new Date()) &&
        subtotal >= Number(coupon.minOrder) &&
        (!coupon.maxUses || coupon.usedCount < coupon.maxUses)
      ) {
        discountAmount =
          coupon.discountType === 'percentage'
            ? Number(((subtotal * Number(coupon.discountValue)) / 100).toFixed(2))
            : Number(coupon.discountValue);
        discountAmount = Math.min(discountAmount, subtotal);
        appliedCoupon = coupon;
      }
    }

    const total = Math.max(0, subtotal - discountAmount);
    const orderNumber = `MHA${Date.now().toString().slice(-7)}`;

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: req.user.id,
          addressId: addressId ? Number(addressId) : null,
          shippingAddress,
          subtotal,
          discountAmount,
          total,
          couponCode: appliedCoupon?.code || null,
          paymentMethod,
          paymentStatus: paymentMethod === 'Cash on delivery' ? 'Pending' : 'Pending',
          unitsEarned: Math.floor(total / 5000),
          items: { create: orderItemsData },
        },
        include: { items: { include: { product: true } } },
      });

      if (appliedCoupon) {
        await tx.coupon.update({
          where: { id: appliedCoupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      await tx.cartItem.deleteMany({ where: { userId: req.user.id } });
      return created;
    });

    let gatewayPayload = null;
    if (paymentMethod !== 'Cash on delivery') {
      gatewayPayload = await createGatewayOrder({
        amountInr: total,
        receipt: order.orderNumber,
      });
      await prisma.payment.create({
        data: {
          orderId: order.id,
          gateway: gatewayPayload.gateway,
          gatewayOrderId: gatewayPayload.gatewayOrderId,
          amount: total,
          status: 'Created',
        },
      });
    } else {
      await processOrderMlmRewards({
        userId: req.user.id,
        orderId: order.id,
        orderTotal: total,
      });
    }

    if (req.user.email) {
      await sendEmail({
        to: req.user.email,
        subject: `Order Confirmed: ${order.orderNumber}`,
        text: `Thank you for shopping with MHA! Order ${order.orderNumber} total: ₹${total}`,
      });
    }

    res.status(201).json({ order, gateway: gatewayPayload });
  } catch (err) {
    next(err);
  }
}

export async function verifyOrderPayment(req, res, next) {
  try {
    const { orderId, gatewayOrderId, gatewayPaymentId, gatewaySignature } = req.body;
    const isValid = verifyGatewaySignature({
      gatewayOrderId,
      gatewayPaymentId,
      gatewaySignature,
    });
    if (!isValid) {
      throw new AppError('Payment signature verification failed', 400);
    }

    const order = await prisma.order.findFirst({
      where: { id: Number(orderId), userId: req.user.id },
    });
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    await prisma.$transaction([
      prisma.payment.updateMany({
        where: { orderId: order.id, gatewayOrderId },
        data: {
          gatewayPaymentId,
          gatewaySignature,
          status: 'Paid',
        },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'Paid' },
      }),
    ]);

    const rewards = await processOrderMlmRewards({
      userId: req.user.id,
      orderId: order.id,
      orderTotal: Number(order.total),
    });

    res.json({ message: 'Payment verified', orderId: order.id, rewards });
  } catch (err) {
    next(err);
  }
}

export async function getMyOrders(req, res, next) {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: { include: { product: { select: { id: true, name: true, imageUrl: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

export async function getOrderById(req, res, next) {
  try {
    const id = Number(req.params.id);
    const order = await prisma.order.findFirst({
      where: { id, userId: req.user.id },
      include: { items: { include: { product: true } }, payments: true },
    });
    if (!order) throw new AppError('Order not found', 404);
    res.json({ order });
  } catch (err) {
    next(err);
  }
}

export async function trackOrder(req, res, next) {
  try {
    const orderNumber = String(req.params.id).trim().toUpperCase();
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        orderNumber: true,
        status: true,
        statusNote: true,
        paymentMethod: true,
        paymentStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!order) throw new AppError('Order not found', 404);
    res.json({ order });
  } catch (err) {
    next(err);
  }
}

export async function cancelOrder(req, res, next) {
  try {
    const id = Number(req.params.id);
    const order = await prisma.order.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!order) throw new AppError('Order not found', 404);
    if (['Shipped', 'Out for delivery', 'Delivered', 'Cancelled'].includes(order.status)) {
      throw new AppError(`Cannot cancel order in ${order.status} state`, 400);
    }

    const nextPaymentStatus = order.paymentStatus === 'Paid' ? 'Refund Pending' : order.paymentStatus;
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'Cancelled',
        paymentStatus: nextPaymentStatus,
        statusNote: req.body?.reason ? `Cancelled by customer: ${String(req.body.reason).slice(0, 120)}` : 'Cancelled by customer',
      },
    });
    res.json({ order: updated });
  } catch (err) {
    next(err);
  }
}

export async function requestReturnOrder(req, res, next) {
  try {
    const id = Number(req.params.id);
    const reason = String(req.body?.reason || '').trim();
    if (reason.length < 5) {
      throw new AppError('Please provide a reason for return (min 5 characters)', 400);
    }
    const order = await prisma.order.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!order) throw new AppError('Order not found', 404);
    if (order.status !== 'Delivered') {
      throw new AppError('Returns can only be requested for delivered orders', 400);
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'Return Requested',
        statusNote: `Return requested: ${reason.slice(0, 160)}`,
      },
    });
    res.json({ order: updated });
  } catch (err) {
    next(err);
  }
}
