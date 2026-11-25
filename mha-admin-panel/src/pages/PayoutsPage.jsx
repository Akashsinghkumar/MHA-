import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';

const inr = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState([]);
  const [msg, setMsg] = useState('');

  async function load() {
    const { payouts: data } = await apiFetch('/admin/payouts');
    setPayouts(data || []);
  }

  useEffect(() => { load(); }, []);

  async function runClosing(closingType) {
    await apiFetch('/admin/closing', { method: 'POST', body: JSON.stringify({ closingType }) });
    setMsg(`${closingType} closing completed.`);
  }

  async function processPayout(id, status) {
    await apiFetch(`/admin/payouts/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
    setMsg(`Payout #${id} marked ${status}.`);
    load();
  }

  return (
    <>
      <h2>Closing &amp; Payout Management</h2>
      <p className="subtitle">Run commission closing and approve member payouts.</p>
      {msg && <p style={{ color: 'var(--teal)', fontWeight: 700 }}>{msg}</p>}
      <div className="card-box">
        <button className="btn teal" type="button" onClick={() => runClosing('Daily')}>Run Daily Closing</button>{' '}
        <button className="btn" type="button" onClick={() => runClosing('Monthly')}>Run Monthly Closing</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Member</th><th>Requested</th><th>Net (after 10%)</th><th>Bank/UPI</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {payouts.length ? payouts.map((p) => (
              <tr key={p.id}>
                <td>{p.user?.name}</td>
                <td>{inr(p.requestedAmount)}</td>
                <td>{inr(p.netAmount)}</td>
                <td>{p.bankOrUpi}</td>
                <td><span className="badge">{p.status}</span></td>
                <td>
                  <button className="btn teal sm" type="button" onClick={() => processPayout(p.id, 'Successful')}>Mark Paid</button>{' '}
                  <button className="btn danger sm" type="button" onClick={() => processPayout(p.id, 'Rejected')}>Reject</button>
                </td>
              </tr>
            )) : <tr><td colSpan="6">No payout requests yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
