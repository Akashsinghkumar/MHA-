import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';

const inr = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');

export default function UsersDataPage() {
  const [users, setUsers] = useState([]);
  const [queue, setQueue] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState('');

  async function loadData(q = search) {
    try {
      const [uRes, kRes] = await Promise.all([
        apiFetch('/admin/users' + (q ? `?q=${encodeURIComponent(q)}` : '')),
        apiFetch('/admin/kyc'),
      ]);
      setUsers(uRes.users || []);
      setQueue(kRes.queue || []);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    loadData('');
  }, []);

  async function viewUser(id) {
    const { user } = await apiFetch(`/admin/users/${id}`);
    setSelectedUser(user);
  }

  async function toggleBlock(id, nextBlocked) {
    await apiFetch(`/admin/users/${id}/block`, {
      method: 'PUT',
      body: JSON.stringify({ isBlocked: nextBlocked }),
    });
    loadData();
  }

  async function reviewKyc(userId, status) {
    await apiFetch(`/admin/kyc/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    loadData();
  }

  return (
    <>
      <h2>Registered Users Data &amp; KYC</h2>
      <p className="subtitle">All users registered on the Public Website are stored in the database and visible here.</p>
      {error && <div className="err">{error}</div>}

      <div className="card-box" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, email or referral code…"
          style={{ flex: 1, minWidth: '220px' }}
        />
        <button className="btn" type="button" onClick={() => loadData(search)}>Search Users</button>
        <button className="btn ghost" type="button" onClick={() => { setSearch(''); loadData(''); }}>Reset</button>
      </div>

      {selectedUser && (
        <div className="card-box" style={{ borderColor: 'var(--teal)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: 'var(--teal)' }}>User #{selectedUser.id}: {selectedUser.name}</h3>
            <button className="btn ghost sm" type="button" onClick={() => setSelectedUser(null)}>Close</button>
          </div>
          <p style={{ color: 'var(--mut)', margin: '8px 0' }}>
            Phone: <b>{selectedUser.phone}</b> · Email: <b>{selectedUser.email || '—'}</b> ·
            Referral Code: <b>{selectedUser.referralCode}</b> · KYC: <b>{selectedUser.kycStatus}</b> ·
            Carry Forward: <b>{inr(selectedUser.carryForward)}</b> · Units: <b>{selectedUser._count?.units ?? 0}</b>
          </p>
          <p style={{ margin: '6px 0' }}>
            <b>Addresses ({selectedUser.addresses?.length || 0}):</b>{' '}
            {selectedUser.addresses?.length
              ? selectedUser.addresses.map((a) => `${a.addressLine}, ${a.city}, ${a.state} - ${a.pincode}`).join(' | ')
              : 'None saved'}
          </p>
          <p style={{ margin: '6px 0' }}>
            <b>Recent Orders ({selectedUser.orders?.length || 0}):</b>{' '}
            {selectedUser.orders?.length
              ? selectedUser.orders.map((o) => `${o.orderNumber} (${inr(o.total)} - ${o.status})`).join(', ')
              : 'No orders yet'}
          </p>
        </div>
      )}

      <h3>Registered Users ({users.length})</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>Phone</th><th>Email</th><th>Ref Code</th>
              <th>Referred By</th><th>KYC</th><th>Orders</th><th>Joined</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length ? users.map((u) => (
              <tr key={u.id}>
                <td>#{u.id}</td>
                <td><b>{u.name}</b></td>
                <td>{u.phone}</td>
                <td>{u.email || '—'}</td>
                <td><code>{u.referralCode}</code></td>
                <td>{u.referredBy ? `${u.referredBy.name} (${u.referredBy.referralCode})` : '—'}</td>
                <td><span className="badge">{u.kycStatus}</span></td>
                <td>{u._count?.orders ?? 0}</td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn teal sm" type="button" onClick={() => viewUser(u.id)}>View Data</button>{' '}
                  <button className="btn ghost sm" type="button" onClick={() => toggleBlock(u.id, !u.isBlocked)}>
                    {u.isBlocked ? 'Unblock' : 'Block'}
                  </button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="10">No registered users found yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginTop: '24px' }}>KYC Verification Queue</h3>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Member</th><th>PAN</th><th>Bank / UPI</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {queue.length ? queue.map((k) => (
              <tr key={k.id}>
                <td>{k.user?.name} ({k.user?.phone})</td>
                <td>{k.panNumber}</td>
                <td>{k.bankOrUpi}</td>
                <td><span className="badge">{k.status}</span></td>
                <td>
                  <button className="btn teal sm" type="button" onClick={() => reviewKyc(k.userId, 'Approved')}>Approve</button>{' '}
                  <button className="btn danger sm" type="button" onClick={() => reviewKyc(k.userId, 'Rejected')}>Reject</button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="5">No KYC submissions yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
