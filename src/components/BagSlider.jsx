import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useBag } from "../context/BagContext";
import { resolveImage } from "../utils/imageResolver";
import { formatSizeDisplay } from "../utils/sizeFormat";
import "./BagSlider.css";

function formatPrice(price, currency) {
  if (currency === "ZAR") {
    return `R ${price.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `€${price.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BagSlider() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalItems, totalPrice } = useBag();
  const overlayRef = useRef(null);
  const navigate = useNavigate();

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setIsOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setIsOpen]);

  const handleCheckout = () => {
    setIsOpen(false);
    navigate("/checkout");
  };

  // Determine currency from first item
  const currency = items.length > 0 ? (items[0].product.currency || "EUR") : "EUR";

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className={`bag-overlay ${isOpen ? "bag-overlay--open" : ""}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Slider */}
      <div className={`bag-slider ${isOpen ? "bag-slider--open" : ""}`}>
        {/* Header */}
        <div className="bag-slider__header">
          <h2 className="bag-slider__title">
            YOUR BAG <span className="bag-slider__count">({totalItems})</span>
          </h2>
          <button className="bag-slider__close" onClick={() => setIsOpen(false)} aria-label="Close bag">
            <X size={22} />
          </button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="bag-slider__empty">
            <ShoppingBag size={48} strokeWidth={1} />
            <p>Your bag is empty</p>
            <button className="bag-slider__continue" onClick={() => setIsOpen(false)}>
              CONTINUE SHOPPING
            </button>
          </div>
        ) : (
          <>
            <div className="bag-slider__items">
              {items.map((item) => {
                const img = resolveImage(item.product.image);
                const unitPrice = item.product.salePrice || item.product.price;
                return (
                  <div key={item.key} className="bag-item">
                    <Link
                      to={`/product/${item.product.id}`}
                      className="bag-item__image"
                      onClick={() => setIsOpen(false)}
                    >
                      {img ? (
                        <img src={img} alt={item.product.name} />
                      ) : (
                        <div className="bag-item__image-placeholder">{item.product.brand}</div>
                      )}
                    </Link>
                    <div className="bag-item__details">
                      <Link
                        to={`/product/${item.product.id}`}
                        className="bag-item__name"
                        onClick={() => setIsOpen(false)}
                      >
                        {item.product.name}
                      </Link>
                      <p className="bag-item__meta">
                        {item.product.brand} / Size {formatSizeDisplay(item.size)}
                      </p>
                      <p className="bag-item__price">
                        {formatPrice(unitPrice * item.quantity, item.product.currency)}
                      </p>
                      <div className="bag-item__actions">
                        <div className="bag-item__qty">
                          <button onClick={() => updateQuantity(item.key, item.quantity - 1)}>
                            <Minus size={12} />
                          </button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.key, item.quantity + 1)}>
                            <Plus size={12} />
                          </button>
                        </div>
                        <button className="bag-item__remove" onClick={() => removeItem(item.key)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="bag-slider__footer">
              <div className="bag-slider__subtotal">
                <span>Subtotal</span>
                <span>{formatPrice(totalPrice, currency)}</span>
              </div>
              <p className="bag-slider__shipping-note">Shipping calculated at checkout</p>
              <button className="bag-slider__checkout" onClick={handleCheckout}>
                CHECKOUT
              </button>
              <button className="bag-slider__continue-shopping" onClick={() => setIsOpen(false)}>
                CONTINUE SHOPPING
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
