import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';

export default function SupportCenterPage() {
  const [tab, setTab] = useState('tickets');
  const [tickets, setTickets] = useState([]);
  const [warrantyClaims, setWarrantyClaims] = useState([]);
  const [serviceBookings, setServiceBookings] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function load() {
    setErr('');
    try {
      const res = await apiFetch('/admin/support');
      setTickets(res.tickets || []);
      setWarrantyClaims(res.warrantyClaims || []);
      setServiceBookings(res.serviceBookings || []);
      setFaqs(res.faqs || []);
    } catch (e) {
      setErr(e.message || 'Failed to load support center data');
    }
  }

  useEffect(() => { load(); }, []);

  async function updateTicket(id, status, adminReply) {
    setMsg('');
    await apiFetch(`/admin/support/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, ...(adminReply !== undefined ? { adminReply } : {}) }),
    });
    setMsg('Support ticket updated.');
    load();
  }

  async function updateWarranty(id, status) {
    setMsg('');
    await apiFetch(`/admin/warranty/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    setMsg('Warranty claim updated.');
    load();
  }

  async function updateBooking(id, status) {
    setMsg('');
    await apiFetch(`/admin/service-bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    setMsg('Service booking updated.');
    load();
  }

  async function addFaq(e) {
    e.preventDefault();
    setMsg('');
    await apiFetch('/admin/faqs', {
      method: 'POST',
      body: JSON.stringify(faqForm),
    });
    setFaqForm({ question: '', answer: '' });
    setMsg('FAQ added to Support Centre!');
    load();
  }

  async function deleteFaq(id) {
    if (!confirm('Delete this FAQ?')) return;
    await apiFetch(`/admin/faqs/${id}`, { method: 'DELETE' });
    setMsg('FAQ deleted.');
    load();
  }

  return (
    <>
      <h2>Support Center</h2>
      <p className="subtitle">Manage customer support tickets, warranty claims, EV service bookings, and FAQs.</p>

      {msg && <div className="cms-toast-bar">{msg}</div>}
      {err && <div className="err" style={{ marginBottom: '12px' }}>{err}</div>}

      <div className="cms-tabs">
        <button type="button" className={tab === 'tickets' ? 'on' : ''} onClick={() => setTab('tickets')}>
          Support Tickets ({tickets.length})
        </button>
        <button type="button" className={tab === 'warranty' ? 'on' : ''} onClick={() => setTab('warranty')}>
          Warranty Claims ({warrantyClaims.length})
        </button>
        <button type="button" className={tab === 'bookings' ? 'on' : ''} onClick={() => setTab('bookings')}>
          Service &amp; Test Rides ({serviceBookings.length})
        </button>
        <button type="button" className={tab === 'faqs' ? 'on' : ''} onClick={() => setTab('faqs')}>
          Support FAQs ({faqs.length})
        </button>
      </div>

      {tab === 'tickets' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Ticket</th><th>Customer</th><th>Subject / Message</th><th>Status</th><th>Reply</th></tr></thead>
            <tbody>
              {tickets.length ? tickets.map((t) => (
                <tr key={t.id}>
                  <td><b>#{t.id}</b></td>
                  <td>{t.user?.name || 'Guest'}<br /><small>{t.user?.phone || t.user?.email || ''}</small></td>
                  <td><b>{t.subject}</b><br /><small>{t.message}</small></td>
                  <td>
                    <select value={t.status} onChange={(e) => updateTicket(t.id, e.target.value)}>
                      {['Open', 'In Progress', 'Resolved', 'Closed'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn sm teal"
                      onClick={() => {
                        const reply = prompt('Enter reply for customer:', t.adminReply || '');
                        if (reply !== null) updateTicket(t.id, t.status, reply);
                      }}
                    >
                      {t.adminReply ? 'Edit Reply' : 'Add Reply'}
                    </button>
                  </td>
                </tr>
              )) : <tr><td colSpan="5">No support tickets yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'warranty' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Claim</th><th>Customer</th><th>Product / Issue</th><th>Status</th></tr></thead>
            <tbody>
              {warrantyClaims.length ? warrantyClaims.map((c) => (
                <tr key={c.id}>
                  <td><b>#{c.id}</b></td>
                  <td>{c.user?.name || 'Customer'} ({c.user?.phone || ''})</td>
                  <td><b>{c.productName || c.orderNumber}</b><br /><small>{c.issueDescription}</small></td>
                  <td>
                    <select value={c.status} onChange={(e) => updateWarranty(c.id, e.target.value)}>
                      {['Pending', 'Approved', 'In Repair', 'Replaced', 'Rejected'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              )) : <tr><td colSpan="4">No warranty claims yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'bookings' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Booking</th><th>Customer</th><th>Product &amp; Service</th><th>Status</th></tr></thead>
            <tbody>
              {serviceBookings.length ? serviceBookings.map((b) => (
                <tr key={b.id}>
                  <td><b>#{b.id}</b></td>
                  <td>{b.name} ({b.phone})</td>
                  <td><b>{b.product}</b> — {b.serviceType}</td>
                  <td>
                    <select value={b.status} onChange={(e) => updateBooking(b.id, e.target.value)}>
                      {['Requested', 'Scheduled', 'Completed', 'Cancelled'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              )) : <tr><td colSpan="4">No service or test ride bookings yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'faqs' && (
        <>
          <form onSubmit={addFaq} className="card-box">
            <h3 style={{ marginTop: 0 }}>Add Support FAQ</h3>
            <div className="form-grid">
              <label>Question
                <input required value={faqForm.question} onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })} placeholder="e.g. How long does delivery take?" />
              </label>
              <label>Answer
                <input required value={faqForm.answer} onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })} placeholder="Standard delivery takes 3–7 business days." />
              </label>
            </div>
            <button className="btn" style={{ marginTop: '12px' }} type="submit">Add FAQ</button>
          </form>

          <div className="table-wrap">
            <table>
              <thead><tr><th>Question</th><th>Answer</th><th>Action</th></tr></thead>
              <tbody>
                {faqs.map((f) => (
                  <tr key={f.id}>
                    <td><b>{f.question}</b></td>
                    <td>{f.answer}</td>
                    <td><button type="button" className="btn sm danger" onClick={() => deleteFaq(f.id)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
