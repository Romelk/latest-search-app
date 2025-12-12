#!/usr/bin/env ts-node

import { BigQuery } from '@google-cloud/bigquery';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * This script enriches product data with realistic demo data for colors.
 * Since the Myntra CSV doesn't have color information, we'll assign common
 * colors based on product categories to make the demo functional.
 */

const CLOTHING_COLORS = [
  'black', 'white', 'blue', 'red', 'green', 'yellow',
  'pink', 'purple', 'orange', 'brown', 'grey', 'navy'
];

// Color distribution biased towards common fashion colors
const COLOR_WEIGHTS = {
  'black': 20,
  'white': 15,
  'blue': 15,
  'navy': 10,
  'grey': 10,
  'red': 8,
  'green': 6,
  'pink': 5,
  'brown': 5,
  'yellow': 3,
  'purple': 2,
  'orange': 1,
};

function getRandomWeightedColor(): string {
  const totalWeight = Object.values(COLOR_WEIGHTS).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  for (const [color, weight] of Object.entries(COLOR_WEIGHTS)) {
    random -= weight;
    if (random <= 0) {
      return color;
    }
  }

  return 'black'; // fallback
}

async function enrichProductData() {
  console.log('==============================================');
  console.log('🎨 Enriching Product Data for Demo');
  console.log('==============================================\n');

  const bigquery = new BigQuery();
  const datasetId = 'fashion_catalog';
  const tableId = 'products';

  try {
    // Get all products that need color data
    console.log('📊 Fetching products without color...');
    const [products] = await bigquery.query({
      query: `
        SELECT product_id, title, category
        FROM \`${datasetId}.${tableId}\`
        WHERE data_source = 'myntra_csv'
        AND (color IS NULL OR color = '')
        AND category IN ('tshirts', 'shirts', 'dresses', 'jeans', 'trousers',
                         'tops', 'kurtas', 'kurtis', 'sweaters', 'sweatshirts',
                         'jackets', 'blazers', 'skirts', 'shorts', 'leggings')
        LIMIT 50000
      `,
      location: 'US',
    });

    console.log(`   Found ${products.length} clothing products to enrich\n`);

    if (products.length === 0) {
      console.log('✅ No products need enrichment!');
      return;
    }

    // Assign colors to products
    console.log('🎨 Assigning colors to products...');
    const colorAssignments = new Map<string, string[]>();

    for (const product of products) {
      const color = getRandomWeightedColor();
      if (!colorAssignments.has(color)) {
        colorAssignments.set(color, []);
      }
      colorAssignments.get(color)!.push(product.product_id);
    }

    console.log(`   Assigned ${products.length} products across ${colorAssignments.size} colors\n`);

    // Show color distribution
    console.log('📊 Color distribution:');
    for (const [color, ids] of Array.from(colorAssignments.entries()).sort((a, b) => b[1].length - a[1].length)) {
      console.log(`   ${color.padEnd(10)}: ${ids.length} products`);
    }
    console.log();

    // Update database in batches
    console.log('🔄 Updating database...\n');
    let totalUpdated = 0;

    for (const [color, productIds] of colorAssignments.entries()) {
      const batchSize = 1000;
      for (let i = 0; i < productIds.length; i += batchSize) {
        const batch = productIds.slice(i, i + batchSize);
        const idList = batch.map(id => `'${id}'`).join(',');

        const updateQuery = `
          UPDATE \`${datasetId}.${tableId}\`
          SET color = '${color}'
          WHERE product_id IN (${idList})
        `;

        try {
          const [job] = await bigquery.createQueryJob({
            query: updateQuery,
            location: 'US',
          });

          await job.getQueryResults();
          totalUpdated += batch.length;

          if (batch.length >= batchSize || i + batch.length === productIds.length) {
            console.log(`   ✅ ${color.padEnd(10)}: Updated ${batch.length} products (Total: ${totalUpdated}/${products.length})`);
          }
        } catch (error) {
          console.error(`   ❌ Error updating ${color}:`, error);
        }
      }
    }

    console.log('\n==============================================');
    console.log(`✅ Product data enrichment complete!`);
    console.log(`   Total products updated: ${totalUpdated}`);
    console.log('==============================================');

  } catch (error) {
    console.error('❌ Error enriching product data:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  enrichProductData()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

export { enrichProductData };
