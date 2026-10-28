import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("loc_token"));
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("loc_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  // Nếu đã có thông tin user lưu ở thiết bị thì không cần chờ loading, vào thẳng app
  const [loading, setLoading] = useState(() => !localStorage.getItem("loc_user") && !!localStorage.getItem("loc_token"));

  // Khi có token (kể cả từ lần trước), đồng bộ lại thông tin người dùng trong nền
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let isMounted = true;
    authApi
      .me(token)
      .then((data) => {
        if (!isMounted) return;
        setUser(data.user);
        try {
          localStorage.setItem("loc_user", JSON.stringify(data.user));
        } catch {}
      })
      .catch((err) => {
        if (!isMounted) return;
        // Chỉ đăng xuất khi máy chủ xác nhận token không hợp lệ hoặc đã hết hạn (401)
        if (err && err.status === 401) {
          setToken(null);
          setUser(null);
          localStorage.removeItem("loc_token");
          localStorage.removeItem("loc_user");
        } else {
          // Lỗi mạng hoặc máy chủ đang khởi động: giữ nguyên phiên đăng nhập trên thiết bị
          console.warn("Không thể đồng bộ hồ sơ lúc khởi động:", err?.message);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  function saveSession(data) {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("loc_token", data.token);
    if (data.user) {
      try {
        localStorage.setItem("loc_user", JSON.stringify(data.user));
      } catch {}
    }
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
    localStorage.removeItem("loc_user");
  }

  function updateUser(updatedUser) {
    setUser((prev) => {
      const next = prev ? { ...prev, ...updatedUser } : updatedUser;
      try {
        localStorage.setItem("loc_user", JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout, updateUser, saveSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải dùng bên trong <AuthProvider>");
  return ctx;
}
