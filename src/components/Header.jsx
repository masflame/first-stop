import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, User, ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { useBag } from "../context/BagContext";
import { useLenis } from "./SmoothScroll";
import "./Header.css";

const navLinks = [
  { label: "NEW", path: "/collections/new" },
  {
    label: "MEN",
    path: "/collections/men",
    submenu: [
      { label: "SNEAKERS", path: "/collections/men/sneakers" },
      { label: "RUNNING", path: "/collections/men/running" },
      { label: "SLIDES & SANDALS", path: "/collections/men/slides" },
      { label: "CLOTHING", path: "/collections/men/clothing" },
      { label: "ACCESSORIES", path: "/collections/men/accessories" },
    ],
  },
  {
    label: "WOMEN",
    path: "/collections/women",
    submenu: [
      { label: "SNEAKERS", path: "/collections/women/sneakers" },
      { label: "RUNNING", path: "/collections/women/running" },
      { label: "SLIDES & SANDALS", path: "/collections/women/slides" },
      { label: "CLOTHING", path: "/collections/women/clothing" },
      { label: "ACCESSORIES", path: "/collections/women/accessories" },
    ],
  },
  { label: "KIDS", path: "/collections/kids" },
  { label: "SOON", path: "/collections/soon" },
  { label: "RAFFLES", path: "/collections/raffle" },
  { label: "BRANDS", path: "/brands" },
  { label: "SALE", path: "/collections/sale" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { setIsOpen, totalItems } = useBag();
  const navigate = useNavigate();
  const location = useLocation();
  const lenisRef = useLenis();

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (location.pathname === "/") {
      if (lenisRef?.current) {
        lenisRef.current.scrollTo(0, { duration: 1.2 });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      navigate("/");
    }
  };

  return (
    <header className="header">
      {/* Main Header */}
      <div className="header-main">
        <div className="header-left">
          <button
            className="icon-btn mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <button
            className="icon-btn search-btn"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Search"
          >
            <Search size={20} />
          </button>
        </div>

        <a href="/" className="logo" onClick={handleLogoClick}>
          <span className="logo-mark">FIRST<span className="logo-pipe">|</span>STOP</span>
          <span className="logo-coords">52.5200° N, 13.4050° E</span>
        </a>

        <div className="header-right">
          <Link to="/account" className="icon-btn" aria-label="Account">
            <User size={20} />
          </Link>
          <button className="icon-btn cart-btn" aria-label="Bag" onClick={() => setIsOpen(true)}>
            <ShoppingBag size={20} />
            {totalItems > 0 && <span className="cart-count">{totalItems}</span>}
          </button>
        </div>
      </div>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="search-overlay">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="search-input"
            />
            <button
              className="icon-btn"
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Navigation */}
      <nav className="nav-desktop">
        {navLinks.map((link) =>
          link.submenu ? (
            <div key={link.path} className="nav-dropdown">
              <Link
                to={link.path}
                className="nav-link"
              >
                {link.label}
              </Link>
              <div className="nav-dropdown__menu">
                {link.submenu.map((sub) => (
                  <Link
                    key={sub.path}
                    to={sub.path}
                    className="nav-dropdown__item"
                  >
                    {sub.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${link.label === "SALE" ? "nav-link--sale" : ""}`}
            >
              {link.label}
            </Link>
          )
        )}
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <nav className="mobile-nav">
            {navLinks.map((link) =>
              link.submenu ? (
                <div key={link.path} className="mobile-nav-group">
                  <Link
                    to={link.path}
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                  <div className="mobile-nav-sub">
                    {link.submenu.map((sub) => (
                      <Link
                        key={sub.path}
                        to={sub.path}
                        className="mobile-nav-sub-link"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={link.path}
                  to={link.path}
                  className="mobile-nav-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
