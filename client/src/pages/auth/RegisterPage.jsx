import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getErrorMessage } from "../../services/api.js";

function RegisterPage() {
  const { isAuthenticated, loading, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!loading && isAuthenticated) {
    return <Navigate to="/store" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await register({ name, email, password });
      navigate("/store", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Could not create account"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas">
      <div className="ui-orb -top-20 -left-12 h-56 w-56 bg-indigo-200/40" />
      <div className="ui-orb bottom-8 -right-10 h-48 w-48 bg-purple-200/30" />
      <Header />
      <main className="relative mx-auto w-full max-w-md px-4 py-12">
        <form
          onSubmit={handleSubmit}
          className="ui-card p-6 sm:p-8"
        >
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">Get started</p>
          <h1 className="ui-title mt-1">Create account</h1>
          <p className="ui-sub">
            Register as a merchant to manage your store.
          </p>

          {error && (
            <p className="ui-alert ui-alert-error">
              {error}
            </p>
          )}

          <label className="ui-label mt-6">
            Name
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
              className="ui-input"
            />
          </label>

          <label className="ui-label mt-4">
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="ui-input"
            />
          </label>

          <label className="ui-label mt-4">
            Password
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              className="ui-input"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="ui-btn ui-btn-primary mt-6 w-full py-2.5"
          >
            {submitting ? "Creating account..." : "Register"}
          </button>

          <p className="mt-4 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link to="/login" className="ui-link">
              Log in
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}

export default RegisterPage;
