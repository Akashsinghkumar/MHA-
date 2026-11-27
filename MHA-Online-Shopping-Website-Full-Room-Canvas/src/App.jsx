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
import PolicyPage from './pages/PolicyPage.jsx';

const PAGE_TITLES = {
  '/': 'MHA Online Shopping — Furniture, Electronics, EV Scooters & Accessories',
  '/shop': 'Shop All Products — MHA Online Shopping',
  '/furniture': 'Furniture for Every Room — MHA Online Shopping',
  '/electronics': 'Electronics & Smart Appliances — MHA Online Shopping',
  '/ev-scooters': 'Electric Scooters — MHA Online Shopping',
  '/accessories': 'Accessories & Add-ons — MHA Online Shopping',
  '/offers': 'Offers, Combos & Promo Codes — MHA Online Shopping',
  '/gallery': 'Gallery & Customer Photos — MHA Online Shopping',
  '/support': 'Support Centre — MHA Online Shopping',
  '/login': 'Sign In or Create Account — MHA Online Shopping',
  '/privacy-policy': 'Privacy Policy — MHA Online Shopping',
  '/terms': 'Terms & Conditions — MHA Online Shopping',
  '/shipping-refund-policy': 'Shipping & Refund Policy — MHA Online Shopping',
};

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
    document.title = PAGE_TITLES[pathname] || 'MHA Online Shopping';
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
        <Route path="/privacy-policy" element={<PolicyPage type="privacy" />} />
        <Route path="/terms" element={<PolicyPage type="terms" />} />
        <Route path="/shipping-refund-policy" element={<PolicyPage type="shipping" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
      <CartDrawer />
      <ProductModal />
      <CheckoutModal />
    </>
  );
}
