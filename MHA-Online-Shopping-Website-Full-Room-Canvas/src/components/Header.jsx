import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { resolveSearchRoute } from '../utils/searchRouting.js';

export default function Header() {
  const { user, logout, cartCount, setCartOpen, searchQuery, setSearchQuery, products } = useStore();
  const navigate = useNavigate();

  function handleSearch(e) {
    e.preventDefault();
    const { route, isCategoryBrowse } = resolveSearchRoute(searchQuery, products);
    if (isCategoryBrowse) {
      setSearchQuery('');
    }
    navigate(route);
  }

  function handleAuthClick() {
    if (user) {
      if (confirm('Log out?')) logout();
    } else {
      navigate('/login');
    }
  }

  return (
    <header>
      <div className="top">
        <button className="logo" type="button" onClick={() => { setSearchQuery(''); navigate('/'); }} aria-label="MHA Online Shopping home">
          <img src="data:image/png;base64,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" alt="MHA" />
        </button>
        <form className="srch" onSubmit={handleSearch} role="search">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for furniture, electronics, EV scooters…"
            aria-label="Search products"
          />
          <button type="submit">Search</button>
        </form>
        <button className="hb" type="button" onClick={handleAuthClick}>
          {user ? `Hi, ${(user.name || user.email || 'Member').split(' ')[0]}` : 'Login'}
        </button>
        <button className="hb cartb" type="button" onClick={() => setCartOpen(true)}>
          Cart ({cartCount})
        </button>
      </div>
    </header>
  );
}
