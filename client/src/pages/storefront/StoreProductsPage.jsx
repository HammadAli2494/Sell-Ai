import { useEffect, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import ProductCard from "../../components/storefront/ProductCard.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { useDebounce } from "../../hooks/useDebounce.js";
import { getErrorMessage } from "../../services/api.js";
import { listPublicCategories, listPublicProducts } from "../../services/product.service.js";

function StoreProductsPage() {
  const { store } = useOutletContext();
  const { addItem } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const categoryId = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "newest";
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingId, setAddingId] = useState("");

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
          setError(getErrorMessage(err, "Could not load products"));
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
          sort: sort || undefined,
        });
        if (!cancelled) {
          setProducts(productData.items);
          setTotalPages(productData.totalPages);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Could not load products"));
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
  }, [store.slug, page, debouncedSearch, categoryId, sort]);

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
    setPage(1);
  }

  async function handleAdd(product) {
    setAddingId(product.id);
    try {
      const result = await addItem(product.id, 1);
      toast.success("Added to cart");
      if (result?.switchedStore) {
        toast.info("Checkout is one store at a time. This item was added to this store's cart.");
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not add to cart"));
    } finally {
      setAddingId("");
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="ui-title">Products</h1>
      <p className="ui-sub">Only products from {store.name}.</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search products"
          className="ui-input mt-0 w-full sm:max-w-xs"
        />
        <select
          value={categoryId}
          onChange={(event) => updateFilter("category", event.target.value)}
          className="ui-input mt-0 sm:w-52"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(event) => updateFilter("sort", event.target.value === "newest" ? "" : event.target.value)}
          className="ui-input mt-0 sm:w-44"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </div>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="ui-skeleton h-64" />
          <div className="ui-skeleton h-64" />
          <div className="ui-skeleton h-64" />
        </div>
      ) : products.length === 0 ? (
        <div className="ui-card mt-6 p-8 text-center">
          <p className="text-sm text-muted">No products found.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              storeSlug={store.slug}
              currency={store.settings?.currency}
              onAdd={handleAdd}
              adding={addingId === product.id}
            />
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div className="mt-6 flex gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="ui-btn ui-btn-secondary">
            Previous
          </button>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} className="ui-btn ui-btn-secondary">
            Next
          </button>
        </div>
      )}
    </main>
  );
}

export default StoreProductsPage;
