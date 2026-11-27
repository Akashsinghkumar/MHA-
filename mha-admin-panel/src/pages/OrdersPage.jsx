import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';

const inr = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [msg, setMsg] = useState('');

  async function load() {
    const { orders: data } = await apiFetch('/admin/orders');
    setOrders(data || []);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id, status) {
    setMsg('');
    await apiFetch(`/admin/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function processRefund(order) {
    if (!confirm(`Process full refund of ${inr(order.total)} for Order #${order.orderNumber}?`)) return;
    setMsg('');
    try {
      const res = await apiFetch(`/admin/orders/${order.id}/refund`, { method: 'POST' });
      setMsg(`Refund processed for #${order.orderNumber} (${res.refund?.refundId || 'done'})`);
      load();
    } catch (err) {
      setMsg(err.message);
    }
  }

  return (
    <>
      <h2>Order Management</h2>
      <p className="subtitle">Manage customer orders, returns, and Razorpay refunds.</p>
      {msg && <p style={{ color: 'var(--teal)', fontWeight: 700 }}>{msg}</p>}
      <div className="table-wrap">
        <table>
          <thead><tr><th>Order #</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {orders.length ? orders.map((o) => {
              const canRefund =
                (o.status === 'Cancelled' || o.status === 'Return Requested') &&
                (o.paymentStatus === 'Paid' || o.paymentStatus === 'Refund Pending');
              return (
                <tr key={o.id}>
                  <td><b>{o.orderNumber}</b></td>
                  <td>{o.user?.name} ({o.user?.phone})</td>
                  <td>{inr(o.total)}</td>
                  <td>{o.paymentMethod} · <span className="badge">{o.paymentStatus}</span></td>
                  <td>
                    <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)}>
                      {['Processing', 'Shipped', 'Out for delivery', 'Delivered', 'Cancelled', 'Return Requested', 'Refunded'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {canRefund ? (
                      <button type="button" className="btn sm teal" onClick={() => processRefund(o)}>
                        Process Refund
                      </button>
                    ) : (
                      <span style={{ color: 'var(--mut)', fontSize: '12px' }}>{o.statusNote || '—'}</span>
                    )}
                  </td>
                </tr>
              );
            }) : <tr><td colSpan="6">No orders placed yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
