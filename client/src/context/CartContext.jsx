import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  addCartItemRequest,
  getCartRequest,
  removeCartItemRequest,
  updateCartItemRequest,
} from "../services/order.service.js";
import { clearCartId, setCartId } from "../utils/cartStorage.js";

const CartContext = createContext(null);

export function CartProvider({ slug, children }) {
  const [cart, setCart] = useState({ id: null, items: [], subtotal: 0 });
  const [loading, setLoading] = useState(Boolean(slug));

  function rememberCart(nextCart) {
    setCart(nextCart);
    if (nextCart?.id) {
      setCartId(slug, nextCart.id);
    } else {
      clearCartId(slug);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadCart() {
      if (!slug) {
        setCart({ id: null, items: [], subtotal: 0 });
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const currentCart = await getCartRequest(slug);
        if (!cancelled) {
          rememberCart(currentCart);
        }
      } catch {
        if (!cancelled) {
          setCart({ id: null, items: [], subtotal: 0 });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCart();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function addItem(productId, quantity = 1) {
    const nextCart = await addCartItemRequest(slug, { productId, quantity });
    rememberCart(nextCart);
    return nextCart;
  }

  async function updateItem(itemId, quantity) {
    const nextCart = await updateCartItemRequest(slug, itemId, { quantity });
    rememberCart(nextCart);
    return nextCart;
  }

  async function removeItem(itemId) {
    const nextCart = await removeCartItemRequest(slug, itemId);
    rememberCart(nextCart);
    return nextCart;
  }

  function clearCart() {
    rememberCart({ id: null, items: [], subtotal: 0 });
  }

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  const value = useMemo(
    () => ({
      cart,
      loading,
      itemCount,
      addItem,
      updateItem,
      removeItem,
      clearCart,
    }),
    [cart, loading, itemCount],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
