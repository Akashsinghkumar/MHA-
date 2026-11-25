import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inr, mediaUrl, siteImg, useStore } from '../context/StoreContext.jsx';

const FALLBACK_SLIDES = [
  {
    id: 1,
    kicker: 'WELCOME TO MHA ONLINE SHOPPING',
    title: 'Beautiful &',
    highlightText: 'Comfortable',
    description: 'Discover stylish sofas, beds, dining tables and furniture for every corner of your home.',
    buttonText: 'Shop Furniture →',
    buttonRoute: '/furniture',
    imageUrl: '/image/Furniture.webp',
  },
];

export default function HomePage() {
  const { products, banners, siteContent, addToCart, setSelectedProduct, toast } = useStore();
  const [slideIdx, setSlideIdx] = useState(0);
  const navigate = useNavigate();

  const slides = banners.length ? banners : FALLBACK_SLIDES;

  useEffect(() => {
    if (slideIdx >= slides.length) setSlideIdx(0);
    const t = setInterval(() => setSlideIdx((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  const bestSellers = products.filter((p) => p.tags.includes('Best Sellers')).slice(0, 4);
  const newArrivals = products.filter((p) => p.tags.includes('New Arrivals')).slice(0, 4);
  const promo = siteContent.home_promo || {};

  function renderHomeGroup(items) {
    return items.map((p) => {
      const off = Math.round((1 - p.offerPrice / p.actualPrice) * 100);
      return (
        <article className="home-product-card" key={p.id}>
          <div className="home-product-visual" style={{ background: p.accentColor }}>
            <img src={p.imageUrl} alt={p.name} loading="lazy" />
          </div>
          <div className="home-product-info">
            <h3>{p.name}</h3>
            <span className="rt">{p.rating} ★</span>
            <div className="home-product-price">
              {inr(p.offerPrice)} <s>{inr(p.actualPrice)}</s>
            </div>
            <span className="un">{off}% off</span>
            <div className="home-product-actions">
              <button className="home-product-view" type="button" onClick={() => setSelectedProduct(p)}>View</button>
              <button className="home-product-add" type="button" onClick={() => addToCart(p.id)}>Add to cart</button>
            </div>
          </div>
        </article>
      );
    });
  }

  return (
    <main id="store" className="home-mode">
      <section className="hero hero-split" id="mhaHero" aria-label="MHA shopping promotions">
        <div className="hero-track">
          {slides.map((s, idx) => (
            <article key={s.id || idx} className={`hero-slide hero-split-slide ${idx === slideIdx ? 'active' : ''}`} aria-hidden={idx !== slideIdx}>
              <div className="hero-copy">
                <span className="hero-accent-bar" aria-hidden="true" />
                {s.kicker && <span className="hero-kicker">{s.kicker}</span>}
                <h1>
                  {s.title}{' '}
                  {s.highlightText && <span className="hero-highlight">{s.highlightText}</span>}
                </h1>
                <p>{s.description}</p>
                <button className="cta" type="button" onClick={() => navigate(s.buttonRoute || '/shop')}>
                  {s.buttonText || 'Shop Now →'}
                </button>
              </div>
              <div className="hero-art" aria-hidden="true">
                <img src={mediaUrl(s.imageUrl, 'Furniture.webp')} alt={s.title} loading={idx === 0 ? 'eager' : 'lazy'} />
              </div>
            </article>
          ))}
        </div>
        {slides.length > 1 && (
          <>
            <button className="hero-arrow hero-prev" type="button" onClick={() => setSlideIdx((i) => (i - 1 + slides.length) % slides.length)} aria-label="Previous banner">‹</button>
            <button className="hero-arrow hero-next" type="button" onClick={() => setSlideIdx((i) => (i + 1) % slides.length)} aria-label="Next banner">›</button>
            <div className="hero-dots" aria-label="Choose banner">
              {slides.map((_, idx) => (
                <button key={idx} className={`hero-dot ${idx === slideIdx ? 'active' : ''}`} type="button" onClick={() => setSlideIdx(idx)} aria-label={`Show banner ${idx + 1}`} />
              ))}
            </div>
          </>
        )}
      </section>

      <section className="home-directory">
        <div className="bar"><h2>Featured Categories</h2></div>
        <div className="home-tiles">
          <button type="button" onClick={() => navigate('/furniture')}><b>Furniture</b><span>Living room · Bedroom · Dining · Home office</span><i><img src={siteImg('Sofa.webp')} alt="Furniture" loading="lazy" /></i><strong>Shop furniture →</strong></button>
          <button type="button" onClick={() => navigate('/electronics')}><b>Electronics</b><span>TVs · Audio · Smart home · Appliances</span><i><img src={siteImg('AllEle.webp')} alt="Electronics" loading="lazy" /></i><strong>Shop electronics →</strong></button>
          <button type="button" onClick={() => navigate('/ev-scooters')}><b>EV Scooters</b><span>All models · Range · Battery · Charging</span><i><img src={siteImg('Sector.webp')} alt="EV Scooters" loading="lazy" /></i><strong>Explore scooters →</strong></button>
          <button type="button" onClick={() => navigate('/accessories')}><b>Accessories</b><span>Home · Electronic · EV · Spare parts</span><i><img src={siteImg('Accessories.webp')} alt="Accessories" loading="lazy" /></i><strong>Find accessories →</strong></button>
        </div>

        <section className="home-products" aria-labelledby="homeBestTitle">
          <div className="bar"><h2 id="homeBestTitle">Best Sellers</h2><span className="home-section-note">Popular picks selected for you</span></div>
          <div className="home-product-grid">{renderHomeGroup(bestSellers)}</div>
          <div className="bar home-subheading"><h2>New Arrivals</h2><span className="home-section-note">Fresh finds across the marketplace</span></div>
          <div className="home-product-grid">{renderHomeGroup(newArrivals)}</div>
        </section>

        <section className="home-why" id="about">
          <div className="bar"><h2>Why Choose MHA?</h2></div>
          <div className="home-why-grid">
            <article><span>🚚</span><h3>Convenient Shopping</h3><p>Explore multiple product categories from one marketplace.</p></article>
            <article><span>🔒</span><h3>Secure Shopping</h3><p>Checkout options designed to make your shopping experience straightforward.</p></article>
            <article><span>🤝</span><h3>Member Support</h3><p>Access your member area to review purchases and account activity.</p></article>
            <article><span>💬</span><h3>Customer Assistance</h3><p>We're here to help with your questions about products and orders.</p></article>
          </div>
        </section>

        <section className="home-reviews">
          <div className="bar"><h2>Customer Reviews</h2></div>
          <div className="home-review-empty">
            <div className="home-review-stars" aria-label="Five star review">★★★★★</div>
            <h3>Your experience matters to us.</h3>
            <p>Customer feedback will be displayed here as verified reviews become available.</p>
            <button type="button" onClick={() => toast('Customer reviews will be available soon.')}>Share Your Experience</button>
          </div>
        </section>

        <div className="home-promo-banner">
          <div>
            <small>{promo.badge || 'PROMOTIONAL SECTION'}</small>
            <h2>{promo.title || 'Make room for better everyday living.'}</h2>
            <p>{promo.subtitle || 'Discover comfortable furniture, useful electronics and products made for your routine.'}</p>
          </div>
          <img className="promo-photo" src={mediaUrl(promo.imageUrl, 'Furniture.webp')} alt="Comfortable living room furniture" />
          <button type="button" onClick={() => navigate(promo.ctaRoute || '/shop')}>{promo.ctaText || 'Explore the marketplace →'}</button>
        </div>
      </section>
    </main>
  );
}
