import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Furniture', slug: 'furniture', imageUrl: '/image/Sofa.webp', sortOrder: 1 },
  { name: 'Electronics', slug: 'electronics', imageUrl: '/image/AllEle.webp', sortOrder: 2 },
  { name: 'EV Scooters', slug: 'ev-scooters', imageUrl: '/image/Sector.webp', sortOrder: 3 },
  { name: 'Accessories', slug: 'accessories', imageUrl: '/image/Accessories.webp', sortOrder: 4 },
];

const RAW_PRODUCTS = [
  [1, '3-Seater Fabric Sofa', 'Furniture', 18999, 24999, '🛋️', 4.4, '#fde8d0', 'Sofa.webp', 'Living Room', ['Best Sellers', 'Popular Items']],
  [2, 'Queen Size Wooden Bed', 'Furniture', 22499, 29999, '🛏️', 4.3, '#f3e2cf', 'bed1.webp', 'Bedroom', ['Popular Items']],
  [3, '6-Seater Dining Table', 'Furniture', 15999, 21999, '🪑', 4.2, '#e9efd9', 'Dinning1.webp', 'Dining', ['Best Sellers']],
  [4, 'Study Table with Shelf', 'Furniture', 6499, 8999, '🗄️', 4.1, '#e4ebf7', 'Home office.webp', 'Home Office', []],
  [5, '4-Door Wardrobe', 'Furniture', 17499, 23999, '🚪', 4.0, '#efe3f3', 'fur1.webp', 'Bedroom', []],
  [6, 'Smart LED TV 43 inch', 'Electronics', 24999, 34999, '📺', 4.5, '#dfeaf9', 'TV.webp', 'TV & Displays', ['Best Sellers', 'Top Rated', 'Popular Items']],
  [7, 'Front Load Washing Machine', 'Electronics', 29999, 39999, '🧺', 4.4, '#e1f2ef', 'Electronics-Appliance.webp', 'Other Electronics', []],
  [8, 'Double Door Refrigerator', 'Electronics', 27999, 36999, '🧊', 4.3, '#e4f1fb', 'Electronics-Appliance.webp', 'Other Electronics', []],
  [9, 'Android Tablet 10 inch', 'Electronics', 11999, 15999, '📱', 4.2, '#efeaf9', 'ele1.webp', 'TV & Displays', []],
  [10, 'Split AC 1.5 Ton', 'Electronics', 35999, 47999, '❄️', 4.4, '#dff3f8', 'Elec.webp', 'Other Electronics', []],
  [11, 'City Rider EV Scooter', 'EV Scooters', 84999, 99999, '🛵', 4.5, '#dcf3e4', 'Sctoor.webp', 'City Rider', ['Best Sellers', 'Top Rated']],
  [12, 'Pro Max EV Scooter', 'EV Scooters', 109999, 129999, '🛴', 4.6, '#d5efe0', 'Sctoor1.webp', 'Pro Max', ['Top Rated']],
  [13, 'Lite EV Scooter', 'EV Scooters', 64999, 74999, '🛵', 4.1, '#e6f4dc', 'Sector.webp', 'Lite', []],
  [14, 'Helmet (ISI certified)', 'Accessories', 1499, 2299, '⛑️', 4.3, '#fbe9d3', 'Accessories.webp', 'EV Accessories', []],
  [15, 'Scooter Charger 48V', 'Accessories', 3499, 4999, '🔌', 4.0, '#eee9d9', 'sp2.webp', 'Spare Parts & Add-ons', []],
  [16, 'Mixer Grinder 750W', 'Accessories', 2999, 4499, '🍹', 4.4, '#fbe0e3', 'Electronics-Appliance.webp', 'Electronic Accessories', []],
  [17, 'Gas Stove 3 Burner', 'Accessories', 3799, 5299, '🔥', 4.2, '#fde3cf', 'Electronics-Appliance.webp', 'Other Accessories', []],
  [18, 'Trolley Bag Set', 'Accessories', 2499, 3999, '🧳', 4.1, '#e4e8f5', 'Accessories.webp', 'Other Accessories', ['Popular Items']],
  [19, 'Bookshelf Storage Cabinet', 'Furniture', 7999, 10999, '🗄️', 4.2, '#e6ebdf', 'fur3.webp', 'Other Furniture', ['New Arrivals']],
  [20, 'Wireless Audio Soundbar', 'Electronics', 8999, 12999, '🔊', 4.5, '#e3eafa', 'ele3.webp', 'Audio', ['Top Rated']],
  [21, 'Smart Home Security Camera', 'Electronics', 3499, 4999, '📷', 4.4, '#e8e7f5', 'Smar1.webp', 'Smart Home', ['New Arrivals']],
  [22, 'Other Electronics Laptop 14 inch', 'Electronics', 42999, 52999, '💻', 4.3, '#e3edf9', 'el.jpg', 'Other Electronics', ['New Arrivals']],
  [23, 'Bluetooth Audio Earbuds', 'Electronics', 1999, 2999, '🎧', 4.2, '#e8e7f5', 'ele4.webp', 'Audio', ['New Arrivals']],
  [24, 'Furniture Accessories Cushion Set', 'Accessories', 999, 1499, '🛋️', 4.1, '#fde8d0', 'Sofa.webp', 'Furniture Accessories', []],
  [25, 'Electronic Accessories USB C Hub', 'Accessories', 1799, 2499, '🔌', 4.2, '#e3eafa', 'ele2.webp', 'Electronic Accessories', []],
  [26, 'EV Accessories Phone Mount', 'Accessories', 699, 999, '🛵', 4.0, '#dcf3e4', 'Sctoor.webp', 'EV Accessories', []],
  [27, 'Spare Parts Scooter Charger', 'Accessories', 3499, 4999, '🔋', 4.2, '#dcf3e4', 'sp3.webp', 'Spare Parts & Add-ons', []],
  [28, 'Recliner Lounge Chair', 'Furniture', 24999, 32999, '🪑', 4.5, '#e8e1d8', 'living1.webp', 'Living Room', []],
  [29, 'Bedside Table with Drawer', 'Furniture', 4499, 6499, '🗄️', 4.2, '#eee5d8', 'bed2.webp', 'Bedroom', []],
  [30, 'Ergonomic Office Chair', 'Furniture', 8999, 12999, '🪑', 4.4, '#e2eaf3', 'office.webp', 'Home Office', []],
  [31, 'Wooden Coffee Table', 'Furniture', 5999, 8499, '🪵', 4.1, '#ebe4da', 'Table.webp', 'Living Room', []],
  [32, '4K Smart TV 55 inch', 'Electronics', 42999, 57999, '📺', 4.6, '#e3eafa', 'TV1.webp', 'TV & Displays', []],
  [33, 'Portable Bluetooth Speaker', 'Electronics', 2999, 4499, '🔊', 4.3, '#e8e7f5', 'sp.webp', 'Audio', []],
  [34, 'Smart Home Bulb Set', 'Electronics', 1499, 2299, '💡', 4.1, '#f5edcf', 'smar2.webp', 'Smart Home', []],
  [35, 'Convection Microwave Oven', 'Electronics', 8999, 11999, '🍽️', 4.2, '#e4eaf0', 'Elec.webp', 'Other Electronics', []],
  [36, 'Family Comfort EV Scooter', 'EV Scooters', 94999, 109999, '🛵', 4.4, '#dcf3e4', 'Sctoor1.webp', 'Family Comfort', []],
  [37, 'Long Range EV Scooter', 'EV Scooters', 124999, 144999, '🛵', 4.6, '#d5efe0', 'EV-Scooter.webp', 'Long Range', []],
  [38, 'Portable EV Charger', 'Accessories', 7999, 9999, '🔌', 4.2, '#e6f4dc', 'sp.webp', 'EV Accessories', []],
  [39, 'Furniture Accessories Sofa Cover', 'Accessories', 1199, 1799, '🛋️', 4.0, '#fde8d0', 'Sofa.webp', 'Furniture Accessories', []],
  [40, 'Electronic Accessories Wall Mount', 'Accessories', 999, 1499, '🖥️', 4.1, '#e3eafa', 'ele2.webp', 'Electronic Accessories', []],
  [41, 'EV Accessories Riding Helmet', 'Accessories', 1699, 2499, '⛑️', 4.3, '#fbe9d3', 'Accessories.webp', 'EV Accessories', []],
  [42, 'Spare Parts EV Tyre Set', 'Accessories', 2499, 3499, '🛞', 4.0, '#eee9d9', 'sp3.webp', 'Spare Parts & Add-ons', []],
  [43, 'Power Bank 20000mAh', 'Accessories', 1999, 2999, '🔋', 4.4, '#e4e8f5', 'ele4.webp', 'Electronic Accessories', []],
];

const BRAND_BY_CATEGORY = {
  Furniture: 'MHA Home',
  Electronics: 'TechNova',
  'EV Scooters': 'VoltRide',
  Accessories: 'Everyday Essentials',
};

async function main() {
  console.log('Seeding MHA database...');

  // 1. Categories
  const categoryMap = {};
  for (const c of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, imageUrl: c.imageUrl, sortOrder: c.sortOrder },
      create: c,
    });
    categoryMap[c.name] = cat.id;
  }

  // 2. Products
  for (const [id, name, catName, offerPrice, actualPrice, emoji, rating, accentColor, photo, subcategory, tags] of RAW_PRODUCTS) {
    await prisma.product.upsert({
      where: { id },
      update: {
        name,
        categoryId: categoryMap[catName],
        subcategory,
        brand: BRAND_BY_CATEGORY[catName] || 'MHA',
        offerPrice,
        actualPrice,
        emoji,
        rating,
        accentColor,
        imageUrl: `/image/${photo}`,
        tags,
      },
      create: {
        id,
        name,
        categoryId: categoryMap[catName],
        subcategory,
        brand: BRAND_BY_CATEGORY[catName] || 'MHA',
        offerPrice,
        actualPrice,
        emoji,
        rating,
        accentColor,
        imageUrl: `/image/${photo}`,
        tags,
      },
    });
  }

  // 3. Default Coupon
  await prisma.coupon.upsert({
    where: { code: 'MHAWELCOME' },
    update: {},
    create: {
      code: 'MHAWELCOME',
      discountType: 'percentage',
      discountValue: 10,
      minOrder: 2000,
      isActive: true,
    },
  });

  // 4. Default Offers
  const offers = [
    {
      slug: 'limited',
      title: 'Limited-Time Offers',
      tagline: 'ENDS SOON',
      description: 'Discover reduced prices on selected MHA products while the offer is active.',
      bannerImage: '/image/Furniture.webp',
      endDate: new Date('2026-12-31'),
      productIds: [1, 2, 6, 11],
    },
    {
      slug: 'combo',
      title: 'Combo Deals',
      tagline: 'PAIR YOUR PICKS',
      description: 'Build a useful bundle for your home, commute or everyday routine.',
      bannerImage: '/image/AllEle.webp',
      productIds: [3, 20, 24, 26],
    },
    {
      slug: 'coupons',
      title: 'Coupons & Promo Codes',
      tagline: 'EXTRA SAVINGS',
      description: 'Apply a promo code at checkout for an extra saving on eligible products.',
      bannerImage: '/image/Sofa.webp',
      promoCode: 'MHAWELCOME',
      productIds: [1, 6, 14, 23],
    },
    {
      slug: 'special',
      title: 'Special Offers',
      tagline: 'GOOD FINDS',
      description: 'Explore current highlights across furniture, electronics, accessories and EV products.',
      bannerImage: '/image/Electronics-Appliance.webp',
      productIds: [7, 12, 21, 31],
    },
  ];

  for (const o of offers) {
    const offer = await prisma.offer.upsert({
      where: { slug: o.slug },
      update: {
        title: o.title,
        tagline: o.tagline,
        description: o.description,
        bannerImage: o.bannerImage,
        promoCode: o.promoCode || null,
        endDate: o.endDate || null,
      },
      create: {
        slug: o.slug,
        title: o.title,
        tagline: o.tagline,
        description: o.description,
        bannerImage: o.bannerImage,
        promoCode: o.promoCode || null,
        endDate: o.endDate || null,
      },
    });
    for (const productId of o.productIds) {
      await prisma.offerProduct.upsert({
        where: { offerId_productId: { offerId: offer.id, productId } },
        update: {},
        create: { offerId: offer.id, productId },
      });
    }
  }

  // 5. Default FAQs
  const existingFaqs = await prisma.faq.count();
  if (existingFaqs === 0) {
    await prisma.faq.createMany({
      data: [
        { question: 'How can I track my order?', answer: 'Enter your order ID in Order Tracking to see its latest status.', sortOrder: 1 },
        { question: 'Which payment methods are available?', answer: 'UPI, Card, Net Banking via Razorpay, and Cash on Delivery are available at checkout.', sortOrder: 2 },
        { question: 'How do I request a return?', answer: 'Create a support ticket with your order ID and reason for the request.', sortOrder: 3 },
      ],
    });
  }

  // 6. Default Settings
  const defaultSettings = [
    { key: 'unit_value', value: '5000' },
    { key: 'profit_share_percent', value: '20' },
    { key: 'payout_deduction_percent', value: '10' },
    { key: 'shipping_policy', value: 'Delivery estimates and service availability are confirmed at checkout.' },
    { key: 'warranty_policy', value: 'Warranty coverage depends on the product and manufacturer. Keep your invoice and submit a claim here if you need help.' },
    { key: 'support_email', value: 'support@mha-shop.com' },
    { key: 'support_phone', value: '' },
    { key: 'support_whatsapp', value: '' },
  ];
  for (const s of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  // 7. Initial Hero Banners
  const existingBanners = await prisma.heroBanner.count();
  if (existingBanners === 0) {
    await prisma.heroBanner.createMany({
      data: [
        {
          kicker: 'WELCOME TO MHA ONLINE SHOPPING',
          title: 'Beautiful &',
          highlightText: 'Comfortable',
          description: 'Discover stylish sofas, beds, dining tables and furniture for every corner of your home.',
          buttonText: 'Shop Furniture →',
          buttonRoute: '/furniture',
          imageUrl: '/image/Furniture.webp',
          sortOrder: 1,
          isActive: true,
        },
        {
          kicker: 'SMARTER LIVING STARTS HERE',
          title: 'Upgrade Your',
          highlightText: 'Technology Today',
          description: 'Explore televisions, appliances, tablets and everyday gadgets at exciting prices.',
          buttonText: 'Explore Electronics →',
          buttonRoute: '/electronics',
          imageUrl: '/image/Electronics-Appliance.webp',
          sortOrder: 2,
          isActive: true,
        },
        {
          kicker: 'THE FUTURE IS ELECTRIC',
          title: 'Ride Smart.',
          highlightText: 'Ride Electric.',
          description: 'Discover modern electric scooters and useful accessories for your daily commute.',
          buttonText: 'Explore EV Scooters →',
          buttonRoute: '/ev-scooters',
          imageUrl: '/image/EV-Scooter.webp',
          sortOrder: 3,
          isActive: true,
        },
        {
          kicker: 'YOUR EVERYDAY MARKETPLACE',
          title: 'Shop More.',
          highlightText: 'Live Better.',
          description: 'Find useful home essentials, accessories and great offers for your everyday needs.',
          buttonText: 'Explore Products →',
          buttonRoute: '/accessories',
          imageUrl: '/image/AllEle.webp',
          sortOrder: 4,
          isActive: true,
        },
      ],
    });
  }

  // 8. Default Page Contents
  const defaultPages = [
    { pageKey: 'home_promo', badge: 'PROMOTIONAL SECTION', title: 'Make room for better everyday living.', subtitle: 'Discover comfortable furniture, useful electronics and products made for your routine.', imageUrl: '/image/Furniture.webp', ctaText: 'Explore the marketplace →', ctaRoute: '/shop' },
    { pageKey: 'shop', badge: 'THE MHA MARKETPLACE', title: 'Find your next favourite', subtitle: 'Browse the full collection and discover something useful for every day.', imageUrl: '/image/AllEle.webp' },
    { pageKey: 'furniture', badge: 'FIND YOUR COMFORT', title: 'Furniture for every room', subtitle: 'Explore thoughtful pieces for living, sleeping, dining and working spaces.', imageUrl: '/image/Furniture.webp' },
    { pageKey: 'electronics', badge: 'SMARTER LIVING', title: 'Electronics for every day', subtitle: 'Explore displays, sound, smart-home devices and more.', imageUrl: '/image/Electronics-Appliance.webp' },
    { pageKey: 'ev', badge: 'ELECTRIC MOBILITY', title: 'Electric scooters for your journey', subtitle: 'Explore models, charging, ownership and service options.', imageUrl: '/image/EV-Scooter.webp' },
    { pageKey: 'accessories', badge: 'THE FINISHING TOUCH', title: 'Accessories & add-ons', subtitle: 'Find useful extras for furniture, electronics and EVs.', imageUrl: '/image/AllEle.webp' },
    { pageKey: 'offers', badge: 'SHOP MORE, SAVE MORE', title: 'Offers at MHA', subtitle: 'Explore limited-time offers, bundles, coupons and featured deals.', imageUrl: '/image/Furniture.webp' },
    { pageKey: 'gallery', badge: 'SEE MHA UP CLOSE', title: 'Gallery & Videos', subtitle: 'Explore products, videos and customer experiences.', imageUrl: '/image/AllEle.webp' },
    { pageKey: 'support', badge: 'CUSTOMER CARE', title: 'Support Centre', subtitle: "We're here to make your shopping experience easier.", imageUrl: '/image/Accessories.webp' },
  ];
  for (const pg of defaultPages) {
    await prisma.pageContent.upsert({
      where: { pageKey: pg.pageKey },
      update: {},
      create: pg,
    });
  }

  // 9. Initial Super Admin
  const adminUsername = process.env.SEED_ADMIN_USERNAME || 'admin';
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@mha-shop.com';
  const adminPass = process.env.SEED_ADMIN_PASSWORD || 'ChangeMeAdmin123!';
  const passwordHash = await bcrypt.hash(adminPass, 12);

  await prisma.adminUser.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      email: adminEmail,
      passwordHash,
      role: 'SUPER_ADMIN',
      permissions: ['*'],
    },
  });

  try {
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 1));`);
  } catch {}

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
