import React, { useState } from 'react';
import { apiFetch, getToken } from '../api.js';
import { inr, useStore } from '../context/StoreContext.jsx';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutModal() {
  const { checkoutOpen, setCheckoutOpen, cartTotal, cart, clearCart, toast, backendConnected, user } = useStore();
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [placedOrder, setPlacedOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!checkoutOpen) return null;

  function closeModal() {
    setPlacedOrder(null);
    setCheckoutOpen(false);
  }

  async function handlePlaceOrder() {
    if (address.trim().length < 10) {
      toast('Enter a full delivery address');
      return;
    }
    setLoading(true);
    try {
      if (getToken()) {
        for (const [productId, quantity] of Object.entries(cart)) {
          await apiFetch('/cart', {
            method: 'POST',
            body: JSON.stringify({ productId: Number(productId), quantity }),
          }).catch(() => {});
        }
        const res = await apiFetch('/orders', {
          method: 'POST',
          body: JSON.stringify({ shippingAddress: address.trim(), paymentMethod }),
        });
        const ord = res.order;
        if (res.gateway) {
          if (res.gateway.mode === 'live') {
            const loaded = await loadRazorpayScript();
            if (!loaded) {
              throw new Error('Could not load Razorpay Checkout. Please try again.');
            }
            await new Promise((resolve, reject) => {
              const rzp = new window.Razorpay({
                key: res.gateway.keyId,
                amount: res.gateway.amount,
                currency: res.gateway.currency || 'INR',
                name: 'MHA Online Shopping',
                description: `Order ${ord.orderNumber}`,
                order_id: res.gateway.gatewayOrderId,
                prefill: {
                  name: user?.name || '',
                  email: user?.email || '',
                  contact: user?.phone || '',
                },
                handler: async (rzpRes) => {
                  try {
                    await apiFetch('/orders/verify-payment', {
                      method: 'POST',
                      body: JSON.stringify({
                        orderId: ord.id,
                        gatewayOrderId: rzpRes.razorpay_order_id || res.gateway.gatewayOrderId,
                        gatewayPaymentId: rzpRes.razorpay_payment_id,
                        gatewaySignature: rzpRes.razorpay_signature,
                      }),
                    });
                    resolve();
                  } catch (verifyErr) {
                    reject(verifyErr);
                  }
                },
                modal: {
                  ondismiss: () => reject(new Error('Payment cancelled by user')),
                },
              });
              rzp.open();
            });
          } else {
            await apiFetch('/orders/verify-payment', {
              method: 'POST',
              body: JSON.stringify({
                orderId: ord.id,
                gatewayOrderId: res.gateway.gatewayOrderId,
                gatewayPaymentId: 'pay_mock_' + Date.now(),
                gatewaySignature: 'verified',
              }),
            });
          }
        }
        setPlacedOrder({
          orderNumber: ord.orderNumber,
          total: ord.total,
          unitsEarned: ord.unitsEarned,
        });
        clearCart();
      } else if (!backendConnected) {
        const orderNumber = 'MHA-DEMO-' + String(Date.now()).slice(-6);
        setPlacedOrder({
          orderNumber,
          total: cartTotal,
          unitsEarned: Number((cartTotal / 10000).toFixed(2)),
        });
        clearCart();
        toast('Demo order placed (connect backend API for live DB orders)');
      } else {
        toast('Please login to place an order');
      }
    } catch (err) {
      toast(err.message || 'Order failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ov on" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
      <div className="md" style={{ maxWidth: '520px' }} role="dialog" aria-modal="true" aria-label="Checkout">
        <button className="x" type="button" onClick={closeModal} aria-label="Close">×</button>
        {placedOrder ? (
          <>
            <h2 style={{ marginTop: 0, color: 'var(--gr)' }}>Order placed</h2>
            <p>
              Order <b>{placedOrder.orderNumber}</b> for {inr(placedOrder.total)} by {paymentMethod} will be delivered to:
              <br />
              {address}
            </p>
            <div className="pill">
              You earned {placedOrder.unitsEarned} unit(s). Saved to your account and database.
            </div>
            <button className="btn" type="button" onClick={closeModal}>Continue shopping</button>
          </>
        ) : (
          <>
            <h2 style={{ marginTop: 0 }}>Checkout</h2>
            <label htmlFor="ka">Delivery address</label>
            <textarea
              className="f"
              id="ka"
              rows="3"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House no, street, city, PIN code"
            />
            <label>Payment</label>
            <div className="pay">
              {['UPI', 'Card', 'Cash on delivery'].map((pm) => (
                <label key={pm}>
                  <input
                    type="radio"
                    name="pm"
                    value={pm}
                    checked={paymentMethod === pm}
                    onChange={() => setPaymentMethod(pm)}
                  />{' '}
                  {pm}
                </label>
              ))}
            </div>
            <div className="tot" style={{ marginTop: '14px' }}>
              <p>Total<b>{inr(cartTotal)}</b></p>
            </div>
            <button className="btn" type="button" disabled={loading} onClick={handlePlaceOrder}>
              {loading ? 'Placing order…' : 'Place order'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
