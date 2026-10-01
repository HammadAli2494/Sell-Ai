import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import MarketplaceLayout from "../../components/layout/MarketplaceLayout.jsx";
import { getErrorMessage } from "../../services/api.js";
import { listPublicMarketplaceCategoriesRequest } from "../../services/store.service.js";

function MarketplaceCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const data = await listPublicMarketplaceCategoriesRequest();
        if (!cancelled) {
          setCategories(data);
        }
      } catch (err) {
        if (!cancelled) {
          const message = getErrorMessage(err, "Unable to load categories");
          setError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MarketplaceLayout>
      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <h1 className="ui-title">Categories</h1>
        <p className="ui-sub">Each category belongs to a merchant store.</p>
        {error ? <p className="ui-alert ui-alert-error">{error}</p> : null}
        {loading ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="ui-skeleton h-24" />
            <div className="ui-skeleton h-24" />
            <div className="ui-skeleton h-24" />
          </div>
        ) : categories.length === 0 ? (
          <div className="ui-card mt-8 p-8 text-center">
            <p className="text-sm text-muted">No categories are available yet.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/s/${category.storeSlug}/products?category=${category.id}`}
                className="ui-card ui-card-hover p-5"
              >
                <p className="font-semibold text-ink">{category.name}</p>
                <p className="mt-1 text-sm text-muted">{category.storeName}</p>
                <p className="mt-3 text-sm text-ink">
                  {category.productCount} {category.productCount === 1 ? "product" : "products"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </MarketplaceLayout>
  );
}

export default MarketplaceCategoriesPage;
