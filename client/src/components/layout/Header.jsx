import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext.jsx";
import { getLastCartSlug } from "../../utils/cartStorage.js";

function initials(name) {
  return (name || "M")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function navClass({ isActive }) {
  return `rounded-lg px-3 py-2 transition ${
    isActive ? "bg-indigo-50 font-medium text-brand" : "text-slate-600 hover:bg-slate-50 hover:text-ink"
  }`;
}

function Header() {
  const { isAuthenticated, isCustomer, isMerchant, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    function onClick(event) {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setMobileOpen(false);
      }
    }

    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  function cartPath() {
    const slug = getLastCartSlug();
    return slug ? `/s/${slug}/cart` : "/stores";
  }

  function handleCartClick(event) {
    if (!getLastCartSlug()) {
      event.preventDefault();
      toast.info("Visit a store to start a cart.");
    }
  }

  return (
    <header className="ui-navbar sticky top-0 z-30">
      <div className="mx-auto flex w-full min-w-0 max-w-6xl items-center justify-between gap-2 px-4 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-2 text-sm font-semibold text-ink">
          <span className="brand-mark h-8 w-8 rounded-xl text-sm">S</span>
          SellAi
        </Link>
        <nav className="hidden min-w-0 flex-wrap items-center justify-end gap-1 text-sm md:flex">
          <NavLink to="/" end className={navClass}>
            Home
          </NavLink>
          <NavLink to="/stores" className={navClass}>
            Browse Stores
          </NavLink>
          <NavLink to="/categories" className={navClass}>
            Categories
          </NavLink>
          {isCustomer ? (
            <NavLink to="/account/orders" className={navClass}>
              My Orders
            </NavLink>
          ) : null}
          <NavLink to={cartPath()} onClick={handleCartClick} className={navClass}>
            Cart
          </NavLink>
          {isMerchant ? (
            <NavLink to="/store" className={navClass}>
              Dashboard
            </NavLink>
          ) : null}
          {isAuthenticated ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 text-sm text-slate-700 transition hover:bg-slate-50"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-brand">
                  {initials(user?.name)}
                </span>
                <span className="hidden max-w-[8rem] truncate lg:inline">{user?.name || "Account"}</span>
              </button>
              {menuOpen ? (
                <div className="ui-menu absolute right-0 mt-2 w-44 rounded-xl border border-line bg-white p-1.5 shadow-lg">
                  <NavLink
                    to={isCustomer ? "/account" : "/merchant/account"}
                    className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    My Account
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Log out
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <NavLink to="/customer/login" className={navClass}>
                Customer Login
              </NavLink>
              <NavLink to="/login" className={navClass}>
                Merchant Login
              </NavLink>
              <NavLink to="/register" className="ui-btn ui-btn-primary">
                Start Selling
              </NavLink>
            </>
          )}
        </nav>
        <button
          type="button"
          className="ui-btn ui-btn-secondary md:hidden"
          onClick={() => setMobileOpen((open) => !open)}
        >
          Menu
        </button>
      </div>
      {mobileOpen ? (
        <div className="border-t border-line px-4 py-3 md:hidden">
          <nav className="grid gap-1 text-sm">
            <NavLink to="/" end className={navClass} onClick={() => setMobileOpen(false)}>
              Home
            </NavLink>
            <NavLink to="/stores" className={navClass} onClick={() => setMobileOpen(false)}>
              Browse Stores
            </NavLink>
            <NavLink to="/categories" className={navClass} onClick={() => setMobileOpen(false)}>
              Categories
            </NavLink>
            {isCustomer ? (
              <NavLink to="/account/orders" className={navClass} onClick={() => setMobileOpen(false)}>
                My Orders
              </NavLink>
            ) : null}
            <NavLink
              to={cartPath()}
              className={navClass}
              onClick={(event) => {
                handleCartClick(event);
                setMobileOpen(false);
              }}
            >
              Cart
            </NavLink>
            {isMerchant ? (
              <NavLink to="/store" className={navClass} onClick={() => setMobileOpen(false)}>
                Dashboard
              </NavLink>
            ) : null}
            {isAuthenticated ? (
              <>
                <NavLink to={isCustomer ? "/account" : "/merchant/account"} className={navClass} onClick={() => setMobileOpen(false)}>
                  My Account
                </NavLink>
                <button
                  type="button"
                  className="rounded-lg px-3 py-2 text-left text-slate-600"
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/customer/login" className={navClass} onClick={() => setMobileOpen(false)}>
                  Customer Login
                </NavLink>
                <NavLink to="/login" className={navClass} onClick={() => setMobileOpen(false)}>
                  Merchant Login
                </NavLink>
                <NavLink to="/register" className="ui-btn ui-btn-primary mt-2" onClick={() => setMobileOpen(false)}>
                  Start Selling
                </NavLink>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export default Header;
