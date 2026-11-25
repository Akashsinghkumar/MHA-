const CATEGORY_ROUTES = {
  Furniture: '/furniture',
  Electronics: '/electronics',
  'EV Scooters': '/ev-scooters',
  Accessories: '/accessories',
};

const SECTION_KEYWORDS = [
  { pattern: /\b(offers?|discounts?|coupons?|promos?|deals?)\b/i, route: '/offers' },
  { pattern: /\b(ev\s*scooters?|electric\s*scooters?|scooters?|ev)\b/i, route: '/ev-scooters' },
  { pattern: /\b(electrics?|electronics?)\b/i, route: '/electronics' },
  { pattern: /\bfurnitures?\b/i, route: '/furniture' },
  { pattern: /\baccessor(y|ies)\b/i, route: '/accessories' },
];

const KEYWORD_FALLBACKS = [
  { pattern: /\b(sofa|bed|chair|table|dining|living|bedroom|wardrobe|bookshelf|cabinet|desk|recliner|couch|mattress|shelf)\b/i, route: '/furniture' },
  { pattern: /\b(tv|led|audio|sound|speaker|earbuds?|headphones?|camera|laptop|smart\s*home|appliance)\b/i, route: '/electronics' },
  { pattern: /\b(helmet|charger|cable|cover|stand|mount|spare|cushion|mat)\b/i, route: '/accessories' },
];

/**
 * Returns true if a product matches the given search query across name, category, subcategory, brand, or tags.
 */
export function matchesProductSearch(product, rawQuery) {
  const q = String(rawQuery || '').trim().toLowerCase();
  if (!q) return true;
  const searchable = [
    product.name,
    product.category,
    product.subcategory,
    product.brand,
    product.tags,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return searchable.includes(q);
}

/**
 * Resolves the best destination route for a search query based on section keywords and matched products.
 */
export function resolveSearchRoute(rawQuery, products = []) {
  const q = String(rawQuery || '').trim();
  if (!q) return { route: '/shop', isCategoryBrowse: false };

  for (const entry of SECTION_KEYWORDS) {
    if (entry.pattern.test(q)) {
      return { route: entry.route, isCategoryBrowse: true };
    }
  }

  const matched = products.filter((p) => matchesProductSearch(p, q));
  const categories = [...new Set(matched.map((p) => p.category).filter(Boolean))];
  if (categories.length === 1 && CATEGORY_ROUTES[categories[0]]) {
    return { route: CATEGORY_ROUTES[categories[0]], isCategoryBrowse: false };
  }

  if (categories.length === 0) {
    for (const entry of KEYWORD_FALLBACKS) {
      if (entry.pattern.test(q)) {
        return { route: entry.route, isCategoryBrowse: false };
      }
    }
  }

  return { route: '/shop', isCategoryBrowse: false };
}
