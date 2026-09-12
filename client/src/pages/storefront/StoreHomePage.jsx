import { Link, useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import { listPublicProducts } from "../../services/product.service.js";
import { formatMoney } from "../../utils/money.js";
import ProductImage from "../../components/common/ProductImage.jsx";

function StoreHomePage() {
  const { store } = useOutletContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const data = await listPublicProducts(store.slug, { limit: 8 });
        if (!cancelled) {
          setProducts(data.items);
          setError("");
        }
      } catch {
        if (!cancelled) {
          setError("Could not load products");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [store.slug]);

  return (
    <main className="ui-page mx-auto w-full max-w-5xl px-4 py-10">
      <section className="ui-card relative overflow-hidden px-6 py-10 sm:px-10">
        <div className="ui-orb -top-16 -right-10 h-40 w-40 bg-indigo-200/40" />
        <div className="relative">
          <h1 className="break-words text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{store.name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            {store.description || "Welcome to our store."}
          </p>
          <Link
            to={`/s/${store.slug}/products`}
            className="store-primary mt-6 inline-flex rounded-xl px-4 py-2.5 text-sm font-medium"
          >
            Browse products
          </Link>
        </div>
      </section>
      <h2 className="mt-10 text-lg font-semibold text-ink">Featured</h2>
      {error ? (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      ) : loading ? (
        <p className="mt-3 text-sm text-muted">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No products yet.</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/s/${store.slug}/products/${product.id}`}
              className="ui-card ui-card-hover p-3"
            >
              <ProductImage src={product.imageUrl} className="mb-3 h-40 w-full" />
              <p className="font-medium text-ink">{product.name}</p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {formatMoney(product.price, store.settings?.currency)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

export default StoreHomePage;
