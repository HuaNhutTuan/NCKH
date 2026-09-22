// Đổi URL này thành địa chỉ backend thật khi triển khai (vd: https://api.locapp.vn hoặc để trống /api khi chạy cùng host)
export const API_BASE = import.meta.env.VITE_API_BASE || "/api";

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
  update: (token, id, tx) => request(`/transactions/${id}`, { method: "PUT", token, body: tx }),
  remove: (token, id) => request(`/transactions/${id}`, { method: "DELETE", token }),
};

export const budgetsApi = {
  list: (token) => request("/budgets", { token }),
  update: (token, category, limit) =>
    request("/budgets", { method: "PUT", token, body: { category, limit } }),
};

export const chatApi = {
  send: (token, { messages, systemPrompt }) =>
    request("/chat", { method: "POST", token, body: { messages, systemPrompt } }),

  sendStream: async (token, { messages, systemPrompt }, onChunk) => {
    const res = await fetch(`${API_BASE}/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages, systemPrompt }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Không thể kết nối với AI.");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullReply = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === "data: [DONE]") {
          return fullReply;
        }
        if (trimmed.startsWith("data: ")) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.error) {
              throw new Error(data.error);
            }
            if (data.text) {
              fullReply += data.text;
              if (onChunk) onChunk(data.text, fullReply);
            }
          } catch (e) {
            if (e.message && e.message !== "Unexpected end of JSON input") {
              throw e;
            }
          }
        }
      }
    }

    return fullReply;
  },
};

export const multimodalApi = {
  // Phân tích câu lệnh văn bản tự nhiên / voice transcript
  parseText: (token, text) =>
    request("/multimodal/text", { method: "POST", token, body: { text } }),

  // Phân tích hình ảnh hóa đơn / ảnh chuyển khoản (dùng FormData)
  parseImage: async (token, file) => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`${API_BASE}/multimodal/image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra khi phân tích hình ảnh.");
    return data;
  },
};

export const settingsApi = {
  get: (token) => request("/settings", { token }),
  update: (token, settings) =>
    request("/settings", { method: "PUT", token, body: settings }),
};

export const knowledgeApi = {
  list: (token) => request("/knowledge", { token }),
  create: (token, item) => request("/knowledge", { method: "POST", token, body: item }),
  upload: async (token, file, title) => {
    const formData = new FormData();
    formData.append("file", file);
    if (title) formData.append("title", title);
    const res = await fetch(`${API_BASE}/knowledge/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra khi tải tài liệu.");
    return data;
  },
  toggle: (token, id) => request(`/knowledge/${id}/toggle`, { method: "PATCH", token }),
  remove: (token, id) => request(`/knowledge/${id}`, { method: "DELETE", token }),
};


