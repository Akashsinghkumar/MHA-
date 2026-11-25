import React from 'react';
import { inr, useStore } from '../context/StoreContext.jsx';

export default function ProductModal() {
  const { selectedProduct, setSelectedProduct, addToCart } = useStore();
  if (!selectedProduct) return null;

  const p = selectedProduct;
  const off = Math.round((1 - p.offerPrice / p.actualPrice) * 100);

  return (
    <div className="ov on" onClick={(e) => { if (e.target === e.currentTarget) setSelectedProduct(null); }}>
      <div className="md" role="dialog" aria-modal="true" aria-label="Product">
        <button className="x" type="button" onClick={() => setSelectedProduct(null)} aria-label="Close">×</button>
        <div className="pd">
          <div className="im" style={{ background: p.accentColor }}>
            <img src={p.imageUrl} alt={p.name} />
          </div>
          <div>
            <h2 style={{ margin: '0 0 6px' }}>{p.name}</h2>
            <span className="rt">{p.rating} ★</span>
            <div className="pr" style={{ fontSize: '28px', margin: '10px 0' }}>
              {inr(p.offerPrice)}
              <s>{inr(p.actualPrice)}</s>
              <em>{off}% off</em>
            </div>
            {p.description && <p className="product-description">{p.description}</p>}
            <button
              className="btn"
              type="button"
              onClick={() => {
                addToCart(p.id);
                setSelectedProduct(null);
              }}
            >
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
