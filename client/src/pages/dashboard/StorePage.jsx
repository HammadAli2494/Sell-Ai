import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useStore } from "../../context/StoreContext.jsx";
import { getErrorMessage } from "../../services/api.js";
import { copyStoreLink, getStoreUrl } from "../../utils/storeUrl.js";

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
  const [privacyPolicy, setPrivacyPolicy] = useState("");
  const [termsPolicy, setTermsPolicy] = useState("");
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
      setPrivacyPolicy("");
      setTermsPolicy("");
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
    setPrivacyPolicy(store.settings?.privacyPolicy || "");
    setTermsPolicy(store.settings?.termsPolicy || "");
  }, [store]);

  async function handleCreate(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      await createStore({ name, description });
      setSuccess("Store created");
      toast.success("Store created successfully");
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
          privacyPolicy,
          termsPolicy,
        },
      });
      setSuccess("Store updated");
      toast.success("Store updated");
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
            {hasStore ? (
              <p className="mt-3 text-sm text-muted">
                Status: <span className="font-medium text-ink">{store.isActive ? "Published" : "Draft"}</span>
              </p>
            ) : null}

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
                  <div className="rounded-xl bg-soft p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">Store visibility</p>
                    <p className="mt-1 text-sm text-ink">{store.isActive ? "Published — visible on Browse Stores" : "Draft — not visible to customers yet"}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={submitting}
                        className="ui-btn ui-btn-primary"
                        onClick={async () => {
                          try {
                            setSubmitting(true);
                            await updateStore({ isActive: !store.isActive });
                            toast.success(store.isActive ? "Store unpublished" : "Store published successfully");
                          } catch (err) {
                            toast.error(getErrorMessage(err, "Could not update store"));
                          } finally {
                            setSubmitting(false);
                          }
                        }}
                      >
                        {store.isActive ? "Unpublish Store" : "Publish Store"}
                      </button>
                    </div>
                    <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">Public store URL</p>
                    <p className="mt-1 break-all text-sm font-medium text-ink">{getStoreUrl(store.slug)}</p>
                    {store.isActive ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a href={getStoreUrl(store.slug)} className="ui-btn ui-btn-primary">
                          View store
                        </a>
                        <button
                          type="button"
                          className="ui-btn ui-btn-secondary"
                          onClick={async () => {
                            try {
                              await copyStoreLink(store.slug);
                              toast.success("Store link copied");
                            } catch {
                              toast.error("Could not copy link");
                            }
                          }}
                        >
                          Copy link
                        </button>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-muted">Publish the store to share it on Browse Stores.</p>
                    )}
                  </div>

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
                  <label className="ui-label">
                    Privacy policy
                    <textarea
                      value={privacyPolicy}
                      onChange={(event) => setPrivacyPolicy(event.target.value)}
                      rows={3}
                      className="ui-input"
                    />
                  </label>
                  <label className="ui-label">
                    Terms
                    <textarea
                      value={termsPolicy}
                      onChange={(event) => setTermsPolicy(event.target.value)}
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
