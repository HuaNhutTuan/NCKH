-- Lộc — schema cơ sở dữ liệu MySQL
-- Chạy: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS loc_app
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE loc_app;

-- Mỗi người dùng có một tài khoản riêng
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(190)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Giao dịch thu/chi, gắn với user_id
CREATE TABLE IF NOT EXISTS transactions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  type        ENUM('income','expense') NOT NULL,
  category    VARCHAR(50)   NOT NULL,
  amount      DECIMAL(14,2) NOT NULL,
  note        VARCHAR(255)  DEFAULT '',
  tx_date     DATE          NOT NULL,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_date (user_id, tx_date)
) ENGINE=InnoDB;

-- Ngân sách hàng tháng theo danh mục, gắn với user_id
CREATE TABLE IF NOT EXISTS budgets (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL,
  category       VARCHAR(50)   NOT NULL,
  monthly_limit  DECIMAL(14,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_user_category (user_id, category)
) ENGINE=InnoDB;
