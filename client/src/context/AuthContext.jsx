import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  changePasswordRequest,
  getCurrentUserRequest,
  loginRequest,
  logoutRequest,
  registerCustomerRequest,
  registerRequest,
  updateProfileRequest,
} from "../services/auth.service.js";
import { clearToken, getToken, setToken } from "../utils/tokenStorage.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      const token = getToken();
      if (!token) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const currentUser = await getCurrentUserRequest();
        if (!cancelled) {
          setUser(currentUser);
        }
      } catch {
        clearToken();
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  async function register(payload) {
    const data = await registerRequest(payload);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function registerCustomer(payload) {
    const data = await registerCustomerRequest(payload);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function login(payload) {
    const data = await loginRequest(payload);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function updateProfile(payload) {
    const nextUser = await updateProfileRequest(payload);
    setUser(nextUser);
    return nextUser;
  }

  async function changePassword(payload) {
    return changePasswordRequest(payload);
  }

  async function logout() {
    try {
      await logoutRequest();
    } catch {
      // Token is cleared locally even if the network request fails.
    } finally {
      clearToken();
      setUser(null);
    }
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isMerchant: user?.role === "MERCHANT" || user?.role === "ADMIN",
      isCustomer: user?.role === "CUSTOMER",
      register,
      registerCustomer,
      login,
      updateProfile,
      changePassword,
      logout,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
