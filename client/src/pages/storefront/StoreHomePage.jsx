import { Link, useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ProductCard from "../../components/storefront/ProductCard.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { getErrorMessage } from "../../services/api.js";
import { listPublicCategories, listPublicProducts } from "../../services/product.service.js";

function StoreHomePage() {
  const { store } = useOutletContext();
  const { addItem } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingId, setAddingId] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [productData, categoryData] = await Promise.all([
          listPublicProducts(store.slug, { limit: 8 }),
          listPublicCategories(store.slug),
        ]);
        if (!cancelled) {
          setProducts(productData.items);
          setCategories(categoryData);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Unable to load products"));
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
  }, [store.slug]);

  async function handleAdd(product) {
    setAddingId(product.id);
    try {
      const result = await addItem(product.id, 1);
      toast.success("Added to cart");
      if (result?.switchedStore) {
        toast.info("Checkout is one store at a time. This item was added to this store's cart.");
      }
    } catch (err) {
      toast.error(getErrorMessage(err, product.stock < 1 ? "This product is out of stock" : "Could not add to cart"));
    } finally {
      setAddingId("");
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <section className="overflow-hidden rounded-2xl border border-line bg-white px-6 py-12 sm:px-10">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Welcome to {store.name}</p>
        <h1 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Quality products delivered to you.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
          {store.description || "Browse this merchant's catalog and check out when you are ready."}
        </p>
        <Link to={`/s/${store.slug}/products`} className="store-primary mt-6 inline-flex rounded-xl px-4 py-2.5 text-sm font-medium">
          Shop Now
        </Link>
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink">Featured products</h2>
          <Link to={`/s/${store.slug}/products`} className="ui-link text-sm">
            View all
          </Link>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {loading ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="ui-skeleton h-64" />
            <div className="ui-skeleton h-64" />
            <div className="ui-skeleton h-64" />
            <div className="ui-skeleton h-64" />
          </div>
        ) : products.length === 0 ? (
          <div className="ui-card mt-5 p-8 text-center">
            <p className="text-sm text-muted">This store has not added products yet.</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-ink">Categories</h2>
        {categories.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No categories created yet.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/s/${store.slug}/products?category=${category.id}`}
                className="ui-card ui-card-hover p-4"
              >
                <p className="font-medium text-ink">{category.name}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12 grid gap-4 lg:grid-cols-3">
        <div className="ui-card p-5">
          <h3 className="font-semibold text-ink">About</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            {store.description || `${store.name} is an independent store on SellAi.`}
          </p>
        </div>
        <div className="ui-card p-5">
          <h3 className="font-semibold text-ink">Shipping & returns</h3>
          <p className="mt-2 line-clamp-4 text-sm leading-6 text-muted">
            {store.settings?.shippingPolicy || "Shipping details are listed on the policies page."}
          </p>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">
            {store.settings?.returnPolicy || "Return details are listed on the policies page."}
          </p>
        </div>
        <div className="ui-card p-5">
          <h3 className="font-semibold text-ink">Contact</h3>
          <p className="mt-2 text-sm text-muted">{store.settings?.supportEmail || "Contact details are set by the merchant."}</p>
          <Link to={`/s/${store.slug}/policies`} className="ui-link mt-3 inline-block text-sm">
            View policies
          </Link>
        </div>
      </section>
    </main>
  );
}

export default StoreHomePage;
