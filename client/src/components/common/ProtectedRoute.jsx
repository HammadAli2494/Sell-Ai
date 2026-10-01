import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

function ProtectedRoute({ children, roles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <p className="text-sm text-muted">Loading...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    const loginTo = roles?.includes("CUSTOMER") ? "/customer/login" : "/login";
    return <Navigate to={loginTo} replace state={{ from: location }} />;
  }

  if (roles?.length && !roles.includes(user.role)) {
    if (user.role === "CUSTOMER") {
      return <Navigate to="/account" replace />;
    }
    return <Navigate to="/store" replace />;
  }

  return children;
}

export default ProtectedRoute;
