import { Link, NavLink, Outlet } from "react-router-dom";
import Header from "./Header.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

function CustomerAccountLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-canvas">
      <Header />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 md:flex-row">
        <aside className="ui-card h-fit w-full p-4 md:w-56">
          <p className="text-sm font-semibold text-ink">{user?.name}</p>
          <p className="truncate text-xs text-muted">{user?.email}</p>
          <nav className="mt-4 grid gap-1 text-sm">
            <NavLink
              to="/account"
              end
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 ${isActive ? "bg-indigo-50 font-medium text-brand" : "text-slate-600 hover:bg-slate-50"}`
              }
            >
              Profile
            </NavLink>
            <NavLink
              to="/account/orders"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 ${isActive ? "bg-indigo-50 font-medium text-brand" : "text-slate-600 hover:bg-slate-50"}`
              }
            >
              My orders
            </NavLink>
            <Link to="/stores" className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50">
              Browse stores
            </Link>
            <button type="button" onClick={logout} className="rounded-lg px-3 py-2 text-left text-slate-600 hover:bg-slate-50">
              Log out
            </button>
          </nav>
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default CustomerAccountLayout;
