// Đổi URL này thành địa chỉ backend thật khi triển khai (vd: https://api.locapp.vn)
export const API_BASE = "http://localhost:4000/api";

async function request(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Có lỗi xảy ra, vui lòng thử lại.");
  }
  return data;
}

export const authApi = {
  register: (name, email, password) =>
    request("/auth/register", { method: "POST", body: { name, email, password } }),
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password } }),
  me: (token) => request("/auth/me", { token }),
};

export const transactionsApi = {
  list: (token) => request("/transactions", { token }),
  create: (token, tx) => request("/transactions", { method: "POST", token, body: tx }),
  remove: (token, id) => request(`/transactions/${id}`, { method: "DELETE", token }),
};

export const budgetsApi = {
  list: (token) => request("/budgets", { token }),
  update: (token, category, limit) =>
    request("/budgets", { method: "PUT", token, body: { category, limit } }),
};
