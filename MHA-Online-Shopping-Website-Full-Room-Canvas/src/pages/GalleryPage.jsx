import React from 'react';
import { apiFetch } from '../api.js';
import { mediaUrl, useStore } from '../context/StoreContext.jsx';

export default function GalleryPage() {
  const { products, gallery, siteContent, toast } = useStore();
  const page = siteContent.gallery || {};

  const furniture = products.filter((p) => p.category === 'Furniture').slice(0, 8);
  const electronics = products.filter((p) => p.category === 'Electronics').slice(0, 6);
  const ev = products.filter((p) => p.category === 'EV Scooters').slice(0, 6);
  const customerPhotos = gallery.filter((g) => g.type === 'customer');

  async function submitPhoto(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await apiFetch('/gallery/customer-photo', { method: 'POST', body: fd });
      e.target.reset();
      toast('Photo submitted for admin review');
    } catch (err) {
      toast(err.message);
    }
  }

  function renderGroup(title, subtitle, items) {
    return (
      <section className="gallery-group">
        <div className="gallery-group-head">
          <div><span>{subtitle}</span><h2>{title}</h2></div>
        </div>
        <div className="gallery-cards">
          {items.length ? items.map((item, idx) => (
            <article key={item.id || idx}>
              <img src={item.imageUrl} alt={item.name || item.title} loading="lazy" />
              <b>{item.name || item.title}</b>
              <span>{item.subcategory ? `${item.subcategory} · ${item.category}` : (item.description || '')}</span>
            </article>
          )) : <p className="gallery-empty">Content will appear here when it is published.</p>}
        </div>
      </section>
    );
  }

  return (
    <main id="store" className="info-mode">
      <section className="sitemap-group" id="gallery" style={{ display: 'block' }}>
        <div className="page-banner">
          <div>
            <span>{page.badge || 'SEE MHA UP CLOSE'}</span>
            <h1>{page.title || 'Gallery & Videos'}</h1>
            <p>{page.subtitle || 'Explore products, videos and customer experiences.'}</p>
          </div>
          <img src={mediaUrl(page.imageUrl, 'AllEle.webp')} alt="MHA product gallery" />
        </div>

        {renderGroup('Product Gallery', 'Furniture Collection', furniture)}
        {renderGroup('Electronics', 'Electronics & Appliances', electronics)}
        {renderGroup('EV', 'Electric mobility', ev)}
        {renderGroup('Customer Photos', 'Customer Homes · Product Setup', customerPhotos)}

        <section className="gallery-submit">
          <div>
            <h2>Share your MHA setup</h2>
            <p>Submit a customer photo for review. Approved photos appear in Customer Photos.</p>
          </div>
          <form className="service-form" onSubmit={submitPhoto}>
            <input name="title" required maxLength={80} placeholder="Photo title" />
            <input name="description" maxLength={180} placeholder="Short description" />
            <input name="image" type="file" accept="image/*" required />
            <button type="submit">Submit for review</button>
          </form>
        </section>
      </section>
    </main>
  );
}
