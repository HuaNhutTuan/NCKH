import React from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import Login from "./Login";
import LocApp from "./LocApp";

function Root() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "Inter, sans-serif", color: "#5B6660",
      }}>
        Đang tải...
      </div>
    );
  }

  return user ? <LocApp /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="app-viewport-container">
        <Root />
      </div>
    </AuthProvider>
  );
}
