import { useEffect, useState } from "react";
import SalesChart from "../../components/dashboard/SalesChart.jsx";
import StatCard from "../../components/dashboard/StatCard.jsx";
import { useStore } from "../../context/StoreContext.jsx";
import { getErrorMessage } from "../../services/api.js";
import { getAnalyticsRequest } from "../../services/analytics.service.js";
import { formatMoney } from "../../utils/money.js";

const ranges = [7, 30, 90];

function AnalyticsPage() {
  const { store, hasStore, loading: storeLoading } = useStore();
  const [days, setDays] = useState(30);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      if (!hasStore) {
        setAnalytics(null);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const data = await getAnalyticsRequest({ days });
        if (!cancelled) {
          setAnalytics(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Could not load analytics"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [hasStore, days]);

  if (storeLoading) {
    return <p className="text-sm text-muted">Loading...</p>;
  }

  if (!hasStore) {
    return <p className="text-sm text-gray-600">Create a store first.</p>;
  }

  const currency = store.settings?.currency;
  const maxStatusCount = Math.max(...(analytics?.ordersByStatus.map((row) => row.count) || [0]), 1);

  return (
    <div className="ui-page">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="ui-title">Analytics</h1>
          <p className="ui-sub">Sales and catalog stats for this store only.</p>
        </div>
        <div className="flex gap-2">
          {ranges.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setDays(range)}
              className={`ui-btn ${
                days === range ? "ui-btn-primary" : "ui-btn-secondary"
              }`}
            >
              {range}d
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="ui-alert ui-alert-error">{error}</p>
      ) : null}

      {loading || !analytics ? (
        <p className="mt-6 text-sm text-muted">Loading analytics...</p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Gross sales"
              value={formatMoney(analytics.totals.sales, currency)}
              hint="Not cancelled"
            />
            <StatCard
              label="Paid-like"
              value={formatMoney(analytics.totals.paid, currency)}
              hint="Paid, processing, shipped, delivered"
            />
            <StatCard
              label="Pending"
              value={formatMoney(analytics.totals.pending, currency)}
              hint="Awaiting payment"
            />
            <StatCard label="Cancelled" value={analytics.totals.cancelledCount} />
          </div>

          <section className="ui-card mt-6 p-5">
            <h2 className="text-sm font-semibold text-ink">Sales over {days} days</h2>
            <div className="mt-4">
              <SalesChart series={analytics.salesByDay} />
            </div>
          </section>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <section className="ui-card p-5">
              <h2 className="text-sm font-semibold text-ink">Orders by status</h2>
              <ul className="mt-4 space-y-3">
                {analytics.ordersByStatus.map((row) => (
                  <li key={row.status}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-ink">{row.status}</span>
                      <span className="text-muted">
                        {row.count} · {formatMoney(row.total, currency)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-soft">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-brand to-purple"
                        style={{ width: `${(row.count / maxStatusCount) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="ui-card p-5">
              <h2 className="text-sm font-semibold text-ink">Top products</h2>
              {analytics.topProducts.length === 0 ? (
                <p className="mt-4 text-sm text-muted">No sold products yet.</p>
              ) : (
                <ul className="mt-4 divide-y divide-gray-100">
                  {analytics.topProducts.map((product) => (
                    <li key={product.productId} className="flex justify-between gap-3 py-2.5 text-sm">
                      <span className="min-w-0 truncate font-medium text-ink">{product.name}</span>
                      <span className="shrink-0 text-muted">{product.quantity} sold</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="ui-card mt-6 p-5">
            <h2 className="text-sm font-semibold text-ink">Low stock</h2>
            {analytics.lowStockProducts.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No products at or below 5 units.</p>
            ) : (
              <ul className="mt-4 divide-y divide-gray-100">
                {analytics.lowStockProducts.map((product) => (
                  <li key={product.id} className="flex justify-between gap-3 py-2.5 text-sm">
                    <span className="min-w-0 truncate font-medium text-ink">{product.name}</span>
                    <span className="shrink-0 text-muted">{product.stock} left</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default AnalyticsPage;
