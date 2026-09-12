import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";

function StorefrontHeader({ store }) {
  const { itemCount } = useCart();
  const { isAuthenticated } = useAuth();
  const slug = store?.slug;
  const backTo = isAuthenticated ? "/store" : "/";
  const backLabel = isAuthenticated ? "Dashboard" : "SellAi";

  return (
    <header className="ui-navbar sticky top-0 z-30">
      <div className="mx-auto flex w-full min-w-0 max-w-5xl items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            to={backTo}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-ink"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M15 6 9 12l6 6" />
            </svg>
            <span className="hidden sm:inline">{backLabel}</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <Link
            to={`/s/${slug}`}
            className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ink"
            style={{ color: store?.settings?.primaryColor || undefined }}
          >
            {store?.settings?.logoUrl ? (
              <img
                src={store.settings.logoUrl}
                alt=""
                className="h-8 w-8 shrink-0 rounded-lg object-cover ring-1 ring-line"
              />
            ) : null}
            <span className="truncate">{store?.name || "Store"}</span>
          </Link>
        </div>
        <nav className="flex min-w-0 flex-wrap items-center justify-end gap-1 text-sm">
          <NavLink
            to={`/s/${slug}/products`}
            className={({ isActive }) =>
              `rounded-lg px-2 py-2 transition sm:px-3 ${
                isActive ? "bg-indigo-50 font-medium text-brand" : "text-slate-600 hover:bg-slate-50 hover:text-ink"
              }`
            }
          >
            Products
          </NavLink>
          <NavLink
            to={`/s/${slug}/orders`}
            className={({ isActive }) =>
              `rounded-lg px-2 py-2 transition sm:px-3 ${
                isActive ? "bg-indigo-50 font-medium text-brand" : "text-slate-600 hover:bg-slate-50 hover:text-ink"
              }`
            }
          >
            Orders
          </NavLink>
          <NavLink
            to={`/s/${slug}/policies`}
            className={({ isActive }) =>
              `rounded-lg px-2 py-2 transition sm:px-3 ${
                isActive ? "bg-indigo-50 font-medium text-brand" : "text-slate-600 hover:bg-slate-50 hover:text-ink"
              }`
            }
          >
            Policies
          </NavLink>
          <NavLink
            to={`/s/${slug}/cart`}
            className={({ isActive }) =>
              `rounded-lg px-2 py-2 transition sm:px-3 ${
                isActive ? "bg-indigo-50 font-medium text-brand" : "text-slate-600 hover:bg-slate-50 hover:text-ink"
              }`
            }
          >
            Cart{itemCount ? ` (${itemCount})` : ""}
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default StorefrontHeader;
