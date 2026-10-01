import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import MarketplaceLayout from "../../components/layout/MarketplaceLayout.jsx";
import StoreCard from "../../components/marketplace/StoreCard.jsx";
import { useDebounce } from "../../hooks/useDebounce.js";
import { getErrorMessage } from "../../services/api.js";
import { listPublicStoresRequest } from "../../services/store.service.js";

function BrowseStoresPage() {
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadStores() {
      setLoading(true);
      setError("");
      try {
        const data = await listPublicStoresRequest({
          search: debouncedSearch || undefined,
          limit: 24,
        });
        if (!cancelled) {
          setStores(data.items);
        }
      } catch (err) {
        if (!cancelled) {
          const message = getErrorMessage(err, "Unable to load stores");
          setError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadStores();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  return (
    <MarketplaceLayout>
      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <h1 className="ui-title">Browse stores</h1>
        <p className="ui-sub">These are published merchant stores loaded from PostgreSQL.</p>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by store name"
          className="ui-input mt-6 max-w-md"
        />
        {error ? <p className="ui-alert ui-alert-error">{error}</p> : null}
        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="ui-skeleton h-52" />
            <div className="ui-skeleton h-52" />
            <div className="ui-skeleton h-52" />
          </div>
        ) : stores.length === 0 ? (
          <div className="ui-card mt-8 p-8 text-center">
            <p className="text-sm text-muted">No stores are available yet.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        )}
      </main>
    </MarketplaceLayout>
  );
}

export default BrowseStoresPage;
