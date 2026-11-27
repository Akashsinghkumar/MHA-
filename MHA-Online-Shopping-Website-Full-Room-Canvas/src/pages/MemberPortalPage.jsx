import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, getToken } from '../api.js';
import { inr, useStore } from '../context/StoreContext.jsx';

const SECTIONS = [
  ['/member', 'Member Area', '#1e9e5a'],
  ['/units', 'Unit & Profit Sharing', '#6b4fc9'],
  ['/referral', 'Referral & Sponsor', '#2b6cd9'],
  ['/incomes', 'Other Incomes', '#f08a1c'],
  ['/ledger', 'Financial Ledger & Settlement', '#d6457a'],
  ['/legal', 'Legal & Technical', '#376c9c'],
];

export default function MemberPortalPage({ section = 'member' }) {
  const { user, setUser, toast } = useStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [units, setUnits] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [payoutAmt, setPayoutAmt] = useState(1000);
  const [pan, setPan] = useState('');
  const [aadhaarLast4, setAadhaarLast4] = useState('');
  const [bankOrUpi, setBankOrUpi] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [kycConsent, setKycConsent] = useState(false);

  async function loadMember() {
    if (!getToken()) return;
    try {
      const [oRes, uRes, lRes, pRes] = await Promise.all([
        apiFetch('/orders'),
        apiFetch('/member/units'),
        apiFetch('/member/ledger'),
        apiFetch('/member/payouts'),
      ]);
      setOrders(oRes.orders || []);
      setUnits(uRes);
      setLedger(lRes);
      setPayouts(pRes.payouts || []);
    } catch {}
  }

  useEffect(() => { loadMember(); }, [user]);

  async function submitKyc(e) {
    e.preventDefault();
    if (!kycConsent) {
      toast('Please confirm the KYC declaration checkbox');
      return;
    }
    try {
      const fd = new FormData(e.target);
      fd.set('fullName', user?.name || 'Member');
      fd.set('panNumber', pan.trim().toUpperCase());
      fd.set('bankOrUpi', bankOrUpi.trim());
      if (ifscCode.trim()) fd.set('ifscCode', ifscCode.trim().toUpperCase());
      if (aadhaarLast4.trim()) fd.set('aadhaarLast4', aadhaarLast4.trim());
      await apiFetch('/member/kyc', {
        method: 'POST',
        body: fd,
      });
      setUser((prev) => (prev ? { ...prev, kycStatus: 'Submitted' } : prev));
      e.target.reset();
      toast('KYC submitted for admin verification');
    } catch (err) {
      toast(err.message);
    }
  }

  async function requestPayout() {
    try {
      await apiFetch('/member/payout', {
        method: 'POST',
        body: JSON.stringify({ amount: Number(payoutAmt), bankOrUpi: user?.phone || 'UPI' }),
      });
      toast('Payout request submitted');
      loadMember();
    } catch (err) {
      toast(err.message);
    }
  }

  const activeSec = SECTIONS.find(([p]) => p === `/${section}`) || SECTIONS[0];

  return (
    <>
      <nav className="mt" aria-label="Member and business pages">
        <button type="button" onClick={() => navigate('/shop')}>Shop</button>
        {SECTIONS.map(([path, label, color]) => (
          <button
            key={path}
            type="button"
            className={path === `/${section}` ? 'on' : ''}
            style={{ borderBottomColor: path === `/${section}` ? color : 'transparent' }}
            onClick={() => navigate(path)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div id="hub">
        <div className="hubw">
          <aside className="sb" aria-label="Pages">
            <h3 style={{ background: activeSec[2] }}>{activeSec[1]}</h3>
            {SECTIONS.map(([path, label]) => (
              <button
                key={path}
                type="button"
                className={path === `/${section}` ? 'on' : ''}
                onClick={() => navigate(path)}
              >
                {label}
              </button>
            ))}
          </aside>

          <section className="ct">
            <h2 style={{ color: activeSec[2] }}>{activeSec[1]}</h2>
            {!user ? (
              <div className="pill">
                Please <button className="mb" type="button" onClick={() => navigate('/login')}>Sign In / Register</button> to view your live account data.
              </div>
            ) : (
              <>
                <div className="kp">
                  <div>Member<strong>{user.name}</strong></div>
                  <div>Referral Code<strong>{user.referralCode}</strong></div>
                  <div>KYC Status<strong>{user.kycStatus}</strong></div>
                  <div>Completed Units<strong>{units?.completedUnits ?? 0}</strong></div>
                  <div>Wallet Balance<strong>{inr(ledger?.walletBalance ?? 0)}</strong></div>
                </div>

                <h3>My Purchases ({orders.length})</h3>
                {orders.length ? (
                  <div className="tw">
                    <table>
                      <thead><tr><th>Order</th><th>Amount</th><th>Payment</th><th>Status</th><th>Action</th></tr></thead>
                      <tbody>
                        {orders.map((o) => (
                          <tr key={o.id}>
                            <td>{o.orderNumber}</td>
                            <td>{inr(o.total)}</td>
                            <td>{o.paymentMethod} ({o.paymentStatus})</td>
                            <td>{o.status}</td>
                            <td>
                              {['Processing', 'Pending', 'Confirmed'].includes(o.status) && (
                                <button
                                  type="button"
                                  className="mb o"
                                  onClick={async () => {
                                    if (!confirm(`Cancel order ${o.orderNumber}?`)) return;
                                    try {
                                      await apiFetch(`/orders/${o.id}/cancel`, { method: 'POST', body: JSON.stringify({ reason: 'Cancelled by customer' }) });
                                      toast('Order cancelled');
                                      loadMember();
                                    } catch (err) { toast(err.message); }
                                  }}
                                >
                                  Cancel
                                </button>
                              )}
                              {o.status === 'Delivered' && (
                                <button
                                  type="button"
                                  className="mb o"
                                  onClick={async () => {
                                    const reason = prompt('Enter reason for return / refund:');
                                    if (!reason || reason.trim().length < 5) return;
                                    try {
                                      await apiFetch(`/orders/${o.id}/return`, { method: 'POST', body: JSON.stringify({ reason: reason.trim() }) });
                                      toast('Return request submitted');
                                      loadMember();
                                    } catch (err) { toast(err.message); }
                                  }}
                                >
                                  Return / Refund
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p>No orders placed yet.</p>}

                <div className="cb">
                  <h3>KYC Verification</h3>
                  <form onSubmit={submitKyc}>
                    <label>PAN Number (10 chars)
                      <input className="f" value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} maxLength={10} required placeholder="e.g. ABCDE1234F" />
                    </label>
                    <label>Aadhaar Last 4 Digits (Optional)
                      <input className="f" value={aadhaarLast4} onChange={(e) => setAadhaarLast4(e.target.value.replace(/\D/g, '').slice(0, 4))} maxLength={4} placeholder="e.g. 1234" />
                    </label>
                    <label>Bank Account Number or UPI ID
                      <input className="f" value={bankOrUpi} onChange={(e) => setBankOrUpi(e.target.value)} required placeholder="Account number or name@upi" />
                    </label>
                    <label>IFSC Code (for Bank Account)
                      <input className="f" value={ifscCode} onChange={(e) => setIfscCode(e.target.value.toUpperCase())} maxLength={11} placeholder="e.g. SBIN0001234" />
                    </label>
                    <label>Upload PAN / ID Proof (JPG, PNG, PDF)
                      <input className="f" name="document" type="file" accept="image/*,.pdf" required />
                    </label>
                    <label>Upload Cancelled Cheque / Passbook (Optional)
                      <input className="f" name="bankProof" type="file" accept="image/*,.pdf" />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '10px 0' }}>
                      <input type="checkbox" checked={kycConsent} onChange={(e) => setKycConsent(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                      <span>I confirm these documents are genuine and belong to me for KYC &amp; payout verification.</span>
                    </label>
                    <button className="mb" type="submit">Submit KYC</button>
                  </form>
                </div>

                <div className="cb">
                  <h3>Request Payout</h3>
                  <label>Amount (₹)<input className="f" type="number" value={payoutAmt} onChange={(e) => setPayoutAmt(e.target.value)} /></label>
                  <p>10% deduction: {inr(payoutAmt * 0.1)} | Net NEFT: {inr(payoutAmt * 0.9)}</p>
                  <button className="mb" type="button" onClick={requestPayout}>Request payout</button>
                </div>

                {payouts.length > 0 && (
                  <div className="tw">
                    <table>
                      <thead><tr><th>Date</th><th>Requested</th><th>Net</th><th>Status</th></tr></thead>
                      <tbody>
                        {payouts.map((p) => (
                          <tr key={p.id}>
                            <td>{new Date(p.requestedAt).toLocaleDateString()}</td>
                            <td>{inr(p.requestedAmount)}</td>
                            <td>{inr(p.netAmount)}</td>
                            <td>{p.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
