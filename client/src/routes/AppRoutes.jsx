import { lazy, Suspense } from "react";
import { Link, Route, Routes, useOutletContext } from "react-router-dom";
import ProtectedRoute from "../components/common/ProtectedRoute.jsx";
import LoginPage from "../pages/auth/LoginPage.jsx";
import RegisterPage from "../pages/auth/RegisterPage.jsx";
import HomePage from "../pages/HomePage.jsx";

const DashboardLayout = lazy(() => import("../components/layout/DashboardLayout.jsx"));
const AccountPage = lazy(() => import("../pages/auth/AccountPage.jsx"));
const AiCenterPage = lazy(() => import("../pages/dashboard/AiCenterPage.jsx"));
const AnalyticsPage = lazy(() => import("../pages/dashboard/AnalyticsPage.jsx"));
const BillingPage = lazy(() => import("../pages/dashboard/BillingPage.jsx"));
const CategoriesPage = lazy(() => import("../pages/dashboard/CategoriesPage.jsx"));
const CustomersPage = lazy(() => import("../pages/dashboard/CustomersPage.jsx"));
const DashboardHomePage = lazy(() => import("../pages/dashboard/DashboardHomePage.jsx"));
const OrdersPage = lazy(() => import("../pages/dashboard/OrdersPage.jsx"));
const ProductsPage = lazy(() => import("../pages/dashboard/ProductsPage.jsx"));
const StorePage = lazy(() => import("../pages/dashboard/StorePage.jsx"));
const CartPage = lazy(() => import("../pages/storefront/CartPage.jsx"));
const CheckoutPage = lazy(() => import("../pages/storefront/CheckoutPage.jsx"));
const OrderConfirmationPage = lazy(() => import("../pages/storefront/OrderConfirmationPage.jsx"));
const OrderLookupPage = lazy(() => import("../pages/storefront/OrderLookupPage.jsx"));
const PoliciesPage = lazy(() => import("../pages/storefront/PoliciesPage.jsx"));
const ProductDetailsPage = lazy(() => import("../pages/storefront/ProductDetailsPage.jsx"));
const StorefrontLayout = lazy(() => import("../pages/storefront/StorefrontLayout.jsx"));
const StoreHomePage = lazy(() => import("../pages/storefront/StoreHomePage.jsx"));
const StoreProductsPage = lazy(() => import("../pages/storefront/StoreProductsPage.jsx"));

function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 text-center">
      <h1 className="ui-title">Page not found</h1>
      <p className="ui-sub">That URL does not exist.</p>
      <Link to="/" className="ui-link mt-4 text-sm">
        Go home
      </Link>
    </main>
  );
}

function StorefrontNotFound() {
  const { store } = useOutletContext();

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-16 text-center">
      <h1 className="ui-title">Page not found</h1>
      <p className="ui-sub">This store does not have that page.</p>
      <Link to={`/s/${store.slug}`} className="ui-link mt-4 inline-block text-sm">
        Back to store
      </Link>
    </main>
  );
}

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <p className="text-sm text-muted">Loading...</p>
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/store"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="ai" element={<AiCenterPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="settings" element={<StorePage />} />
          <Route
            path="*"
            element={
              <main className="mx-auto max-w-lg py-10 text-center">
                <h1 className="ui-title">Page not found</h1>
                <Link to="/store" className="ui-link mt-4 inline-block text-sm">
                  Back to dashboard
                </Link>
              </main>
            }
          />
        </Route>
        <Route path="/s/:slug" element={<StorefrontLayout />}>
          <Route index element={<StoreHomePage />} />
          <Route path="products" element={<StoreProductsPage />} />
          <Route path="products/:productId" element={<ProductDetailsPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="orders" element={<OrderLookupPage />} />
          <Route path="orders/:orderId" element={<OrderConfirmationPage />} />
          <Route path="policies" element={<PoliciesPage />} />
          <Route path="*" element={<StorefrontNotFound />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
