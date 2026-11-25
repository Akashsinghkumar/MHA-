import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';

const inr = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/admin/dashboard')
      .then((d) => setStats(d.stats))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="err">{error}</div>;
  if (!stats) return <p>Loading dashboard…</p>;

  return (
    <>
      <h2>Dashboard &amp; Reports</h2>
      <p className="subtitle">Live figures directly from MHA Backend Database.</p>
      <div className="kpis">
        <div className="kpi"><span>Total Members</span><strong>{stats.totalMembers}</strong></div>
        <div className="kpi"><span>Orders Today</span><strong>{stats.ordersToday}</strong></div>
        <div className="kpi"><span>Total Orders</span><strong>{stats.totalOrders}</strong></div>
        <div className="kpi"><span>Total Revenue</span><strong>{inr(stats.totalRevenue)}</strong></div>
        <div className="kpi"><span>Pending KYC</span><strong>{stats.pendingKyc}</strong></div>
        <div className="kpi"><span>Pending Payouts</span><strong>{stats.pendingPayouts}</strong></div>
        <div className="kpi"><span>Low Stock Items</span><strong>{stats.lowStockProducts}</strong></div>
      </div>
    </>
  );
}
