import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("loc_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Khi có token (kể cả từ lần trước), lấy lại thông tin người dùng
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me(token)
      .then((data) => setUser(data.user))
      .catch(() => {
        setToken(null);
        localStorage.removeItem("loc_token");
      })
      .finally(() => setLoading(false));
  }, [token]);

  function saveSession(data) {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("loc_token", data.token);
  }

  async function login(email, password) {
    const data = await authApi.login(email, password);
    saveSession(data);
  }

  async function register(name, email, password) {
    const data = await authApi.register(name, email, password);
    saveSession(data);
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("loc_token");
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải dùng bên trong <AuthProvider>");
  return ctx;
}
