import React from 'react';
import { inr, useStore } from '../context/StoreContext.jsx';

export default function ProductCard({ product }) {
  const { addToCart, setSelectedProduct, wishlist, toggleWishlist, compare, toggleCompare } = useStore();
  const off = Math.round((1 - product.offerPrice / product.actualPrice) * 100);
  const wished = wishlist.includes(product.id);
  const compared = compare.includes(product.id);

  return (
    <div className="pc">
      <button
        className="im"
        type="button"
        style={{ background: product.accentColor, border: 0 }}
        aria-label={`View ${product.name}`}
        onClick={() => setSelectedProduct(product)}
      >
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
      </button>
      <div className="pb">
        <h3 onClick={() => setSelectedProduct(product)} style={{ cursor: 'pointer' }}>{product.name}</h3>
        <span className="rt">{product.rating} ★</span>
        <div className="pr">
          {inr(product.offerPrice)}
          <s>{inr(product.actualPrice)}</s>
          <em>{off}% off</em>
        </div>
        <div className="un">{product.brand} · {product.category} · {product.subcategory}</div>
        <button className="add" type="button" onClick={() => addToCart(product.id)}>Add to cart</button>
        <div className="pc-actions">
          <button
            className={`wish ${wished ? 'active' : ''}`}
            type="button"
            onClick={() => toggleWishlist(product.id)}
          >
            {wished ? '♥ Wishlisted' : '♡ Wishlist'}
          </button>
          <button
            className={`compare ${compared ? 'active' : ''}`}
            type="button"
            onClick={() => toggleCompare(product.id)}
          >
            {compared ? '✓ Comparing' : '⇄ Compare'}
          </button>
        </div>
      </div>
    </div>
  );
}
