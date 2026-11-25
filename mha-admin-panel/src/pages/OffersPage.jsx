import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';

export default function OffersPage() {
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    apiFetch('/offers').then((d) => setOffers(d.offers || []));
  }, []);

  return (
    <>
      <h2>Offers Management</h2>
      <p className="subtitle">Active offer sections on the public store.</p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Slug</th><th>Title</th><th>Promo Code</th><th>Products</th></tr></thead>
          <tbody>
            {offers.map((o) => (
              <tr key={o.id}>
                <td>{o.slug}</td>
                <td><b>{o.title}</b></td>
                <td>{o.promoCode || '—'}</td>
                <td>{o.products?.length || 0} items</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
