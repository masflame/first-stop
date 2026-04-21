import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, PackageCheck } from "lucide-react";
import { useBag } from "../context/BagContext";
import "./PaymentStatus.css";

function formatPrice(price) {
  return `R ${Number(price || 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function PaymentSuccess() {
  const { clearBag } = useBag();

  useEffect(() => {
    clearBag();
  }, [clearBag]);

  const pendingOrder = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("pending_payfast_order");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!pendingOrder) return;
    const updated = {
      ...pendingOrder,
      status: "payment_received",
      paidAt: new Date().toISOString(),
    };
    sessionStorage.setItem("pending_payfast_order", JSON.stringify(updated));
  }, [pendingOrder]);

  return (
    <main className="payment-status payment-status--success">
      <div className="payment-status__shell">
        <section className="payment-status__hero">
          <div className="payment-status__eyebrow">ORDER STATUS</div>
          <div className="payment-status__status-line">
            <span>STATUS</span>
            <strong>ORDER PROCESSING</strong>
          </div>
          <h1>Payment received. Your order is processing.</h1>
          <p className="payment-status__lead">
            Your payment went through and your order is now being prepared.
            You do not need to pay again.
          </p>
          <div className="payment-status__support-strip">
            <div>
              <span>Status</span>
              <strong>Payment received</strong>
            </div>
            <div>
              <span>Next step</span>
              <strong>Order confirmation email</strong>
            </div>
          </div>
        </section>

        <section className="payment-status__panel">
          {pendingOrder && (
            <>
              <div className="payment-status__summary-card">
                <div className="payment-status__summary-head">
                  <h2>Order Snapshot</h2>
                  <span>Saved order details</span>
                </div>
                <div className="payment-status__summary-grid">
                  <div>
                    <span>Order ID</span>
                    <strong>#{pendingOrder.paymentId}</strong>
                  </div>
                  <div>
                    <span>Total</span>
                    <strong>{formatPrice(pendingOrder.total)}</strong>
                  </div>
                  <div>
                    <span>Email</span>
                    <strong>{pendingOrder.customer?.email || "-"}</strong>
                  </div>
                  <div>
                    <span>Items</span>
                    <strong>{pendingOrder.items?.length || 0}</strong>
                  </div>
                </div>
              </div>

              {!!pendingOrder.items?.length && (
                <div className="payment-status__items-card">
                  <div className="payment-status__summary-head">
                    <h2>What you ordered</h2>
                    <span>Preview</span>
                  </div>
                  <div className="payment-status__items-list">
                    {pendingOrder.items.slice(0, 3).map((item) => (
                      <div key={item.key} className="payment-status__item-row">
                        <div className="payment-status__item-mark">
                          <PackageCheck size={16} strokeWidth={2} />
                        </div>
                        <div className="payment-status__item-copy">
                          <strong>{item.name}</strong>
                          <span>{item.brand} / Qty {item.quantity}</span>
                        </div>
                        <div className="payment-status__item-price">{formatPrice(item.unitPrice * item.quantity)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="payment-status__note-card">
            <h2>What happens next</h2>
            <p>
              We are finalizing your order details and will email your confirmation shortly.
            </p>
          </div>

          <div className="payment-status__actions">
            <Link to="/" className="payment-status__btn payment-status__btn--primary">
              Continue Shopping <ArrowRight size={14} />
            </Link>
            <Link to="/collections/sale" className="payment-status__btn">
              View Sale
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
