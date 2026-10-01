import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Header from "../../components/layout/Header.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getErrorMessage } from "../../services/api.js";

function AccountPage() {
  const { user, logout, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handlePassword(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password updated");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not update password"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas">
      <Header />
      <main className="mx-auto w-full max-w-xl space-y-4 px-4 py-12">
        <section className="ui-card p-6 sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">Profile</p>
          <h1 className="ui-title mt-1">Account</h1>
          <p className="ui-sub">You are authenticated as a merchant.</p>
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
            <button type="button" onClick={logout} className="ui-btn ui-btn-secondary">
              Log out
            </button>
          </div>
        </section>
        <form onSubmit={handlePassword} className="ui-card grid gap-4 p-6">
          <h2 className="text-sm font-semibold text-ink">Change password</h2>
          <label className="ui-label">
            Current password
            <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required className="ui-input" />
          </label>
          <label className="ui-label">
            New password
            <input type="password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required className="ui-input" />
          </label>
          <button type="submit" disabled={saving} className="ui-btn ui-btn-secondary">
            {saving ? "Updating..." : "Update password"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default AccountPage;
