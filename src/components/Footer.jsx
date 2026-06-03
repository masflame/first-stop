import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoName from "../assets/SD-name.png";
import "./Footer.css";

const footerSections = [
  {
    key: "shop",
    title: "SHOP",
    links: [
    { label: "New", path: "/collections/new" },
    { label: "Men", path: "/collections/men" },
    { label: "Women", path: "/collections/women" },
    { label: "Kids", path: "/collections/kids" },
    { label: "Sale", path: "/collections/sale" },
    { label: "Brands", path: "/brands" },
    ],
  },
  {
    key: "info",
    title: "INFO",
    links: [
    { label: "About Us", path: "/about" },
    { label: "Stores", path: "/stores" },
    { label: "Blog", path: "/blog" },
    { label: "Careers", path: "/careers" },
    ],
  },
  {
    key: "help",
    title: "HELP",
    links: [
    { label: "Shipping & Returns", path: "/shipping" },
    { label: "FAQ", path: "/faq" },
    { label: "Contact", path: "/contact" },
    { label: "Size Guide", path: "/size-guide" },
    ],
  },
  {
    key: "legal",
    title: "LEGAL",
    links: [
    { label: "Privacy Policy", path: "/privacy" },
    { label: "Terms & Conditions", path: "/terms" },
    { label: "Imprint", path: "/imprint" },
    ],
  },
];

export default function Footer() {
  const mobileViewport = typeof window !== "undefined" && window.innerWidth <= 768;
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isMobile, setIsMobile] = useState(mobileViewport);
  const [openSections, setOpenSections] = useState(() =>
    Object.fromEntries(footerSections.map((section) => [section.key, !mobileViewport]))
  );

  // Admin gateway
  const [copyrightClicks, setCopyrightClicks] = useState(0);
  const clickResetTimer = useRef(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminItemName, setAdminItemName] = useState("");
  const [adminAmount, setAdminAmount] = useState("");

  const handleCopyrightClick = () => {
    clearTimeout(clickResetTimer.current);
    setCopyrightClicks((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setAdminOpen(true);
        return 0;
      }
      clickResetTimer.current = setTimeout(() => setCopyrightClicks(0), 3000);
      return next;
    });
  };

  const closeAdmin = () => {
    setAdminOpen(false);
    setAdminItemName("");
    setAdminAmount("");
  };

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(adminAmount);
    if (!adminItemName.trim() || !Number.isFinite(amount) || amount <= 0) return;
    closeAdmin();
    navigate("/checkout", { state: { adminItem: { name: adminItemName.trim(), amount } } });
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");

    const syncViewport = (event) => {
      const mobile = event.matches;
      setIsMobile(mobile);
      setOpenSections(
        Object.fromEntries(footerSections.map((section) => [section.key, !mobile]))
      );
    };

    syncViewport(mediaQuery);
    mediaQuery.addEventListener("change", syncViewport);

    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    setEmail("");
  };

  const toggleSection = (sectionKey) => {
    if (!isMobile) return;

    setOpenSections((currentSections) => ({
      ...currentSections,
      [sectionKey]: !currentSections[sectionKey],
    }));
  };

  return (
    <footer className="footer">
      {/* Newsletter */}
      <div className="footer-newsletter">
        <div className="footer-newsletter__inner">
          <h3 className="footer-newsletter__title">NEWSLETTER</h3>
          <p className="footer-newsletter__text">
            Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
          </p>
          <form className="footer-newsletter__form" onSubmit={handleSubscribe}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="footer-newsletter__input"
              required
            />
            <button type="submit" className="footer-newsletter__btn">
              SUBSCRIBE
            </button>
          </form>
        </div>
      </div>

      {/* Links */}
      <div className="footer-links">
        <div className="footer-links__inner">
          {footerSections.map((section) => (
            <section
              key={section.key}
              className={`footer-col footer-col--collapsible${openSections[section.key] ? " footer-col--open" : ""}`}
            >
              <button
                type="button"
                className="footer-col__summary"
                onClick={() => toggleSection(section.key)}
                aria-expanded={openSections[section.key]}
              >
                <span className="footer-col__title">{section.title}</span>
                <span className="footer-col__chevron" aria-hidden="true">+</span>
              </button>
              {openSections[section.key] && (
                <div className="footer-col__links">
                {section.links.map((link) => (
                  <Link key={link.path} to={link.path} className="footer-link">
                    {link.label}
                  </Link>
                ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="footer-bottom">
        <div className="footer-bottom__inner">
          <Link to="/" className="footer-logo">
            <img src={logoName} alt="Shoe District" className="footer-logo__wordmark" />
          </Link>
          <div className="footer-social">
            <a href="#" className="footer-social__link" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
            <a href="#" className="footer-social__link" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="#" className="footer-social__link" aria-label="YouTube">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
            </a>
          </div>
          <p
            className="footer-copyright"
            onClick={handleCopyrightClick}
            style={{ cursor: "default", userSelect: "none" }}
          >
            ┬⌐ 2025 SHOE DISTRICT. All rights reserved.
          </p>
        </div>
      </div>

      {/* Admin Gateway Modal */}
      {adminOpen && (
        <div className="admin-gateway-overlay" role="dialog" aria-modal="true" aria-label="Custom Order">
          <div className="admin-gateway-modal">
            <button type="button" className="admin-gateway-close" onClick={closeAdmin} aria-label="Close">├ù</button>
            <h2 className="admin-gateway-title">Custom Order</h2>
            <form onSubmit={handleAdminSubmit} className="admin-gateway-form">
              <div className="admin-gateway-field">
                <label htmlFor="admin-item-name">Item Name</label>
                <input
                  id="admin-item-name"
                  type="text"
                  placeholder="e.g. Custom Service"
                  value={adminItemName}
                  onChange={(e) => setAdminItemName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="admin-gateway-field">
                <label htmlFor="admin-amount">Amount (R)</label>
                <input
                  id="admin-amount"
                  type="number"
                  placeholder="0.00"
                  min="1"
                  step="0.01"
                  value={adminAmount}
                  onChange={(e) => setAdminAmount(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="admin-gateway-submit">PROCEED TO CHECKOUT</button>
            </form>
          </div>
        </div>
      )}
    </footer>
  );
}
