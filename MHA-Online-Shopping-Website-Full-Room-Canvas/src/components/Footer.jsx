import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer exact-footer">
      <div className="exact-footer-grid">
        {/* Column 1: Brand */}
        <div className="footer-col footer-brand-col">
          <div className="footer-logo-mark">
            <Link to="/" className="logo" style={{ display: 'inline-block' }} aria-label="MHA Online Shopping home">
              <img src="data:image/png;base64,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" alt="MHA" />
            </Link>
          </div>
          <p className="footer-tagline">
            Your one-stop destination for Furniture, Electronics, EV Scooters and more.
          </p>
        </div>

        {/* Column 2: Quick Links */}
        <div className="footer-col footer-col-sep">
          <h4>Quick Links</h4>
          <span className="footer-heading-bar" />
          <ul className="footer-chevrons">
            <li><Link to="/"><span>›</span> Home</Link></li>
            <li><Link to="/shop"><span>›</span> Shop All</Link></li>
            <li><Link to="/#about"><span>›</span> About Us</Link></li>
            <li><Link to="/support"><span>›</span> Contact Us</Link></li>
          </ul>
        </div>

        {/* Column 3: Categories */}
        <div className="footer-col">
          <h4>Categories</h4>
          <span className="footer-heading-bar" />
          <ul className="footer-chevrons">
            <li><Link to="/furniture"><span>›</span> Sofas &amp; Couches</Link></li>
            <li><Link to="/furniture"><span>›</span> Dining Tables</Link></li>
            <li><Link to="/furniture"><span>›</span> Chairs</Link></li>
            <li><Link to="/furniture"><span>›</span> Bedroom</Link></li>
            <li><Link to="/accessories"><span>›</span> Decor &amp; Accessories</Link></li>
          </ul>
        </div>

        {/* Column 4: Contact Us */}
        <div className="footer-col">
          <h4>Contact Us</h4>
          <span className="footer-heading-bar" />
          <ul className="footer-contact-list">
            <li><a href="tel:1234567890">(123) 456-7890</a></li>
            <li><a href="mailto:info@mhashopping.com">info@mhashopping.com</a></li>
            <li className="footer-addr-text">Ghaghra, Doranda<br />Ranchi (Jharkhand)</li>
          </ul>
        </div>

        {/* Column 5: Visit Our Showroom */}
        <div className="footer-col">
          <h4>Visit Our Showroom</h4>
          <span className="footer-heading-bar" />
          <div className="footer-showroom-card">
            <div>
              <b>Ghaghra, Doranda</b><br />
              Ranchi (Jharkhand)
            </div>
            <div>
              <div><b>Mon - Sat:</b> <span className="gold-time">10 AM - 06 PM</span></div>
              <div><b>Sun:</b> <span className="gold-time">11 AM - 05 PM</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom-wrap">
        <div className="footer-bottom">
          <span>© 2026 MHA Shopping. All rights reserved.</span>
          <div className="footer-legal-links">
            <Link to="/legal">Privacy Policy</Link>
            <Link to="/legal">Terms of Service</Link>
            <Link to="/support">Shipping Info</Link>
            <Link to="/support">Contact Us</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
