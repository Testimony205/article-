-- Inspirational Article Recommender System
-- Database Setup Script for MySQL

-- Create database (run this separately if needed)
-- CREATE DATABASE IF NOT EXISTS inspirational_articles;
-- USE inspirational_articles;

-- Users table (for optional authentication)
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,  -- bcrypt hash
  name        VARCHAR(100),
  role        ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions table (for authenticated users)
CREATE TABLE IF NOT EXISTS sessions (
  token       CHAR(64) PRIMARY KEY,
  user_id     INT NOT NULL,
  expires_at  DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT,                     -- NULL for seeded articles
  title       VARCHAR(500) NOT NULL,
  slug        VARCHAR(255) UNIQUE NOT NULL,
  body        MEDIUMTEXT NOT NULL,
  excerpt     VARCHAR(500),
  author      VARCHAR(100),
  category    VARCHAR(50),
  tags        JSON,
  image_url   VARCHAR(500),
  source_url  VARCHAR(1000),
  source_name VARCHAR(255),
  imported_at DATETIME,
  content_quality ENUM('full','preview') NOT NULL DEFAULT 'full',
  reading_time INT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FULLTEXT KEY ft_search (title, body),
  INDEX idx_source_url (source_url(255)),
  INDEX idx_category (category),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Article TF-IDF vectors (THE KEY TABLE - stores intelligence)
CREATE TABLE IF NOT EXISTS article_vectors (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  article_id  INT UNIQUE NOT NULL,
  tfidf_json  MEDIUMTEXT NOT NULL,     -- serialized TF-IDF vector as JSON
  keywords    TEXT,                    -- top 10 keywords, comma-separated
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reading history (supports both anonymous UUID and user_id)
CREATE TABLE IF NOT EXISTS reading_history (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT,                     -- NULL for anonymous
  anonymous_id VARCHAR(36),            -- UUID for anonymous users
  article_id  INT NOT NULL,
  read_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  read_percentage INT DEFAULT 0,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_anonymous_id (anonymous_id),
  INDEX idx_read_at (read_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bookmarks (supports both anonymous UUID and user_id)
CREATE TABLE IF NOT EXISTS bookmarks (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT,
  anonymous_id VARCHAR(36),
  article_id  INT NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_bookmark_user (user_id, article_id),
  UNIQUE KEY unique_bookmark_anon (anonymous_id, article_id),
  INDEX idx_user_id (user_id),
  INDEX idx_anonymous_id (anonymous_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Search analytics for admin insights
CREATE TABLE IF NOT EXISTS search_logs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT,
  anonymous_id VARCHAR(36),
  query_text  VARCHAR(255) NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_query_text (query_text),
  INDEX idx_created_at (created_at),
  INDEX idx_user_id (user_id),
  INDEX idx_anonymous_id (anonymous_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify tables were created
SHOW TABLES;
