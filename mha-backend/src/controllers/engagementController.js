import prisma from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getWishlist(req, res, next) {
  try {
    const items = await prisma.wishlist.findMany({
      where: { userId: req.user.id },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

export async function addToWishlist(req, res, next) {
  try {
    const productId = Number(req.params.productId);
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new AppError('Product not found', 404);

    const item = await prisma.wishlist.upsert({
      where: { userId_productId: { userId: req.user.id, productId } },
      update: {},
      create: { userId: req.user.id, productId },
    });
    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
}

export async function removeFromWishlist(req, res, next) {
  try {
    const productId = Number(req.params.productId);
    await prisma.wishlist.deleteMany({
      where: { userId: req.user.id, productId },
    });
    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    next(err);
  }
}

export async function getProductReviews(req, res, next) {
  try {
    const productId = Number(req.params.id);
    const reviews = await prisma.review.findMany({
      where: { productId, isApproved: true },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ reviews });
  } catch (err) {
    next(err);
  }
}

export async function createReview(req, res, next) {
  try {
    const { productId, rating, reviewText } = req.body;
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId: Number(productId),
        order: { userId: req.user.id, status: 'Delivered' },
      },
    });

    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        productId: Number(productId),
        rating: Math.min(5, Math.max(1, Number(rating))),
        reviewText,
        isVerified: Boolean(hasPurchased),
      },
    });
    res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
}

export async function applyCoupon(req, res, next) {
  try {
    const { code, subtotal } = req.body;
    const coupon = await prisma.coupon.findUnique({
      where: { code: String(code).trim().toUpperCase() },
    });
    if (!coupon || !coupon.isActive) {
      throw new AppError('Invalid or inactive coupon code', 400);
    }
    if (coupon.expiryDate && coupon.expiryDate < new Date()) {
      throw new AppError('Coupon has expired', 400);
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw new AppError('Coupon usage limit reached', 400);
    }
    if (Number(subtotal) < Number(coupon.minOrder)) {
      throw new AppError(`Minimum order of ₹${coupon.minOrder} required`, 400);
    }

    const discountAmount =
      coupon.discountType === 'percentage'
        ? Number(((Number(subtotal) * Number(coupon.discountValue)) / 100).toFixed(2))
        : Number(coupon.discountValue);

    res.json({
      code: coupon.code,
      discountAmount: Math.min(discountAmount, Number(subtotal)),
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    });
  } catch (err) {
    next(err);
  }
}
