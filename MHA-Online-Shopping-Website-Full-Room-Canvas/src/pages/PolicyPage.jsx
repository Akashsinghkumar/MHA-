import React from 'react';
import { Link } from 'react-router-dom';

const POLICIES = {
  privacy: {
    badge: 'LEGAL & COMPLIANCE',
    title: 'Privacy Policy',
    updated: 'Last updated: November 2026',
    sections: [
      ['1. Information We Collect', 'We collect your name, email address, mobile number, delivery addresses, and order details solely to process orders, verify your account via OTP, and provide customer support.'],
      ['2. How We Use Your Data', 'Your data is used to fulfill orders, send transactional OTPs and order updates, prevent fraud, and improve our storefront experience. We never sell your personal data to third parties.'],
      ['3. Payments & Security', 'Online payments are processed securely through Razorpay using encrypted HTTPS connections. Passwords are stored using bcrypt cryptographic hashing.'],
      ['4. Contact Us', 'For any privacy or data deletion requests, contact us at info@mhashopping.com.'],
    ],
  },
  terms: {
    badge: 'LEGAL & COMPLIANCE',
    title: 'Terms & Conditions',
    updated: 'Last updated: November 2026',
    sections: [
      ['1. Account & Eligibility', 'Users must provide accurate contact information verified by OTP. You are responsible for maintaining the confidentiality of your account credentials.'],
      ['2. Pricing & Availability', 'All product prices are listed in INR (₹) and include applicable store offers. Product availability and delivery timelines are confirmed at checkout.'],
      ['3. Orders & Cancellations', 'Orders in Processing state may be cancelled by the customer from My Account. Once shipped, orders follow our Return & Refund Policy.'],
      ['4. Referral Program', 'Optional referral codes connect new accounts to an existing member in accordance with MHA program guidelines.'],
    ],
  },
  shipping: {
    badge: 'CUSTOMER CARE',
    title: 'Shipping, Cancellation & Refund Policy',
    updated: 'Last updated: November 2026',
    sections: [
      ['1. Shipping & Delivery', 'Standard delivery timelines are 3–7 business days depending on product category (Furniture, Electronics, EV Scooters, Accessories) and delivery location.'],
      ['2. Order Cancellation', 'You can cancel an order before it is shipped directly from My Account → My Purchases. Prepaid cancellations are marked for immediate refund.'],
      ['3. Returns & Exchanges', 'Delivered products with manufacturing defects or transit damage are eligible for a return request within 7 days of delivery from My Account.'],
      ['4. Refund Timeline', 'Approved refunds for Razorpay/UPI/Card payments are processed back to your original payment method within 5–7 business days.'],
    ],
  },
};

export default function PolicyPage({ type = 'privacy' }) {
  const doc = POLICIES[type] || POLICIES.privacy;
  return (
    <main id="store" className="category-mode">
      <div className="home-directory" style={{ display: 'block', maxWidth: '900px', margin: '0 auto' }}>
        <div className="cb" style={{ padding: '28px' }}>
          <small style={{ color: 'var(--brand)', fontWeight: 700, letterSpacing: '1px' }}>{doc.badge}</small>
          <h1 style={{ margin: '6px 0 4px' }}>{doc.title}</h1>
          <p style={{ color: 'var(--mut)', marginBottom: '20px' }}>{doc.updated}</p>

          {doc.sections.map(([heading, body]) => (
            <section key={heading} style={{ marginBottom: '18px' }}>
              <h3 style={{ margin: '0 0 6px' }}>{heading}</h3>
              <p style={{ margin: 0, lineHeight: 1.65 }}>{body}</p>
            </section>
          ))}

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '24px', borderTop: '1px solid var(--ln)', paddingTop: '16px' }}>
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms">Terms &amp; Conditions</Link>
            <Link to="/shipping-refund-policy">Shipping &amp; Refund Policy</Link>
            <Link to="/support">Support Centre</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
