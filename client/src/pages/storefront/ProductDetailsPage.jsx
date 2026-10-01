import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Link, useOutletContext, useParams } from "react-router-dom";
import ProductImage from "../../components/common/ProductImage.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { getErrorMessage } from "../../services/api.js";
import { getPublicProduct } from "../../services/product.service.js";
import { formatMoney } from "../../utils/money.js";

function ProductDetailsPage() {
  const { productId } = useParams();
  const { store } = useOutletContext();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      setLoading(true);
      setError("");
      try {
        const data = await getPublicProduct(store.slug, productId);
        if (!cancelled) {
          setProduct(data);
          setQuantity(1);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Product not found"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProduct();
    return () => {
      cancelled = true;
    };
  }, [store.slug, productId]);

  async function handleAdd() {
    if (!product) {
      return;
    }
    if (product.stock < 1) {
      toast.warning("This product is out of stock");
      return;
    }
    setAdding(true);
    setError("");
    try {
      const result = await addItem(product.id, quantity);
      toast.success("Added to cart");
      if (result?.switchedStore) {
        toast.info("Checkout is one store at a time. This item was added to this store's cart.");
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not add to cart"));
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="ui-skeleton h-80" />
      </main>
    );
  }

  if (!product) {
    return <main className="px-4 py-10 text-sm text-red-600">{error || "Product not found"}</main>;
  }

  const maxQuantity = Math.max(1, product.stock || 1);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <Link to={`/s/${store.slug}/products`} className="ui-link text-sm">
        Back to products
      </Link>
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div className="ui-card overflow-hidden p-4">
          <ProductImage src={product.imageUrl} alt={product.name} className="h-80 w-full" />
        </div>
        <div className="ui-card p-5 sm:p-6">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">{store.name}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">{product.name}</h1>
          {product.category?.name ? <p className="mt-2 text-sm text-muted">{product.category.name}</p> : null}
          <p className="mt-4 text-2xl font-semibold text-ink">{formatMoney(product.price, store.settings?.currency)}</p>
          <p className="mt-4 text-sm leading-6 text-muted">{product.description || "No description yet."}</p>
          <p className="mt-4 text-sm text-muted">
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>
          <label className="ui-label mt-5 max-w-32">
            Quantity
            <input
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(event) => setQuantity(Math.min(maxQuantity, Math.max(1, Number(event.target.value) || 1)))}
              className="ui-input"
            />
          </label>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          <button
            type="button"
            disabled={adding || product.stock < 1}
            onClick={handleAdd}
            className="store-primary mt-6 rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-70"
          >
            {adding ? "Adding..." : "Add to Cart"}
          </button>
          <div className="mt-8 border-t border-line pt-4 text-sm text-muted">
            <p className="font-medium text-ink">Sold by {store.name}</p>
            <p className="mt-1">{store.description || "Independent store on SellAi."}</p>
            {store.settings?.supportEmail ? <p className="mt-2">{store.settings.supportEmail}</p> : null}
          </div>
        </div>
      </div>
    </main>
  );
}

export default ProductDetailsPage;
