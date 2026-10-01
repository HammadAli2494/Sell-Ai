import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { listPublicCategories } from "../../services/product.service.js";

function StoreCategoriesPage() {
  const { store } = useOutletContext();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await listPublicCategories(store.slug);
        if (!cancelled) {
          setCategories(data);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load categories");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [store.slug]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="ui-title">Categories</h1>
      <p className="ui-sub">{store.name}</p>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {loading ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="ui-skeleton h-24" />
          <div className="ui-skeleton h-24" />
        </div>
      ) : categories.length === 0 ? (
        <div className="ui-card mt-6 p-8 text-center">
          <p className="text-sm text-muted">No categories created yet.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/s/${store.slug}/products?category=${category.id}`}
              className="ui-card ui-card-hover p-5"
            >
              <p className="font-semibold text-ink">{category.name}</p>
              <p className="mt-2 text-sm text-muted">Browse products</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

export default StoreCategoriesPage;
