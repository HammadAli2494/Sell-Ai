import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useStore } from "../../context/StoreContext.jsx";
import { getErrorMessage } from "../../services/api.js";
import {
  createCheckoutRequest,
  createPortalRequest,
  getBillingRequest,
  listPlansRequest,
} from "../../services/billing.service.js";
import { formatMoney } from "../../utils/money.js";

function BillingPage() {
  const { hasStore, loading: storeLoading } = useStore();
  const [searchParams] = useSearchParams();
  const checkoutState = searchParams.get("checkout");
  const [plans, setPlans] = useState([]);
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyPlan, setBusyPlan] = useState("");

  async function loadBilling() {
    const [planList, current] = await Promise.all([listPlansRequest(), getBillingRequest()]);
    setPlans(planList);
    setBilling(current);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!hasStore) {
        setPlans([]);
        setBilling(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const [planList, current] = await Promise.all([listPlansRequest(), getBillingRequest()]);
        if (!cancelled) {
          setPlans(planList);
          setBilling(current);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Could not load billing"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [hasStore]);

  useEffect(() => {
    if (checkoutState !== "success" || !hasStore) {
      return undefined;
    }

    let cancelled = false;
    let attempts = 0;

    async function refresh() {
      attempts += 1;
      try {
        const current = await getBillingRequest();
        if (!cancelled) {
          setBilling(current);
        }
      } catch {
        // Keep showing the last known database state.
      }

      if (!cancelled && attempts < 4) {
        window.setTimeout(refresh, 2000);
      }
    }

    refresh();

    return () => {
      cancelled = true;
    };
  }, [checkoutState, hasStore]);

  async function handleCheckout(planName) {
    setBusyPlan(planName);
    setError("");
    try {
      const result = await createCheckoutRequest(planName);
      if (result.url) {
        window.location.assign(result.url);
        return;
      }
      await loadBilling();
    } catch (err) {
      setError(getErrorMessage(err, "Could not start checkout"));
    } finally {
      setBusyPlan("");
    }
  }

  async function handlePortal() {
    setBusyPlan("portal");
    setError("");
    try {
      const result = await createPortalRequest();
      window.location.assign(result.url);
    } catch (err) {
      setError(getErrorMessage(err, "Could not open billing portal"));
    } finally {
      setBusyPlan("");
    }
  }

  if (storeLoading) {
    return <p className="text-sm text-muted">Loading...</p>;
  }

  if (!hasStore) {
    return <p className="text-sm text-gray-600">Create a store first.</p>;
  }

  const currentPlan = billing?.subscription?.plan?.name;
  const entitledPlan = billing?.entitlements?.planName;

  return (
    <section className="ui-page max-w-3xl">
      <h1 className="ui-title">Billing</h1>
      <p className="ui-sub">
        Plan, payment status, and AI limits come from the server database after Stripe
        confirms them. This page cannot change them on its own.
      </p>

      {checkoutState === "success" ? (
        <p className="ui-alert ui-alert-success">
          Checkout finished. Status updates when the Stripe webhook is verified.
        </p>
      ) : null}
      {checkoutState === "cancel" ? (
        <p className="ui-alert ui-alert-info">
          Checkout was canceled. Nothing was changed.
        </p>
      ) : null}
      {error ? (
        <p className="ui-alert ui-alert-error">{error}</p>
      ) : null}

      {loading || !billing ? (
        <p className="mt-6 text-sm text-muted">Loading billing...</p>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <article className="ui-card ui-card-hover p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Status</p>
              <p className="mt-2 font-semibold text-ink">{billing.subscription.status}</p>
            </article>
            <article className="ui-card ui-card-hover p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Plan</p>
              <p className="mt-2 font-semibold text-ink">{currentPlan}</p>
            </article>
            <article className="ui-card ui-card-hover p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">AI limit</p>
              <p className="mt-2 font-semibold text-ink">{billing.entitlements.aiRequestLimit} / month</p>
              {entitledPlan !== currentPlan ? (
                <p className="mt-1 text-xs text-muted">Using {entitledPlan} limits</p>
              ) : null}
            </article>
          </div>

          {!billing.configured ? (
            <p className="mt-4 text-sm text-muted">
              Stripe is not configured on the server yet. Paid upgrades stay disabled until
              secret keys are set in environment variables.
            </p>
          ) : null}

          {billing.hasBillingAccount ? (
            <button
              type="button"
              onClick={handlePortal}
              disabled={Boolean(busyPlan)}
              className="ui-btn ui-btn-secondary mt-4"
            >
              {busyPlan === "portal" ? "Opening..." : "Manage billing"}
            </button>
          ) : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = plan.name === currentPlan && entitledPlan === plan.name;
              const isPaid = plan.name !== "FREE";
              return (
                <article key={plan.name} className={`ui-card ui-card-hover p-5 ${isCurrent ? "ring-2 ring-brand" : ""}`}>
                  <p className="text-sm font-medium text-muted">{plan.name}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">{formatMoney(plan.priceMonthly)}</p>
                  <p className="mt-2 text-sm text-gray-600">{plan.aiRequestLimit} AI requests / month</p>
                  {isCurrent ? (
                    <p className="mt-4 text-sm font-medium text-emerald-700">Current plan</p>
                  ) : isPaid ? (
                    <button
                      type="button"
                      disabled={!billing.configured || Boolean(busyPlan)}
                      onClick={() => handleCheckout(plan.name)}
                      className="ui-btn ui-btn-primary mt-4 w-full"
                    >
                      {busyPlan === plan.name ? "Starting..." : `Choose ${plan.name}`}
                    </button>
                  ) : (
                    <p className="mt-4 text-sm text-muted">Included with every store</p>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

export default BillingPage;
