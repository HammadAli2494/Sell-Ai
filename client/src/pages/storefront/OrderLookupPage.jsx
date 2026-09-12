import { useEffect, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { getErrorMessage } from "../../services/api.js";
import { listPublicOrdersRequest } from "../../services/order.service.js";
import { formatMoney } from "../../utils/money.js";
import StatusBadge from "../../components/common/StatusBadge.jsx";

function OrderLookupPage() {
  const { store } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const initialEmail = searchParams.get("email");
    if (initialEmail) {
      lookup(initialEmail);
    }
    // Run once when the page opens with ?email=
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function lookup(nextEmail) {
    const value = nextEmail.trim();
    if (!value) {
      setError("Enter the email used at checkout");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const data = await listPublicOrdersRequest(store.slug, value);
      setOrders(data.items);
      setSearchParams({ email: value }, { replace: true });
    } catch (err) {
      setOrders([]);
      setError(getErrorMessage(err, "Could not find orders"));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await lookup(email);
  }

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10">
      <h1 className="ui-title">Your orders</h1>
      <p className="ui-sub">
        Enter the email used at checkout to look up orders for this store only.
      </p>
      <form onSubmit={handleSubmit} className="ui-card mt-6 space-y-4 p-5">
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
          disabled={loading}
          className="store-primary w-full rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-70"
        >
          {loading ? "Looking up..." : "Find orders"}
        </button>
      </form>
      {error ? <p className="ui-alert ui-alert-error">{error}</p> : null}
      {loading ? null : searched && orders.length === 0 && !error ? (
        <p className="mt-4 text-sm text-muted">No orders found for that email.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                to={`/s/${store.slug}/orders/${order.id}?email=${encodeURIComponent(email.trim())}`}
                className="ui-card ui-card-hover block p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-ink">
                    {formatMoney(order.total, store.settings?.currency)}
                  </p>
                  <StatusBadge status={order.status} />
                </div>
                <p className="mt-2 break-all text-xs text-muted">{order.id}</p>
                <p className="mt-1 text-xs text-muted">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default OrderLookupPage;
