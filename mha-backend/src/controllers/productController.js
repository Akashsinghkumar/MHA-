import prisma from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';

export async function listCategories(_req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    res.json({ categories });
  } catch (err) {
    next(err);
  }
}

export async function listProducts(req, res, next) {
  try {
    const {
      category,
      subcategory,
      brand,
      q,
      tag,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 50,
    } = req.query;

    const where = { isActive: true };

    if (category && category !== 'All') {
      where.category = { name: { equals: String(category) } };
    }
    if (subcategory) {
      where.subcategory = { equals: String(subcategory) };
    }
    if (brand) {
      where.brand = { equals: String(brand) };
    }
    if (tag) {
      where.tags = { contains: String(tag) };
    }
    if (q) {
      where.OR = [
        { name: { contains: String(q) } },
        { description: { contains: String(q) } },
        { subcategory: { contains: String(q) } },
      ];
    }
    if (minPrice || maxPrice) {
      where.offerPrice = {};
      if (minPrice) where.offerPrice.gte = Number(minPrice);
      if (maxPrice) where.offerPrice.lte = Number(maxPrice);
    }

    let orderBy = { id: 'asc' };
    if (sort === 'l' || sort === 'price_asc') orderBy = { offerPrice: 'asc' };
    else if (sort === 'h' || sort === 'price_desc') orderBy = { offerPrice: 'desc' };
    else if (sort === 'r' || sort === 'rating') orderBy = { rating: 'desc' };

    const take = Math.min(100, Math.max(1, Number(limit) || 50));
    const skip = (Math.max(1, Number(page) || 1) - 1) * take;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take,
        include: { category: { select: { id: true, name: true, slug: true } } },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      products: products.map((p) => ({
        ...p,
        tags: Array.isArray(p.tags)
          ? p.tags
          : (() => {
              try {
                return JSON.parse(p.tags || '[]');
              } catch {
                return [];
              }
            })(),
      })),
      pagination: {
        total,
        page: Number(page) || 1,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getProductById(req, res, next) {
  try {
    const id = Number(req.params.id);
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        reviews: {
          where: { isApproved: true },
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!product || !product.isActive) {
      throw new AppError('Product not found', 404);
    }
    res.json({ product });
  } catch (err) {
    next(err);
  }
}
