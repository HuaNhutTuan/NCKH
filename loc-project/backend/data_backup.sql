-- Loc Database Seed (DU LIEU MAU -- khong chua thong tin nguoi dung that)
-- Mat khau mac dinh cho tai khoan test: TestPass123!
-- (Duoc tao bang: bcrypt.hash('TestPass123!', 12))
SET FOREIGN_KEY_CHECKS = 0;

-- Table: users (Du lieu an danh -- khong phai nguoi dung that)
REPLACE INTO users (id, name, email, password_hash, created_at) VALUES (3, 'Admin Demo', 'admin@demo.local', '$2a$12$uu/PyJ3u69rAJmbDqpNFrea8z9WZNSyGYGLA/aUSUEtIBoz/uBFeG', '2026-09-08');
REPLACE INTO users (id, name, email, password_hash, created_at) VALUES (6, 'User Demo 1', 'user1@demo.local', '$2a$12$uu/PyJ3u69rAJmbDqpNFrea8z9WZNSyGYGLA/aUSUEtIBoz/uBFeG', '2026-09-10');
REPLACE INTO users (id, name, email, password_hash, created_at) VALUES (7, 'User Demo 2', 'user2@demo.local', '$2a$12$uu/PyJ3u69rAJmbDqpNFrea8z9WZNSyGYGLA/aUSUEtIBoz/uBFeG', '2026-09-11');

-- Table: budgets
REPLACE INTO budgets (id, user_id, category, monthly_limit) VALUES (1, 3, 'food', '400000.00');
REPLACE INTO budgets (id, user_id, category, monthly_limit) VALUES (2, 3, 'study', '1000000.00');
REPLACE INTO budgets (id, user_id, category, monthly_limit) VALUES (3, 3, 'entertainment', '5000000.00');
REPLACE INTO budgets (id, user_id, category, monthly_limit) VALUES (4, 3, 'shopping', '100000.00');
REPLACE INTO budgets (id, user_id, category, monthly_limit) VALUES (5, 3, 'health', '500000.00');
REPLACE INTO budgets (id, user_id, category, monthly_limit) VALUES (6, 3, 'transport', '100000.00');
REPLACE INTO budgets (id, user_id, category, monthly_limit) VALUES (7, 3, 'housing', '5000000.00');
REPLACE INTO budgets (id, user_id, category, monthly_limit) VALUES (8, 3, 'other', '500000.00');
REPLACE INTO budgets (id, user_id, category, monthly_limit) VALUES (9, 7, 'transport', '1000000.00');

-- Table: transactions
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (1, 3, 'expense', 'food', '54000.00', 'an sang', '2026-09-07', '2026-09-08');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (2, 3, 'expense', 'study', '500000.00', 'mua sach', '2026-09-09', '2026-09-10');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (3, 3, 'expense', 'health', '40000.00', 'kham benh', '2026-09-09', '2026-09-10');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (4, 3, 'expense', 'entertainment', '1000000.00', 'mua may tinh', '2026-09-09', '2026-09-10');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (5, 3, 'expense', 'shopping', '50000.00', 'mua do dung', '2026-09-09', '2026-09-10');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (6, 3, 'income', 'parttime', '3000000.00', 'luong lam them', '2026-09-09', '2026-09-10');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (7, 7, 'expense', 'transport', '50000.00', 'di hoc', '2026-09-10', '2026-09-11');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (8, 7, 'income', 'allowance', '2000000.00', 'tien nha gui', '2026-09-10', '2026-09-11');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (9, 7, 'expense', 'study', '838300.00', 'mua sach giao trinh', '2026-09-10', '2026-09-11');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (10, 3, 'expense', 'food', '50000.00', 'An sang het 50k', '2026-09-10', '2026-09-11');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (11, 3, 'expense', 'food', '35000.00', 'Uong ca phe', '2026-09-10', '2026-09-11');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (12, 3, 'expense', 'study', '150000.00', 'In tai lieu', '2026-09-10', '2026-09-11');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (13, 3, 'income', 'parttime', '500000.00', 'Lanh luong cuoi tuan', '2026-09-10', '2026-09-11');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (14, 3, 'income', 'allowance', '2000000.00', 'Gia dinh tro cap thang', '2026-09-10', '2026-09-11');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (15, 3, 'expense', 'transport', '30000.00', 'di choi cuoi tuan', '2026-09-10', '2026-09-11');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (16, 3, 'income', 'parttime', '1500000.00', 'Luong lam them thang 9', '2026-09-10', '2026-09-11');

-- Table: user_settings
REPLACE INTO user_settings (user_id, payday_day, emergency_reserve, updated_at) VALUES (3, 1, '1000000.00', '2026-09-11');

SET FOREIGN_KEY_CHECKS = 1;
