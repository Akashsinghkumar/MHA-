import React, { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import SiteNav from './components/SiteNav.jsx';
import Footer from './components/Footer.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import ProductModal from './components/ProductModal.jsx';
import CheckoutModal from './components/CheckoutModal.jsx';

import HomePage from './pages/HomePage.jsx';
import ShopPage from './pages/ShopPage.jsx';
import FurniturePage from './pages/FurniturePage.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import OffersPage from './pages/OffersPage.jsx';
import GalleryPage from './pages/GalleryPage.jsx';
import SupportPage from './pages/SupportPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import MemberPortalPage from './pages/MemberPortalPage.jsx';

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    const map = {
      '/': 'home',
      '/shop': 'shop',
      '/furniture': 'furniture',
      '/electronics': 'electronics',
      '/ev-scooters': 'ev',
      '/accessories': 'accessories',
      '/offers': 'offers',
      '/gallery': 'gallery',
      '/support': 'support',
      '/login': 'login',
      '/member': 'member',
      '/units': 'units',
      '/referral': 'referral',
      '/incomes': 'incomes',
      '/ledger': 'ledger',
      '/legal': 'legal',
    };
    document.body.dataset.page = map[pathname] || 'home';
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <Header />
      <SiteNav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/furniture" element={<FurniturePage />} />
        <Route path="/electronics" element={<CategoryPage category="Electronics" />} />
        <Route path="/ev-scooters" element={<CategoryPage category="EV Scooters" />} />
        <Route path="/accessories" element={<CategoryPage category="Accessories" />} />
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/member" element={<MemberPortalPage section="member" />} />
        <Route path="/units" element={<MemberPortalPage section="units" />} />
        <Route path="/referral" element={<MemberPortalPage section="referral" />} />
        <Route path="/incomes" element={<MemberPortalPage section="incomes" />} />
        <Route path="/ledger" element={<MemberPortalPage section="ledger" />} />
        <Route path="/legal" element={<MemberPortalPage section="legal" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
      <CartDrawer />
      <ProductModal />
      <CheckoutModal />
    </>
  );
}
