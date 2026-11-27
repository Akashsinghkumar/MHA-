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

export default function WebsiteCmsPage() {
  const [cmsTab, setCmsTab] = useState('banners');
  const [banners, setBanners] = useState([]);
  const [pages, setPages] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [offers, setOffers] = useState([]);
  const [editBanner, setEditBanner] = useState(null);
  const [editPage, setEditPage] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function loadAll() {
    try {
      const [bRes, pRes, gRes, fRes, oRes] = await Promise.all([
        apiFetch('/admin/banners'),
        apiFetch('/admin/site-content'),
        apiFetch('/admin/gallery'),
        apiFetch('/support/faqs'),
        apiFetch('/offers'),
      ]);
      setBanners(bRes.banners || []);
      setPages(pRes.pages || []);
      setGallery(gRes.items || []);
      setFaqs(fRes.faqs || []);
      setOffers(oRes.offers || []);
    } catch (e) {
      setErr(e.message || 'Failed to load CMS data');
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function saveBanner(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      const fd = new FormData(e.target);
      if (editBanner?.id) {
        await apiFetch(`/admin/banners/${editBanner.id}`, { method: 'PUT', body: fd });
        setMsg('Hero banner updated — live on Public Website!');
      } else {
        await apiFetch('/admin/banners', { method: 'POST', body: fd });
        setMsg('New hero banner added!');
      }
      setEditBanner(null);
      e.target.reset();
      loadAll();
    } catch (error) {
      setErr(error.message || 'Could not save banner');
    }
  }

  async function deleteBanner(id) {
    if (!confirm('Delete this hero banner?')) return;
    await apiFetch(`/admin/banners/${id}`, { method: 'DELETE' });
    if (editBanner?.id === id) setEditBanner(null);
    setMsg('Hero banner deleted.');
    loadAll();
  }

  async function toggleBannerActive(b) {
    await apiFetch(`/admin/banners/${b.id}`, {
      method: 'PUT',
      body: JSON.stringify({ isActive: !b.isActive }),
    });
    setMsg(`Banner #${b.id} is now ${!b.isActive ? 'Active' : 'Hidden'}.`);
    loadAll();
  }

  function startEditBanner(b) {
    setEditBanner(b);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startEditPage(pg) {
    setEditPage(pg);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function savePageContent(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    await apiFetch(`/admin/site-content/${editPage.pageKey}`, { method: 'PUT', body: fd });
    setMsg(`Updated "${editPage.pageKey}" page content & image!`);
    setEditPage(null);
    loadAll();
  }

  async function addGallery(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    await apiFetch('/admin/gallery', { method: 'POST', body: fd });
    e.target.reset();
    setMsg('Gallery item published.');
    loadAll();
  }

  async function toggleApproveGallery(item) {
    await apiFetch(`/admin/gallery/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify({ isApproved: !item.isApproved }),
    });
    loadAll();
  }

  async function deleteGallery(id) {
    await apiFetch(`/admin/gallery/${id}`, { method: 'DELETE' });
    loadAll();
  }

  async function addFaq(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    await apiFetch('/admin/faqs', {
      method: 'POST',
      body: JSON.stringify({ question: fd.get('question'), answer: fd.get('answer'), sortOrder: faqs.length + 1 }),
    });
    e.target.reset();
    setMsg('FAQ added.');
    loadAll();
  }

  async function deleteFaq(id) {
    await apiFetch(`/admin/faqs/${id}`, { method: 'DELETE' });
    loadAll();
  }

  async function saveOffer(e, slug) {
    e.preventDefault();
    const fd = new FormData(e.target);
    fd.append('slug', slug);
    await apiFetch('/admin/offers', { method: 'POST', body: fd });
    setMsg(`Offer "${slug}" updated!`);
    loadAll();
  }

  return (
    <div className="cms-studio">
      <div className="cms-studio-head">
        <div>
          <span className="cms-studio-badge">WEBSITE CMS STUDIO</span>
          <h2>Manage Public Website Content &amp; Images</h2>
          <p className="subtitle" style={{ marginBottom: 0 }}>
            Edit banners, page headings, images, offers, gallery &amp; FAQs — changes appear live on the Public Website.
          </p>
        </div>
      </div>

      {msg && <div className="cms-toast-bar">{msg}</div>}
      {err && <div className="err" style={{ marginBottom: '14px' }}>{err}</div>}

      <div className="cms-size-guide">
        <div><span>Home Hero Split Banner</span><strong>1200 × 740 px (16:10)</strong></div>
        <div><span>Page Banners &amp; Promo</span><strong>960 × 500 px (2:1)</strong></div>
        <div><span>Offers Section Banner</span><strong>1000 × 550 px (Landscape)</strong></div>
        <div><span>Product Card Image</span><strong>800 × 800 px (1:1 Square)</strong></div>
      </div>

      <div className="cms-tabs">
        {[
          ['banners', 'Home Hero Banners'],
          ['pages', 'All Page Banners & Texts'],
          ['offers', 'Offers & Promo Codes'],
          ['gallery', 'Gallery & Customer Photos'],
          ['faqs', 'Support FAQs'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={cmsTab === id ? 'on' : ''}
            onClick={() => setCmsTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {cmsTab === 'banners' && (
        <div>
          <form className="cms-editor-card" onSubmit={saveBanner} key={editBanner?.id || 'new-banner'}>
            <h3>{editBanner ? `Edit Hero Slide #${editBanner.id}` : 'Add New Hero Slide'}</h3>
            <div className="form-grid">
              <label>Title (White text)<input name="title" defaultValue={editBanner?.title || ''} required placeholder="e.g. Beautiful &" /></label>
              <label>Highlight Text (Gold text)<input name="highlightText" defaultValue={editBanner?.highlightText || ''} placeholder="e.g. Comfortable" /></label>
              <label>Kicker / Tagline<input name="kicker" defaultValue={editBanner?.kicker || ''} placeholder="WELCOME TO MHA" /></label>
              <label>Button Text<input name="buttonText" defaultValue={editBanner?.buttonText || 'Shop Furniture →'} required /></label>
              <label>Button Route<input name="buttonRoute" defaultValue={editBanner?.buttonRoute || '/furniture'} required placeholder="/furniture or /shop" /></label>
              <label>Sort Order<input name="sortOrder" type="number" defaultValue={editBanner?.sortOrder ?? banners.length + 1} /></label>
              <label>
                Upload New Image <small style={{ color: 'var(--gold)' }}>(Exact fit: 1200 × 740 px · 16:10 Landscape)</small>
                <input name="image" type="file" accept="image/*" />
                {editBanner?.imageUrl && (
                  <img src={resolveImg(editBanner.imageUrl)} alt="Current banner" style={{ marginTop: '8px', height: '70px', borderRadius: '6px', objectFit: 'cover' }} />
                )}
              </label>
              <label>Active
                <select name="isActive" defaultValue={editBanner ? String(editBanner.isActive) : 'true'}>
                  <option value="true">Active (Visible)</option>
                  <option value="false">Hidden</option>
                </select>
              </label>
            </div>
            <label>Description<textarea name="description" rows="2" defaultValue={editBanner?.description || ''} required /></label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button className="btn teal" type="submit">{editBanner ? 'Save Banner Changes' : 'Add Hero Banner'}</button>
              {editBanner && <button className="btn ghost" type="button" onClick={() => setEditBanner(null)}>Cancel</button>}
            </div>
          </form>

          <div className="cms-card-grid">
            {banners.map((b) => (
              <article className="cms-item-card" key={b.id}>
                <img src={resolveImg(b.imageUrl)} alt={b.title} className="cms-preview-thumb" />
                <div className="cms-item-body">
                  <span className="badge">Slide #{b.sortOrder} · {b.isActive ? 'Active' : 'Hidden'}</span>
                  <h4>{b.title} <span style={{ color: 'var(--gold)' }}>{b.highlightText}</span></h4>
                  <p>{b.description}</p>
                  <small>Button: <b>{b.buttonText}</b> → <code>{b.buttonRoute}</code></small>
                  <div className="cms-item-actions">
                    <button className="btn teal sm" type="button" onClick={() => startEditBanner(b)}>Edit</button>
                    <button className="btn ghost sm" type="button" onClick={() => toggleBannerActive(b)}>{b.isActive ? 'Hide' : 'Show'}</button>
                    <button className="btn danger sm" type="button" onClick={() => deleteBanner(b.id)}>Delete</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {cmsTab === 'pages' && (
        <div>
          {editPage && (
            <form className="cms-editor-card" onSubmit={savePageContent} key={editPage.pageKey}>
              <h3>Editing Page: <code>{editPage.pageKey}</code></h3>
              <div className="form-grid">
                <label>Badge / Kicker<input name="badge" defaultValue={editPage.badge || ''} /></label>
                <label>Heading Title<input name="title" defaultValue={editPage.title || ''} required /></label>
                <label>CTA Button Text (optional)<input name="ctaText" defaultValue={editPage.ctaText || ''} /></label>
                <label>CTA Route (optional)<input name="ctaRoute" defaultValue={editPage.ctaRoute || ''} /></label>
                <label>Replace Banner Image <small style={{ color: 'var(--gold)' }}>(Exact fit: 960 × 500 px · 2:1 Landscape)</small><input name="image" type="file" accept="image/*" /></label>
              </div>
              <label>Subtitle / Description<textarea name="subtitle" rows="2" defaultValue={editPage.subtitle || ''} /></label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button className="btn teal" type="submit">Save Page Content</button>
                <button className="btn ghost" type="button" onClick={() => setEditPage(null)}>Cancel</button>
              </div>
            </form>
          )}

          <div className="cms-card-grid">
            {pages.map((pg) => (
              <article className="cms-item-card" key={pg.pageKey}>
                {pg.imageUrl && <img src={resolveImg(pg.imageUrl)} alt={pg.title} className="cms-preview-thumb" />}
                <div className="cms-item-body">
                  <span className="badge">{pg.pageKey}</span>
                  <h4>{pg.title}</h4>
                  <p>{pg.subtitle}</p>
                  <div className="cms-item-actions">
                    <button className="btn teal sm" type="button" onClick={() => startEditPage(pg)}>Edit Page &amp; Image</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {cmsTab === 'offers' && (
        <div className="cms-card-grid">
          {offers.map((o) => (
            <form className="cms-editor-card" key={o.id} onSubmit={(e) => saveOffer(e, o.slug)}>
              <span className="badge">{o.slug}</span>
              <label>Title<input name="title" defaultValue={o.title} required /></label>
              <label>Tagline<input name="tagline" defaultValue={o.tagline || ''} /></label>
              <label>Promo Code<input name="promoCode" defaultValue={o.promoCode || ''} /></label>
              <label>Description<textarea name="description" rows="2" defaultValue={o.description || ''} /></label>
              <label>Replace Banner Image <small style={{ color: 'var(--gold)' }}>(Exact fit: 1000 × 550 px · Landscape)</small><input name="banner" type="file" accept="image/*" /></label>
              <button className="btn teal sm" style={{ marginTop: '10px' }} type="submit">Save Offer</button>
            </form>
          ))}
        </div>
      )}

      {cmsTab === 'gallery' && (
        <div>
          <form className="cms-editor-card" onSubmit={addGallery}>
            <h3>Add Gallery Photo / YouTube Video</h3>
            <div className="form-grid">
              <label>Type
                <select name="type">
                  <option value="photo">Product Photo</option>
                  <option value="showroom">Showroom</option>
                  <option value="video">YouTube Video</option>
                </select>
              </label>
              <label>Title<input name="title" required /></label>
              <label>Category<input name="category" placeholder="Furniture / Showroom" /></label>
              <label>Video URL (optional)<input name="videoUrl" placeholder="https://youtu.be/..." /></label>
              <label>Image<input name="image" type="file" accept="image/*" /></label>
            </div>
            <label>Description<input name="description" /></label>
            <button className="btn teal" style={{ marginTop: '10px' }} type="submit">Publish to Gallery</button>
          </form>

          <div className="table-wrap">
            <table>
              <thead><tr><th>Type</th><th>Title</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {gallery.length ? gallery.map((g) => (
                  <tr key={g.id}>
                    <td>{g.type}</td>
                    <td>{g.title}</td>
                    <td><span className="badge">{g.isApproved ? 'Published' : 'Pending'}</span></td>
                    <td>
                      <button className="btn teal sm" type="button" onClick={() => toggleApproveGallery(g)}>
                        {g.isApproved ? 'Unpublish' : 'Approve'}
                      </button>{' '}
                      <button className="btn danger sm" type="button" onClick={() => deleteGallery(g.id)}>Delete</button>
                    </td>
                  </tr>
                )) : <tr><td colSpan="4">No custom gallery items yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {cmsTab === 'faqs' && (
        <div>
          <form className="cms-editor-card" onSubmit={addFaq}>
            <h3>Add Support FAQ</h3>
            <label>Question<input name="question" required /></label>
            <label>Answer<textarea name="answer" rows="2" required /></label>
            <button className="btn teal" style={{ marginTop: '10px' }} type="submit">Add FAQ</button>
          </form>

          <div className="table-wrap">
            <table>
              <thead><tr><th>Question</th><th>Answer</th><th>Action</th></tr></thead>
              <tbody>
                {faqs.map((f) => (
                  <tr key={f.id}>
                    <td><b>{f.question}</b></td>
                    <td>{f.answer}</td>
                    <td><button className="btn danger sm" type="button" onClick={() => deleteFaq(f.id)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
