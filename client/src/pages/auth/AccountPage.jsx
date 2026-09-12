import { Link } from "react-router-dom";
import Header from "../../components/layout/Header.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

function AccountPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-canvas">
      <Header />
      <main className="mx-auto w-full max-w-xl px-4 py-12">
        <section className="ui-card p-6 sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">Profile</p>
          <h1 className="ui-title mt-1">Account</h1>
          <p className="ui-sub">
            You are authenticated. Open the dashboard to manage your store.
          </p>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="rounded-xl bg-soft px-3 py-2.5">
              <dt className="text-muted">Name</dt>
              <dd className="mt-0.5 font-medium text-ink">{user?.name}</dd>
            </div>
            <div className="rounded-xl bg-soft px-3 py-2.5">
              <dt className="text-muted">Email</dt>
              <dd className="mt-0.5 font-medium text-ink">{user?.email}</dd>
            </div>
            <div className="rounded-xl bg-soft px-3 py-2.5">
              <dt className="text-muted">Role</dt>
              <dd className="mt-0.5 font-medium text-ink">{user?.role}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/store" className="ui-btn ui-btn-primary">
              Open dashboard
            </Link>
            <button
              type="button"
              onClick={logout}
              className="ui-btn ui-btn-secondary"
            >
              Log out
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AccountPage;
