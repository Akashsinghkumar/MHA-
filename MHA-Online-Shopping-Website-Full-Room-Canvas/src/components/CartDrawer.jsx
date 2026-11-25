import React from 'react';
import { useNavigate } from 'react-router-dom';
import { inr, useStore } from '../context/StoreContext.jsx';

export default function CartDrawer() {
  const {
    products,
    cart,
    cartOpen,
    setCartOpen,
    cartTotal,
    updateCartQty,
    user,
    setCheckoutOpen,
    toast,
  } = useStore();
  const navigate = useNavigate();

  const entries = Object.entries(cart)
    .map(([id, qty]) => ({ product: products.find((p) => p.id === Number(id)), qty }))
    .filter((x) => x.product && x.qty > 0);

  function handleCheckout() {
    setCartOpen(false);
    if (!user) {
      toast('Login to continue');
      navigate('/login');
      return;
    }
    setCheckoutOpen(true);
  }

  return (
    <aside className={`dr ${cartOpen ? 'on' : ''}`} aria-label="Cart">
      <h2>Your cart</h2>
      <div className="cl">
        {entries.length ? (
          entries.map(({ product, qty }) => (
            <div className="ci" key={product.id}>
              <span className="e">
                <img src={product.imageUrl} alt="" />
              </span>
              <div>
                <b>{product.name}</b>
                <br />
                {inr(product.offerPrice)}
              </div>
              <span className="q">
                <button type="button" onClick={() => updateCartQty(product.id, -1)} aria-label="Remove one">−</button>
                {qty}
                <button type="button" onClick={() => updateCartQty(product.id, 1)} aria-label="Add one">+</button>
              </span>
            </div>
          ))
        ) : (
          <p style={{ color: 'var(--mut)' }}>Your cart is empty. Add a product to start.</p>
        )}
      </div>
      <div className="tot">
        {cartTotal > 0 ? (
          <>
            <p>Subtotal<b>{inr(cartTotal)}</b></p>
            <p>Delivery<b>Free</b></p>
            <div className="pill">
              This order earns {Math.floor(cartTotal / 5000)} unit(s). ₹{(cartTotal % 5000).toLocaleString('en-IN')} carries forward.
            </div>
            <button className="btn" type="button" onClick={handleCheckout}>Checkout</button>
            <button className="btn" style={{ background: 'var(--bg)', color: 'var(--ink)' }} type="button" onClick={() => setCartOpen(false)}>
              Keep shopping
            </button>
          </>
        ) : (
          <button className="btn" type="button" onClick={() => setCartOpen(false)}>Keep shopping</button>
        )}
      </div>
    </aside>
  );
}
