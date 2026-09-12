import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useDebounce } from "../../hooks/useDebounce.js";
import { listPublicCategories, listPublicProducts } from "../../services/product.service.js";
import { formatMoney } from "../../utils/money.js";
import ProductImage from "../../components/common/ProductImage.jsx";

function StoreProductsPage() {
  const { store } = useOutletContext();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const categoryData = await listPublicCategories(store.slug);
        if (!cancelled) {
          setCategories(categoryData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Could not load products");
        }
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, [store.slug]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const productData = await listPublicProducts(store.slug, {
          page,
          limit: 12,
          search: debouncedSearch || undefined,
          categoryId: categoryId || undefined,
        });
        if (!cancelled) {
          setProducts(productData.items);
          setTotalPages(productData.totalPages);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Could not load products");
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
  }, [store.slug, page, debouncedSearch, categoryId]);

  return (
    <main className="ui-page mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="ui-title">Products</h1>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search"
          className="ui-input mt-0 w-full sm:max-w-xs"
        />
        <select
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value);
            setPage(1);
          }}
          className="ui-input mt-0 sm:w-52"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="mt-6 text-sm text-muted">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No products found.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/s/${store.slug}/products/${product.id}`}
              className="ui-card ui-card-hover p-3"
            >
              <ProductImage src={product.imageUrl} className="mb-3 h-44 w-full" />
              <p className="font-medium text-ink">{product.name}</p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {formatMoney(product.price, store.settings?.currency)}
              </p>
            </Link>
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((value) => value - 1)}
            className="ui-btn ui-btn-secondary"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((value) => value + 1)}
            className="ui-btn ui-btn-secondary"
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
}

export default StoreProductsPage;
