import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';

const inr = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);

  async function load() {
    const { orders: data } = await apiFetch('/admin/orders');
    setOrders(data || []);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id, status) {
    await apiFetch(`/admin/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    load();
  }

  return (
    <>
      <h2>Order Management</h2>
      <p className="subtitle">Manage all customer orders.</p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Order #</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
          <tbody>
            {orders.length ? orders.map((o) => (
              <tr key={o.id}>
                <td><b>{o.orderNumber}</b></td>
                <td>{o.user?.name} ({o.user?.phone})</td>
                <td>{inr(o.total)}</td>
                <td>{o.paymentMethod} · <span className="badge">{o.paymentStatus}</span></td>
                <td>
                  <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)}>
                    {['Processing', 'Shipped', 'Out for delivery', 'Delivered', 'Cancelled'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            )) : <tr><td colSpan="5">No orders placed yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
