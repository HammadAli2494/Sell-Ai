import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { getErrorMessage } from "../../services/api.js";
import { listMyOrdersRequest } from "../../services/order.service.js";
import { formatMoney } from "../../utils/money.js";

function CustomerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    setLoading(true);
    try {
      const data = await listMyOrdersRequest({ limit: 20 });
      setOrders(data.items);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not load orders"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <section className="ui-card p-5">
      <h1 className="ui-title">My orders</h1>
      {loading ? (
        <div className="mt-4 space-y-2">
          <div className="ui-skeleton h-16" />
          <div className="ui-skeleton h-16" />
        </div>
      ) : orders.length === 0 ? (
        <p className="ui-empty">You haven't placed any orders yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {orders.map((order) => (
            <li key={order.id} className="py-3">
              <Link to={`/account/orders/${order.id}`} className="block rounded-xl p-2 hover:bg-slate-50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">{order.store?.name || "Store"}</p>
                    <p className="text-xs text-muted">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-ink">{formatMoney(order.total)}</p>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
                <p className="mt-1 break-all text-xs text-faint">{order.id}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default CustomerOrdersPage;
