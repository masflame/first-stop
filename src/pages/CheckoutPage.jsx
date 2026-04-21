import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Lock, Truck, ShieldCheck } from "lucide-react";
import { useBag } from "../context/BagContext";
import { resolveImage } from "../utils/imageResolver";
import { buildPayfastData, PAYFAST_URL } from "../utils/payfast";
import { formatSizeDisplay } from "../utils/sizeFormat";
import "./CheckoutPage.css";

function formatPrice(price) {
  return `R ${price.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const SHIPPING_RATE = 150;
const FREE_SHIPPING_THRESHOLD = 1500;

export default function CheckoutPage() {
  const { items, totalPrice } = useBag();
  const [step, setStep] = useState("info"); // info | payment
  const [form, setForm] = useState({
    email: "", firstName: "", lastName: "",
    address: "", apartment: "", city: "",
    province: "", country: "South Africa", postalCode: "", phone: "",
  });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);

  const shippingCost = totalPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_RATE;
  const total = totalPrice + shippingCost;

  if (items.length === 0) {
    return (
      <main className="checkout-page">
        <div className="checkout-empty">
          <h1>Your bag is empty</h1>
          <Link to="/" className="checkout-empty__link">Continue Shopping</Link>
        </div>
      </main>
    );
  }

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validateInfo = () => {
    const e = {};
    if (!form.email.includes("@")) e.email = "Enter a valid email";
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.address.trim()) e.address = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (!form.province.trim()) e.province = "Required";
    if (!form.postalCode.trim()) e.postalCode = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleInfoSubmit = (e) => {
    e.preventDefault();
    if (validateInfo()) setStep("payment");
  };

  const handlePayfastCheckout = async (e) => {
    e.preventDefault();

    if (!validateInfo()) {
      setStep("info");
      return;
    }

    setProcessing(true);

    try {
      const paymentId = `${Date.now()}${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`;

      const payfastItems = items.map((i) => ({
        name: i.product.name,
        price: i.product.salePrice || i.product.price,
        qty: i.quantity,
      }));

      const customer = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      };

      const data = buildPayfastData({ items: payfastItems, customer, paymentId });

      const pendingOrder = {
        paymentId,
        status: "pending",
        customer,
        items: items.map((i) => ({
          key: i.key,
          name: i.product.name,
          brand: i.product.brand,
          size: i.size,
          quantity: i.quantity,
          unitPrice: i.product.salePrice || i.product.price,
          image: i.product.image,
        })),
        subtotal: totalPrice,
        shipping: shippingCost,
        total,
        createdAt: new Date().toISOString(),
      };

      // Save pending order before redirect (client-side snapshot).
      sessionStorage.setItem("pending_payfast_order", JSON.stringify(pendingOrder));
      // TODO: persist pending order in DB here.

      const formEl = document.createElement("form");
      formEl.method = "POST";
      formEl.action = PAYFAST_URL;

      for (const [key, value] of Object.entries(data)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = String(value);
        formEl.appendChild(input);
      }

      document.body.appendChild(formEl);
      formEl.submit();
    } catch {
      setProcessing(false);
      setErrors((prev) => ({
        ...prev,
        general: "Unable to start secure checkout. Please try again.",
      }));
    }
  };

  return (
    <main className="checkout-page">
      <div className="checkout-layout">
        {/* Left: Forms */}
        <div className="checkout-form-col">
          <Link to="/" className="checkout-logo">
            <span className="logo-mark">FIRST<span className="logo-pipe">|</span>STOP</span>
            <span className="logo-coords">52.5200° N, 13.4050° E</span>
          </Link>

          {/* Breadcrumb steps */}
          <div className="checkout-steps">
            <button
              className={`checkout-step ${step === "info" ? "checkout-step--active" : "checkout-step--done"}`}
              onClick={() => step === "payment" && setStep("info")}
            >
              Information
            </button>
            <span className="checkout-steps__sep">/</span>
            <span className={`checkout-step ${step === "payment" ? "checkout-step--active" : ""}`}>
              Payment
            </span>
          </div>

          {step === "info" && (
            <form className="checkout-form" onSubmit={handleInfoSubmit}>
              <h2 className="checkout-form__heading">Contact</h2>
              <div className="checkout-field">
                <input
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  className={errors.email ? "checkout-input--error" : ""}
                />
                {errors.email && <span className="checkout-field__error">{errors.email}</span>}
              </div>

              <h2 className="checkout-form__heading">Shipping Address</h2>
              <div className="checkout-row">
                <div className="checkout-field">
                  <input
                    placeholder="First name"
                    value={form.firstName}
                    onChange={(e) => updateForm("firstName", e.target.value)}
                    className={errors.firstName ? "checkout-input--error" : ""}
                  />
                  {errors.firstName && <span className="checkout-field__error">{errors.firstName}</span>}
                </div>
                <div className="checkout-field">
                  <input
                    placeholder="Last name"
                    value={form.lastName}
                    onChange={(e) => updateForm("lastName", e.target.value)}
                    className={errors.lastName ? "checkout-input--error" : ""}
                  />
                  {errors.lastName && <span className="checkout-field__error">{errors.lastName}</span>}
                </div>
              </div>
              <div className="checkout-field">
                <input
                  value={form.country}
                  readOnly
                  aria-readonly="true"
                />
              </div>
              <div className="checkout-field">
                <input
                  placeholder="Address"
                  value={form.address}
                  onChange={(e) => updateForm("address", e.target.value)}
                  className={errors.address ? "checkout-input--error" : ""}
                />
                {errors.address && <span className="checkout-field__error">{errors.address}</span>}
              </div>
              <div className="checkout-field">
                <input
                  placeholder="Apartment, suite, etc. (optional)"
                  value={form.apartment}
                  onChange={(e) => updateForm("apartment", e.target.value)}
                />
              </div>
              <div className="checkout-row checkout-row--3">
                <div className="checkout-field">
                  <input
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => updateForm("city", e.target.value)}
                    className={errors.city ? "checkout-input--error" : ""}
                  />
                  {errors.city && <span className="checkout-field__error">{errors.city}</span>}
                </div>
                <div className="checkout-field">
                  <select
                    value={form.province}
                    onChange={(e) => updateForm("province", e.target.value)}
                    className={errors.province ? "checkout-input--error" : ""}
                  >
                    <option value="">Province</option>
                    <option>Eastern Cape</option>
                    <option>Free State</option>
                    <option>Gauteng</option>
                    <option>KwaZulu-Natal</option>
                    <option>Limpopo</option>
                    <option>Mpumalanga</option>
                    <option>Northern Cape</option>
                    <option>North West</option>
                    <option>Western Cape</option>
                  </select>
                  {errors.province && <span className="checkout-field__error">{errors.province}</span>}
                </div>
                <div className="checkout-field">
                  <input
                    placeholder="Postal code"
                    value={form.postalCode}
                    onChange={(e) => updateForm("postalCode", e.target.value)}
                    className={errors.postalCode ? "checkout-input--error" : ""}
                  />
                  {errors.postalCode && <span className="checkout-field__error">{errors.postalCode}</span>}
                </div>
              </div>
              <div className="checkout-field">
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={form.phone}
                  onChange={(e) => updateForm("phone", e.target.value)}
                />
              </div>

              <div className="checkout-form__actions">
                <Link to="/" className="checkout-back">
                  <ChevronLeft size={14} /> Back to shop
                </Link>
                <button type="submit" className="checkout-submit">
                  CONTINUE TO PAYMENT
                </button>
              </div>
            </form>
          )}

          {step === "payment" && (
            <form className="checkout-form" onSubmit={handlePayfastCheckout}>
              {/* Shipping summary */}
              <div className="checkout-info-summary">
                <div className="checkout-info-row">
                  <span className="checkout-info-label">Contact</span>
                  <span className="checkout-info-value">{form.email}</span>
                  <button type="button" className="checkout-info-change" onClick={() => setStep("info")}>Change</button>
                </div>
                <div className="checkout-info-row">
                  <span className="checkout-info-label">Ship to</span>
                  <span className="checkout-info-value">
                    {form.address}{form.apartment ? `, ${form.apartment}` : ""}, {form.city}, {form.province}, {form.postalCode}, {form.country}
                  </span>
                  <button type="button" className="checkout-info-change" onClick={() => setStep("info")}>Change</button>
                </div>
              </div>

              <h2 className="checkout-form__heading">
                <Lock size={14} /> Payment
              </h2>
              <p className="checkout-form__sub">You will be redirected to secure payment to complete your order.</p>

              <div className="checkout-card-box">
                <div className="checkout-card-box__header">
                  <Lock size={16} />
                  <span>Secure Payment</span>
                </div>
                <p className="checkout-form__sub" style={{ margin: "0 0 4px" }}>
                  Your order will be created and held while payment is being confirmed.
                </p>
                <p className="checkout-form__sub" style={{ marginBottom: 0 }}>
                  After payment, you will come back to the store and see your updated order status automatically.
                </p>
              </div>

              {errors.general && <span className="checkout-field__error">{errors.general}</span>}

              <div className="checkout-form__actions">
                <button type="button" className="checkout-back" onClick={() => setStep("info")}>
                  <ChevronLeft size={14} /> Back to details
                </button>
                <button type="submit" className="checkout-submit checkout-submit--pay" disabled={processing}>
                  {processing ? (
                    <span className="checkout-spinner" />
                  ) : (
                    <>
                      <Lock size={14} />
                      PAY {formatPrice(total)}
                    </>
                  )}
                </button>
              </div>

              <div className="checkout-secure-badges">
                <ShieldCheck size={14} />
                <span>Secure 256-bit SSL encrypted payment</span>
              </div>
            </form>
          )}
        </div>

        {/* Right: Order Summary */}
        <div className="checkout-summary-col">
          <div className="checkout-summary">
            <h3 className="checkout-summary__title">Order Summary</h3>
            <div className="checkout-summary__items">
              {items.map((item) => {
                const img = resolveImage(item.product.image);
                const unitPrice = item.product.salePrice || item.product.price;
                return (
                  <div key={item.key} className="checkout-summary-item">
                    <div className="checkout-summary-item__img">
                      {img ? <img src={img} alt={item.product.name} /> : <div className="checkout-summary-item__placeholder">{item.product.brand}</div>}
                      <span className="checkout-summary-item__badge">{item.quantity}</span>
                    </div>
                    <div className="checkout-summary-item__info">
                      <span className="checkout-summary-item__name">{item.product.name}</span>
                      <span className="checkout-summary-item__meta">Size {formatSizeDisplay(item.size)}</span>
                    </div>
                    <span className="checkout-summary-item__price">
                      {formatPrice(unitPrice * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="checkout-summary__totals">
              <div className="checkout-summary__row">
                <span>Subtotal</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="checkout-summary__row">
                <span>
                  <Truck size={14} /> Shipping
                </span>
                <span>{shippingCost === 0 ? "FREE" : formatPrice(shippingCost)}</span>
              </div>
              <div className="checkout-summary__row checkout-summary__row--total">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
