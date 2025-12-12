#!/usr/bin/env ts-node

import * as fs from 'fs';
import csv from 'csv-parser';
import { BigQuery } from '@google-cloud/bigquery';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

interface CSVRow {
  id: string;
  name: string;
  img: string;
  asin: string;
  price: string;
  mrp: string;
  rating: string;
  ratingTotal: string;
  discount: string;
  seller: string;
  purl: string;
}

interface Product {
  product_id: string;
  title: string;
  brand: string;
  price: number;
  image_url: string;
  category: string;
  color: string;
  size: string | null;
  fit: string | null;
  occasion_tags: string[];
  style: string | null;
  description: string;
  rating: number;
  rating_count: number;
  discount_percentage: number;
  original_price: number;
  product_url: string;
  image_urls: string[];
  data_source: string;
}

// Color patterns for extraction
const COLOR_PATTERNS = [
  /\b(black|white|blue|red|green|yellow|pink|purple|orange|brown|grey|gray|beige|navy|olive|maroon|cream|gold|silver|multicolor|multi)\b/i
];

// Extract category from Myntra URL
function extractCategory(productUrl: string): string {
  const match = productUrl.match(/myntra\.com\/([^\/]+)\//);
  if (match) {
    return match[1].replace(/-/g, ' ');
  }
  return 'general';
}

// Extract color from product name
function extractColor(productName: string): string {
  for (const pattern of COLOR_PATTERNS) {
    const match = productName.match(pattern);
    if (match) {
      return match[1].toLowerCase();
    }
  }
  return '';
}

// Process image URLs
function processImages(imgString: string): { primary: string; all: string[] } {
  if (!imgString) {
    return { primary: '', all: [] };
  }

  const urls = imgString.split(';')
    .map(u => u.trim())
    .filter(u => u && u.startsWith('http'));

  // Get unique base URLs (remove DPR variations)
  const uniqueUrls = Array.from(new Set(
    urls.map(u => u.split('?')[0])
  ));

  return {
    primary: uniqueUrls[0] || '',
    all: uniqueUrls.slice(0, 5) // Limit to 5 images
  };
}

// Transform CSV row to Product
function transformRow(row: CSVRow): Product | null {
  try {
    const category = extractCategory(row.purl);
    const color = extractColor(row.name);
    const images = processImages(row.img);

    // Skip products with invalid data
    if (!row.id || !row.name || !row.seller || !row.price || !row.purl) {
      return null;
    }

    const price = parseFloat(row.price);
    const mrp = parseFloat(row.mrp);

    // Skip invalid prices
    if (isNaN(price) || price <= 0) {
      return null;
    }

    return {
      product_id: `MYNTRA-${row.id}`,
      title: row.name.substring(0, 200), // Limit title length
      brand: row.seller.substring(0, 100),
      price: price,
      image_url: images.primary,
      category: category,
      color: color,
      size: null,
      fit: null,
      occasion_tags: [],
      style: null,
      description: row.name,
      rating: parseFloat(row.rating) || 0,
      rating_count: parseInt(row.ratingTotal) || 0,
      discount_percentage: parseInt(row.discount) || 0,
      original_price: mrp || price,
      product_url: row.purl,
      image_urls: images.all,
      data_source: 'myntra_csv'
    };
  } catch (error) {
    console.error('Error transforming row:', error);
    return null;
  }
}

// Smart sampling to get diverse products
function shouldIncludeProduct(
  product: Product,
  categoryCounts: Map<string, number>,
  targetPerCategory: number
): boolean {
  // Include high-quality products (rating >= 3.5)
  if (product.rating > 0 && product.rating < 3.5) {
    return false;
  }

  // Check category quota
  const currentCount = categoryCounts.get(product.category) || 0;
  return currentCount < targetPerCategory;
}

async function loadMyntraData() {
  console.log('🚀 Starting Myntra Data Load...\n');

  const csvFilePath = '/Users/romelkumar/Downloads/myntra202305041052.csv';
  const targetProducts = 50000;
  const estimatedCategories = 100;
  const targetPerCategory = Math.ceil(targetProducts / estimatedCategories);

  console.log(`Target: ${targetProducts} products`);
  console.log(`Estimated categories: ${estimatedCategories}`);
  console.log(`Target per category: ${targetPerCategory}\n`);

  // Check if CSV file exists
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV file not found: ${csvFilePath}`);
    process.exit(1);
  }

  console.log('📖 Reading CSV file...');

  const products: Product[] = [];
  const categoryCounts = new Map<string, number>();
  let rowsProcessed = 0;
  let rowsSkipped = 0;

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row: CSVRow) => {
        rowsProcessed++;

        // Show progress every 10k rows
        if (rowsProcessed % 10000 === 0) {
          console.log(`  Processed ${rowsProcessed} rows, collected ${products.length} products...`);
        }

        // Stop when we have enough products
        if (products.length >= targetProducts) {
          return;
        }

        const product = transformRow(row);

        if (!product) {
          rowsSkipped++;
          return;
        }

        if (shouldIncludeProduct(product, categoryCounts, targetPerCategory)) {
          products.push(product);
          categoryCounts.set(
            product.category,
            (categoryCounts.get(product.category) || 0) + 1
          );
        }
      })
      .on('end', async () => {
        console.log(`\n✅ CSV parsing complete!`);
        console.log(`   Rows processed: ${rowsProcessed}`);
        console.log(`   Rows skipped: ${rowsSkipped}`);
        console.log(`   Products collected: ${products.length}`);
        console.log(`   Unique categories: ${categoryCounts.size}\n`);

        // Show top 20 categories
        console.log('📊 Top 20 Categories:');
        const sortedCategories = Array.from(categoryCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20);

        sortedCategories.forEach(([category, count], index) => {
          console.log(`   ${(index + 1).toString().padStart(2)}. ${category.padEnd(30)} ${count}`);
        });

        console.log('\n💾 Loading data into BigQuery...');

        try {
          await loadToBigQuery(products);
          console.log('\n🎉 Data load complete!');
          resolve();
        } catch (error) {
          console.error('\n❌ Error loading data to BigQuery:', error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV:', error);
        reject(error);
      });
  });
}

async function loadToBigQuery(products: Product[]) {
  const projectId = process.env.GCP_PROJECT_ID;
  const dataset = process.env.BIGQUERY_DATASET || 'fashion_catalog';
  const table = process.env.BIGQUERY_TABLE || 'products';

  if (!projectId) {
    throw new Error('GCP_PROJECT_ID not configured in .env file');
  }

  console.log(`   Project: ${projectId}`);
  console.log(`   Dataset: ${dataset}`);
  console.log(`   Table: ${table}\n`);

  const bigquery = new BigQuery({ projectId });
  const tableRef = bigquery.dataset(dataset).table(table);

  // Insert in batches
  const batchSize = 1000;
  const totalBatches = Math.ceil(products.length / batchSize);

  console.log(`   Inserting ${products.length} products in ${totalBatches} batches...\n`);

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;

    try {
      await tableRef.insert(batch);
      console.log(`   ✅ Batch ${batchNumber}/${totalBatches} inserted (${batch.length} products)`);
    } catch (error) {
      const err = error as any;
      console.error(`   ❌ Error inserting batch ${batchNumber}:`, err.message);

      // Try to get more details about the error
      if (err.errors && err.errors.length > 0) {
        console.error('   First error details:', JSON.stringify(err.errors[0], null, 2));
      }

      throw err;
    }
  }
}

// Run the script
if (require.main === module) {
  loadMyntraData()
    .then(() => {
      console.log('\n✨ All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Fatal error:', error);
      process.exit(1);
    });
}

export { loadMyntraData };
