CREATE DATABASE IF NOT EXISTS beauty_mart_inventory;
USE beauty_mart_inventory;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  shade VARCHAR(100),
  buy_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  sell_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stock_quantity INT NOT NULL DEFAULT 0,
  low_stock_alert INT NOT NULL DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_products_brand (brand),
  INDEX idx_products_category (category),
  INDEX idx_products_stock_quantity (stock_quantity)
);

CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  facebook_acc VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customers_name (name),
  INDEX idx_customers_phone (phone)
);

CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT,
  sales_person VARCHAR(255) NOT NULL,
  order_date DATE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_profit DECIMAL(10, 2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(100),
  delivery_status VARCHAR(100) NOT NULL DEFAULT 'pending',
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sales_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE SET NULL,
  INDEX idx_sales_customer_id (customer_id),
  INDEX idx_sales_order_date (order_date),
  INDEX idx_sales_delivery_status (delivery_status)
);

CREATE TABLE IF NOT EXISTS sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  buy_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  sell_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  profit DECIMAL(10, 2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_sale_items_sale
    FOREIGN KEY (sale_id) REFERENCES sales(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_sale_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT,
  INDEX idx_sale_items_sale_id (sale_id),
  INDEX idx_sale_items_product_id (product_id)
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  movement_type ENUM('IN', 'OUT', 'ADJUSTMENT') NOT NULL,
  quantity INT NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_stock_movements_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE,
  INDEX idx_stock_movements_product_id (product_id),
  INDEX idx_stock_movements_type (movement_type),
  INDEX idx_stock_movements_created_at (created_at)
);

INSERT INTO users (name, email, password, role)
VALUES ('Admin User', 'admin@beautymart.com', '$2b$10$ufmJgXMTtLmmz0yiL9BhcetsRj3GVkY0LZ7ojiHS1f5THqRwLSLMm', 'admin')
ON DUPLICATE KEY UPDATE email = email;

-- Showcase inventory for demos and portfolio presentations. The NOT EXISTS
-- guard keeps this seed safe to run again without duplicating products.
INSERT INTO products
  (brand, product_name, category, shade, buy_price, sell_price, stock_quantity, low_stock_alert)
SELECT
  seed.brand,
  seed.product_name,
  seed.category,
  seed.shade,
  seed.buy_price,
  seed.sell_price,
  seed.stock_quantity,
  seed.low_stock_alert
FROM (
  SELECT 'Beauty of Joseon' AS brand, 'Relief Sun Rice + Probiotics SPF50+' AS product_name, 'Sunscreen' AS category, '50 ml' AS shade, 395.00 AS buy_price, 42000.00 AS sell_price, 18 AS stock_quantity, 5 AS low_stock_alert
  UNION ALL SELECT 'COSRX', 'Advanced Snail 96 Mucin Power Essence', 'Skincare', '100 ml', 420.00, 45000.00, 14, 5
  UNION ALL SELECT 'Anua', 'Heartleaf 77% Soothing Toner', 'Skincare', '250 ml', 510.00, 54000.00, 9, 4
  UNION ALL SELECT 'The Ordinary', 'Niacinamide 10% + Zinc 1%', 'Serum', '30 ml', 310.00, 34000.00, 16, 5
  UNION ALL SELECT 'CeraVe', 'Foaming Facial Cleanser', 'Cleanser', '236 ml', 455.00, 49000.00, 11, 4
  UNION ALL SELECT 'La Roche-Posay', 'Cicaplast Baume B5+', 'Moisturizer', '40 ml', 420.00, 45500.00, 7, 4
  UNION ALL SELECT 'SKIN1004', 'Madagascar Centella Ampoule', 'Serum', '55 ml', 390.00, 42000.00, 13, 5
  UNION ALL SELECT 'Laneige', 'Lip Sleeping Mask EX', 'Lip Care', 'Berry', 350.00, 38500.00, 6, 4
  UNION ALL SELECT 'rom&nd', 'Juicy Lasting Tint', 'Lip Tint', '23 Nucadamia', 195.00, 22500.00, 20, 6
  UNION ALL SELECT 'rom&nd', 'Juicy Lasting Tint', 'Lip Tint', '25 Bare Grape', 195.00, 22500.00, 4, 6
  UNION ALL SELECT 'Maybelline', 'Fit Me Matte + Poreless Foundation', 'Foundation', '128 Warm Nude', 285.00, 32000.00, 12, 4
  UNION ALL SELECT 'Maybelline', 'Sky High Waterproof Mascara', 'Mascara', 'Very Black', 260.00, 29500.00, 8, 4
  UNION ALL SELECT 'L''Oreal Paris', 'Infallible 24H Fresh Wear Foundation', 'Foundation', '130 True Beige', 480.00, 52000.00, 5, 4
  UNION ALL SELECT 'Peripera', 'Ink Velvet', 'Lip Tint', '17 Rosy Nude', 175.00, 20500.00, 15, 5
  UNION ALL SELECT 'Canmake', 'Cream Cheek', 'Blush', '16 Almond Terracotta', 210.00, 24500.00, 10, 4
  UNION ALL SELECT 'Etude', 'Drawing Eye Brow', 'Eyebrow', '03 Brown', 105.00, 13500.00, 22, 6
  UNION ALL SELECT 'Tsubaki', 'Premium Moist & Repair Shampoo', 'Hair Care', '490 ml', 330.00, 36500.00, 8, 3
  UNION ALL SELECT 'Bath & Body Works', 'Fine Fragrance Mist', 'Body Mist', 'Into the Night', 520.00, 58000.00, 3, 4
) AS seed
WHERE NOT EXISTS (
  SELECT 1
  FROM products AS existing
  WHERE existing.brand = seed.brand
    AND existing.product_name = seed.product_name
    AND existing.shade <=> seed.shade
);

-- Realistic customer directory used by the portfolio demo.
CREATE TEMPORARY TABLE demo_customers (
  name VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  facebook_acc VARCHAR(255)
);

INSERT INTO demo_customers (name, phone, address, facebook_acc) VALUES
  ('Su Myat Noe', '09 420 315 882', 'Sanchaung Township, Yangon', 'Su Myat Noe'),
  ('Thiri Mon', '09 777 204 619', 'Tamwe Township, Yangon', 'Thiri Mon Beauty'),
  ('Nandar Hlaing', '09 965 118 407', 'Chanayethazan Township, Mandalay', 'Nandar Hlaing'),
  ('Khin Yadanar', '09 450 883 126', 'Kamayut Township, Yangon', 'Khin Yadanar Kyaw'),
  ('May Thu Aung', '09 798 445 230', 'Bahan Township, Yangon', 'May Thu Aung'),
  ('Ei Ei Phyo', '09 421 670 519', 'North Okkalapa Township, Yangon', 'Ei Phyo'),
  ('Hnin Pwint Wai', '09 750 338 914', 'Ahlone Township, Yangon', 'Hnin Pwint Wai'),
  ('Yoon Wadi', '09 969 512 733', 'Thingangyun Township, Yangon', 'Yoon Wadi'),
  ('Moe Sandi', '09 444 289 601', 'Mawlamyine, Mon State', 'Moe Sandi'),
  ('Phyu Sin Thant', '09 790 156 842', 'Hlaing Township, Yangon', 'Phyu Sin Thant');

INSERT INTO customers (name, phone, address, facebook_acc)
SELECT seed.name, seed.phone, seed.address, seed.facebook_acc
FROM demo_customers AS seed
WHERE NOT EXISTS (
  SELECT 1
  FROM customers AS existing
  WHERE existing.facebook_acc = seed.facebook_acc
);

DROP TEMPORARY TABLE demo_customers;

-- Recent sales make the dashboard, filters, export, and customer history useful
-- immediately. Marker is stored in note so rerunning the seed is idempotent.
CREATE TEMPORARY TABLE demo_sales (
  marker VARCHAR(100),
  days_ago INT,
  customer_facebook VARCHAR(255),
  sales_person VARCHAR(255),
  brand VARCHAR(255),
  product_name VARCHAR(255),
  shade VARCHAR(100),
  quantity INT,
  sell_price DECIMAL(10, 2),
  payment_method VARCHAR(100),
  delivery_status VARCHAR(100)
);

INSERT INTO demo_sales
  (marker, days_ago, customer_facebook, sales_person, brand, product_name, shade, quantity, sell_price, payment_method, delivery_status)
VALUES
  ('BM-DEMO-001', 0, 'Su Myat Noe', 'HT', 'Beauty of Joseon', 'Relief Sun Rice + Probiotics SPF50+', '50 ml', 2, 42000, 'Prepaid', 'delivered'),
  ('BM-DEMO-002', 0, 'Thiri Mon Beauty', 'May', 'rom&nd', 'Juicy Lasting Tint', '25 Bare Grape', 1, 22500, 'COD', 'shipped'),
  ('BM-DEMO-003', 0, 'Khin Yadanar Kyaw', 'Thiri', 'COSRX', 'Advanced Snail 96 Mucin Power Essence', '100 ml', 1, 45000, 'Prepaid', 'pending'),
  ('BM-DEMO-004', 0, 'Ei Phyo', 'HT', 'Maybelline', 'Sky High Waterproof Mascara', 'Very Black', 1, 29500, 'COD', 'pending'),
  ('BM-DEMO-005', 1, 'Nandar Hlaing', 'May', 'Anua', 'Heartleaf 77% Soothing Toner', '250 ml', 1, 54000, 'Prepaid', 'delivered'),
  ('BM-DEMO-006', 2, 'May Thu Aung', 'Thiri', 'The Ordinary', 'Niacinamide 10% + Zinc 1%', '30 ml', 2, 34000, 'COD', 'delivered'),
  ('BM-DEMO-007', 3, 'Hnin Pwint Wai', 'HT', 'Laneige', 'Lip Sleeping Mask EX', 'Berry', 1, 38500, 'Prepaid', 'delivered'),
  ('BM-DEMO-008', 5, 'Yoon Wadi', 'May', 'Canmake', 'Cream Cheek', '16 Almond Terracotta', 2, 24500, 'COD', 'delivered'),
  ('BM-DEMO-009', 7, 'Moe Sandi', 'Thiri', 'SKIN1004', 'Madagascar Centella Ampoule', '55 ml', 1, 42000, 'Prepaid', 'delivered'),
  ('BM-DEMO-010', 10, 'Phyu Sin Thant', 'HT', 'Peripera', 'Ink Velvet', '17 Rosy Nude', 2, 20500, 'COD', 'delivered'),
  ('BM-DEMO-011', 14, 'Su Myat Noe', 'May', 'CeraVe', 'Foaming Facial Cleanser', '236 ml', 1, 49000, 'Prepaid', 'delivered'),
  ('BM-DEMO-012', 19, 'Thiri Mon Beauty', 'Thiri', 'Etude', 'Drawing Eye Brow', '03 Brown', 3, 13500, 'COD', 'delivered'),
  ('BM-DEMO-013', 24, 'Khin Yadanar Kyaw', 'HT', 'Maybelline', 'Fit Me Matte + Poreless Foundation', '128 Warm Nude', 1, 32000, 'Prepaid', 'delivered'),
  ('BM-DEMO-014', 31, 'Nandar Hlaing', 'May', 'Bath & Body Works', 'Fine Fragrance Mist', 'Into the Night', 1, 58000, 'COD', 'delivered');

INSERT INTO sales
  (customer_id, sales_person, order_date, total_amount, total_profit, payment_method, delivery_status, note)
SELECT
  customer.id,
  seed.sales_person,
  DATE_SUB(CURDATE(), INTERVAL seed.days_ago DAY),
  seed.sell_price * seed.quantity,
  (seed.sell_price - (product.buy_price * 100)) * seed.quantity,
  seed.payment_method,
  seed.delivery_status,
  CONCAT('Portfolio demo order: ', seed.marker)
FROM demo_sales AS seed
INNER JOIN customers AS customer ON customer.facebook_acc = seed.customer_facebook
INNER JOIN products AS product
  ON product.brand = seed.brand
 AND product.product_name = seed.product_name
 AND product.shade <=> seed.shade
WHERE NOT EXISTS (
  SELECT 1 FROM sales AS existing
  WHERE existing.note = CONCAT('Portfolio demo order: ', seed.marker)
);

INSERT INTO sale_items (sale_id, product_id, quantity, buy_price, sell_price, profit)
SELECT
  sale.id,
  product.id,
  seed.quantity,
  product.buy_price * 100,
  seed.sell_price,
  (seed.sell_price - (product.buy_price * 100)) * seed.quantity
FROM demo_sales AS seed
INNER JOIN sales AS sale ON sale.note = CONCAT('Portfolio demo order: ', seed.marker)
INNER JOIN products AS product
  ON product.brand = seed.brand
 AND product.product_name = seed.product_name
 AND product.shade <=> seed.shade
WHERE NOT EXISTS (
  SELECT 1 FROM sale_items AS existing
  WHERE existing.sale_id = sale.id AND existing.product_id = product.id
);

INSERT INTO stock_movements (product_id, movement_type, quantity, note)
SELECT
  product.id,
  'OUT',
  seed.quantity,
  CONCAT('Portfolio demo sale: ', seed.marker)
FROM demo_sales AS seed
INNER JOIN products AS product
  ON product.brand = seed.brand
 AND product.product_name = seed.product_name
 AND product.shade <=> seed.shade
WHERE NOT EXISTS (
  SELECT 1 FROM stock_movements AS existing
  WHERE existing.note = CONCAT('Portfolio demo sale: ', seed.marker)
);

DROP TEMPORARY TABLE demo_sales;
