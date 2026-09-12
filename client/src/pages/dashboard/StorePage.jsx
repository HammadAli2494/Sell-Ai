import { useEffect, useState } from "react";
import { useStore } from "../../context/StoreContext.jsx";
import { getErrorMessage } from "../../services/api.js";

function StorePage() {
  const { store, loading, hasStore, createStore, updateStore } = useStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [logoUrl, setLogoUrl] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [returnPolicy, setReturnPolicy] = useState("");
  const [shippingPolicy, setShippingPolicy] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!store) {
      setName("");
      setDescription("");
      setCurrency("USD");
      setPrimaryColor("#2563eb");
      setLogoUrl("");
      setSupportEmail("");
      setReturnPolicy("");
      setShippingPolicy("");
      return;
    }

    setName(store.name || "");
    setDescription(store.description || "");
    setCurrency(store.settings?.currency || "USD");
    setPrimaryColor(store.settings?.primaryColor || "#2563eb");
    setLogoUrl(store.settings?.logoUrl || "");
    setSupportEmail(store.settings?.supportEmail || "");
    setReturnPolicy(store.settings?.returnPolicy || "");
    setShippingPolicy(store.settings?.shippingPolicy || "");
  }, [store]);

  async function handleCreate(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      await createStore({ name, description });
      setSuccess("Store created");
    } catch (err) {
      setError(getErrorMessage(err, "Could not create store"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      await updateStore({
        name,
        description,
        settings: {
          currency: currency.toUpperCase(),
          primaryColor,
          logoUrl,
          supportEmail: supportEmail.trim(),
          returnPolicy,
          shippingPolicy,
        },
      });
      setSuccess("Store updated");
    } catch (err) {
      setError(getErrorMessage(err, "Could not update store"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ui-page max-w-xl">
      <section className="ui-card p-6 sm:p-8">
        {loading ? (
          <p className="text-sm text-muted">Loading store...</p>
        ) : (
          <>
            <h1 className="ui-title">
              {hasStore ? "Store settings" : "Create your store"}
            </h1>
            <p className="ui-sub">
              {hasStore
                ? "This store is tied to your account. Other merchants cannot access it."
                : "Your products, orders, and customers will belong to this store."}
            </p>
            {hasStore && (
              <a
                href={`/s/${store.slug}`}
                className="ui-link mt-3 inline-block text-sm"
              >
                View storefront
              </a>
            )}

            {error && (
              <p className="ui-alert ui-alert-error">
                {error}
              </p>
            )}
            {success && (
              <p className="ui-alert ui-alert-success">
                {success}
              </p>
            )}

            <form
              onSubmit={hasStore ? handleUpdate : handleCreate}
              className="mt-6 space-y-4"
            >
              <label className="ui-label">
                Store name
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  minLength={2}
                  className="ui-input"
                />
              </label>

              <label className="ui-label">
                Description
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  className="ui-input"
                />
              </label>

              {hasStore && (
                <>
                  <p className="text-sm text-muted">
                    Slug: <span className="font-medium text-ink">{store.slug}</span>
                  </p>

                  <label className="ui-label">
                    Currency
                    <input
                      type="text"
                      value={currency}
                      onChange={(event) => setCurrency(event.target.value)}
                      maxLength={3}
                      className="ui-input uppercase"
                    />
                  </label>

                  <label className="ui-label">
                    Brand color
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(event) => setPrimaryColor(event.target.value)}
                      className="ui-input h-10 px-2"
                    />
                  </label>

                  <label className="ui-label">
                    Logo URL
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(event) => setLogoUrl(event.target.value)}
                      placeholder="https://..."
                      className="ui-input"
                    />
                  </label>

                  <label className="ui-label">
                    Support email
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(event) => setSupportEmail(event.target.value)}
                      className="ui-input"
                    />
                  </label>

                  <label className="ui-label">
                    Return policy
                    <textarea
                      value={returnPolicy}
                      onChange={(event) => setReturnPolicy(event.target.value)}
                      rows={3}
                      className="ui-input"
                    />
                  </label>

                  <label className="ui-label">
                    Shipping policy
                    <textarea
                      value={shippingPolicy}
                      onChange={(event) => setShippingPolicy(event.target.value)}
                      rows={3}
                      className="ui-input"
                    />
                  </label>
                </>
              )}

              <button
                type="submit"
                disabled={submitting || loading}
                className="ui-btn ui-btn-primary w-full py-2.5"
              >
                {submitting
                  ? hasStore
                    ? "Saving..."
                    : "Creating..."
                  : hasStore
                    ? "Save settings"
                    : "Create store"}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

export default StorePage;
