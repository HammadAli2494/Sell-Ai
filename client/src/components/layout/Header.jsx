import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

function initials(name) {
  return (name || "M")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
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
      }
    }

    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className="ui-navbar sticky top-0 z-30">
      <div className="mx-auto flex w-full min-w-0 max-w-5xl items-center justify-between gap-2 px-4 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-2 text-sm font-semibold text-ink">
          <span className="brand-mark h-8 w-8 rounded-xl text-sm">S</span>
          SellAi
        </Link>
        <nav className="flex min-w-0 flex-wrap items-center justify-end gap-1 text-sm sm:gap-2">
          {isAuthenticated ? (
            <>
              <NavLink
                to="/store"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 transition ${
                    isActive ? "bg-indigo-50 font-medium text-brand" : "text-slate-600 hover:bg-slate-50 hover:text-ink"
                  }`
                }
              >
                Dashboard
              </NavLink>
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
                  <span className="hidden max-w-[8rem] truncate sm:inline">{user?.name || "Account"}</span>
                </button>
                {menuOpen ? (
                  <div className="ui-menu absolute right-0 mt-2 w-44 rounded-xl border border-line bg-white p-1.5 shadow-lg">
                    <NavLink
                      to="/account"
                      className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      Account
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
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 transition ${
                    isActive ? "font-medium text-brand" : "text-slate-600 hover:bg-slate-50 hover:text-ink"
                  }`
                }
              >
                Log in
              </NavLink>
              <NavLink to="/register" className="ui-btn ui-btn-primary">
                Register
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
