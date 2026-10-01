import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { useStore } from "../../context/StoreContext.jsx";
import { getErrorMessage } from "../../services/api.js";
import { getMerchantOrderRequest, updateOrderStatusRequest } from "../../services/order.service.js";
import { formatMoney } from "../../utils/money.js";

const STATUSES = ["CONFIRMED", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

function MerchantOrderPage() {
  const { orderId } = useParams();
  const { store } = useStore();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadOrder() {
    setLoading(true);
    try {
      setOrder(await getMerchantOrderRequest(orderId));
    } catch (err) {
      toast.error(getErrorMessage(err, "Order not found"));
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function handleStatus(status) {
    try {
      setOrder(await updateOrderStatusRequest(orderId, status));
      toast.success("Order status updated");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not update order"));
    }
  }

  if (loading) {
    return <div className="ui-skeleton h-48" />;
  }

  if (!order) {
    return (
      <section className="ui-card p-5">
        <p className="text-sm text-muted">Order not found.</p>
        <Link to="/store/orders" className="ui-link mt-3 inline-block text-sm">
          Back to orders
        </Link>
      </section>
    );
  }

  return (
    <section className="ui-page max-w-3xl">
      <Link to="/store/orders" className="ui-link text-sm">
        Back to orders
      </Link>
      <div className="ui-card mt-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="ui-title">Order details</h1>
            <p className="break-all text-xs text-muted">{order.id}</p>
            <p className="mt-2 text-sm text-ink">{order.customer.name}</p>
            <p className="text-sm text-muted">{order.customer.email}</p>
            <p className="mt-1 text-xs text-muted">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold">{formatMoney(order.total, store?.settings?.currency)}</p>
            <div className="mt-2 flex flex-col items-end gap-1">
              <StatusBadge status={order.status} />
              <StatusBadge status={order.paymentStatus} />
            </div>
          </div>
        </div>
        <ul className="mt-5 space-y-2 text-sm">
          {order.items.map((item) => (
            <li key={item.id}>
              {item.product.name} × {item.quantity} — {formatMoney(item.price, store?.settings?.currency)}
            </li>
          ))}
        </ul>
        <div className="mt-5 rounded-xl bg-soft p-4 text-sm">
          <p className="font-medium text-ink">Shipping</p>
          <p className="mt-1 text-muted">{order.shippingName}</p>
          <p className="text-muted">{order.shippingAddress}</p>
          <p className="text-muted">
            {[order.shippingCity, order.shippingState, order.shippingPostalCode, order.shippingCountry].filter(Boolean).join(", ")}
          </p>
          {order.shippingPhone ? <p className="text-muted">{order.shippingPhone}</p> : null}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => handleStatus(status)}
              className={`ui-btn ${order.status === status ? "ui-btn-primary" : "ui-btn-secondary"} !px-2.5 !py-1 text-xs`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default MerchantOrderPage;
