import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import SalesChart from "../../components/dashboard/SalesChart.jsx";
import StatCard from "../../components/dashboard/StatCard.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useStore } from "../../context/StoreContext.jsx";
import { getErrorMessage } from "../../services/api.js";
import { getAnalyticsRequest } from "../../services/analytics.service.js";
import { formatMoney } from "../../utils/money.js";
import { getStoreUrl } from "../../utils/storeUrl.js";

function DashboardHomePage() {
  const { user } = useAuth();
  const { store, hasStore, loading: storeLoading } = useStore();
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
        const data = await getAnalyticsRequest({ days: 30 });
        if (!cancelled) {
          setAnalytics(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Could not load dashboard"));
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
  }, [hasStore]);

  if (storeLoading) {
    return (
      <div className="ui-page">
        <div className="ui-skeleton h-24" />
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="ui-skeleton h-24" />
          <div className="ui-skeleton h-24" />
          <div className="ui-skeleton h-24" />
          <div className="ui-skeleton h-24" />
        </div>
      </div>
    );
  }

  if (!hasStore) {
    return (
      <section className="ui-card mx-auto max-w-xl p-6 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">Get started</p>
        <h1 className="ui-title mt-2">Create your store</h1>
        <p className="ui-sub">
          Products, orders, customers, and analytics all belong to your store.
        </p>
        <Link to="/store/settings" className="ui-btn ui-btn-primary mt-6">
          Open settings
        </Link>
      </section>
    );
  }

  const currency = store.settings?.currency;
  const recentSeries = analytics?.salesByDay.slice(-7) || [];
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="ui-page">
      <section className="relative overflow-hidden rounded-2xl border border-line bg-white p-5 sm:p-6">
        <div className="ui-orb -top-16 right-0 h-40 w-40 bg-indigo-200/40" />
        <div className="relative">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">Welcome back</p>
          <h1 className="ui-title mt-1">Hello, {firstName}</h1>
          <p className="ui-sub">{store.name} · last 30 days</p>
        </div>
      </section>

      {error ? <p className="ui-alert ui-alert-error">{error}</p> : null}

      {loading || !analytics ? (
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="ui-skeleton h-24" />
          <div className="ui-skeleton h-24" />
          <div className="ui-skeleton h-24" />
          <div className="ui-skeleton h-24" />
        </div>
      ) : (
        <>
          <div className="ui-stagger mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Sales"
              value={formatMoney(analytics.totals.sales, currency)}
              hint="Excludes cancelled orders"
            />
            <StatCard label="Orders" value={analytics.totals.salesCount} hint={`${analytics.totals.pendingCount} pending`} />
            <StatCard label="Customers" value={analytics.totals.customers} />
            <StatCard
              label="Listings"
              value={analytics.totals.products}
              hint={`${analytics.totals.activeProducts} active`}
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <section className="ui-card p-5 lg:col-span-2">
              <h2 className="text-sm font-semibold text-ink">Sales last 7 days</h2>
              <div className="mt-4">
                <SalesChart series={recentSeries} />
              </div>
            </section>
            <section className="ui-card p-5">
              <h2 className="text-sm font-semibold text-ink">Quick actions</h2>
              <div className="mt-4 grid gap-2">
                <Link to="/store/ai" className="ui-btn ui-btn-ai justify-start">
                  Generate listing
                </Link>
                <Link to="/store/products" className="ui-btn ui-btn-secondary justify-start">
                  Add product
                </Link>
                <Link to="/store/orders" className="ui-btn ui-btn-secondary justify-start">
                  View orders
                </Link>
                <a href={getStoreUrl(store.slug)} className="ui-btn ui-btn-secondary justify-start">
                  View store
                </a>
                <Link to="/store/settings" className="ui-btn ui-btn-secondary justify-start">
                  Store settings
                </Link>
              </div>
            </section>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <section className="ui-card p-5">
              <h2 className="text-sm font-semibold text-ink">Recent orders</h2>
              {analytics.recentOrders.length === 0 ? (
                <div className="ui-empty">
                  <p>No orders yet.</p>
                  <Link to="/store/products" className="ui-link mt-2 inline-block">
                    Add a product
                  </Link>
                </div>
              ) : (
                <ul className="mt-4 divide-y divide-slate-100">
                  {analytics.recentOrders.map((order) => (
                    <li key={order.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <div className="min-w-0">
                        <Link to={`/store/orders/${order.id}`} className="truncate font-medium text-ink hover:text-brand">
                          {order.customer.name}
                        </Link>
                        <div className="mt-1">
                          <StatusBadge status={order.status} />
                        </div>
                      </div>
                      <p className="shrink-0 font-semibold text-ink">{formatMoney(order.total, currency)}</p>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/store/orders" className="ui-link mt-3 inline-block text-sm">
                View orders
              </Link>
            </section>
            <section className="ui-card p-5">
              <h2 className="text-sm font-semibold text-ink">Listing snapshot</h2>
              <p className="mt-1 text-xs text-muted">Catalog counts from your current store data.</p>
              <dl className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-soft px-3 py-3">
                  <dt className="text-xs text-muted">Total listings</dt>
                  <dd className="mt-1 text-lg font-semibold text-ink">{analytics.totals.products}</dd>
                </div>
                <div className="rounded-xl bg-soft px-3 py-3">
                  <dt className="text-xs text-muted">Active listings</dt>
                  <dd className="mt-1 text-lg font-semibold text-ink">{analytics.totals.activeProducts}</dd>
                </div>
              </dl>
              <Link to="/store/ai" className="ui-link mt-4 inline-block text-sm">
                Open AI Center
              </Link>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export default DashboardHomePage;
