import React, { useState } from 'react';
import { apiFetch } from '../api.js';
import { inr, mediaUrl, useStore } from '../context/StoreContext.jsx';
import { matchesProductSearch } from '../utils/searchRouting.js';
import ProductCard from '../components/ProductCard.jsx';

export default function CategoryPage({ category }) {
  const { products, siteContent, toast, searchQuery, setSearchQuery } = useStore();
  const elecPage = siteContent.electronics || {};
  const evPage = siteContent.ev || {};
  const accPage = siteContent.accessories || {};
  const [subFilter, setSubFilter] = useState('');
  const [emiPrice, setEmiPrice] = useState(84999);
  const [emiDown, setEmiDown] = useState(10000);
  const [emiMonths, setEmiMonths] = useState(24);

  const items = products.filter(
    (p) =>
      p.category === category &&
      (!subFilter || p.subcategory === subFilter) &&
      (!searchQuery || matchesProductSearch(p, searchQuery))
  );

  const rate = 0.095 / 12;
  const principal = Math.max(0, Number(emiPrice) - Number(emiDown));
  const n = Math.max(1, Number(emiMonths));
  const emi = (principal * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);

  async function submitService(e, serviceType) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await apiFetch('/support/service', {
        method: 'POST',
        body: JSON.stringify({
          name: fd.get('name'),
          phone: fd.get('phone'),
          product: fd.get('model') || 'EV Scooter',
          serviceType: serviceType || fd.get('serviceType'),
        }),
      });
      e.target.reset();
      toast('Request submitted.');
    } catch (err) {
      toast(err.message);
    }
  }

  return (
    <main id="store" className="category-mode">
      <div className="home-directory" style={{ display: 'block' }}>
        {category === 'Electronics' && (
          <section className="sitemap-group" id="electronics" style={{ display: 'block' }}>
            <div className="page-banner">
              <div><span>{elecPage.badge || 'SMARTER LIVING'}</span><h1>{elecPage.title || 'Electronics for every day'}</h1><p>{elecPage.subtitle || 'Explore displays, sound, smart-home devices and more.'}</p></div>
              <img src={mediaUrl(elecPage.imageUrl, 'Electronics-Appliance.webp')} alt="Electronics and appliances" />
            </div>
            <div className="sitemap-cards">
              {['TV & Displays', 'Audio', 'Smart Home', 'Other Electronics'].map((sub) => (
                <button key={sub} type="button" onClick={() => setSubFilter(sub === subFilter ? '' : sub)}>
                  <b>{sub}</b><span>Browse {sub}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {category === 'EV Scooters' && (
          <section className="sitemap-group" id="ev-services" style={{ display: 'block' }}>
            <div className="page-banner">
              <div><span>{evPage.badge || 'ELECTRIC MOBILITY'}</span><h1>{evPage.title || 'Electric scooters for your journey'}</h1><p>{evPage.subtitle || 'Explore models, charging, ownership and service options.'}</p></div>
              <img src={mediaUrl(evPage.imageUrl, 'EV-Scooter.webp')} alt="Electric scooter" />
            </div>
            <div className="service-tools">
              <section>
                <h3>Finance / EMI Calculator</h3>
                <label>Vehicle price (₹)<input type="number" value={emiPrice} onChange={(e) => setEmiPrice(e.target.value)} min="1" /></label>
                <label>Down payment (₹)<input type="number" value={emiDown} onChange={(e) => setEmiDown(e.target.value)} min="0" /></label>
                <label>Loan term (months)<input type="number" value={emiMonths} onChange={(e) => setEmiMonths(e.target.value)} min="1" max="84" /></label>
                <p>Estimated EMI: {inr(emi || 0)} / month</p>
              </section>
              <section>
                <h3>Book a Test Ride</h3>
                <form className="service-form" onSubmit={(e) => submitService(e, 'Test Ride')}>
                  <input name="name" required placeholder="Your name" />
                  <input name="phone" required type="tel" placeholder="Mobile number" />
                  <select name="model">
                    <option>City Rider EV Scooter</option>
                    <option>Pro Max EV Scooter</option>
                    <option>Lite EV Scooter</option>
                  </select>
                  <button type="submit">Request a test ride</button>
                </form>
              </section>
              <section>
                <h3>Service Booking</h3>
                <form className="service-form" onSubmit={(e) => submitService(e)}>
                  <input name="name" required placeholder="Your name" />
                  <input name="phone" required type="tel" placeholder="Mobile number" />
                  <select name="serviceType">
                    <option>Routine service</option>
                    <option>Battery check</option>
                    <option>Charging support</option>
                    <option>Repair</option>
                  </select>
                  <button type="submit">Request service</button>
                </form>
              </section>
            </div>
          </section>
        )}

        {category === 'Accessories' && (
          <section className="sitemap-group" id="accessories" style={{ display: 'block' }}>
            <div className="page-banner">
              <div><span>{accPage.badge || 'THE FINISHING TOUCH'}</span><h1>{accPage.title || 'Accessories & add-ons'}</h1><p>{accPage.subtitle || 'Find useful extras for furniture, electronics and EVs.'}</p></div>
              <img src={mediaUrl(accPage.imageUrl, 'AllEle.webp')} alt="Product accessories" />
            </div>
            <div className="sitemap-cards">
              {['Furniture Accessories', 'Electronic Accessories', 'EV Accessories', 'Spare Parts & Add-ons'].map((sub) => (
                <button key={sub} type="button" onClick={() => setSubFilter(sub === subFilter ? '' : sub)}>
                  <b>{sub}</b><span>Browse {sub}</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="bar">
        <h2>{category}{subFilter ? ` · ${subFilter}` : ''}{searchQuery ? ` · “${searchQuery}”` : ''} ({items.length})</h2>
        {(subFilter || searchQuery) && (
          <button className="mb o" type="button" onClick={() => { setSubFilter(''); setSearchQuery(''); }}>
            Show all
          </button>
        )}
      </div>
      <div className="grid" id="gr">
        {items.length ? items.map((p) => <ProductCard key={p.id} product={p} />) : <p>No products found in {category} for “{searchQuery}”.</p>}
      </div>
    </main>
  );
}
