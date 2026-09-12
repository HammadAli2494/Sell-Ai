import { useState } from "react";
import { Link, Navigate, useNavigate, useOutletContext } from "react-router-dom";
import { useCart } from "../../context/CartContext.jsx";
import { getErrorMessage } from "../../services/api.js";
import { checkoutRequest } from "../../services/order.service.js";
import { formatMoney } from "../../utils/money.js";

function CheckoutPage() {
  const { store } = useOutletContext();
  const { cart, loading, clearCart } = useCart();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [error, setError] = useState("");

  if (loading) {
    return <main className="px-4 py-10 text-sm text-muted">Loading checkout...</main>;
  }

  if (!placed && cart.items.length === 0) {
    return <Navigate to={`/s/${store.slug}/cart`} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const order = await checkoutRequest(store.slug, { name, email });
      setPlaced(true);
      clearCart();
      navigate(`/s/${store.slug}/orders/${order.id}?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(getErrorMessage(err, "Could not place order"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10">
      <Link to={`/s/${store.slug}/cart`} className="ui-link text-sm">
        Back to cart
      </Link>
      <h1 className="ui-title mt-4">Checkout</h1>
      <p className="ui-sub">
        Total {formatMoney(cart.subtotal, store.settings?.currency)}. We'll save this as a pending
        order. The merchant confirms payment separately, for example pay on delivery.
      </p>
      {error && <p className="ui-alert ui-alert-error">{error}</p>}
      <form onSubmit={handleSubmit} className="ui-card mt-6 space-y-4 p-5">
        <label className="ui-label">
          Name
          <input
            required
            minLength={2}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="ui-input"
          />
        </label>
        <label className="ui-label">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="ui-input"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="store-primary w-full rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-70"
        >
          {submitting ? "Placing order..." : "Place order"}
        </button>
      </form>
    </main>
  );
}

export default CheckoutPage;
