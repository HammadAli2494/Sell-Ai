import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { getErrorMessage } from "../../services/api.js";
import { checkoutRequest } from "../../services/order.service.js";
import { formatMoney } from "../../utils/money.js";

function CheckoutPage() {
  const { store } = useOutletContext();
  const { cart, loading, clearCart } = useCart();
  const { user, isAuthenticated, isCustomer, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    state: user?.state || "",
    postalCode: user?.postalCode || "",
    country: user?.country || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }
    setForm((current) => ({
      name: current.name || user.name || "",
      phone: current.phone || user.phone || "",
      address: current.address || user.address || "",
      city: current.city || user.city || "",
      state: current.state || user.state || "",
      postalCode: current.postalCode || user.postalCode || "",
      country: current.country || user.country || "",
    }));
  }, [user]);

  if (authLoading || loading) {
    return <main className="px-4 py-10 text-sm text-muted">Loading checkout...</main>;
  }

  if (!isAuthenticated || !isCustomer) {
    return <Navigate to="/customer/login" replace state={{ from: location }} />;
  }

  if (!placed && cart.items.length === 0) {
    return <Navigate to={`/s/${store.slug}/cart`} replace />;
  }

  function setValue(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const order = await checkoutRequest(store.slug, form);
      setPlaced(true);
      clearCart();
      toast.success("Order placed successfully");
      navigate(`/account/orders/${order.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to place order"));
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
        Review your {store.name} order. Payment is recorded as unpaid until the merchant collects it.
      </p>
      <section className="ui-card mt-6 p-5">
        <h2 className="text-sm font-semibold text-ink">Order summary</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {cart.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span>
                {item.product.name} × {item.quantity}
              </span>
              <span className="font-medium">{formatMoney(item.product.price * item.quantity, store.settings?.currency)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 font-semibold text-ink">Total {formatMoney(cart.subtotal, store.settings?.currency)}</p>
        <p className="mt-1 text-xs text-muted">Payment status after checkout: Unpaid</p>
      </section>
      <form onSubmit={handleSubmit} className="ui-card mt-4 grid gap-4 p-5">
        <label className="ui-label">
          Full name
          <input required minLength={2} value={form.name} onChange={(event) => setValue("name", event.target.value)} className="ui-input" />
        </label>
        <label className="ui-label">
          Phone
          <input value={form.phone} onChange={(event) => setValue("phone", event.target.value)} className="ui-input" />
        </label>
        <label className="ui-label">
          Address
          <input required minLength={3} value={form.address} onChange={(event) => setValue("address", event.target.value)} className="ui-input" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="ui-label">
            City
            <input required minLength={2} value={form.city} onChange={(event) => setValue("city", event.target.value)} className="ui-input" />
          </label>
          <label className="ui-label">
            State
            <input value={form.state} onChange={(event) => setValue("state", event.target.value)} className="ui-input" />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="ui-label">
            Postal code
            <input value={form.postalCode} onChange={(event) => setValue("postalCode", event.target.value)} className="ui-input" />
          </label>
          <label className="ui-label">
            Country
            <input required minLength={2} value={form.country} onChange={(event) => setValue("country", event.target.value)} className="ui-input" />
          </label>
        </div>
        <button type="submit" disabled={submitting} className="store-primary w-full rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-70">
          {submitting ? "Placing order..." : "Place order"}
        </button>
      </form>
    </main>
  );
}

export default CheckoutPage;
