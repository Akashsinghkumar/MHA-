import prisma from '../config/db.js';
import { getUploadedFileUrl } from '../services/uploadService.js';

export async function listHeroBanners(_req, res, next) {
  try {
    const banners = await prisma.heroBanner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    });
    res.json({ banners });
  } catch (err) {
    next(err);
  }
}

export async function getSiteContent(_req, res, next) {
  try {
    const rows = await prisma.pageContent.findMany();
    const content = Object.fromEntries(rows.map((r) => [r.pageKey, r]));
    res.json({ content });
  } catch (err) {
    next(err);
  }
}

export async function listActiveOffers(_req, res, next) {
  try {
    const now = new Date();
    const offers = await prisma.offer.findMany({
      where: {
        isActive: true,
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      include: {
        products: {
          include: { product: true },
        },
      },
      orderBy: { id: 'asc' },
    });
    res.json({ offers });
  } catch (err) {
    next(err);
  }
}

export async function listGallery(_req, res, next) {
  try {
    const items = await prisma.galleryItem.findMany({
      where: { isApproved: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

export async function submitCustomerPhoto(req, res, next) {
  try {
    const { title, description, category } = req.body;
    const imageUrl = req.file ? await getUploadedFileUrl(req.file) : req.body.imageUrl;

    const item = await prisma.galleryItem.create({
      data: {
        type: 'customer',
        title,
        category: category || 'Customer Photos',
        description,
        imageUrl,
        isApproved: false, // Pending admin approval
        uploadedBy: req.user?.id || null,
      },
    });
    res.status(201).json({ item, message: 'Submitted for admin review' });
  } catch (err) {
    next(err);
  }
}

export async function getFaqsAndPolicies(_req, res, next) {
  try {
    const [faqs, settings] = await Promise.all([
      prisma.faq.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.setting.findMany({
        where: {
          key: {
            in: ['shipping_policy', 'warranty_policy', 'support_email', 'support_phone', 'support_whatsapp'],
          },
        },
      }),
    ]);
    const config = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    res.json({ faqs, config });
  } catch (err) {
    next(err);
  }
}

export async function createSupportTicket(req, res, next) {
  try {
    const { name, email, subject, message } = req.body;
    const ticketNumber = `TKT-${Date.now().toString().slice(-8)}`;
    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId: req.user?.id || null,
        name,
        email,
        subject: subject || 'General Support',
        message,
      },
    });
    res.status(201).json({ ticket });
  } catch (err) {
    next(err);
  }
}

export async function getMyTickets(req, res, next) {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ tickets });
  } catch (err) {
    next(err);
  }
}

export async function createWarrantyClaim(req, res, next) {
  try {
    const { orderNumber, issue } = req.body;
    const claimNumber = `WAR-${Date.now().toString().slice(-8)}`;
    const claim = await prisma.warrantyClaim.create({
      data: {
        claimNumber,
        userId: req.user?.id || null,
        orderNumber: String(orderNumber).trim().toUpperCase(),
        issue,
      },
    });
    res.status(201).json({ claim });
  } catch (err) {
    next(err);
  }
}

export async function createServiceBooking(req, res, next) {
  try {
    const { name, phone, product, serviceType, bookingDate } = req.body;
    const bookingNumber = `SRV-${Date.now().toString().slice(-8)}`;
    const booking = await prisma.serviceBooking.create({
      data: {
        bookingNumber,
        userId: req.user?.id || null,
        name,
        phone,
        product,
        serviceType,
        bookingDate: bookingDate ? new Date(bookingDate) : null,
      },
    });
    res.status(201).json({ booking });
  } catch (err) {
    next(err);
  }
}
