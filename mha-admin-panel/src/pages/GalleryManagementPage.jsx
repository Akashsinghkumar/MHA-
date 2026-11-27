import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';

const isLocalhost =
  typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);

const BACKEND_ORIGIN = (
  import.meta.env.VITE_API_URL ||
  (isLocalhost ? 'http://127.0.0.1:5000/api' : 'https://mha-production-c977c1c9.up.railway.app/api')
).replace(/\/api\/?$/, '');

const PUBLIC_ORIGIN = isLocalhost
  ? 'http://127.0.0.1:5174'
  : 'https://melodious-passion-production-30694a3f.up.railway.app';

const resolveImg = (url) => {
  if (!url) return '';
  if (url.startsWith('/uploads/')) return `${BACKEND_ORIGIN}${url}`;
  if (url.startsWith('/image/')) return `${PUBLIC_ORIGIN}${url}`;
  return url;
};

export default function GalleryManagementPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function load() {
    setErr('');
    try {
      const res = await apiFetch('/admin/gallery');
      setItems(res.items || []);
    } catch (e) {
      setErr(e.message || 'Failed to load gallery items');
    }
  }

  useEffect(() => { load(); }, []);

  async function addGalleryItem(e) {
    e.preventDefault();
    setMsg('');
    setErr('');
    try {
      const fd = new FormData(e.target);
      await apiFetch('/admin/gallery', { method: 'POST', body: fd });
      e.target.reset();
      setMsg('Gallery item added & synced to Public Website!');
      load();
    } catch (e2) {
      setErr(e2.message || 'Failed to add gallery item');
    }
  }

  async function toggleApproval(item) {
    setMsg('');
    await apiFetch(`/admin/gallery/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify({ isApproved: !item.isApproved }),
    });
    setMsg(item.isApproved ? 'Item hidden from public gallery.' : 'Item approved & published!');
    load();
  }

  async function deleteItem(id) {
    if (!confirm('Delete this gallery item?')) return;
    await apiFetch(`/admin/gallery/${id}`, { method: 'DELETE' });
    setMsg('Gallery item deleted.');
    load();
  }

  const visibleItems = filter === 'all' ? items : items.filter((it) => it.type === filter);

  return (
    <>
      <h2>Gallery Management</h2>
      <p className="subtitle">Upload showroom photos/videos and approve or remove customer-submitted photos.</p>

      {msg && <div className="cms-toast-bar">{msg}</div>}
      {err && <div className="err" style={{ marginBottom: '12px' }}>{err}</div>}

      <form onSubmit={addGalleryItem} className="card-box">
        <h3 style={{ marginTop: 0 }}>Add New Gallery Photo / Video</h3>
        <div className="form-grid">
          <label>Title
            <input name="title" required placeholder="e.g. Modern Living Room Setup" />
          </label>
          <label>Type
            <select name="type" defaultValue="product">
              <option value="product">Product Showcase</option>
              <option value="video">Video Showcase</option>
              <option value="customer">Customer Photo</option>
            </select>
          </label>
          <label>Upload Image (Cloudinary)
            <input name="image" type="file" accept="image/*" />
          </label>
          <label>Or Video / Image URL
            <input name="videoUrl" placeholder="https://..." />
          </label>
        </div>
        <label style={{ marginTop: '10px' }}>Description
          <textarea name="description" rows="2" placeholder="Short caption for the gallery card" />
        </label>
        <button className="btn" style={{ marginTop: '12px' }} type="submit">Add to Gallery</button>
      </form>

      <div className="cms-tabs">
        {[['all', 'All Items'], ['customer', 'Customer Photos'], ['product', 'Showroom Products'], ['video', 'Videos']].map(([k, label]) => (
          <button key={k} type="button" className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>
            {label}
          </button>
        ))}
      </div>

      <div className="cms-card-grid">
        {visibleItems.length ? visibleItems.map((it) => (
          <article key={it.id} className="cms-item-card">
            {it.imageUrl && <img className="cms-preview-thumb" src={resolveImg(it.imageUrl)} alt={it.title} />}
            <div className="cms-item-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge">{it.type}</span>
                <span className="badge" style={{ color: it.isApproved ? '#15803d' : '#b45309' }}>
                  {it.isApproved ? 'Published' : 'Pending Review'}
                </span>
              </div>
              <h4>{it.title}</h4>
              <p>{it.description || ''}</p>
              <div className="cms-item-actions">
                <button type="button" className="btn sm teal" onClick={() => toggleApproval(it)}>
                  {it.isApproved ? 'Hide' : 'Approve'}
                </button>
                <button type="button" className="btn sm danger" onClick={() => deleteItem(it.id)}>
                  Delete
                </button>
              </div>
            </div>
          </article>
        )) : <p>No gallery items in this category yet.</p>}
      </div>
    </>
  );
}
