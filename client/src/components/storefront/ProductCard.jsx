import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import ProductImage from "../common/ProductImage.jsx";
import { formatMoney } from "../../utils/money.js";

function ProductCard({
  product,
  storeSlug,
  currency,
  storeName,
  onAdd,
  adding = false,
}) {
  const href = `/s/${storeSlug}/products/${product.id}`;
  const outOfStock = product.stock < 1;

  async function handleAdd(event) {
    event.preventDefault();
    if (outOfStock) {
      toast.warning("This product is out of stock");
      return;
    }
    await onAdd?.(product);
  }

  return (
    <article className="ui-card flex h-full flex-col p-3">
      <Link to={href} className="block">
        <ProductImage src={product.imageUrl} alt={product.name} className="mb-3 h-44 w-full" />
        <p className="font-medium text-ink">{product.name}</p>
      </Link>
      {storeName ? <p className="mt-1 text-xs text-muted">{storeName}</p> : null}
      {product.category?.name ? <p className="mt-1 text-xs text-muted">{product.category.name}</p> : null}
      <p className="mt-2 text-sm font-semibold text-ink">{formatMoney(product.price, currency)}</p>
      <p className="mt-1 text-xs text-muted">{outOfStock ? "Out of stock" : `${product.stock} in stock`}</p>
      <div className="mt-auto flex flex-wrap gap-2 pt-3">
        <Link to={href} className="ui-btn ui-btn-secondary flex-1">
          View Product
        </Link>
        {onAdd ? (
          <button type="button" disabled={adding || outOfStock} onClick={handleAdd} className="ui-btn ui-btn-primary flex-1">
            {adding ? "Adding..." : "Add to Cart"}
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default ProductCard;
