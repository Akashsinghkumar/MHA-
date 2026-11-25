import React, { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { getAdminToken } from './api.js';
import AdminLayout from './components/AdminLayout.jsx';
import AdminAuthPage from './pages/AdminAuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import UsersDataPage from './pages/UsersDataPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import OffersPage from './pages/OffersPage.jsx';
import PayoutsPage from './pages/PayoutsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import WebsiteCmsPage from './pages/WebsiteCmsPage.jsx';

export default function App() {
  const [authed, setAuthed] = useState(Boolean(getAdminToken()));

  return (
    <Routes>
      <Route path="/login" element={<AdminAuthPage onAuth={() => setAuthed(true)} />} />
      <Route
        path="/"
        element={authed ? <AdminLayout onLogout={() => setAuthed(false)} /> : <Navigate to="/login" replace />}
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="website-cms" element={<WebsiteCmsPage />} />
        <Route path="users" element={<UsersDataPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="offers" element={<OffersPage />} />
        <Route path="payouts" element={<PayoutsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to={authed ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
