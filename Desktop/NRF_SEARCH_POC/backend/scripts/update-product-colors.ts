#!/usr/bin/env ts-node

import { BigQuery } from '@google-cloud/bigquery';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

interface Product {
  product_id: string;
  title: string;
  color: string | null;
}

// Common color patterns to extract from product titles
const COLOR_PATTERNS = [
  { pattern: /\b(black)\b/i, color: 'black' },
  { pattern: /\b(white|off-white|cream)\b/i, color: 'white' },
  { pattern: /\b(blue|navy|indigo|sky blue)\b/i, color: 'blue' },
  { pattern: /\b(red|maroon|burgundy|crimson)\b/i, color: 'red' },
  { pattern: /\b(green|olive|emerald|mint)\b/i, color: 'green' },
  { pattern: /\b(yellow|mustard|golden)\b/i, color: 'yellow' },
  { pattern: /\b(pink|rose|blush)\b/i, color: 'pink' },
  { pattern: /\b(purple|violet|lavender)\b/i, color: 'purple' },
  { pattern: /\b(orange|rust|coral)\b/i, color: 'orange' },
  { pattern: /\b(brown|tan|beige|khaki)\b/i, color: 'brown' },
  { pattern: /\b(grey|gray|charcoal|silver)\b/i, color: 'grey' },
  { pattern: /\b(multi|multicolour|multicolor)\b/i, color: 'multicolor' },
];

function extractColor(title: string): string | null {
  const lowerTitle = title.toLowerCase();

  for (const { pattern, color } of COLOR_PATTERNS) {
    if (pattern.test(lowerTitle)) {
      return color;
    }
  }

  return null;
}

async function updateProductColors() {
  console.log('==============================================');
  console.log('🎨 Updating Product Colors from Titles');
  console.log('==============================================\n');

  const bigquery = new BigQuery();
  const datasetId = 'fashion_catalog';
  const tableId = 'products';

  try {
    // Fetch all Myntra products without color data
    console.log('📊 Fetching products without color data...');
    const [rows] = await bigquery.query({
      query: `
        SELECT product_id, title, color
        FROM \`${datasetId}.${tableId}\`
        WHERE data_source = 'myntra_csv'
        AND (color IS NULL OR color = '')
        LIMIT 50000
      `,
      location: 'US',
    });

    console.log(`   Found ${rows.length} products to update\n`);

    if (rows.length === 0) {
      console.log('✅ All products already have color data!');
      return;
    }

    // Extract colors and prepare updates
    const updates: Array<{ product_id: string; color: string }> = [];
    let extractedCount = 0;
    let noColorCount = 0;

    for (const row of rows) {
      const color = extractColor(row.title);
      if (color) {
        updates.push({ product_id: row.product_id, color });
        extractedCount++;
      } else {
        noColorCount++;
      }
    }

    console.log(`📈 Color extraction results:`);
    console.log(`   ✅ Extracted colors: ${extractedCount}`);
    console.log(`   ⚠️  No color found: ${noColorCount}`);
    console.log(`   📊 Success rate: ${((extractedCount / rows.length) * 100).toFixed(1)}%\n`);

    if (updates.length === 0) {
      console.log('⚠️  No colors to update');
      return;
    }

    // Group updates by color for efficient batch updates
    const colorGroups = new Map<string, string[]>();
    for (const { product_id, color } of updates) {
      if (!colorGroups.has(color)) {
        colorGroups.set(color, []);
      }
      colorGroups.get(color)!.push(product_id);
    }

    console.log(`🔄 Updating database in ${colorGroups.size} batches by color...\n`);

    let totalUpdated = 0;
    for (const [color, productIds] of colorGroups.entries()) {
      // BigQuery doesn't support IN with parameters well, so we'll build the query directly
      // Split into smaller batches of 1000 to avoid query size limits
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

          console.log(`   ✅ Updated ${batch.length} products to color: ${color} (Total: ${totalUpdated}/${updates.length})`);
        } catch (error) {
          console.error(`   ❌ Error updating batch for color ${color}:`, error);
        }
      }
    }

    console.log('\n==============================================');
    console.log(`✅ Color update complete!`);
    console.log(`   Total products updated: ${totalUpdated}`);
    console.log('==============================================');

  } catch (error) {
    console.error('❌ Error updating product colors:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  updateProductColors()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

export { updateProductColors };
