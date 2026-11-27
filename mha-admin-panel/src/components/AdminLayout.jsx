import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { getAdminUser, setAdminToken, setAdminUser } from '../api.js';

const NAV_ITEMS = [
  ['/dashboard', 'Dashboard & Reports'],
  ['/website-cms', 'Website CMS (Design & Data)'],
  ['/gallery-management', 'Gallery Management'],
  ['/users', 'Member & KYC Approval'],
  ['/products', 'Product Management'],
  ['/orders', 'Order Management'],
  ['/offers', 'Offers Management'],
  ['/payouts', 'Payouts & Closing'],
  ['/support-center', 'Support Center'],
  ['/settings', 'Settings & Logs'],
];

export default function AdminLayout({ onLogout }) {
  const admin = getAdminUser();
  const navigate = useNavigate();

  function handleLogout() {
    setAdminToken('');
    setAdminUser(null);
    if (onLogout) onLogout();
    navigate('/login');
  }

  return (
    <>
      <header className="topbar">
        <h1>MHA — Admin Panel</h1>
        <div className="topbar-right">
          <span>{admin?.username || 'Admin'} ({admin?.role || 'STAFF'})</span>
          <button className="btn ghost sm" onClick={handleLogout}>Sign out</button>
        </div>
      </header>
      <div className="layout">
        <aside className="sidebar">
          <h2>Management</h2>
          {NAV_ITEMS.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              style={{ textDecoration: 'none', display: 'block' }}
              className={({ isActive }) => (isActive ? 'on' : '')}
            >
              {({ isActive }) => (
                <button type="button" className={isActive ? 'on' : ''}>{label}</button>
              )}
            </NavLink>
          ))}
        </aside>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </>
  );
}
