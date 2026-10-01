import { Link } from "react-router-dom";

function StoreCard({ store }) {
  const categoryLabel = store.categories?.length ? store.categories.join(" · ") : "Independent store";

  return (
    <article className="ui-card flex h-full flex-col p-5">
      <div className="flex items-start gap-3">
        {store.logoUrl ? (
          <img src={store.logoUrl} alt="" referrerPolicy="no-referrer" className="h-12 w-12 rounded-xl object-cover ring-1 ring-line" />
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-sm font-semibold text-brand">
            {store.name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-ink">{store.name}</h3>
          <p className="mt-1 text-sm text-muted">{categoryLabel}</p>
        </div>
      </div>
      <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-6 text-muted">
        {store.description || "Visit this store to browse its products."}
      </p>
      <p className="mt-4 text-sm font-medium text-ink">
        {store.productCount} {store.productCount === 1 ? "Product" : "Products"}
      </p>
      <Link to={`/s/${store.slug}`} className="ui-btn ui-btn-primary mt-4">
        Visit Store
      </Link>
    </article>
  );
}

export default StoreCard;
