# Lộc — Backend (Node.js + Express + MySQL)

Backend cung cấp đăng ký/đăng nhập tài khoản riêng cho từng người dùng, cùng API lưu giao dịch và ngân sách theo từng tài khoản trong MySQL.

## 1. Cài đặt MySQL và tạo database

```bash
mysql -u root -p < schema.sql
```

Lệnh này tạo database `loc_app` với 3 bảng: `users`, `transactions`, `budgets`.

## 2. Cấu hình biến môi trường

```bash
cp .env.example .env
```

Mở `.env` và điền thông tin MySQL thật của bạn (`DB_USER`, `DB_PASSWORD`...), đổi `JWT_SECRET` thành một chuỗi ngẫu nhiên dài, và đặt `CLIENT_ORIGIN` là địa chỉ frontend của bạn (vd: `http://localhost:5173` khi dùng Vite).

## 3. Cài đặt và chạy server

```bash
npm install
npm run dev
```

Server chạy tại `http://localhost:4000`. Kiểm tra nhanh: mở `http://localhost:4000/api/health` phải thấy `{"status":"ok"}`.

## 4. Các API chính

| Method | Endpoint              | Mô tả                                    | Cần đăng nhập |
|--------|-----------------------|-------------------------------------------|:---:|
| POST   | `/api/auth/register`  | `{name, email, password}` → tạo tài khoản | Không |
| POST   | `/api/auth/login`     | `{email, password}` → trả về token        | Không |
| GET    | `/api/auth/me`        | Thông tin người dùng hiện tại              | Có |
| GET    | `/api/transactions`   | Danh sách giao dịch của bạn                | Có |
| POST   | `/api/transactions`   | `{type, category, amount, note, date}`     | Có |
| DELETE | `/api/transactions/:id` | Xoá một giao dịch                        | Có |
| GET    | `/api/budgets`        | `{category: limit, ...}`                   | Có |
| PUT    | `/api/budgets`        | `{category, limit}` → tạo/cập nhật hạn mức | Có |
| POST   | `/api/chat`           | `{messages, systemPrompt}` → AI trả lời     | Có |

Mọi route "Có" yêu cầu header: `Authorization: Bearer <token>` (token nhận được từ lúc đăng ký/đăng nhập).

## 5. Bảo mật đã áp dụng

- Mật khẩu **không bao giờ** lưu dạng thô — được băm bằng thuật toán `SHA-256` trước khi lưu vào cơ sở dữ liệu MySQL.
- Đăng nhập/đăng ký trả về **JWT** hết hạn sau 7 ngày; mỗi request tới dữ liệu riêng tư đều được xác thực qua middleware `requireAuth`.
- Mỗi giao dịch/ngân sách gắn với `user_id`; các câu truy vấn luôn lọc theo `user_id` của người đang đăng nhập, nên một tài khoản không thể đọc hay xoá dữ liệu của tài khoản khác.
- CORS chỉ cho phép domain frontend bạn khai báo trong `CLIENT_ORIGIN`.

Gợi ý nâng cao thêm khi đưa lên production: dùng HTTPS, giới hạn số lần đăng nhập sai (rate limiting), và cân nhắc dùng refresh token thay vì JWT sống 7 ngày.

## 6. Kết nối với frontend (app "Lộc" đã thiết kế)

Ba file trong thư mục `loc-frontend/` đi kèm giúp bạn tích hợp:

- **`api.js`** — hàm gọi API, nhớ đổi `API_BASE` thành domain backend thật khi triển khai.
- **`AuthContext.jsx`** — quản lý trạng thái đăng nhập (`token`, `user`), lưu token vào `localStorage` để người dùng không phải đăng nhập lại mỗi lần mở web.
- **`Login.jsx`** — màn hình đăng nhập/đăng ký, cùng tông màu với app.

### Cách nối vào file `loc-app.jsx` đã có

1. Bọc ứng dụng trong `<AuthProvider>` và hiển thị `<Login />` nếu chưa đăng nhập:

```jsx
import { AuthProvider, useAuth } from "./AuthContext";
import Login from "./Login";

function Root() {
  const { user, loading, token, logout } = useAuth();
  if (loading) return null; // hoặc màn hình loading
  if (!user) return <Login />;
  return <App token={token} onLogout={logout} />; // App = component chính trong loc-app.jsx
}

export default function Wrapped() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
```

2. Trong `loc-app.jsx`, thay phần dữ liệu mẫu (`seedTx`, `seedBudgets`) bằng dữ liệu tải từ API khi component mount:

```jsx
import { transactionsApi, budgetsApi } from "./api";

useEffect(() => {
  transactionsApi.list(token).then((d) => setTransactions(d.transactions));
  budgetsApi.list(token).then((d) => setBudgets(d.budgets));
}, [token]);
```

3. Thay hàm `addTransaction` / `deleteTx` / cập nhật ngân sách để gọi API thay vì chỉ cập nhật state cục bộ (gọi API xong thì cập nhật lại state để giao diện phản ánh đúng).

Nếu bạn muốn, mình có thể viết lại toàn bộ `loc-app.jsx` đã tích hợp sẵn các bước trên — chỉ cần bạn xác nhận.
