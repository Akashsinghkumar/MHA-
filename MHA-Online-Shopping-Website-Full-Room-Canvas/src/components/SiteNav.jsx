import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';

const LINKS = [
  ['/', 'Home'],
  ['/shop', 'Shop'],
  ['/furniture', 'Furniture'],
  ['/electronics', 'Electronics'],
  ['/ev-scooters', 'EV Scooters'],
  ['/accessories', 'Accessories'],
  ['/offers', 'Offers'],
  ['/gallery', 'Gallery'],
  ['/support', 'Support'],
  ['/member', 'My Account'],
];

const PORTAL_PATHS = ['/member', '/units', '/referral', '/incomes', '/ledger', '/legal'];

export default function SiteNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { setCartOpen, cartTotal, toast, setSearchQuery } = useStore();

  return (
    <nav className="site-nav" aria-label="Main navigation">
      {LINKS.map(([to, label]) => {
        const isActive =
          pathname === to || (to === '/member' && PORTAL_PATHS.includes(pathname));
        return (
          <button
            key={to}
            type="button"
            className={isActive ? 'on' : ''}
            onClick={() => { setSearchQuery(''); navigate(to); }}
          >
            {label}
          </button>
        );
      })}
      <button type="button" onClick={() => setCartOpen(true)}>Cart</button>
      <button
        type="button"
        onClick={() => {
          setCartOpen(true);
          if (!cartTotal) toast('Add products to your cart to begin checkout');
        }}
      >
        Checkout
      </button>
    </nav>
  );
}
