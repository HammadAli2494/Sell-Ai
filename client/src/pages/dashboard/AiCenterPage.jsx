import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../../context/StoreContext.jsx";
import { getErrorMessage } from "../../services/api.js";
import { generateAiRequest, getAiUsageRequest } from "../../services/ai.service.js";
import { listMerchantProducts, updateProductRequest } from "../../services/product.service.js";

const features = [
  { id: "description", label: "Description", blurb: "Long-form product copy" },
  { id: "title", label: "Title", blurb: "A clear product name" },
  { id: "seo", label: "SEO", blurb: "Title, meta, slug, and alt" },
  { id: "marketing", label: "Marketing", blurb: "Social, ads, and email" },
];

const emptyForm = {
  productId: "",
  productName: "",
  category: "",
  features: "",
  audience: "",
  tone: "professional",
};

function ResultFields({ feature, result }) {
  if (!result) {
    return null;
  }

  if (feature === "description") {
    return <p className="whitespace-pre-wrap text-sm leading-6 text-ink">{result.description}</p>;
  }

  if (feature === "title") {
    return <p className="text-sm font-medium text-ink">{result.title}</p>;
  }

  if (feature === "seo") {
    return (
      <dl className="space-y-4 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">SEO title</dt>
          <dd className="mt-1 text-ink">{result.title}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Meta description</dt>
          <dd className="mt-1 text-ink">{result.metaDescription}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Slug</dt>
          <dd className="mt-1 text-ink">{result.slug}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Image alt text</dt>
          <dd className="mt-1 text-ink">{result.altText}</dd>
        </div>
      </dl>
    );
  }

  return (
    <dl className="space-y-4 text-sm">
      <div>
        <dt className="text-xs font-medium uppercase tracking-wide text-muted">Social</dt>
        <dd className="mt-1 whitespace-pre-wrap leading-6 text-ink">{result.social}</dd>
      </div>
      <div>
        <dt className="text-xs font-medium uppercase tracking-wide text-muted">Ad copy</dt>
        <dd className="mt-1 whitespace-pre-wrap leading-6 text-ink">{result.adCopy}</dd>
      </div>
      <div>
        <dt className="text-xs font-medium uppercase tracking-wide text-muted">Email</dt>
        <dd className="mt-1 whitespace-pre-wrap leading-6 text-ink">{result.email}</dd>
      </div>
    </dl>
  );
}

function resultText(feature, result) {
  if (!result) {
    return "";
  }
  if (feature === "description") {
    return result.description || "";
  }
  if (feature === "title") {
    return result.title || "";
  }
  if (feature === "seo") {
    return [result.title, result.metaDescription, result.slug, result.altText].filter(Boolean).join("\n");
  }
  return [result.social, result.adCopy, result.email].filter(Boolean).join("\n\n");
}

function AiCenterPage() {
  const { hasStore, loading: storeLoading } = useStore();
  const [feature, setFeature] = useState("description");
  const [form, setForm] = useState(emptyForm);
  const [products, setProducts] = useState([]);
  const [usage, setUsage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadPage() {
    const [usageData, productData] = await Promise.all([
      getAiUsageRequest(),
      listMerchantProducts({ limit: 50 }),
    ]);
    setUsage(usageData);
    setProducts(productData.items);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!hasStore) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const [usageData, productData] = await Promise.all([
          getAiUsageRequest(),
          listMerchantProducts({ limit: 50 }),
        ]);
        if (!cancelled) {
          setUsage(usageData);
          setProducts(productData.items);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Could not load AI Center"));
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
  }, [hasStore]);

  function selectProduct(productId) {
    const product = products.find((item) => item.id === productId);
    setForm({
      ...form,
      productId,
      productName: product?.name || form.productName,
      category: product?.category?.name || form.category,
      features: product?.description || form.features,
    });
  }

  async function handleGenerate(event) {
    event.preventDefault();
    setGenerating(true);
    setError("");
    setSuccess("");
    setResult(null);

    try {
      const data = await generateAiRequest({
        feature,
        productId: form.productId || undefined,
        productName: form.productName || undefined,
        category: form.category || undefined,
        features: form.features || undefined,
        audience: form.audience || undefined,
        tone: form.tone,
      });
      setResult(data.result);
      setUsage(data.usage);
    } catch (err) {
      setError(getErrorMessage(err, "Could not generate copy"));
    } finally {
      setGenerating(false);
    }
  }

  async function handleApply() {
    if (!form.productId || !result) {
      return;
    }

    setApplying(true);
    setError("");
    setSuccess("");

    try {
      if (feature === "description") {
        await updateProductRequest(form.productId, { description: result.description });
      } else if (feature === "title") {
        await updateProductRequest(form.productId, { name: result.title });
      }
      setSuccess("Saved to the selected product");
      await loadPage();
    } catch (err) {
      setError(getErrorMessage(err, "Could not update product"));
    } finally {
      setApplying(false);
    }
  }

  async function handleCopy() {
    const text = resultText(feature, result);
    if (!text) {
      return;
    }
    await navigator.clipboard.writeText(text);
    setSuccess("Copied");
  }

  if (storeLoading) {
    return (
      <div className="ui-page max-w-6xl">
        <div className="ui-skeleton h-20" />
        <div className="mt-6 ui-skeleton h-28" />
      </div>
    );
  }

  if (!hasStore) {
    return (
      <section className="ui-card mx-auto max-w-xl p-6">
        <h1 className="ui-title">AI Center</h1>
        <p className="mt-3 text-sm text-slate-600">
          Create a store first in{" "}
          <Link to="/store/settings" className="ui-link">
            Settings
          </Link>
          .
        </p>
      </section>
    );
  }

  const canApply = form.productId && result && (feature === "description" || feature === "title");
  const atLimit = usage && usage.remaining <= 0;

  return (
    <div className="ui-page relative max-w-6xl">
      <div className="ui-orb -top-10 right-0 h-44 w-44 bg-indigo-200/40" />
      <div className="ui-orb top-32 -left-8 h-36 w-36 bg-purple-200/30" />
      <div className="relative">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">Generation</p>
        <h1 className="ui-title mt-1">AI Center</h1>
        <p className="ui-sub">
          React calls Express; Express calls OpenAI. Limits come from your store subscription in
          the database.{" "}
          <Link to="/store/billing" className="ui-link">
            View billing
          </Link>
        </p>
      </div>

      {error ? <p className="ui-alert ui-alert-error">{error}</p> : null}
      {success ? <p className="ui-alert ui-alert-success">{success}</p> : null}

      {loading ? (
        <p className="mt-6 text-sm text-muted">Loading AI Center...</p>
      ) : (
        <>
          <section className="ui-card relative mt-6 overflow-hidden p-5">
            <div className="ui-orb -top-16 right-8 h-32 w-32 bg-purple-200/40" />
            <div className="relative flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">
                  {usage ? `${usage.used} / ${usage.limit} requests this month` : "Usage"}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {usage?.planName} plan · status {usage?.status}
                </p>
              </div>
            </div>
            <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-soft">
              <div
                className="h-full rounded-full bg-linear-to-r from-brand to-purple"
                style={{
                  width: `${usage && usage.limit ? Math.min(100, (usage.used / usage.limit) * 100) : 0}%`,
                }}
              />
            </div>
            {!usage?.configured ? (
              <p className="mt-3 text-sm text-muted">
                OpenAI is not configured on the server yet. Add OPENAI_API_KEY to enable generation.
              </p>
            ) : null}
          </section>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {features.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setFeature(item.id);
                  setResult(null);
                  setSuccess("");
                }}
                className={`ui-card ui-card-hover p-4 text-left ${
                  feature === item.id
                    ? "ring-2 ring-brand"
                    : "hover:border-slate-300"
                }`}
              >
                <p className="text-sm font-semibold text-ink">{item.label}</p>
                <p className="mt-1 text-xs text-muted">{item.blurb}</p>
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <form onSubmit={handleGenerate} className="ui-card grid gap-4 p-5">
              <h2 className="text-sm font-semibold text-ink">Product information</h2>
              <label className="ui-label">
                Existing product
                <select
                  value={form.productId}
                  onChange={(event) => selectProduct(event.target.value)}
                  className="ui-input"
                >
                  <option value="">None</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ui-label">
                Product name
                <input
                  value={form.productName}
                  onChange={(event) => setForm({ ...form, productName: event.target.value })}
                  required={!form.productId}
                  minLength={2}
                  className="ui-input"
                />
              </label>
              <label className="ui-label">
                Category
                <input
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                  className="ui-input"
                />
              </label>
              <label className="ui-label">
                Features
                <textarea
                  value={form.features}
                  onChange={(event) => setForm({ ...form, features: event.target.value })}
                  rows={3}
                  className="ui-input"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="ui-label">
                  Audience
                  <input
                    value={form.audience}
                    onChange={(event) => setForm({ ...form, audience: event.target.value })}
                    className="ui-input"
                  />
                </label>
                <label className="ui-label">
                  Tone
                  <select
                    value={form.tone}
                    onChange={(event) => setForm({ ...form, tone: event.target.value })}
                    className="ui-input"
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="luxury">Luxury</option>
                    <option value="casual">Casual</option>
                    <option value="bold">Bold</option>
                  </select>
                </label>
              </div>
              <button
                type="submit"
                disabled={generating || atLimit || !usage?.configured}
                className="ui-btn ui-btn-ai min-h-11"
              >
                {generating ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="ui-dot-pulse" />
                    Generating listing
                  </span>
                ) : atLimit ? (
                  "Limit reached"
                ) : (
                  "Generate Listing"
                )}
              </button>
            </form>

            <section className="ui-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-ink">Result</h2>
                {result ? (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={handleCopy} className="ui-btn ui-btn-secondary">
                      Copy
                    </button>
                    {canApply ? (
                      <button
                        type="button"
                        onClick={handleApply}
                        disabled={applying}
                        className="ui-btn ui-btn-primary"
                      >
                        {applying ? "Saving..." : "Apply to product"}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="mt-4 min-h-44">
                {generating ? (
                  <div className="space-y-3">
                    <div className="ui-skeleton h-4 w-3/4" />
                    <div className="ui-skeleton h-4 w-full" />
                    <div className="ui-skeleton h-4 w-5/6" />
                    <div className="ui-skeleton h-4 w-2/3" />
                  </div>
                ) : result ? (
                  <ResultFields feature={feature} result={result} />
                ) : (
                  <p className="text-sm text-muted">
                    Generated copy will appear here. Choose a type, add product details, then generate.
                  </p>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export default AiCenterPage;
