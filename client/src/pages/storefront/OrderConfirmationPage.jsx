import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { getErrorMessage } from "../../services/api.js";
import { getPublicOrderRequest } from "../../services/order.service.js";
import { formatMoney } from "../../utils/money.js";
import StatusBadge from "../../components/common/StatusBadge.jsx";

function OrderConfirmationPage() {
  const { orderId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { store } = useOutletContext();
  const emailFromUrl = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailFromUrl);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(emailFromUrl));

  useEffect(() => {
    let cancelled = false;

    async function loadOrder() {
      if (!emailFromUrl) {
        setLoading(false);
        setError("");
        setOrder(null);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const data = await getPublicOrderRequest(store.slug, orderId, emailFromUrl);
        if (!cancelled) {
          setOrder(data);
        }
      } catch (err) {
        if (!cancelled) {
          setOrder(null);
          setError(getErrorMessage(err, "Order not found"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      cancelled = true;
    };
  }, [store.slug, orderId, emailFromUrl]);

  function handleEmailSubmit(event) {
    event.preventDefault();
    const nextEmail = email.trim();
    if (!nextEmail) {
      setError("Enter the email used at checkout");
      return;
    }
    setSearchParams({ email: nextEmail }, { replace: true });
  }

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10">
      <h1 className="ui-title">Order confirmation</h1>
      <p className="mt-2 break-all text-xs text-muted">Order ID: {orderId}</p>

      {!emailFromUrl ? (
        <form onSubmit={handleEmailSubmit} className="ui-card mt-6 space-y-4 p-5">
          <p className="text-sm text-muted">
            Enter the checkout email to view this order.
          </p>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
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
            className="store-primary w-full rounded-xl px-4 py-2.5 text-sm font-medium"
          >
            View order
          </button>
        </form>
      ) : loading ? (
        <p className="mt-4 text-sm text-muted">Loading order...</p>
      ) : error ? (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      ) : (
        <section className="ui-card mt-6 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-gray-600">
              Thanks {order.customer.name}.
            </p>
            <StatusBadge status={order.status} />
          </div>
          <ul className="mt-4 space-y-2 text-sm text-ink">
            {order.items.map((item) => (
              <li key={item.id}>
                {item.product.name} x {item.quantity}
              </li>
            ))}
          </ul>
          <p className="mt-4 font-semibold text-ink">
            Total {formatMoney(order.total, store.settings?.currency)}
          </p>
        </section>
      )}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link to={`/s/${store.slug}`} className="ui-link">
          Back to store
        </Link>
        <button
          type="button"
          className="ui-link"
          onClick={() => navigate(`/s/${store.slug}/orders`)}
        >
          Look up another order
        </button>
      </div>
    </main>
  );
}

export default OrderConfirmationPage;
