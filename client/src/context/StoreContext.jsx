import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import {
  createStoreRequest,
  getMyStoreRequest,
  updateMyStoreRequest,
} from "../services/store.service.js";

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadStore() {
      if (!isAuthenticated || (user?.role !== "MERCHANT" && user?.role !== "ADMIN")) {
        setStore(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const currentStore = await getMyStoreRequest();
        if (!cancelled) {
          setStore(currentStore);
        }
      } catch {
        if (!cancelled) {
          setStore(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadStore();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  async function createStore(payload) {
    const created = await createStoreRequest(payload);
    setStore(created);
    return created;
  }

  async function updateStore(payload) {
    const updated = await updateMyStoreRequest(payload);
    setStore(updated);
    return updated;
  }

  const value = useMemo(
    () => ({
      store,
      loading,
      hasStore: Boolean(store),
      createStore,
      updateStore,
    }),
    [store, loading],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within StoreProvider");
  }
  return context;
}
