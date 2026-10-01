import { useEffect, useState } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import StorefrontHeader from "../../components/layout/StorefrontHeader.jsx";
import StoreChat from "../../components/ai/StoreChat.jsx";
import { CartProvider } from "../../context/CartContext.jsx";
import { getPublicStoreRequest } from "../../services/store.service.js";
import { getErrorMessage } from "../../services/api.js";

function StorefrontLayout() {
  const { slug } = useParams();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadStore() {
      setLoading(true);
      setError("");
      try {
        const currentStore = await getPublicStoreRequest(slug);
        if (!cancelled) {
          setStore(currentStore);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Store not found"));
          setStore(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadStore();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="text-sm text-muted">Loading store...</p>
      </main>
    );
  }

  if (error || !store) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 text-center">
        <p className="text-sm text-red-600">{error || "Store not found"}</p>
        <Link to="/stores" className="ui-link mt-4 text-sm">
          Browse stores
        </Link>
      </main>
    );
  }

  return (
    <CartProvider slug={slug}>
      <div
        className="flex min-h-screen flex-col overflow-x-hidden bg-canvas"
        style={{ ["--store-color"]: store.settings?.primaryColor || "#4f46e5" }}
      >
        <StorefrontHeader store={store} />
        <div className="min-w-0 flex-1">
          <Outlet context={{ store }} />
        </div>
        <footer className="mt-auto border-t border-line bg-white px-4 py-8 text-sm text-muted">
          <div className="mx-auto grid w-full max-w-6xl gap-6 sm:grid-cols-3">
            <div>
              <p className="font-medium text-ink">{store.name}</p>
              <p className="mt-2 text-sm leading-6">{store.description || "Independent store on SellAi."}</p>
            </div>
            <div className="grid gap-2">
              <Link to={`/s/${store.slug}/policies`} className="ui-link">
                Policies
              </Link>
              <Link to={`/s/${store.slug}/products`} className="ui-link">
                Products
              </Link>
              {store.settings?.supportEmail ? (
                <a className="ui-link" href={`mailto:${store.settings.supportEmail}`}>
                  Contact
                </a>
              ) : null}
            </div>
            <p className="sm:text-right">Powered by SellAi</p>
          </div>
        </footer>
        <StoreChat store={store} />
      </div>
    </CartProvider>
  );
}

export default StorefrontLayout;
