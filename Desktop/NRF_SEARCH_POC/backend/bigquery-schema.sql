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

-- Extend products table with Myntra CSV fields
-- Run this to add new columns for Myntra product data
ALTER TABLE `fashion_catalog.products`
ADD COLUMN IF NOT EXISTS rating FLOAT64,
ADD COLUMN IF NOT EXISTS rating_count INT64,
ADD COLUMN IF NOT EXISTS discount_percentage INT64,
ADD COLUMN IF NOT EXISTS original_price FLOAT64,
ADD COLUMN IF NOT EXISTS product_url STRING,
ADD COLUMN IF NOT EXISTS image_urls ARRAY<STRING>,
ADD COLUMN IF NOT EXISTS data_source STRING DEFAULT 'manual';

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

-- AI Fashion Toolkit Tables
-- Cost tracking table for $100 budget enforcement
CREATE TABLE IF NOT EXISTS `fashion_catalog.toolkit_usage` (
  usage_id STRING NOT NULL,
  session_id STRING NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  tool_name STRING NOT NULL,
  cost_usd FLOAT64 NOT NULL,
  image_count INT64,
  input_tokens INT64,
  output_tokens INT64,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
OPTIONS(
  description="Tracks AI toolkit usage and costs for rate limiting"
);

-- Style profiles table for personalized recommendations
CREATE TABLE IF NOT EXISTS `fashion_catalog.style_profiles` (
  profile_id STRING NOT NULL,
  session_id STRING NOT NULL,
  profile_data JSON NOT NULL,
  image_hashes ARRAY<STRING>,
  analysis_summary STRING,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
OPTIONS(
  description="Stores user style profiles from multi-image analysis"
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_toolkit_session
ON `fashion_catalog.toolkit_usage`(session_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_profile_session
ON `fashion_catalog.style_profiles`(session_id);
