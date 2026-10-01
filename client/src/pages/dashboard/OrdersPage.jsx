import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useStore } from "../../context/StoreContext.jsx";
import { getErrorMessage } from "../../services/api.js";
import { listMerchantOrders, updateOrderStatusRequest } from "../../services/order.service.js";
import { formatMoney } from "../../utils/money.js";
import StatusBadge from "../../components/common/StatusBadge.jsx";

const STATUSES = ["CONFIRMED", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const POLL_MS = 10000;

function OrdersPage() {
  const { store, hasStore, loading: storeLoading } = useStore();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageRef = useRef(page);
  const seenIdsRef = useRef(new Set());
  const initializedRef = useRef(false);

  pageRef.current = page;

  async function applyOrders(data, { notifyNew = false } = {}) {
    const incoming = data.items;
    const seen = seenIdsRef.current;
    const hasNew = incoming.some((order) => !seen.has(order.id));

    if (notifyNew && initializedRef.current && hasNew) {
      toast.info("New order received");
    }

    incoming.forEach((order) => seen.add(order.id));
    initializedRef.current = true;
    setOrders(incoming);
    setTotalPages(data.totalPages);
  }

  async function loadOrders({ silent = false } = {}) {
    if (!silent) {
      setLoading(true);
    }
    try {
      const data = await listMerchantOrders({ page: pageRef.current, limit: 10 });
      await applyOrders(data, { notifyNew: silent });
    } catch (err) {
      if (!silent) {
        toast.error(getErrorMessage(err, "Could not load orders"));
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    if (!hasStore) {
      seenIdsRef.current = new Set();
      initializedRef.current = false;
      return undefined;
    }

    loadOrders();
    return undefined;
  }, [hasStore, page]);

  useEffect(() => {
    if (!hasStore) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      loadOrders({ silent: true });
    }, POLL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [hasStore]);

  async function handleStatus(orderId, status) {
    try {
      await updateOrderStatusRequest(orderId, status);
      toast.success("Order status updated");
      await loadOrders({ silent: true });
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not update order"));
    }
  }

  return (
    <div className="ui-page">
      <h1 className="ui-title">Orders</h1>
      {storeLoading ? (
        <p className="mt-4 text-sm text-muted">Loading...</p>
      ) : !hasStore ? (
        <p className="mt-4 text-sm text-slate-600">
          Create a store first in{" "}
          <Link to="/store/settings" className="ui-link">
            Settings
          </Link>
          .
        </p>
      ) : loading ? (
        <div className="mt-6 space-y-3">
          <div className="ui-skeleton h-28" />
          <div className="ui-skeleton h-28" />
        </div>
      ) : orders.length === 0 ? (
        <div className="ui-card mt-6">
          <p className="ui-empty">No orders received yet.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((order) => (
            <article key={order.id} className="ui-card ui-card-hover p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Link to={`/store/orders/${order.id}`} className="font-semibold text-ink hover:text-brand">
                    {order.customer.name}
                  </Link>
                  <p className="text-sm text-muted">{order.customer.email}</p>
                  <p className="mt-1 text-xs text-muted">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-semibold text-ink">{formatMoney(order.total, store.settings?.currency)}</p>
                  <div className="mt-1 flex flex-wrap justify-end gap-1">
                    <StatusBadge status={order.status} />
                    <StatusBadge status={order.paymentStatus} />
                  </div>
                </div>
              </div>
              <p className="mt-3 break-all text-xs text-muted">{order.id}</p>
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.product.name} x {item.quantity}
                  </li>
                ))}
              </ul>
              {order.shippingAddress ? (
                <p className="mt-3 text-xs text-muted">
                  Ship to {order.shippingAddress}, {order.shippingCity}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatus(order.id, status)}
                    className={`ui-btn ${order.status === status ? "ui-btn-primary" : "ui-btn-secondary"} !px-2.5 !py-1 text-xs`}
                  >
                    {status}
                  </button>
                ))}
                <Link to={`/store/orders/${order.id}`} className="ui-btn ui-btn-ghost !px-2.5 !py-1 text-xs">
                  Details
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div className="mt-4 flex gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="ui-btn ui-btn-secondary">
            Previous
          </button>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} className="ui-btn ui-btn-secondary">
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default OrdersPage;
