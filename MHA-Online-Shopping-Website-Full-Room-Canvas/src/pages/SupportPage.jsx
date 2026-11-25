import React, { useState } from 'react';
import { apiFetch } from '../api.js';
import { mediaUrl, useStore } from '../context/StoreContext.jsx';

export default function SupportPage() {
  const { faqs, supportConfig, siteContent, toast } = useStore();
  const page = siteContent.support || {};
  const [trackId, setTrackId] = useState('');
  const [trackResult, setTrackResult] = useState('');
  const [ticketResult, setTicketResult] = useState('');

  async function handleTrack(e) {
    e.preventDefault();
    try {
      const { order } = await apiFetch(`/orders/track/${encodeURIComponent(trackId.trim().toUpperCase())}`);
      setTrackResult(`${order.orderNumber} · ${order.status}${order.statusNote ? ` · ${order.statusNote}` : ''}`);
    } catch {
      setTrackResult(`No order found for ${trackId.trim().toUpperCase()}. Check the ID or contact support.`);
    }
  }

  async function handleWarranty(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const { claim } = await apiFetch('/support/warranty', {
        method: 'POST',
        body: JSON.stringify({ orderNumber: fd.get('warrantyOrder'), issue: fd.get('warrantyIssue') }),
      });
      e.target.reset();
      toast(`Warranty claim created: ${claim.claimNumber}`);
    } catch (err) {
      toast(err.message);
    }
  }

  async function handleService(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const { booking } = await apiFetch('/support/service', {
        method: 'POST',
        body: JSON.stringify({
          name: fd.get('serviceName'),
          phone: fd.get('servicePhone'),
          product: fd.get('serviceProduct'),
          serviceType: fd.get('serviceType'),
        }),
      });
      e.target.reset();
      toast(`Service booking created: ${booking.bookingNumber}`);
    } catch (err) {
      toast(err.message);
    }
  }

  async function handleContact(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const { ticket } = await apiFetch('/support/tickets', {
        method: 'POST',
        body: JSON.stringify({
          name: fd.get('ticketName'),
          email: fd.get('ticketEmail'),
          message: fd.get('ticketMessage'),
        }),
      });
      setTicketResult(`Your support ticket is ${ticket.ticketNumber}. Keep this ID for follow-up.`);
      e.target.reset();
    } catch (err) {
      toast(err.message);
    }
  }

  return (
    <main id="store" className="info-mode">
      <section className="sitemap-group support-group" id="support" style={{ display: 'block' }}>
        <div className="page-banner">
          <div>
            <span>{page.badge || 'CUSTOMER CARE'}</span>
            <h1>{page.title || 'Support Centre'}</h1>
            <p>{page.subtitle || "We're here to make your shopping experience easier."}</p>
          </div>
          <img src={mediaUrl(page.imageUrl, 'Accessories.webp')} alt="MHA customer support" />
        </div>

        <div className="support-grid support-hub-grid">
          <section className="support-card">
            <span className="support-number">01</span>
            <h2>FAQ</h2>
            <p>General questions and answers.</p>
            <div>
              {faqs.map((f) => (
                <details key={f.id}>
                  <summary>{f.question}</summary>
                  <p>{f.answer}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="support-card">
            <span className="support-number">02</span>
            <h2>Shipping &amp; Delivery</h2>
            <p>{supportConfig.shipping_policy}</p>
          </section>

          <section className="track-card">
            <span className="support-number">03</span>
            <h2>Order Tracking</h2>
            <form onSubmit={handleTrack}>
              <input value={trackId} onChange={(e) => setTrackId(e.target.value)} placeholder="Order ID" required />
              <button type="submit">Track order</button>
            </form>
            <p aria-live="polite">{trackResult}</p>
          </section>

          <section className="support-card">
            <span className="support-number">04</span>
            <h2>Warranty</h2>
            <p>{supportConfig.warranty_policy}</p>
            <form className="service-form" onSubmit={handleWarranty}>
              <input name="warrantyOrder" required placeholder="Order ID" />
              <textarea name="warrantyIssue" required placeholder="Describe the warranty issue" />
              <button type="submit">Submit warranty claim</button>
            </form>
          </section>

          <section className="support-card">
            <span className="support-number">05</span>
            <h2>Installation &amp; Services</h2>
            <p>Book an installation or service visit.</p>
            <form className="service-form" onSubmit={handleService}>
              <input name="serviceName" required placeholder="Your name" />
              <input name="servicePhone" required type="tel" placeholder="Phone number" />
              <input name="serviceProduct" required placeholder="Product / order" />
              <select name="serviceType">
                <option>Installation</option>
                <option>Repair</option>
                <option>Maintenance</option>
              </select>
              <button type="submit">Book service</button>
            </form>
          </section>

          <section className="support-card">
            <span className="support-number">06</span>
            <h2>Contact Support</h2>
            <p className="support-contact-links">
              {supportConfig.support_email && <a href={`mailto:${supportConfig.support_email}`}>{supportConfig.support_email}</a>}
              {supportConfig.support_phone && <> · <a href={`tel:${supportConfig.support_phone}`}>{supportConfig.support_phone}</a></>}
            </p>
            <form className="service-form" onSubmit={handleContact}>
              <input name="ticketName" required placeholder="Your name" />
              <input name="ticketEmail" required type="email" placeholder="Your email" />
              <textarea name="ticketMessage" required placeholder="How can we help?" />
              <button type="submit">Create support ticket</button>
            </form>
            {ticketResult && <p className="support-form-result" aria-live="polite">{ticketResult}</p>}
          </section>
        </div>
      </section>
    </main>
  );
}
