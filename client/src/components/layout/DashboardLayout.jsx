import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext.jsx";
import { useStore } from "../../context/StoreContext.jsx";
import { copyStoreLink, getStoreUrl } from "../../utils/storeUrl.js";
import MerchantNav from "./MerchantNav.jsx";

const pageMeta = {
  "/store": ["Dashboard", "Overview"],
  "/store/products": ["Products", "Catalog"],
  "/store/categories": ["Categories", "Catalog"],
  "/store/orders": ["Orders", "Commerce"],
  "/store/customers": ["Customers", "Commerce"],
  "/store/analytics": ["Analytics", "Insights"],
  "/store/ai": ["AI Center", "Generation"],
  "/store/billing": ["Billing", "Plan"],
  "/store/settings": ["Settings", "Store"],
};

function initials(name) {
  return (name || "M")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function DashboardSidebar({ storeName, user, onNavigate, onLogout }) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-soft">
      <div className="border-b border-line px-4 py-4">
        <Link to="/store" className="flex items-center gap-2.5" onClick={onNavigate}>
          <span className="brand-mark h-8 w-8 rounded-xl text-sm">S</span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-ink">SellAi</span>
            <span className="block truncate text-xs text-muted">{storeName}</span>
          </span>
        </Link>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <MerchantNav onNavigate={onNavigate} />
      </div>
      <div className="border-t border-line p-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-brand">
            {initials(user?.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>
        </div>
        <button type="button" onClick={onLogout} className="ui-btn ui-btn-secondary mt-3 w-full">
          Log out
        </button>
      </div>
    </div>
  );
}

function DashboardLayout() {
  const { user, logout } = useAuth();
  const { store, hasStore, loading } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const [title, section] = pageMeta[location.pathname] || ["Dashboard", "Merchant"];

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const storeName = loading ? "Loading store..." : hasStore ? store.name : "No store yet";
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-canvas md:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 overflow-y-auto border-r border-line bg-soft md:block">
        <DashboardSidebar storeName={storeName} user={user} onNavigate={closeMenu} onLogout={logout} />
      </aside>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="ui-drawer-backdrop absolute inset-0 bg-slate-900/40"
            onClick={closeMenu}
          />
          <aside className="ui-drawer-panel relative z-10 h-full w-[min(16rem,calc(100%-2.5rem))] border-r border-line bg-soft shadow-sm">
            <DashboardSidebar
              storeName={storeName}
              user={user}
              onNavigate={closeMenu}
              onLogout={logout}
            />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="ui-navbar sticky top-0 z-30 flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            className="ui-btn ui-btn-secondary p-2 md:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">{section}</p>
            <p className="truncate text-sm font-semibold text-ink">{title}</p>
          </div>
          {hasStore ? (
            <div className="flex shrink-0 gap-2">
              {store.isActive ? (
                <a href={getStoreUrl(store.slug)} className="ui-btn ui-btn-secondary">
                  View store
                </a>
              ) : (
                <Link to="/store/settings" className="ui-btn ui-btn-secondary">
                  Publish store
                </Link>
              )}
              <button
                type="button"
                className="ui-btn ui-btn-secondary hidden sm:inline-flex"
                onClick={async () => {
                  try {
                    await copyStoreLink(store.slug);
                    toast.success("Store link copied");
                  } catch {
                    toast.error("Could not copy link");
                  }
                }}
              >
                Copy link
              </button>
            </div>
          ) : null}
          <span
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-brand sm:flex"
            title={user?.email}
          >
            {initials(user?.name)}
          </span>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">
          {!loading && !hasStore && location.pathname !== "/store/settings" && location.pathname !== "/store" ? (
            <p className="ui-alert ui-alert-warn mb-4">
              Create a store in{" "}
              <Link to="/store/settings" className="font-medium underline">
                Settings
              </Link>{" "}
              before adding products or viewing analytics.
            </p>
          ) : null}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
