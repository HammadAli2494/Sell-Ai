import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { getErrorMessage } from "../../services/api.js";
import { getMyOrderRequest } from "../../services/order.service.js";
import { formatMoney } from "../../utils/money.js";

function CustomerOrderDetailPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadOrder() {
    setLoading(true);
    try {
      setOrder(await getMyOrderRequest(orderId));
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

  if (loading) {
    return <div className="ui-skeleton h-48" />;
  }

  if (!order) {
    return (
      <section className="ui-card p-5">
        <p className="text-sm text-muted">Order not found.</p>
        <Link to="/account/orders" className="ui-link mt-3 inline-block text-sm">
          Back to orders
        </Link>
      </section>
    );
  }

  return (
    <section className="ui-card p-5">
      <Link to="/account/orders" className="ui-link text-sm">
        Back to orders
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="ui-title">Order details</h1>
          <p className="break-all text-xs text-muted">{order.id}</p>
          <p className="mt-1 text-sm text-muted">{order.store?.name}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={order.status} />
          <StatusBadge status={order.paymentStatus} />
        </div>
      </div>
      <ul className="mt-5 space-y-2 text-sm">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3">
            <span>
              {item.product.name} × {item.quantity}
            </span>
            <span className="font-medium">{formatMoney(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 font-semibold text-ink">Total {formatMoney(order.total)}</p>
      <div className="mt-5 rounded-xl bg-soft p-4 text-sm">
        <p className="font-medium text-ink">Shipping</p>
        <p className="mt-1 text-muted">{order.shippingName}</p>
        <p className="text-muted">{order.shippingAddress}</p>
        <p className="text-muted">
          {[order.shippingCity, order.shippingState, order.shippingPostalCode, order.shippingCountry].filter(Boolean).join(", ")}
        </p>
        {order.shippingPhone ? <p className="text-muted">{order.shippingPhone}</p> : null}
      </div>
    </section>
  );
}

export default CustomerOrderDetailPage;
