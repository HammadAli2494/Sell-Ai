import { Link, useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { getErrorMessage } from "../../services/api.js";
import { formatMoney } from "../../utils/money.js";
import ProductImage from "../../components/common/ProductImage.jsx";
import { useState } from "react";

function CartPage() {
  const { store } = useOutletContext();
  const { isCustomer } = useAuth();
  const { cart, loading, updateItem, removeItem } = useCart();
  const [error, setError] = useState("");

  async function handleQuantity(itemId, quantity) {
    setError("");
    try {
      await updateItem(itemId, quantity);
    } catch (err) {
      setError(getErrorMessage(err, "Could not update cart"));
    }
  }

  async function handleRemove(itemId) {
    setError("");
    try {
      await removeItem(itemId);
    } catch (err) {
      setError(getErrorMessage(err, "Could not remove item"));
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link to={`/s/${store.slug}`} className="ui-link text-sm">
        Back to store
      </Link>
      <h1 className="ui-title mt-4">Cart</h1>
      {error && <p className="ui-alert ui-alert-error">{error}</p>}
      {loading ? (
        <p className="mt-4 text-sm text-muted">Loading cart...</p>
      ) : cart.items.length === 0 ? (
        <div className="ui-card mt-6 p-8 text-center">
          <p className="text-sm text-muted">Your cart is empty.</p>
          <Link to={`/s/${store.slug}/products`} className="ui-link mt-3 inline-block text-sm">
            Browse products
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-6 space-y-3">
            {cart.items.map((item) => (
              <li
                key={item.id}
                className="ui-card ui-card-hover flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <ProductImage src={item.product.imageUrl} className="h-16 w-16 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{item.product.name}</p>
                    <p className="text-sm text-muted">
                      {formatMoney(item.product.price, store.settings?.currency)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="ui-btn ui-btn-secondary !px-2.5"
                    onClick={() => handleQuantity(item.id, Math.max(1, item.quantity - 1))}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(event) => handleQuantity(item.id, Number(event.target.value))}
                    className="ui-input mt-0 w-16"
                  />
                  <button
                    type="button"
                    className="ui-btn ui-btn-secondary !px-2.5"
                    onClick={() => handleQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="ui-btn ui-btn-danger"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-base font-semibold text-ink">
              Subtotal: {formatMoney(cart.subtotal, store.settings?.currency)}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link to={`/s/${store.slug}/products`} className="ui-btn ui-btn-secondary">
                Continue shopping
              </Link>
            <Link
              to={isCustomer ? `/s/${store.slug}/checkout` : "/customer/login"}
              state={isCustomer ? undefined : { from: { pathname: `/s/${store.slug}/checkout` } }}
              className="store-primary inline-flex rounded-xl px-4 py-2.5 text-sm font-medium"
              onClick={() => {
                if (!isCustomer) {
                  toast.warning("Please log in as a customer to continue");
                }
              }}
            >
              {isCustomer ? "Proceed to checkout" : "Log in to checkout"}
            </Link>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

export default CartPage;
