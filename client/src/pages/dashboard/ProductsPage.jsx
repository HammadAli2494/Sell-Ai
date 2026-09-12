import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../../context/StoreContext.jsx";
import { useDebounce } from "../../hooks/useDebounce.js";
import { getErrorMessage } from "../../services/api.js";
import {
  createProductRequest,
  deleteProductRequest,
  listCategoriesRequest,
  listMerchantProducts,
  updateProductRequest,
} from "../../services/product.service.js";
import { formatMoney } from "../../utils/money.js";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import ProductImage from "../../components/common/ProductImage.jsx";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  stock: "0",
  imageUrl: "",
  categoryId: "",
  isActive: true,
};

function ProductsPage() {
  const { store, hasStore, loading: storeLoading } = useStore();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  async function loadProducts() {
    setLoading(true);
    setError("");
    try {
      const productData = await listMerchantProducts({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
      });
      setProducts(productData.items);
      setTotalPages(productData.totalPages);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load products"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!hasStore) {
      return undefined;
    }

    let cancelled = false;

    async function loadCategories() {
      try {
        const categoryData = await listCategoriesRequest();
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
  }, [hasStore]);

  useEffect(() => {
    if (hasStore) {
      loadProducts();
    }
  }, [hasStore, page, debouncedSearch]);

  function startEdit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      stock: String(product.stock),
      imageUrl: product.imageUrl || "",
      categoryId: product.categoryId || "",
      isActive: product.isActive,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      stock: Number(form.stock),
      imageUrl: form.imageUrl || undefined,
      categoryId: form.categoryId || undefined,
      isActive: form.isActive,
    };

    try {
      if (editingId) {
        await updateProductRequest(editingId, payload);
      } else {
        await createProductRequest(payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadProducts();
    } catch (err) {
      setError(getErrorMessage(err, "Could not save product"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(productId) {
    setError("");
    try {
      await deleteProductRequest(productId);
      await loadProducts();
    } catch (err) {
      setError(getErrorMessage(err, "Could not delete product"));
    }
  }

  return (
    <div className="ui-page">
        {storeLoading ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : !hasStore ? (
          <p className="text-sm text-gray-600">
            Create a store first in{" "}
            <Link to="/store/settings" className="ui-link">
              Settings
            </Link>
            .
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="ui-title">Products</h1>
                <p className="ui-sub">{store.name}</p>
              </div>
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search products"
                className="ui-input mt-0 w-full sm:w-64"
              />
            </div>

            {error && (
              <p className="ui-alert ui-alert-error">{error}</p>
            )}

            <form
              onSubmit={handleSubmit}
              className="ui-card mt-6 grid gap-4 p-5 sm:grid-cols-2"
            >
              <label className="ui-label">
                Name
                <input
                  required
                  minLength={2}
                  placeholder="Name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="ui-input"
                />
              </label>
              <label className="ui-label">
                Price
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Price"
                  value={form.price}
                  onChange={(event) => setForm({ ...form, price: event.target.value })}
                  className="ui-input"
                />
              </label>
              <label className="ui-label">
                Stock
                <input
                  required
                  type="number"
                  min="0"
                  placeholder="Stock"
                  value={form.stock}
                  onChange={(event) => setForm({ ...form, stock: event.target.value })}
                  className="ui-input"
                />
              </label>
              <label className="ui-label">
                Category
                <select
                  value={form.categoryId}
                  onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
                  className="ui-input"
                >
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ui-label sm:col-span-2">
                Image URL
                <input
                  placeholder="Image URL"
                  value={form.imageUrl}
                  onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
                  className="ui-input"
                />
              </label>
              <label className="ui-label sm:col-span-2">
                Description
                <textarea
                  placeholder="Description"
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  className="ui-input"
                  rows={3}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                />
                Active
              </label>
              <button
                type="submit"
                disabled={saving}
                className="ui-btn ui-btn-primary justify-self-start"
              >
                {saving ? "Saving..." : editingId ? "Update product" : "Add product"}
              </button>
            </form>

            <div className="ui-card mt-6 overflow-x-auto">
              {loading ? (
                <p className="p-5 text-sm text-muted">Loading products...</p>
              ) : products.length === 0 ? (
                <p className="ui-empty">No products found.</p>
              ) : (
                <table className="ui-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <ProductImage src={product.imageUrl} className="h-10 w-10 shrink-0" />
                            <span className="font-medium">{product.name}</span>
                          </div>
                        </td>
                        <td>
                          {formatMoney(product.price, store.settings?.currency)}
                        </td>
                        <td>{product.stock}</td>
                        <td>
                          <StatusBadge status={product.isActive ? "Active" : "Hidden"} />
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => startEdit(product)}
                            className="ui-btn ui-btn-ghost mr-1"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product.id)}
                            className="ui-btn ui-btn-danger"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex gap-2">
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
          </>
        )}
    </div>
  );
}

export default ProductsPage;
