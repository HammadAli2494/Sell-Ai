import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Header from "../../components/layout/Header.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getErrorMessage } from "../../services/api.js";

function CustomerRegisterPage() {
  const { isAuthenticated, isCustomer, isMerchant, loading, registerCustomer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAuthenticated && isCustomer) {
    return <Navigate to={location.state?.from?.pathname || "/account"} replace />;
  }
  if (!loading && isMerchant) {
    return <Navigate to="/store" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await registerCustomer({ name, email, password });
      toast.success("Account created successfully");
      navigate(location.state?.from?.pathname || "/account", { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to create account"));
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
          <h1 className="ui-title mt-1">Create customer account</h1>
          <p className="ui-sub">Register to place orders across SellAi stores.</p>
          <label className="ui-label mt-6">
            Full name
            <input type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} className="ui-input" />
          </label>
          <label className="ui-label mt-4">
            Email
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="ui-input" />
          </label>
          <label className="ui-label mt-4">
            Password
            <input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} className="ui-input" />
          </label>
          <button type="submit" disabled={submitting} className="ui-btn ui-btn-primary mt-6 w-full py-2.5">
            {submitting ? "Creating account..." : "Register"}
          </button>
          <p className="mt-4 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link to="/customer/login" className="ui-link">
              Log in
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}

export default CustomerRegisterPage;
