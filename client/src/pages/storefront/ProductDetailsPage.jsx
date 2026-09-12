import { useEffect, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { useCart } from "../../context/CartContext.jsx";
import { getErrorMessage } from "../../services/api.js";
import { getPublicProduct } from "../../services/product.service.js";
import { formatMoney } from "../../utils/money.js";
import ProductImage from "../../components/common/ProductImage.jsx";

function ProductDetailsPage() {
  const { productId } = useParams();
  const { store } = useOutletContext();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      setLoading(true);
      setError("");
      try {
        const data = await getPublicProduct(store.slug, productId);
        if (!cancelled) {
          setProduct(data);
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
    setAdding(true);
    setMessage("");
    setError("");
    try {
      await addItem(product.id, 1);
      setMessage("Added to cart");
    } catch (err) {
      setError(getErrorMessage(err, "Could not add to cart"));
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return <main className="px-4 py-10 text-sm text-muted">Loading product...</main>;
  }

  if (!product) {
    return <main className="px-4 py-10 text-sm text-red-600">{error || "Product not found"}</main>;
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link to={`/s/${store.slug}/products`} className="ui-link text-sm">
        Back to products
      </Link>
      <div className="ui-card mt-4 overflow-hidden p-4 sm:p-6">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className="h-64 w-full sm:h-80"
        />
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-ink">{product.name}</h1>
        <p className="mt-2 text-xl font-semibold text-ink">{formatMoney(product.price, store.settings?.currency)}</p>
        <p className="mt-4 text-sm leading-6 text-muted sm:text-base">{product.description || "No description yet."}</p>
        <p className="mt-3 text-sm text-muted">
          {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
        </p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
        <button
          type="button"
          disabled={adding || product.stock < 1}
          onClick={handleAdd}
          className="store-primary mt-6 rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-70"
        >
          {adding ? "Adding..." : "Add to cart"}
        </button>
      </div>
    </main>
  );
}

export default ProductDetailsPage;
