-- Lộc Database Backup
SET FOREIGN_KEY_CHECKS = 0;

-- Table: users
REPLACE INTO users (id, name, email, password_hash, created_at) VALUES (3, 'Tuấn', 'tuannhut419@gmail.com', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '2026-09-08');
REPLACE INTO users (id, name, email, password_hash, created_at) VALUES (6, 'Khoa', 'khoa@gmail.com', 'a5688ef7bb84cafc9412051ce202dd3de2f8491bc42ba62b455668b789884128', '2026-09-10');
REPLACE INTO users (id, name, email, password_hash, created_at) VALUES (7, 'adjwdjiaw', 'nhut@gmail.com', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '2026-09-11');

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
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (1, 3, 'expense', 'food', '54000.00', 'ăn', '2026-09-07', '2026-09-08');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (2, 3, 'expense', 'study', '500000.00', 'mua sách', '2026-09-09', '2026-09-10');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (3, 3, 'expense', 'health', '40000.00', 'khám bệnh', '2026-09-09', '2026-09-10');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (4, 3, 'expense', 'entertainment', '1000000.00', 'mua máy tính', '2026-09-09', '2026-09-10');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (5, 3, 'expense', 'shopping', '1.00', 'mua kẹo', '2026-09-09', '2026-09-10');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (6, 3, 'income', 'parttime', '10000000.00', 'làm gia sư', '2026-09-09', '2026-09-10');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (7, 7, 'expense', 'transport', '500000.00', 'ddi hoc', '2026-09-10', '2026-09-11');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (8, 7, 'income', 'parttime', '100000000.00', 'tien', '2026-09-10', '2026-09-11');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (9, 7, 'expense', 'study', '838300.00', 'mua sach', '2026-09-10', '2026-09-11');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (10, 3, 'expense', 'food', '50000.00', 'Ăn sáng hết 50k', '2026-09-10', '2026-09-11');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (11, 3, 'expense', 'food', '200000.00', 'Uống cà phê 200k', '2026-09-10', '2026-09-11');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (12, 3, 'expense', 'study', '500000.00', 'ăn sáng', '2026-09-10', '2026-09-11');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (13, 3, 'income', 'parttime', '500000.00', 'Hôm nay lãnh lương 500k', '2026-09-10', '2026-09-11');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (14, 3, 'income', 'allowance', '2000000.00', 'Hôm nay được bố mẹ trợ cấp 2 triệu', '2026-09-10', '2026-09-11');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (15, 3, 'expense', 'transport', '300000.00', 'đi chơi', '2026-09-10', '2026-09-11');
REPLACE INTO transactions (id, user_id, type, category, amount, note, tx_date, created_at) VALUES (16, 3, 'income', 'parttime', '10000000.00', 'đi làm ', '2026-09-10', '2026-09-11');

-- Table: user_settings
REPLACE INTO user_settings (user_id, payday_day, emergency_reserve, updated_at) VALUES (3, 1, '5000000.00', '2026-09-11');

SET FOREIGN_KEY_CHECKS = 1;
