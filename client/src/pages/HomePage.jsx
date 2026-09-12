import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/layout/Header.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { checkHealth } from "../services/api.js";

function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const [status, setStatus] = useState("checking");
  const [database, setDatabase] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      try {
        const data = await checkHealth();
        if (!cancelled) {
          setStatus(data?.status === "ok" ? "ok" : "error");
          setDatabase(data?.database || "");
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setError(err.message || "Could not reach the API");
        }
      }
    }

    loadHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas">
      <div className="ui-orb -top-24 -left-16 h-72 w-72 bg-indigo-200/50" />
      <div className="ui-orb top-24 -right-16 h-64 w-64 bg-purple-200/40" />
      <div className="ui-orb bottom-0 left-1/3 h-56 w-56 bg-cyan-200/30" />
      <Header />
      <main className="relative mx-auto w-full max-w-5xl px-4 py-14 sm:py-20">
        <section className="ui-page max-w-none text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-brand shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
            AI-powered seller platform
          </p>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Generate listings that sell with{" "}
            <span className="ui-gradient-text">AI-powered listing generation</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
            {isAuthenticated
              ? `Welcome back, ${user?.name}. Open your dashboard to manage products, orders, and AI copy.`
              : "SellAi helps merchants create product copy, run a storefront, and manage orders from one clean workspace."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {isAuthenticated ? (
              <Link to="/store" className="ui-btn ui-btn-primary px-5 py-2.5">
                Open dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="ui-btn ui-btn-primary px-5 py-2.5">
                  Create merchant account
                </Link>
                <Link to="/login" className="ui-btn ui-btn-secondary px-5 py-2.5">
                  Log in
                </Link>
              </>
            )}
          </div>
        </section>

        <div className="ui-card mx-auto mt-14 max-w-3xl overflow-hidden p-3">
          <div className="rounded-2xl bg-soft p-4 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              <span className="ml-2 text-xs font-medium text-muted">Merchant dashboard preview</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {["Sales", "Orders", "AI listings"].map((label, index) => (
                <div key={label} className="rounded-xl border border-line bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.08em] text-muted">{label}</p>
                  <p className="mt-2 text-xl font-semibold text-ink">{["$4,280", "128", "36"][index]}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 h-24 rounded-xl border border-line bg-white px-4 py-3">
              <div className="flex h-full items-end gap-1.5">
                {[32, 48, 28, 64, 44, 78, 56].map((height, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-t-md bg-brand"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="ui-card mx-auto mt-8 max-w-xl p-5">
          <p className="text-sm font-medium text-ink">API health</p>
          {status === "checking" && <p className="mt-1 text-sm text-muted">Checking...</p>}
          {status === "ok" && (
            <p className="mt-1 text-sm text-emerald-700">
              Connected to Express
              {database === "connected" ? " and PostgreSQL" : " (PostgreSQL not connected yet)"}
            </p>
          )}
          {status === "error" && (
            <p className="mt-1 text-sm text-red-600">
              {error || "API is not reachable. Start the server on port 5000."}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export default HomePage;
