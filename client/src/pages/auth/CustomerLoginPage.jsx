import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Header from "../../components/layout/Header.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getErrorMessage } from "../../services/api.js";

function CustomerLoginPage() {
  const { isAuthenticated, isCustomer, isMerchant, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const returnTo = location.state?.from
    ? `${location.state.from.pathname}${location.state.from.search || ""}`
    : "/account";

  if (!loading && isAuthenticated && isCustomer) {
    return <Navigate to={returnTo} replace />;
  }

  if (!loading && isMerchant) {
    return <Navigate to="/store" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const nextUser = await login({ email, password, expectedRole: "CUSTOMER" });
      if (nextUser.role !== "CUSTOMER") {
        toast.warning("Use merchant login for store dashboards.");
        navigate("/store", { replace: true });
        return;
      }
      toast.success("Login successful");
      navigate(returnTo, { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, "Invalid email or password"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas">
      <Header />
      <main className="relative mx-auto w-full max-w-md px-4 py-12">
        <form onSubmit={handleSubmit} className="ui-card p-6 sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">Customer</p>
          <h1 className="ui-title mt-1">Customer login</h1>
          <p className="ui-sub">Sign in to checkout and track your orders.</p>
          <label className="ui-label mt-6">
            Email
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="ui-input" />
          </label>
          <label className="ui-label mt-4">
            Password
            <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required className="ui-input" />
          </label>
          <button type="submit" disabled={submitting} className="ui-btn ui-btn-primary mt-6 w-full py-2.5">
            {submitting ? "Logging in..." : "Log in"}
          </button>
          <p className="mt-4 text-center text-sm text-muted">
            Need an account?{" "}
            <Link to="/customer/register" className="ui-link">
              Register
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}

export default CustomerLoginPage;
