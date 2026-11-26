import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiFetch, getToken, setToken, resolveBackendImage, IS_REMOTE_WITHOUT_API } from '../api.js';
import { authClient } from '../neonAuth.js';
import { FALLBACK_BANNERS, FALLBACK_PRODUCTS, FALLBACK_OFFERS, FALLBACK_FAQS } from '../data/fallbackCatalog.js';

const StoreContext = createContext(null);

export const inr = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
export const siteImg = (path) => `${import.meta.env.BASE_URL}image/${String(path).replace(/^\/+/, '')}`;
export const mediaUrl = (url, fallbackImg = 'AllEle.webp') => {
  if (!url) return siteImg(fallbackImg);
  if (url.startsWith('/uploads/')) return resolveBackendImage(url);
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${import.meta.env.BASE_URL}${String(url).replace(/^\/+/, '')}`;
};

export function StoreProvider({ children }) {
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [banners, setBanners] = useState(FALLBACK_BANNERS);
  const [siteContent, setSiteContent] = useState({});
  const [offers, setOffers] = useState(FALLBACK_OFFERS);
  const [gallery, setGallery] = useState([]);
  const [faqs, setFaqs] = useState(FALLBACK_FAQS);
  const [supportConfig, setSupportConfig] = useState({
    shipping_policy: 'Delivery estimates and service availability are confirmed at checkout.',
    warranty_policy: 'Warranty coverage depends on the product and manufacturer.',
    support_email: 'support@mha-shop.com',
    support_phone: '',
    support_whatsapp: '',
  });
  const [backendConnected, setBackendConnected] = useState(false);

  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mhaUser') || 'null'); } catch { return null; }
  });
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mhaCart') || '{}'); } catch { return {}; }
  });
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mhaWishlist') || '[]'); } catch { return []; }
  });
  const [compare, setCompare] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(toast._t);
    toast._t = setTimeout(() => setToastMsg(''), 2300);
  }, []);

  useEffect(() => {
    try { localStorage.setItem('mhaCart', JSON.stringify(cart)); } catch {}
  }, [cart]);

  useEffect(() => {
    try { localStorage.setItem('mhaUser', JSON.stringify(user)); } catch {}
  }, [user]);

  useEffect(() => {
    try { localStorage.setItem('mhaWishlist', JSON.stringify(wishlist)); } catch {}
  }, [wishlist]);

  const loadInitialData = useCallback(async () => {
    if (!IS_REMOTE_WITHOUT_API) {
      try {
        const [prodRes, banRes, contentRes, offerRes, galRes, faqRes] = await Promise.all([
          apiFetch('/products?limit=100'),
          apiFetch('/banners'),
          apiFetch('/site-content'),
          apiFetch('/offers'),
          apiFetch('/gallery'),
          apiFetch('/support/faqs'),
        ]);
        setBackendConnected(true);
        if (banRes.banners?.length) setBanners(banRes.banners);
        setSiteContent(contentRes.content || {});
        setProducts(
          (prodRes.products || []).map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            category: p.category?.name || 'Other',
            subcategory: p.subcategory || '',
            brand: p.brand || 'MHA',
            offerPrice: Number(p.offerPrice),
            actualPrice: Number(p.actualPrice),
            rating: Number(p.rating || 4.5),
            emoji: p.emoji || '📦',
            accentColor: p.accentColor || '#eff5fa',
            imageUrl: p.imageUrl?.startsWith('/uploads/')
              ? resolveBackendImage(p.imageUrl)
              : `${import.meta.env.BASE_URL}${String(p.imageUrl || 'image/AllEle.webp').replace(/^\/+/, '')}`,
            tags: Array.isArray(p.tags) ? p.tags : [],
          }))
        );
        setOffers(offerRes.offers || []);
        setGallery(galRes.items || []);
        setFaqs(faqRes.faqs || []);
        if (faqRes.config) setSupportConfig((prev) => ({ ...prev, ...faqRes.config }));
      } catch {
        setBackendConnected(false);
      }
    }

    if (authClient) {
      try {
        const sessionRes = await authClient.getSession();
        if (sessionRes?.data?.user) {
          const u = sessionRes.data.user;
          setUser({
            id: u.id,
            name: u.name || u.email?.split('@')[0] || 'Member',
            email: u.email,
            kycStatus: 'Pending',
            referralCode: 'MHA-MEMBER',
          });
        }
      } catch {}
    }

    if (getToken()) {
      try {
        const me = await apiFetch('/auth/me');
        setUser(me.user);
      } catch {
        setToken('');
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    loadInitialData();
    const onFocus = () => loadInitialData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadInitialData]);

  function addToCart(productId, qty = 1) {
    setCart((prev) => ({ ...prev, [productId]: (prev[productId] || 0) + qty }));
    if (getToken()) {
      apiFetch('/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: Number(productId), quantity: qty }),
      }).catch(() => {});
    }
    toast('Added to cart');
  }

  function updateCartQty(productId, delta) {
    setCart((prev) => {
      const next = { ...prev };
      const val = (next[productId] || 0) + delta;
      if (val <= 0) delete next[productId];
      else next[productId] = val;
      return next;
    });
  }

  function clearCart() {
    setCart({});
  }

  function toggleWishlist(productId) {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      toast(exists ? 'Removed from wishlist' : 'Added to wishlist');
      return exists ? prev.filter((id) => id !== productId) : [...prev, productId];
    });
  }

  function toggleCompare(productId) {
    setCompare((prev) => {
      if (prev.includes(productId)) return prev.filter((id) => id !== productId);
      if (prev.length >= 3) {
        toast('Compare up to 3 products');
        return prev;
      }
      return [...prev, productId];
    });
  }

  async function logout() {
    if (authClient) {
      try { await authClient.signOut(); } catch {}
    }
    setToken('');
    setUser(null);
    toast('Logged out');
  }

  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);
  const cartTotal = Object.entries(cart).reduce((sum, [id, q]) => {
    const p = products.find((x) => x.id === Number(id));
    return sum + (p ? p.offerPrice * q : 0);
  }, 0);

  return (
    <StoreContext.Provider
      value={{
        products,
        banners,
        siteContent,
        offers,
        gallery,
        faqs,
        supportConfig,
        backendConnected,
        user,
        setUser,
        logout,
        cart,
        cartCount,
        cartTotal,
        addToCart,
        updateCartQty,
        clearCart,
        wishlist,
        toggleWishlist,
        compare,
        setCompare,
        toggleCompare,
        searchQuery,
        setSearchQuery,
        cartOpen,
        setCartOpen,
        checkoutOpen,
        setCheckoutOpen,
        selectedProduct,
        setSelectedProduct,
        toast,
        reloadCatalog: loadInitialData,
      }}
    >
      {children}
      {toastMsg && <div className="toast" style={{ display: 'block' }} role="status">{toastMsg}</div>}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
