import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../../context/StoreContext.jsx";
import { getErrorMessage } from "../../services/api.js";
import { listMerchantOrders, updateOrderStatusRequest } from "../../services/order.service.js";
import { formatMoney } from "../../utils/money.js";
import StatusBadge from "../../components/common/StatusBadge.jsx";

function OrdersPage() {
  const { store, hasStore, loading: storeLoading } = useStore();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      const data = await listMerchantOrders({ page, limit: 10 });
      setOrders(data.items);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load orders"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (hasStore) {
      loadOrders();
    }
  }, [hasStore, page]);

  async function handleStatus(orderId, status) {
    try {
      await updateOrderStatusRequest(orderId, status);
      await loadOrders();
    } catch (err) {
      setError(getErrorMessage(err, "Could not update order"));
    }
  }

  return (
    <div className="ui-page">
        <h1 className="ui-title">Orders</h1>
        {error && (
          <p className="ui-alert ui-alert-error">{error}</p>
        )}
        {storeLoading ? (
          <p className="mt-4 text-sm text-muted">Loading...</p>
        ) : !hasStore ? (
          <p className="mt-4 text-sm text-gray-600">
            Create a store first in{" "}
            <Link to="/store/settings" className="ui-link">
              Settings
            </Link>
            .
          </p>
        ) : loading ? (
          <p className="mt-4 text-sm text-muted">Loading orders...</p>
        ) : orders.length === 0 ? (
          <div className="ui-card mt-6">
            <p className="ui-empty">No orders yet.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {orders.map((order) => (
              <article key={order.id} className="ui-card ui-card-hover p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-ink">{order.customer.name}</p>
                    <p className="text-sm text-muted">{order.customer.email}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-semibold text-ink">
                      {formatMoney(order.total, store.settings?.currency)}
                    </p>
                    <div className="mt-1">
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                </div>
                <p className="mt-3 break-all text-xs text-muted">{order.id}</p>
                <ul className="mt-3 space-y-1 text-sm text-gray-600">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.product.name} x {item.quantity}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleStatus(order.id, status)}
                      className={`ui-btn ${
                        order.status === status ? "ui-btn-primary" : "ui-btn-secondary"
                      } !px-2.5 !py-1 text-xs`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
              className="ui-btn ui-btn-secondary"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((value) => value + 1)}
              className="ui-btn ui-btn-secondary"
            >
              Next
            </button>
          </div>
        )}
    </div>
  );
}

export default OrdersPage;
