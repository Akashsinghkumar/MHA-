import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';

const inr = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
const HOME_TAGS = ['Best Sellers', 'New Arrivals', 'Top Rated', 'Popular Items'];

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function load() {
    try {
      const [pRes, cRes] = await Promise.all([apiFetch('/products?limit=100'), apiFetch('/categories')]);
      setProducts(pRes.products || []);
      setCategories(cRes.categories || []);
    } catch (e) {
      setErr(e.message || 'Failed to load products');
    }
  }

  useEffect(() => { load(); }, []);

  function startEdit(p) {
    setEditing(p);
    setSelectedTags(Array.isArray(p.tags) ? p.tags : []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function toggleTag(tag) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function handleSave(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      const fd = new FormData(e.target);
      fd.append('tags', JSON.stringify(selectedTags));
      if (editing) {
        await apiFetch(`/admin/products/${editing.id}`, { method: 'PUT', body: fd });
        setMsg(`Updated "${fd.get('name')}" (details + image) in database!`);
        setEditing(null);
      } else {
        await apiFetch('/admin/products', { method: 'POST', body: fd });
        setMsg('New product added to database!');
      }
      setSelectedTags([]);
      e.target.reset();
      load();
    } catch (error) {
      setErr(error.message || 'Could not save product');
    }
  }

  async function handleRemove(id) {
    if (!confirm('Deactivate this product?')) return;
    await apiFetch(`/admin/products/${id}`, { method: 'DELETE' });
    setMsg('Product removed.');
    load();
  }

  return (
    <>
      <h2>Product Management</h2>
      <p className="subtitle">{products.length} products in database. Edit details, prices, images &amp; Home page sections.</p>
      {msg && <div className="cms-toast-bar">{msg}</div>}
      {err && <div className="err" style={{ marginBottom: '14px' }}>{err}</div>}

      <form onSubmit={handleSave} className="card-box" key={editing?.id || 'new-prod'}>
        <h3>{editing ? `Edit Product #${editing.id}: ${editing.name}` : 'Add New Product'}</h3>
        <div className="form-grid">
          <label>Name<input name="name" defaultValue={editing?.name || ''} required /></label>
          <label>Category
            <select name="categoryId" defaultValue={editing?.categoryId || categories[0]?.id || ''}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>Subcategory<input name="subcategory" defaultValue={editing?.subcategory || ''} required placeholder="Living Room / Audio / City Rider" /></label>
          <label>Brand<input name="brand" defaultValue={editing?.brand || 'MHA'} /></label>
          <label>Actual Price (₹)<input name="actualPrice" type="number" defaultValue={editing?.actualPrice || ''} required /></label>
          <label>Offer Price (₹)<input name="offerPrice" type="number" defaultValue={editing?.offerPrice || ''} required /></label>
          <label>Rating (0–5)<input name="rating" type="number" step="0.1" min="0" max="5" defaultValue={editing?.rating ?? 4.5} /></label>
          <label>Stock<input name="stock" type="number" defaultValue={editing?.stock ?? 50} /></label>
          <label>
            {editing ? 'Replace Image (optional)' : 'Image'}{' '}
            <small style={{ color: 'var(--gold)' }}>(Exact fit: 800 × 800 px · 1:1 Square)</small>
            <input name="image" type="file" accept="image/*" />
          </label>
        </div>
        <label>Description<textarea name="description" rows="2" defaultValue={editing?.description || ''} /></label>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '10px' }}>
          {HOME_TAGS.map((tag) => (
            <label key={tag} style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
              <input
                type="checkbox"
                style={{ width: 'auto' }}
                checked={selectedTags.includes(tag)}
                onChange={() => toggleTag(tag)}
              />
              {tag}
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          <button className="btn" type="submit">{editing ? 'Save Product Changes' : 'Add Product'}</button>
          {editing && <button className="btn ghost" type="button" onClick={() => { setEditing(null); setSelectedTags([]); }}>Cancel Edit</button>}
        </div>
      </form>

      <div className="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Category</th><th>Offer / Actual</th><th>Home Tags</th><th>Stock</th><th>Actions</th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>#{p.id}</td>
                <td><b>{p.name}</b></td>
                <td>{p.category?.name} · {p.subcategory}</td>
                <td>{inr(p.offerPrice)} <small style={{ color: 'var(--mut)', textDecoration: 'line-through' }}>{inr(p.actualPrice)}</small></td>
                <td>{(p.tags || []).join(', ') || '—'}</td>
                <td>{p.stock}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn teal sm" type="button" onClick={() => startEdit(p)}>Edit</button>{' '}
                  <button className="btn danger sm" type="button" onClick={() => handleRemove(p.id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
