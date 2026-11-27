import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import env from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { getUploadedFileUrl } from '../services/uploadService.js';
import { createAndSendOtp, verifyOtpCode } from '../services/otpService.js';
import { refundGatewayPayment } from '../services/paymentService.js';

async function logAdminAction(adminId, action, details, ip) {
  try {
    await prisma.adminLog.create({
      data: { adminId, action, details, ip },
    });
  } catch {
    // Non-blocking audit log
  }
}

// ==================== AUTH & DASHBOARD ====================

function hasHttpsEmailProvider() {
  return Boolean(
    process.env.RESEND_API_KEY ||
      process.env.BREVO_API_KEY ||
      process.env.OTP_DEV_MODE === 'true'
  );
}

export async function adminLogin(req, res, next) {
  try {
    const { username, password, otp } = req.body;
    const identifier = String(username || '').trim();
    const admin = await prisma.adminUser.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier.toLowerCase() }],
      },
    });
    if (!admin || !admin.isActive) {
      throw new AppError('Invalid admin credentials', 401);
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      await logAdminAction(admin.id, 'ADMIN_LOGIN_FAILED', `Failed password attempt for ${admin.username}`, req.ip);
      throw new AppError('Invalid admin credentials', 401);
    }

    const twoFactorActive =
      process.env.ADMIN_2FA_ENABLED === 'true' ||
      (process.env.ADMIN_2FA_ENABLED !== 'false' && hasHttpsEmailProvider());
    if (twoFactorActive && admin.email) {
      if (!otp) {
        const otpRes = await createAndSendOtp({
          channel: 'email',
          target: admin.email,
          purpose: 'admin_login',
        });
        const [localPart, domain] = admin.email.split('@');
        const masked = `${localPart.slice(0, 2)}***@${domain}`;
        return res.json({
          requiresOtp: true,
          emailMasked: masked,
          message: `Verification OTP sent to ${masked}`,
          ...(otpRes.devOtp ? { devOtp: otpRes.devOtp } : {}),
        });
      }
      await verifyOtpCode({
        channel: 'email',
        target: admin.email,
        code: otp,
        purpose: 'admin_login',
      });
    }

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const token = jwt.sign({ adminId: admin.id, role: admin.role }, env.adminJwtSecret, {
      expiresIn: env.adminJwtExpiresIn,
    });

    await logAdminAction(admin.id, 'ADMIN_LOGIN', `Signed in as ${admin.username}`, req.ip);

    res.json({
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        mustChangePassword: password === 'ChangeMeAdmin123!',
      },
      token,
    });
  } catch (err) {
    next(err);
  }
}

export async function adminSendResetOtp(req, res, next) {
  try {
    const identifier = String(req.body.identifier || '').trim();
    const admin = await prisma.adminUser.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier.toLowerCase() }],
      },
    });
    if (!admin || !admin.isActive || !admin.email) {
      throw new AppError('No active admin account found with that username or email', 404);
    }
    const otpRes = await createAndSendOtp({
      channel: 'email',
      target: admin.email,
      purpose: 'admin_reset',
    });
    const [localPart, domain] = admin.email.split('@');
    const masked = `${localPart.slice(0, 2)}***@${domain}`;
    res.json({
      emailMasked: masked,
      message: `Reset OTP sent to ${masked}`,
      ...(otpRes.devOtp ? { devOtp: otpRes.devOtp } : {}),
    });
  } catch (err) {
    next(err);
  }
}

export async function adminResetPassword(req, res, next) {
  try {
    const { identifier, otp, newPassword } = req.body;
    if (!identifier || !otp || !newPassword || newPassword.length < 8) {
      throw new AppError('Username/email, 6-digit OTP, and new password (min 8 chars) are required', 400);
    }
    const cleanId = String(identifier).trim();
    const admin = await prisma.adminUser.findFirst({
      where: {
        OR: [{ username: cleanId }, { email: cleanId.toLowerCase() }],
      },
    });
    if (!admin || !admin.isActive || !admin.email) {
      throw new AppError('Admin account not found', 404);
    }
    await verifyOtpCode({
      channel: 'email',
      target: admin.email,
      code: String(otp).trim(),
      purpose: 'admin_reset',
    });
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { passwordHash },
    });
    await logAdminAction(admin.id, 'ADMIN_PASSWORD_RESET', `Password reset via OTP for ${admin.username}`, req.ip);
    res.json({ message: 'Admin password reset successfully. Please sign in.' });
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateProfile(req, res, next) {
  try {
    const { username, email } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanUsername = String(username || '').trim();
    if (!cleanUsername || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new AppError('Valid username and email address are required', 400);
    }
    const updated = await prisma.adminUser.update({
      where: { id: req.admin.id },
      data: { username: cleanUsername, email: cleanEmail },
      select: { id: true, username: true, email: true, role: true, permissions: true },
    });
    await logAdminAction(req.admin.id, 'ADMIN_PROFILE_UPDATE', `Updated profile (${updated.username} / ${updated.email})`, req.ip);
    res.json({ admin: updated, message: 'Admin profile updated.' });
  } catch (err) {
    next(err);
  }
}

export async function adminChangePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      throw new AppError('Current password and new password (min 8 chars) are required', 400);
    }
    const admin = await prisma.adminUser.findUnique({ where: { id: req.admin.id } });
    if (!admin) {
      throw new AppError('Admin not found', 404);
    }
    const ok = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!ok) {
      throw new AppError('Current password is incorrect', 401);
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { passwordHash },
    });
    await logAdminAction(admin.id, 'ADMIN_PASSWORD_CHANGED', `Password changed for ${admin.username}`, req.ip);
    res.json({ message: 'Admin password updated successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function adminRegister(req, res, next) {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password || password.length < 6) {
      throw new AppError('Username, valid email, and password (min 6 chars) are required', 400);
    }

    const existing = await prisma.adminUser.findFirst({
      where: {
        OR: [
          { username: username.trim() },
          { email: email.trim().toLowerCase() },
        ],
      },
    });
    if (existing) {
      throw new AppError('Admin username or email already exists', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const adminRole = ['SUPER_ADMIN', 'MANAGER', 'SUPPORT_STAFF', 'FINANCE'].includes(role)
      ? role
      : 'MANAGER';
    const perms = adminRole === 'SUPER_ADMIN' ? ['*'] : ['products', 'orders', 'users', 'kyc', 'support'];

    const admin = await prisma.adminUser.create({
      data: {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: adminRole,
        permissions: perms,
      },
    });

    const token = jwt.sign({ adminId: admin.id, role: admin.role }, env.adminJwtSecret, {
      expiresIn: env.adminJwtExpiresIn,
    });

    await logAdminAction(req.admin?.id || admin.id, 'ADMIN_REGISTER', `Created staff admin ${admin.username} (${admin.role})`, req.ip);

    res.status(201).json({
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: perms,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
}

export async function getDashboardStats(_req, res, next) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalMembers,
      ordersToday,
      totalOrders,
      pendingKyc,
      pendingPayouts,
      revenueAgg,
      lowStockProducts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.count(),
      prisma.kycDocument.count({ where: { status: 'Pending' } }),
      prisma.payout.count({ where: { status: 'Pending' } }),
      prisma.order.aggregate({
        where: { status: { not: 'Cancelled' } },
        _sum: { total: true },
      }),
      prisma.product.count({ where: { stock: { lte: 5 }, isActive: true } }),
    ]);

    res.json({
      stats: {
        totalMembers,
        ordersToday,
        totalOrders,
        pendingKyc,
        pendingPayouts,
        totalRevenue: Number(revenueAgg._sum.total || 0),
        lowStockProducts,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ==================== PRODUCTS & CATEGORIES ====================

export async function adminCreateProduct(req, res, next) {
  try {
    const {
      name,
      description,
      categoryId,
      subcategory,
      brand,
      actualPrice,
      offerPrice,
      rating,
      stock,
      tags,
    } = req.body;
    const imageUrl = req.file ? await getUploadedFileUrl(req.file) : req.body.imageUrl || '/image/AllEle.webp';

    const product = await prisma.product.create({
      data: {
        name,
        description,
        categoryId: Number(categoryId),
        subcategory,
        brand: brand || 'MHA',
        actualPrice: Number(actualPrice),
        offerPrice: Number(offerPrice),
        rating: rating !== undefined ? Number(rating) : 4.5,
        stock: stock !== undefined ? Number(stock) : 50,
        imageUrl,
        tags: Array.isArray(tags)
          ? tags
          : typeof tags === 'string' && tags.startsWith('[')
            ? JSON.parse(tags)
            : [],
      },
    });

    await logAdminAction(req.admin.id, 'CREATE_PRODUCT', `Created product #${product.id}: ${product.name}`, req.ip);
    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = { ...req.body };
    if (req.file) data.imageUrl = await getUploadedFileUrl(req.file);
    if (data.categoryId) data.categoryId = Number(data.categoryId);
    if (data.actualPrice) data.actualPrice = Number(data.actualPrice);
    if (data.offerPrice) data.offerPrice = Number(data.offerPrice);
    if (data.rating !== undefined) data.rating = Number(data.rating);
    if (data.stock !== undefined) data.stock = Number(data.stock);
    if (typeof data.tags === 'string') {
      try { data.tags = JSON.parse(data.tags); } catch { data.tags = [data.tags]; }
    }

    const product = await prisma.product.update({ where: { id }, data });
    await logAdminAction(req.admin.id, 'UPDATE_PRODUCT', `Updated product #${id}`, req.ip);
    res.json({ product });
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    await logAdminAction(req.admin.id, 'DELETE_PRODUCT', `Deactivated product #${id}`, req.ip);
    res.json({ message: 'Product deactivated' });
  } catch (err) {
    next(err);
  }
}

export async function adminUpsertCategory(req, res, next) {
  try {
    const { id, name, slug, sortOrder } = req.body;
    const imageUrl = req.file ? await getUploadedFileUrl(req.file) : req.body.imageUrl;
    const category = id
      ? await prisma.category.update({
          where: { id: Number(id) },
          data: { name, slug, sortOrder: Number(sortOrder || 0), ...(imageUrl ? { imageUrl } : {}) },
        })
      : await prisma.category.create({
          data: { name, slug, sortOrder: Number(sortOrder || 0), imageUrl },
        });
    res.json({ category });
  } catch (err) {
    next(err);
  }
}

// ==================== ORDERS & PAYMENTS ====================

export async function adminListOrders(req, res, next) {
  try {
    const { status } = req.query;
    const orders = await prisma.order.findMany({
      where: status ? { status: String(status) } : {},
      include: {
        user: { select: { id: true, name: true, phone: true } },
        items: { include: { product: { select: { name: true } } } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateOrderStatus(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { status, statusNote } = req.body;
    const order = await prisma.order.update({
      where: { id },
      data: { status, statusNote },
    });
    await logAdminAction(req.admin.id, 'UPDATE_ORDER', `Order #${order.orderNumber} -> ${status}`, req.ip);
    res.json({ order });
  } catch (err) {
    next(err);
  }
}

export async function adminRefundOrder(req, res, next) {
  try {
    const id = Number(req.params.id);
    const order = await prisma.order.findUnique({
      where: { id },
      include: { payments: { where: { status: 'Paid' }, orderBy: { id: 'desc' }, take: 1 } },
    });
    if (!order) throw new AppError('Order not found', 404);
    if (order.paymentStatus === 'Refunded') {
      throw new AppError('Order is already refunded', 400);
    }

    const paidPayment = order.payments?.[0];
    const refundRes = await refundGatewayPayment({
      gatewayPaymentId: paidPayment?.gatewayPaymentId,
      amountInr: Number(order.total),
      notes: { orderNumber: order.orderNumber },
    });

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'Refunded',
        paymentStatus: 'Refunded',
        statusNote: `Refund processed (${refundRes.refundId})`,
      },
    });

    await logAdminAction(
      req.admin.id,
      'ADMIN_ORDER_REFUND',
      `Refunded Order #${order.orderNumber} (${refundRes.refundId})`,
      req.ip
    );
    res.json({ order: updated, refund: refundRes });
  } catch (err) {
    next(err);
  }
}

// ==================== USERS & KYC ====================

export async function adminListUsers(req, res, next) {
  try {
    const q = String(req.query.q || '').trim();
    const where = q
      ? {
          OR: [
            { name: { contains: q } },
            { phone: { contains: q } },
            { email: { contains: q } },
            { referralCode: { contains: q } },
          ],
        }
      : {};

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        referralCode: true,
        referredBy: { select: { id: true, name: true, referralCode: true } },
        kycStatus: true,
        isBlocked: true,
        carryForward: true,
        createdAt: true,
        _count: { select: { orders: true, units: true, referrals: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

export async function adminGetUserDetail(req, res, next) {
  try {
    const id = Number(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        referralCode: true,
        referredBy: { select: { id: true, name: true, phone: true, referralCode: true } },
        kycStatus: true,
        isBlocked: true,
        carryForward: true,
        createdAt: true,
        addresses: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { id: true, orderNumber: true, total: true, status: true, paymentMethod: true, paymentStatus: true, createdAt: true },
        },
        units: true,
        kycDocuments: { orderBy: { createdAt: 'desc' } },
        _count: { select: { orders: true, units: true, referrals: true } },
      },
    });
    if (!user) throw new AppError('User not found', 404);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function adminToggleUserBlock(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const { isBlocked } = req.body;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isBlocked: Boolean(isBlocked) },
    });
    await logAdminAction(req.admin.id, 'USER_BLOCK_TOGGLE', `User #${userId} blocked=${isBlocked}`, req.ip);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function adminListKycQueue(_req, res, next) {
  try {
    const queue = await prisma.kycDocument.findMany({
      include: { user: { select: { id: true, name: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ queue });
  } catch (err) {
    next(err);
  }
}

export async function adminReviewKyc(req, res, next) {
  try {
    const userId = Number(req.params.userId);
    const { status, reviewNote } = req.body; // Approved or Rejected
    const userStatus = status === 'Approved' ? 'Verified' : 'Rejected';

    await prisma.$transaction([
      prisma.kycDocument.updateMany({
        where: { userId, status: 'Pending' },
        data: { status, reviewNote, reviewedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { kycStatus: userStatus },
      }),
    ]);

    await logAdminAction(req.admin.id, 'REVIEW_KYC', `User #${userId} KYC -> ${userStatus}`, req.ip);
    res.json({ message: `KYC ${userStatus}` });
  } catch (err) {
    next(err);
  }
}

// ==================== OFFERS, GALLERY & SUPPORT ====================

export async function adminUpsertOffer(req, res, next) {
  try {
    const { slug, title, tagline, description, promoCode, endDate, isActive, productIds } = req.body;
    const bannerImage = req.file ? await getUploadedFileUrl(req.file) : req.body.bannerImage;

    const offer = await prisma.offer.upsert({
      where: { slug },
      update: {
        title,
        tagline,
        description,
        promoCode,
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        ...(bannerImage ? { bannerImage } : {}),
      },
      create: {
        slug,
        title,
        tagline,
        description,
        promoCode,
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        bannerImage,
      },
    });

    if (Array.isArray(productIds)) {
      await prisma.offerProduct.deleteMany({ where: { offerId: offer.id } });
      if (productIds.length > 0) {
        await prisma.offerProduct.createMany({
          data: productIds.map((pid) => ({ offerId: offer.id, productId: Number(pid) })),
        });
      }
    }

    res.json({ offer });
  } catch (err) {
    next(err);
  }
}

export async function adminManageGallery(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { isApproved } = req.body;
    const item = await prisma.galleryItem.update({
      where: { id },
      data: { isApproved: Boolean(isApproved) },
    });
    res.json({ item });
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateTicketStatus(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { status, adminReply } = req.body;
    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: { status, ...(adminReply ? { adminReply } : {}) },
    });
    res.json({ ticket });
  } catch (err) {
    next(err);
  }
}

// ==================== PAYOUTS, CLOSING, SETTINGS & LOGS ====================

export async function adminListPayouts(_req, res, next) {
  try {
    const payouts = await prisma.payout.findMany({
      include: { user: { select: { id: true, name: true, phone: true } } },
      orderBy: { requestedAt: 'desc' },
    });
    res.json({ payouts });
  } catch (err) {
    next(err);
  }
}

export async function adminProcessPayout(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { status, utrNumber } = req.body;
    const payout = await prisma.payout.update({
      where: { id },
      data: {
        status,
        ...(utrNumber ? { utrNumber } : {}),
        processedAt: new Date(),
      },
    });
    await prisma.financialLedger.updateMany({
      where: { referenceId: String(id), category: 'Payout' },
      data: { status: status === 'Successful' ? 'Completed' : status },
    });
    await logAdminAction(req.admin.id, 'PROCESS_PAYOUT', `Payout #${id} -> ${status}`, req.ip);
    res.json({ payout });
  } catch (err) {
    next(err);
  }
}

export async function adminRunClosing(req, res, next) {
  try {
    const { closingType, periodLabel } = req.body;
    const eligible = await prisma.commission.aggregate({
      where: { status: 'Eligible' },
      _sum: { amount: true },
      _count: { id: true },
    });

    await prisma.commission.updateMany({
      where: { status: 'Eligible' },
      data: { status: 'Credited', closingDate: new Date() },
    });

    const log = await prisma.closingLog.create({
      data: {
        closingType: closingType || 'Daily',
        periodLabel: periodLabel || new Date().toISOString().slice(0, 10),
        totalAmount: Number(eligible._sum.amount || 0),
        recordsCount: eligible._count.id,
        runBy: req.admin.username,
      },
    });

    await logAdminAction(req.admin.id, 'RUN_CLOSING', `${closingType} closing completed`, req.ip);
    res.json({ closing: log });
  } catch (err) {
    next(err);
  }
}

export async function adminGetSettings(_req, res, next) {
  try {
    const settings = await prisma.setting.findMany();
    res.json({ settings: Object.fromEntries(settings.map((s) => [s.key, s.value])) });
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateSettings(req, res, next) {
  try {
    const entries = Object.entries(req.body || {});
    for (const [key, value] of entries) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }
    await logAdminAction(req.admin.id, 'UPDATE_SETTINGS', `Updated ${entries.length} settings`, req.ip);
    res.json({ message: 'Settings updated' });
  } catch (err) {
    next(err);
  }
}

export async function adminGetLogs(_req, res, next) {
  try {
    const logs = await prisma.adminLog.findMany({
      include: { admin: { select: { username: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ logs });
  } catch (err) {
    next(err);
  }
}

// ==================== WEBSITE CMS (BANNERS, PAGES, GALLERY, FAQS) ====================

export async function adminListBanners(_req, res, next) {
  try {
    const banners = await prisma.heroBanner.findMany({
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    });
    res.json({ banners });
  } catch (err) {
    next(err);
  }
}

export async function adminCreateBanner(req, res, next) {
  try {
    const { kicker, title, highlightText, description, buttonText, buttonRoute, sortOrder, isActive } = req.body;
    const imageUrl = req.file ? await getUploadedFileUrl(req.file) : req.body.imageUrl || '/image/Furniture.webp';
    const banner = await prisma.heroBanner.create({
      data: {
        kicker: kicker || 'MHA ONLINE SHOPPING',
        title,
        highlightText: highlightText || '',
        description,
        buttonText: buttonText || 'Shop Now →',
        buttonRoute: buttonRoute || '/shop',
        imageUrl,
        sortOrder: Number(sortOrder || 0),
        isActive: isActive !== undefined ? String(isActive) !== 'false' : true,
      },
    });
    await logAdminAction(req.admin.id, 'CREATE_BANNER', `Created hero banner #${banner.id}: ${title}`, req.ip);
    res.status(201).json({ banner });
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateBanner(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { kicker, title, highlightText, description, buttonText, buttonRoute, sortOrder, isActive } = req.body;
    const data = {};
    if (kicker !== undefined) data.kicker = kicker;
    if (title !== undefined) data.title = title;
    if (highlightText !== undefined) data.highlightText = highlightText;
    if (description !== undefined) data.description = description;
    if (buttonText !== undefined) data.buttonText = buttonText;
    if (buttonRoute !== undefined) data.buttonRoute = buttonRoute;
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);
    if (isActive !== undefined) data.isActive = String(isActive) !== 'false' && isActive !== false;
    if (req.file) data.imageUrl = await getUploadedFileUrl(req.file);
    else if (req.body.imageUrl) data.imageUrl = req.body.imageUrl;

    const banner = await prisma.heroBanner.update({ where: { id }, data });
    await logAdminAction(req.admin.id, 'UPDATE_BANNER', `Updated hero banner #${id}`, req.ip);
    res.json({ banner });
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteBanner(req, res, next) {
  try {
    const id = Number(req.params.id);
    await prisma.heroBanner.delete({ where: { id } });
    await logAdminAction(req.admin.id, 'DELETE_BANNER', `Deleted hero banner #${id}`, req.ip);
    res.json({ message: 'Banner deleted' });
  } catch (err) {
    next(err);
  }
}

export async function adminListSiteContent(_req, res, next) {
  try {
    const pages = await prisma.pageContent.findMany({ orderBy: { pageKey: 'asc' } });
    res.json({ pages });
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateSiteContent(req, res, next) {
  try {
    const pageKey = req.params.pageKey;
    const { badge, title, subtitle, ctaText, ctaRoute } = req.body;
    const imageUrl = req.file ? await getUploadedFileUrl(req.file) : req.body.imageUrl;

    const page = await prisma.pageContent.upsert({
      where: { pageKey },
      update: {
        ...(badge !== undefined ? { badge } : {}),
        ...(title !== undefined ? { title } : {}),
        ...(subtitle !== undefined ? { subtitle } : {}),
        ...(ctaText !== undefined ? { ctaText } : {}),
        ...(ctaRoute !== undefined ? { ctaRoute } : {}),
        ...(imageUrl ? { imageUrl } : {}),
      },
      create: {
        pageKey,
        badge: badge || '',
        title: title || pageKey,
        subtitle: subtitle || '',
        ctaText: ctaText || '',
        ctaRoute: ctaRoute || '',
        imageUrl: imageUrl || '/image/AllEle.webp',
      },
    });
    await logAdminAction(req.admin.id, 'UPDATE_PAGE_CONTENT', `Updated page content: ${pageKey}`, req.ip);
    res.json({ page });
  } catch (err) {
    next(err);
  }
}

export async function adminListGallery(_req, res, next) {
  try {
    const items = await prisma.galleryItem.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

export async function adminCreateGalleryItem(req, res, next) {
  try {
    const { type, title, category, description, location, videoUrl } = req.body;
    const imageUrl = req.file ? await getUploadedFileUrl(req.file) : req.body.imageUrl;
    const item = await prisma.galleryItem.create({
      data: {
        type: type || 'photo',
        title,
        category: category || '',
        description: description || '',
        location: location || '',
        videoUrl: videoUrl || '',
        imageUrl: imageUrl || '',
        isApproved: true,
      },
    });
    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteGalleryItem(req, res, next) {
  try {
    await prisma.galleryItem.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Gallery item deleted' });
  } catch (err) {
    next(err);
  }
}

export async function adminUpsertFaq(req, res, next) {
  try {
    const { id, question, answer, sortOrder } = req.body;
    const faq = id
      ? await prisma.faq.update({
          where: { id: Number(id) },
          data: { question, answer, sortOrder: Number(sortOrder || 0) },
        })
      : await prisma.faq.create({
          data: { question, answer, sortOrder: Number(sortOrder || 0) },
        });
    res.json({ faq });
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteFaq(req, res, next) {
  try {
    await prisma.faq.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'FAQ deleted' });
  } catch (err) {
    next(err);
  }
}
