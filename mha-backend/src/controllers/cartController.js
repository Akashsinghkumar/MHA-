import prisma from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getCart(req, res, next) {
  try {
    const items = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: true },
      orderBy: { id: 'asc' },
    });

    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.product.offerPrice) * item.quantity,
      0
    );

    res.json({
      items,
      subtotal,
      unitsEarnedPreview: Math.floor(subtotal / 5000),
      carryForwardPreview: subtotal % 5000,
    });
  } catch (err) {
    next(err);
  }
}

export async function addToCart(req, res, next) {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
    if (!product || !product.isActive) {
      throw new AppError('Product not available', 404);
    }
    if (product.stock < quantity) {
      throw new AppError('Insufficient stock', 400);
    }

    const item = await prisma.cartItem.upsert({
      where: {
        userId_productId: { userId: req.user.id, productId: Number(productId) },
      },
      update: { quantity: { increment: Number(quantity) } },
      create: {
        userId: req.user.id,
        productId: Number(productId),
        quantity: Number(quantity),
      },
      include: { product: true },
    });

    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
}

export async function updateCartItem(req, res, next) {
  try {
    const itemId = Number(req.params.itemId);
    const { quantity } = req.body;

    if (quantity <= 0) {
      await prisma.cartItem.deleteMany({
        where: { id: itemId, userId: req.user.id },
      });
      return res.json({ message: 'Item removed from cart' });
    }

    const existing = await prisma.cartItem.findFirst({
      where: { id: itemId, userId: req.user.id },
    });
    if (!existing) {
      throw new AppError('Cart item not found', 404);
    }

    const updated = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: Number(quantity) },
      include: { product: true },
    });
    res.json({ item: updated });
  } catch (err) {
    next(err);
  }
}

export async function removeCartItem(req, res, next) {
  try {
    const itemId = Number(req.params.itemId);
    await prisma.cartItem.deleteMany({
      where: { id: itemId, userId: req.user.id },
    });
    res.json({ message: 'Item removed' });
  } catch (err) {
    next(err);
  }
}
