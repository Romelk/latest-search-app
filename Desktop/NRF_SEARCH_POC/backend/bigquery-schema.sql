-- BigQuery Schema for Fashion Catalog
-- Create dataset (run this in BigQuery console or via CLI)

CREATE SCHEMA IF NOT EXISTS `fashion_catalog`
OPTIONS(
  description="Fashion and lifestyle product catalog for agentic search demo"
);

-- Create products table
CREATE TABLE IF NOT EXISTS `fashion_catalog.products` (
  product_id STRING NOT NULL,
  title STRING NOT NULL,
  brand STRING NOT NULL,
  price FLOAT64 NOT NULL,
  image_url STRING,
  category STRING NOT NULL,
  color STRING,
  size STRING,
  fit STRING,
  occasion_tags ARRAY<STRING>,
  style STRING,
  description STRING,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
OPTIONS(
  description="Product catalog table with fashion and lifestyle items"
);

-- Sample data insert
INSERT INTO `fashion_catalog.products` (product_id, title, brand, price, image_url, category, color, size, fit, occasion_tags, style, description)
VALUES
  ('SKU001', 'Blue Formal Shirt', 'Peter England', 2499.0, 'https://via.placeholder.com/300x400/4A90E2/FFFFFF?text=Blue+Shirt', 'shirt', 'blue', '42', 'regular', ['formal', 'office'], 'formal', 'Classic blue formal shirt with regular fit'),
  ('SKU002', 'Navy Blue Regular Fit Trousers', 'Van Heusen', 2999.0, 'https://via.placeholder.com/300x400/2C3E50/FFFFFF?text=Navy+Trousers', 'trousers', 'navy', '42', 'regular', ['formal', 'office'], 'formal', 'Navy blue regular fit formal trousers'),
  ('SKU003', 'Beige A-Line Kurti', 'Fabindia', 2299.0, 'https://via.placeholder.com/300x400/D4A574/FFFFFF?text=Beige+Kurti', 'kurti', 'beige', 'M', 'regular', ['casual', 'semi-formal'], 'ethnic', 'Elegant beige A-line kurti for casual occasions'),
  ('SKU004', 'White Cotton Shirt', 'Arrow', 2799.0, 'https://via.placeholder.com/300x400/FFFFFF/000000?text=White+Shirt', 'shirt', 'white', '42', 'slim', ['formal', 'wedding'], 'formal', 'Classic white cotton shirt with slim fit'),
  ('SKU005', 'Grey Comfort Fit Chinos', 'Allen Solly', 3199.0, 'https://via.placeholder.com/300x400/95A5A6/FFFFFF?text=Grey+Chinos', 'trousers', 'grey', '42', 'comfort', ['casual', 'smart-casual'], 'casual', 'Comfortable grey chinos for everyday wear'),
  ('SKU006', 'Olive Green Cotton Palazzo', 'Biba', 1899.0, 'https://via.placeholder.com/300x400/556B2F/FFFFFF?text=Olive+Palazzo', 'palazzo', 'olive', 'L', 'regular', ['casual', 'festive'], 'ethnic', 'Comfortable olive green cotton palazzo pants'),
  ('SKU007', 'Black Formal Blazer', 'Raymond', 8999.0, 'https://via.placeholder.com/300x400/000000/FFFFFF?text=Black+Blazer', 'blazer', 'black', '42', 'regular', ['formal', 'wedding'], 'formal', 'Premium black formal blazer for special occasions'),
  ('SKU008', 'Floral Print Maxi Dress', 'W', 3499.0, 'https://via.placeholder.com/300x400/FF69B4/FFFFFF?text=Maxi+Dress', 'dress', 'multicolor', 'M', 'regular', ['casual', 'party'], 'western', 'Beautiful floral print maxi dress'),
  ('SKU009', 'Denim Jeans Blue', 'Levis', 3999.0, 'https://via.placeholder.com/300x400/4169E1/FFFFFF?text=Denim+Jeans', 'jeans', 'blue', '32', 'slim', ['casual'], 'casual', 'Classic blue denim jeans with slim fit'),
  ('SKU010', 'Red Running Shoes', 'Nike', 5499.0, 'https://via.placeholder.com/300x400/DC143C/FFFFFF?text=Running+Shoes', 'shoes', 'red', 'UK 9', 'regular', ['sports', 'casual'], 'sports', 'Comfortable red running shoes for active lifestyle');

-- Create analytics events table
CREATE TABLE IF NOT EXISTS `fashion_catalog.analytics_events` (
  event_id STRING NOT NULL,
  session_id STRING NOT NULL,
  event_name STRING NOT NULL,
  event_timestamp TIMESTAMP NOT NULL,
  query STRING,
  intent_mode STRING,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
OPTIONS(
  description="Analytics events for tracking user interactions"
);
