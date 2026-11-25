import React from 'react';
import { useNavigate } from 'react-router-dom';
import { inr, mediaUrl, useStore } from '../context/StoreContext.jsx';

export default function OffersPage() {
  const { offers, products, siteContent, addToCart, setSelectedProduct, toast } = useStore();
  const page = siteContent.offers || {};
  const navigate = useNavigate();

  function copyCode(code) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => toast(`Coupon copied: ${code}`)).catch(() => toast(`Coupon: ${code}`));
    } else {
      toast(`Coupon: ${code}`);
    }
  }

  return (
    <main id="store" className="info-mode">
      <section className="sitemap-group" id="offers" style={{ display: 'block' }}>
        <div className="page-banner">
          <div>
            <span>{page.badge || 'SHOP MORE, SAVE MORE'}</span>
            <h1>{page.title || 'Offers at MHA'}</h1>
            <p>{page.subtitle || 'Explore limited-time offers, bundles, coupons and featured deals.'}</p>
          </div>
          <img src={mediaUrl(page.imageUrl, 'Furniture.webp')} alt="MHA offer collection" />
        </div>

        <div className="offer-section-stack">
          {offers.length ? offers.map((o) => {
            const items = (o.products || [])
              .map((op) => products.find((p) => p.id === op.productId))
              .filter(Boolean);
            return (
              <section className="offer-section" key={o.id}>
                <div className="offer-section-banner">
                  <div>
                    <span>{o.tagline || 'ACTIVE OFFER'}</span>
                    <h2>{o.title}</h2>
                    <p>{o.description}</p>
                    {o.promoCode && (
                      <button type="button" className="offer-code" onClick={() => copyCode(o.promoCode)}>
                        Copy code · {o.promoCode}
                      </button>
                    )}
                  </div>
                  <img src={o.bannerImage ? `${import.meta.env.BASE_URL}${o.bannerImage.replace(/^\/+/, '')}` : siteImg('AllEle.webp')} alt={o.title} />
                </div>

                <div className="offer-showcase-heading">
                  <h3>Product showcase</h3>
                  <button className="offer-view-all" type="button" onClick={() => navigate('/shop')}>View all offers →</button>
                </div>

                <div className="grid offer-products">
                  {items.map((p) => {
                    const discount = Math.round((1 - p.offerPrice / p.actualPrice) * 100);
                    return (
                      <article className="pc offer-product-card" key={p.id}>
                        <button type="button" className="im" onClick={() => setSelectedProduct(p)}>
                          <img src={p.imageUrl} alt={p.name} loading="lazy" />
                        </button>
                        <div className="pb">
                          <h3 className="offer-product-name" onClick={() => setSelectedProduct(p)}>{p.name}</h3>
                          <span className="rt">{p.rating} ★</span>
                          <div className="pr">{inr(p.offerPrice)} <s>{inr(p.actualPrice)}</s><em>{discount}% off</em></div>
                          <div className="un">{p.subcategory} · {p.category}</div>
                          <button className="add" type="button" onClick={() => addToCart(p.id)}>Add to cart</button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          }) : <p>Loading active offers…</p>}
        </div>
      </section>
    </main>
  );
}
