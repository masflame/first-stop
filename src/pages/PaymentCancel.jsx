import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, RefreshCcw } from "lucide-react";
import { supabase } from "../utils/supabase";
import "./PaymentStatus.css";

function formatPrice(price) {
  return `R ${Number(price || 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function PaymentCancel() {
  const pendingOrder = useMemo(() => {
    try {
      const raw =
        sessionStorage.getItem("gm_pending_order") ||
        sessionStorage.getItem("pending_payfast_order");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!pendingOrder?.paymentId) return;
    const updated = {
      ...pendingOrder,
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
    };
    supabase
      .from("Orders")
      .update({ status: "cancelled" })
      .eq("order_id", pendingOrder.paymentId);
    sessionStorage.setItem("gm_pending_order", JSON.stringify(updated));
    sessionStorage.setItem("pending_payfast_order", JSON.stringify(updated));
  }, [pendingOrder]);

  return (
    <main className="payment-status payment-status--cancel">
      <div className="payment-status__shell">
        <section className="payment-status__hero">
          <div className="payment-status__eyebrow">ORDER STATUS</div>
          <div className="payment-status__status-line">
            <span>STATUS</span>
            <strong>PAYMENT CANCELLED</strong>
          </div>
          <h1>This payment did not complete.</h1>
          <p className="payment-status__lead">
            This attempt was cancelled and no charge was completed.
            You can safely try checkout again.
          </p>
          <div className="payment-status__support-strip">
            <div>
              <span>Status</span>
              <strong>Payment cancelled</strong>
            </div>
            <div>
              <span>Recommended</span>
              <strong>Go back to checkout and retry</strong>
            </div>
          </div>
        </section>

        <section className="payment-status__panel">
          {pendingOrder && (
            <div className="payment-status__summary-card">
              <div className="payment-status__summary-head">
                <h2>Order Snapshot</h2>
                <span>Ready to retry</span>
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
                  <span>Bag status</span>
                  <strong>Still available to reorder</strong>
                </div>
              </div>
            </div>
          )}

          <div className="payment-status__note-card">
            <h2>Retry in a few seconds</h2>
            <p>
              If you closed the payment window, lost connection, or changed your mind, you can go back to checkout and finish the same order.
            </p>
          </div>

          <div className="payment-status__actions">
            <Link to="/checkout" className="payment-status__btn payment-status__btn--primary">
              <RefreshCcw size={14} /> Back to Checkout
            </Link>
            <Link to="/" className="payment-status__btn">
              Continue Shopping <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
