import React, { useState } from 'react';
import { inr, mediaUrl, useStore } from '../context/StoreContext.jsx';
import { matchesProductSearch } from '../utils/searchRouting.js';
import ProductCard from '../components/ProductCard.jsx';

export default function ShopPage() {
  const { products, siteContent, searchQuery, setSearchQuery, compare, setCompare } = useStore();
  const page = siteContent.shop || {};
  const [priceRange, setPriceRange] = useState('');
  const [brand, setBrand] = useState('');
  const [type, setType] = useState('');
  const [sort, setSort] = useState('');
  const [showCompare, setShowCompare] = useState(false);

  const [minP, maxP] = priceRange ? priceRange.split('-').map((v) => (v ? Number(v) : null)) : [0, Infinity];
  const filtered = products
    .filter((p) => {
      if (type && p.category !== type) return false;
      if (brand && p.brand !== brand) return false;
      if (searchQuery && !matchesProductSearch(p, searchQuery)) return false;
      if (minP !== null && p.offerPrice < minP) return false;
      if (maxP !== null && p.offerPrice >= maxP) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'l') return a.offerPrice - b.offerPrice;
      if (sort === 'h') return b.offerPrice - a.offerPrice;
      if (sort === 'r') return b.rating - a.rating;
      return 0;
    });

  const comparedItems = compare.map((id) => products.find((p) => p.id === id)).filter(Boolean);

  return (
    <main id="store" className="shop-mode">
      <div className="page-banner shop-banner" id="shopBanner" style={{ display: 'grid' }}>
        <div>
          <span>{page.badge || 'THE MHA MARKETPLACE'}</span>
          <h1>{page.title || 'Find your next favourite'}</h1>
          <p>{page.subtitle || 'Browse the full collection and discover something useful for every day.'}</p>
        </div>
        <img src={mediaUrl(page.imageUrl, 'AllEle.webp')} alt="Products in the MHA marketplace" />
      </div>

      <div className="bar">
        <h2 id="ttl">{searchQuery ? `Results for “${searchQuery}”` : 'All products'} ({filtered.length})</h2>
        {searchQuery && (
          <button className="mb o" type="button" onClick={() => setSearchQuery('')}>
            Show all
          </button>
        )}
      </div>

      <div className="shop-tools" aria-label="Product filters">
        <label>Price
          <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)}>
            <option value="">Any price</option>
            <option value="0-5000">Under ₹5,000</option>
            <option value="5000-15000">₹5,000–₹15,000</option>
            <option value="15000-50000">₹15,000–₹50,000</option>
            <option value="50000-">Above ₹50,000</option>
          </select>
        </label>
        <label>Brand
          <select value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="">All brands</option>
            <option>MHA Home</option>
            <option>TechNova</option>
            <option>VoltRide</option>
            <option>Everyday Essentials</option>
          </select>
        </label>
        <label>Type
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All types</option>
            <option>Furniture</option>
            <option>Electronics</option>
            <option>EV Scooters</option>
            <option>Accessories</option>
          </select>
        </label>
        <label>Sort options
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="">Featured</option>
            <option value="l">Price: low to high</option>
            <option value="h">Price: high to low</option>
            <option value="r">Top rated</option>
          </select>
        </label>
      </div>

      {compare.length > 0 && (
        <div className="compare-tray">
          <span>{comparedItems.map((p) => p.name).join(' · ')}</span>
          <div>
            <button type="button" onClick={() => setShowCompare(true)}>Compare selected</button>{' '}
            <button type="button" onClick={() => { setCompare([]); setShowCompare(false); }}>Clear</button>
          </div>
        </div>
      )}

      {showCompare && comparedItems.length >= 2 && (
        <section className="compare-results">
          <h3>Product comparison</h3>
          <div className="tw">
            <table>
              <thead><tr><th>Product</th><th>Brand</th><th>Category</th><th>Price</th><th>Rating</th></tr></thead>
              <tbody>
                {comparedItems.map((p) => (
                  <tr key={p.id}>
                    <th>{p.name}</th><td>{p.brand}</td><td>{p.category}</td><td>{inr(p.offerPrice)}</td><td>{p.rating} ★</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="grid" id="gr">
        {filtered.length ? filtered.map((p) => <ProductCard key={p.id} product={p} />) : <p>No products found. Try another filter or category.</p>}
      </div>
    </main>
  );
}
