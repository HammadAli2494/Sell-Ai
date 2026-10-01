import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";

function navClass({ isActive }) {
  return `rounded-lg px-2 py-2 transition sm:px-3 ${
    isActive ? "bg-indigo-50 font-medium text-brand" : "text-slate-600 hover:bg-slate-50 hover:text-ink"
  }`;
}

function StorefrontHeader({ store }) {
  const { itemCount } = useCart();
  const { isAuthenticated, isCustomer, isMerchant } = useAuth();
  const slug = store?.slug;

  return (
    <header className="ui-navbar sticky top-0 z-30">
      <div className="mx-auto flex w-full min-w-0 max-w-6xl items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            to="/stores"
            className="hidden shrink-0 rounded-lg px-2 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-ink sm:inline"
          >
            Stores
          </Link>
          <Link to={`/s/${slug}`} className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ink">
            {store?.settings?.logoUrl ? (
              <img
                src={store.settings.logoUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="h-8 w-8 shrink-0 rounded-lg object-cover ring-1 ring-line"
              />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-semibold text-brand">
                {(store?.name || "S").slice(0, 1)}
              </span>
            )}
            <span className="truncate">{store?.name || "Store"}</span>
          </Link>
        </div>
        <nav className="flex min-w-0 flex-wrap items-center justify-end gap-1 text-sm">
          <NavLink to={`/s/${slug}`} end className={navClass}>
            Home
          </NavLink>
          <NavLink to={`/s/${slug}/products`} className={navClass}>
            Products
          </NavLink>
          <NavLink to={`/s/${slug}/categories`} className={navClass}>
            Categories
          </NavLink>
          <NavLink to={`/s/${slug}/policies`} className={navClass}>
            Policies
          </NavLink>
          {isCustomer ? (
            <NavLink to="/account/orders" className={navClass}>
              Account
            </NavLink>
          ) : !isAuthenticated ? (
            <NavLink to="/customer/login" className={navClass}>
              Account
            </NavLink>
          ) : isMerchant ? (
            <NavLink to="/store" className={navClass}>
              Dashboard
            </NavLink>
          ) : null}
          <NavLink to={`/s/${slug}/cart`} className={navClass}>
            Cart{itemCount ? ` (${itemCount})` : ""}
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default StorefrontHeader;
