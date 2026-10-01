import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../../context/StoreContext.jsx";
import { toast } from "react-toastify";
import { getErrorMessage } from "../../services/api.js";
import {
  createCategoryRequest,
  deleteCategoryRequest,
  listCategoriesRequest,
  updateCategoryRequest,
} from "../../services/product.service.js";

function CategoriesPage() {
  const { hasStore, loading: storeLoading } = useStore();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  async function loadCategories() {
    setLoading(true);
    setError("");
    try {
      setCategories(await listCategoriesRequest());
    } catch (err) {
      setError(getErrorMessage(err, "Could not load categories"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (hasStore) {
      loadCategories();
    }
  }, [hasStore]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await updateCategoryRequest(editingId, { name });
        setEditingId(null);
        toast.success("Category updated");
      } else {
        await createCategoryRequest({ name });
        toast.success("Category created");
      }
      setName("");
      await loadCategories();
    } catch (err) {
      setError(getErrorMessage(err, editingId ? "Could not update category" : "Could not create category"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(categoryId) {
    try {
      await deleteCategoryRequest(categoryId);
      if (editingId === categoryId) {
        setEditingId(null);
        setName("");
      }
      await loadCategories();
    } catch (err) {
      setError(getErrorMessage(err, "Could not delete category"));
    }
  }

  return (
    <div className="ui-page max-w-3xl">
        <h1 className="ui-title">Categories</h1>
        {storeLoading ? (
          <p className="mt-4 text-sm text-muted">Loading...</p>
        ) : !hasStore ? (
          <p className="mt-4 text-sm text-gray-600">
            Create a store first in{" "}
            <Link to="/store/settings" className="ui-link">
              Settings
            </Link>
            .
          </p>
        ) : (
          <>
            {error && (
              <p className="ui-alert ui-alert-error">{error}</p>
            )}
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                required
                minLength={2}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Category name"
                className="ui-input mt-0 flex-1"
              />
              <button
                type="submit"
                disabled={saving}
                className="ui-btn ui-btn-primary"
              >
                {saving ? (editingId ? "Saving..." : "Adding...") : editingId ? "Save category" : "Add category"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setName("");
                  }}
                  className="ui-btn ui-btn-secondary"
                >
                  Cancel
                </button>
              ) : null}
            </form>
            <ul className="ui-card mt-6 divide-y divide-gray-100">
              {loading ? (
                <li className="p-5 text-sm text-muted">Loading categories...</li>
              ) : categories.length === 0 ? (
                <li className="ui-empty">No categories yet.</li>
              ) : (
                categories.map((category) => (
                  <li key={category.id} className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm">
                    <span className="min-w-0 truncate font-medium text-ink">{category.name}</span>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(category.id);
                          setName(category.name);
                        }}
                        className="ui-btn ui-btn-ghost"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(category.id)}
                        className="ui-btn ui-btn-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </>
        )}
    </div>
  );
}

export default CategoriesPage;
