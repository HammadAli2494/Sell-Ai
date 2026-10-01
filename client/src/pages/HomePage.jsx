import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import MarketplaceLayout from "../components/layout/MarketplaceLayout.jsx";
import StoreCard from "../components/marketplace/StoreCard.jsx";
import ProductCard from "../components/storefront/ProductCard.jsx";
import { getErrorMessage } from "../services/api.js";
import {
  listPublicMarketplaceCategoriesRequest,
  listPublicMarketplaceProductsRequest,
  listPublicStoresRequest,
} from "../services/store.service.js";

function HomePage() {
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadMarketplace() {
      setLoading(true);
      setError("");
      try {
        const [storeData, productData, categoryData] = await Promise.all([
          listPublicStoresRequest({ limit: 6 }),
          listPublicMarketplaceProductsRequest({ limit: 8 }),
          listPublicMarketplaceCategoriesRequest(),
        ]);
        if (!cancelled) {
          setStores(storeData.items);
          setProducts(productData.items);
          setCategories(categoryData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Unable to load stores"));
          toast.error(getErrorMessage(err, "Unable to load stores"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMarketplace();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MarketplaceLayout>
      <main>
        <section className="border-b border-line bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-brand">Independent commerce</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              Discover independent stores.
              <span className="block text-slate-500">Shop products from sellers on SellAi.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
              Browse live merchant stores, add products to a store cart, and place a real order. Every listing comes from PostgreSQL — not a demo catalog.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/stores" className="ui-btn ui-btn-primary px-5 py-2.5">
                Browse Stores
              </Link>
              <Link to="/register" className="ui-btn ui-btn-secondary px-5 py-2.5">
                Start Selling
              </Link>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          {error ? <p className="ui-alert ui-alert-error">{error}</p> : null}

          <section>
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-ink">Featured stores</h2>
                <p className="mt-1 text-sm text-muted">Published merchant stores from the live database.</p>
              </div>
              <Link to="/stores" className="ui-link text-sm">
                View all
              </Link>
            </div>
            {loading ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="ui-skeleton h-52" />
                <div className="ui-skeleton h-52" />
                <div className="ui-skeleton h-52" />
              </div>
            ) : stores.length === 0 ? (
              <div className="ui-card mt-6 p-8 text-center">
                <p className="text-sm text-muted">No stores are available yet.</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stores.map((store) => (
                  <StoreCard key={store.id} store={store} />
                ))}
              </div>
            )}
          </section>

          <section className="mt-14">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-ink">New products</h2>
                <p className="mt-1 text-sm text-muted">Recent active listings from published stores.</p>
              </div>
              <Link to="/stores" className="ui-link text-sm">
                Shop stores
              </Link>
            </div>
            {loading ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="ui-skeleton h-64" />
                <div className="ui-skeleton h-64" />
                <div className="ui-skeleton h-64" />
                <div className="ui-skeleton h-64" />
              </div>
            ) : products.length === 0 ? (
              <div className="ui-card mt-6 p-8 text-center">
                <p className="text-sm text-muted">No products have been published yet.</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    storeSlug={product.store.slug}
                    storeName={product.store.name}
                    currency={product.store.settings?.currency}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="mt-14">
            <h2 className="text-xl font-semibold text-ink">Shop by category</h2>
            <p className="mt-1 text-sm text-muted">Store-specific categories created by merchants.</p>
            {loading ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="ui-skeleton h-20" />
                <div className="ui-skeleton h-20" />
                <div className="ui-skeleton h-20" />
                <div className="ui-skeleton h-20" />
              </div>
            ) : categories.length === 0 ? (
              <div className="ui-card mt-6 p-8 text-center">
                <p className="text-sm text-muted">No categories are available yet.</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {categories.slice(0, 8).map((category) => (
                  <Link
                    key={category.id}
                    to={`/s/${category.storeSlug}/products?category=${category.id}`}
                    className="ui-card ui-card-hover p-4"
                  >
                    <p className="font-medium text-ink">{category.name}</p>
                    <p className="mt-1 text-sm text-muted">{category.storeName}</p>
                    <p className="mt-2 text-xs text-muted">
                      {category.productCount} {category.productCount === 1 ? "product" : "products"}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="ui-card mt-14 p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-ink">Sell on SellAi</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Create a merchant account, publish your store, and start receiving real customer orders in your dashboard.
            </p>
            <Link to="/register" className="ui-btn ui-btn-primary mt-5">
              Start Selling
            </Link>
          </section>
        </div>
      </main>
    </MarketplaceLayout>
  );
}

export default HomePage;
