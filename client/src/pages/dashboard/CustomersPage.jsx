import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../../context/StoreContext.jsx";
import { getErrorMessage } from "../../services/api.js";
import { listCustomersRequest } from "../../services/customer.service.js";

function CustomersPage() {
  const { hasStore, loading: storeLoading } = useStore();
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCustomers() {
      if (!hasStore) {
        return;
      }
      setLoading(true);
      setError("");
      try {
        const data = await listCustomersRequest({ page, limit: 10 });
        if (!cancelled) {
          setCustomers(data.items);
          setTotalPages(data.totalPages);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Could not load customers"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCustomers();

    return () => {
      cancelled = true;
    };
  }, [hasStore, page]);

  return (
    <div className="ui-page max-w-4xl">
        <h1 className="ui-title">Customers</h1>
        {error && (
          <p className="ui-alert ui-alert-error">{error}</p>
        )}
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
        ) : loading ? (
          <p className="mt-4 text-sm text-muted">Loading customers...</p>
        ) : customers.length === 0 ? (
          <div className="ui-card mt-6">
            <p className="ui-empty">No customers yet.</p>
          </div>
        ) : (
          <div className="ui-card mt-6 overflow-x-auto">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Orders</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="max-w-[10rem] truncate font-medium sm:max-w-none">{customer.name}</td>
                    <td className="max-w-[12rem] break-all text-muted">{customer.email}</td>
                    <td>{customer.orderCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
    </div>
  );
}

export default CustomersPage;
