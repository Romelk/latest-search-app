#!/usr/bin/env ts-node

import { BigQuery } from '@google-cloud/bigquery';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Creates realistic demo products for all demo searches in DEMO_SEARCHES.md
 * This ensures every demo search returns good results
 */

interface DemoProduct {
  product_id: string;
  title: string;
  brand: string;
  price: number;
  image_url: string;
  category: string;
  color?: string;
  rating?: number;
  rating_count?: number;
  discount_percentage?: number;
  original_price?: number;
  data_source: string;
}

const DEMO_PRODUCTS: Omit<DemoProduct, 'product_id'>[] = [
  // CLEAR INTENT DEMO SEARCHES

  // 1. "men blue tshirt"
  { title: 'Men Solid Blue Cotton T-Shirt', brand: 'Roadster', price: 499, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/2488493/2018/4/24/11524551822246-Roadster-Men-Tshirts-4491524551821992-1.jpg', category: 'tshirts', color: 'blue', rating: 4.3, rating_count: 2341, discount_percentage: 40, original_price: 999, data_source: 'demo' },
  { title: 'Men Blue Printed Round Neck T-Shirt', brand: 'H&M', price: 799, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563HMPrintedRoundNeckT-shirt1.jpg', category: 'tshirts', color: 'blue', rating: 4.1, rating_count: 1523, discount_percentage: 20, original_price: 999, data_source: 'demo' },
  { title: 'Men Navy Blue Solid Polo T-Shirt', brand: 'Nike', price: 1499, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/11182492/2020/1/10/d0c698a6-1e1b-434f-b9d0-9c2c2f3e88b11578636863608-Nike-Men-Tshirts-6961578636862086-1.jpg', category: 'tshirts', color: 'blue', rating: 4.5, rating_count: 3245, discount_percentage: 25, original_price: 1999, data_source: 'demo' },

  // 2. "women red dress"
  { title: 'Women Red Floral Print A-Line Dress', brand: 'Mango', price: 1999, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17046812/2022/2/8/8c1f1f9d-4f92-4e70-8b35-dcfe5e4e4f131644298563739-Mango-Women-Red-Solid-A-Line-Midi-Dress-3331644298563292-1.jpg', category: 'dresses', color: 'red', rating: 4.2, rating_count: 1789, discount_percentage: 30, original_price: 2999, data_source: 'demo' },
  { title: 'Women Solid Red Fit & Flare Dress', brand: 'Forever 21', price: 1299, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/16762854/2022/1/13/9f8b0f5e-4d7a-4f0f-8b35-4f3e4f4f4f4f1642064563739-Forever-21-Women-Dresses-3331642064563292-1.jpg', category: 'dresses', color: 'red', rating: 4.4, rating_count: 2456, discount_percentage: 35, original_price: 1999, data_source: 'demo' },
  { title: 'Women Maroon Ethnic Maxi Dress', brand: 'Libas', price: 2499, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-Dress-1.jpg', category: 'dresses', color: 'red', rating: 4.6, rating_count: 1234, discount_percentage: 40, original_price: 4199, data_source: 'demo' },

  // 3. "nike shoes"
  { title: 'Nike Air Max 270 Running Shoes', brand: 'Nike', price: 12995, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/10339441/2019/7/26/0c8e8f5d-4e31-4b87-be2f-ae4f867e4c751564121867563-Nike-Men-Black-Air-Max-270-Running-Shoes-1.jpg', category: 'sports shoes', color: 'black', rating: 4.7, rating_count: 5678, discount_percentage: 15, original_price: 15295, data_source: 'demo' },
  { title: 'Nike Revolution 6 Sports Shoes', brand: 'Nike', price: 3495, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-Shoes-1.jpg', category: 'sports shoes', color: 'white', rating: 4.5, rating_count: 3456, discount_percentage: 20, original_price: 4369, data_source: 'demo' },

  // 4. "white formal shirt"
  { title: 'Men White Slim Fit Formal Shirt', brand: 'Van Heusen', price: 1299, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/11182492/2020/1/10/d0c698a6-1e1b-434f-b9d0-9c2c2f3e88b11578636863608-Shirt-1.jpg', category: 'shirts', color: 'white', rating: 4.4, rating_count: 3678, discount_percentage: 35, original_price: 1999, data_source: 'demo' },
  { title: 'Men White Regular Fit Cotton Formal Shirt', brand: 'Arrow', price: 1799, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-Shirt-2.jpg', category: 'shirts', color: 'white', rating: 4.6, rating_count: 4523, discount_percentage: 40, original_price: 2999, data_source: 'demo' },
  { title: 'Men White Printed Formal Shirt', brand: 'Louis Philippe', price: 2199, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-Shirt-3.jpg', category: 'shirts', color: 'white', rating: 4.5, rating_count: 2987, discount_percentage: 30, original_price: 3142, data_source: 'demo' },

  // 5. "black jeans"
  { title: 'Men Black Slim Fit Jeans', brand: 'Levi\'s', price: 2999, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/2488493/2018/4/24/11524551822246-Levis-Men-Jeans-1.jpg', category: 'jeans', color: 'black', rating: 4.6, rating_count: 6789, discount_percentage: 40, original_price: 4999, data_source: 'demo' },
  { title: 'Men Black Skinny Fit Stretchable Jeans', brand: 'Jack & Jones', price: 2499, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-Jeans-1.jpg', category: 'jeans', color: 'black', rating: 4.4, rating_count: 4567, discount_percentage: 50, original_price: 4999, data_source: 'demo' },
  { title: 'Men Black Regular Fit Mid-Rise Jeans', brand: 'Wrangler', price: 1999, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-Jeans-2.jpg', category: 'jeans', color: 'black', rating: 4.3, rating_count: 3456, discount_percentage: 45, original_price: 3636, data_source: 'demo' },

  // AMBIGUOUS SEARCHES - Add variety to trigger refinement chips

  // For "shirt" - mix of casual and formal
  { title: 'Men Blue Casual Shirt', brand: 'US Polo', price: 1499, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-Shirt-4.jpg', category: 'shirts', color: 'blue', rating: 4.2, rating_count: 2345, discount_percentage: 30, original_price: 2141, data_source: 'demo' },
  { title: 'Men Pink Formal Shirt', brand: 'Peter England', price: 999, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-Shirt-5.jpg', category: 'shirts', color: 'pink', rating: 4.1, rating_count: 1789, discount_percentage: 50, original_price: 1998, data_source: 'demo' },
  { title: 'Men Green Checked Casual Shirt', brand: 'Allen Solly', price: 1299, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-Shirt-6.jpg', category: 'shirts', color: 'green', rating: 4.3, rating_count: 2156, discount_percentage: 35, original_price: 1998, data_source: 'demo' },

  // For "dress" - different occasions
  { title: 'Women Black Evening Gown', brand: 'Zara', price: 3999, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-Dress-2.jpg', category: 'dresses', color: 'black', rating: 4.7, rating_count: 1567, discount_percentage: 25, original_price: 5332, data_source: 'demo' },
  { title: 'Women Blue Casual A-Line Dress', brand: 'H&M', price: 1499, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-Dress-3.jpg', category: 'dresses', color: 'blue', rating: 4.2, rating_count: 2789, discount_percentage: 40, original_price: 2498, data_source: 'demo' },
  { title: 'Women White Party Dress', brand: 'Vero Moda', price: 2499, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-Dress-4.jpg', category: 'dresses', color: 'white', rating: 4.4, rating_count: 1895, discount_percentage: 30, original_price: 3570, data_source: 'demo' },

  // For "shoes" - sports, casual, formal
  { title: 'Men Brown Formal Leather Shoes', brand: 'Clarks', price: 4999, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-Shoes-2.jpg', category: 'formal shoes', color: 'brown', rating: 4.6, rating_count: 3456, discount_percentage: 20, original_price: 6248, data_source: 'demo' },
  { title: 'Women Pink Casual Sneakers', brand: 'Puma', price: 2999, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-Shoes-3.jpg', category: 'casual shoes', color: 'pink', rating: 4.3, rating_count: 2567, discount_percentage: 35, original_price: 4613, data_source: 'demo' },

  // For "jacket" - different types
  { title: 'Men Black Leather Jacket', brand: 'Pepe Jeans', price: 5999, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-Jacket-1.jpg', category: 'jackets', color: 'black', rating: 4.5, rating_count: 1234, discount_percentage: 40, original_price: 9998, data_source: 'demo' },
  { title: 'Men Navy Blue Denim Jacket', brand: 'Levi\'s', price: 3499, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-Jacket-2.jpg', category: 'jackets', color: 'navy', rating: 4.4, rating_count: 2345, discount_percentage: 30, original_price: 4998, data_source: 'demo' },
  { title: 'Women Grey Winter Jacket', brand: 'Only', price: 2999, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-Jacket-3.jpg', category: 'jackets', color: 'grey', rating: 4.6, rating_count: 1789, discount_percentage: 35, original_price: 4613, data_source: 'demo' },

  // For "tshirt" - more variety
  { title: 'Women Pink Graphic T-Shirt', brand: 'Zara', price: 799, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-TShirt-1.jpg', category: 'tshirts', color: 'pink', rating: 4.2, rating_count: 3456, discount_percentage: 20, original_price: 998, data_source: 'demo' },
  { title: 'Men Grey Plain Round Neck T-Shirt', brand: 'Puma', price: 999, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-TShirt-2.jpg', category: 'tshirts', color: 'grey', rating: 4.3, rating_count: 4567, discount_percentage: 30, original_price: 1427, data_source: 'demo' },
  { title: 'Boys Green Sports T-Shirt', brand: 'Nike', price: 599, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-TShirt-3.jpg', category: 'tshirts', color: 'green', rating: 4.4, rating_count: 2345, discount_percentage: 25, original_price: 798, data_source: 'demo' },

  // GOAL INTENT - Interview outfits
  { title: 'Men Navy Blue Formal Blazer', brand: 'Raymond', price: 5999, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-Blazer-1.jpg', category: 'blazers', color: 'navy', rating: 4.7, rating_count: 1567, discount_percentage: 35, original_price: 9229, data_source: 'demo' },
  { title: 'Men Black Formal Trousers', brand: 'Van Heusen', price: 1799, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-Trousers-1.jpg', category: 'trousers', color: 'black', rating: 4.5, rating_count: 3456, discount_percentage: 40, original_price: 2998, data_source: 'demo' },
  { title: 'Women Black Formal Blazer', brand: 'Marks & Spencer', price: 3999, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-Blazer-2.jpg', category: 'blazers', color: 'black', rating: 4.6, rating_count: 987, discount_percentage: 30, original_price: 5712, data_source: 'demo' },
  { title: 'Women Grey Formal Trousers', brand: 'Arrow', price: 1499, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-Trousers-2.jpg', category: 'trousers', color: 'grey', rating: 4.4, rating_count: 2345, discount_percentage: 45, original_price: 2725, data_source: 'demo' },

  // Wedding outfits
  { title: 'Women Maroon Silk Saree', brand: 'Fabindia', price: 4999, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-Saree-1.jpg', category: 'sarees', color: 'red', rating: 4.8, rating_count: 1234, discount_percentage: 20, original_price: 6248, data_source: 'demo' },
  { title: 'Men Cream Silk Kurta', brand: 'Manyavar', price: 2999, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-Kurta-1.jpg', category: 'kurtas', color: 'white', rating: 4.6, rating_count: 1789, discount_percentage: 25, original_price: 3998, data_source: 'demo' },

  // Casual/weekend wear
  { title: 'Boys Blue Denim Shorts', brand: 'UCB', price: 799, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-Shorts-1.jpg', category: 'shorts', color: 'blue', rating: 4.2, rating_count: 1456, discount_percentage: 40, original_price: 1331, data_source: 'demo' },
  { title: 'Boys Green Casual T-Shirt', brand: 'Pantaloons Junior', price: 499, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-TShirt-4.jpg', category: 'tshirts', color: 'green', rating: 4.1, rating_count: 2345, discount_percentage: 50, original_price: 998, data_source: 'demo' },

  // Gym/workout
  { title: 'Men Black Track Pants', brand: 'Adidas', price: 1999, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-TrackPants-1.jpg', category: 'track pants', color: 'black', rating: 4.5, rating_count: 3456, discount_percentage: 30, original_price: 2855, data_source: 'demo' },
  { title: 'Men Grey Sports T-Shirt', brand: 'Nike', price: 1299, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-TShirt-5.jpg', category: 'tshirts', color: 'grey', rating: 4.4, rating_count: 2789, discount_percentage: 35, original_price: 1998, data_source: 'demo' },
  { title: 'Women Pink Sports Tights', brand: 'Puma', price: 1499, image_url: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17284780/2022/2/25/7e6f9f63-4e31-4b87-be2f-ae4f867e4c751645774867563-Tights-1.jpg', category: 'tights', color: 'pink', rating: 4.3, rating_count: 1890, discount_percentage: 40, original_price: 2498, data_source: 'demo' },
];

async function createDemoProducts() {
  console.log('==============================================');
  console.log('🎯 Creating Demo Products for DEMO_SEARCHES.md');
  console.log('==============================================\n');

  const bigquery = new BigQuery();
  const datasetId = 'fashion_catalog';
  const tableId = 'products';
  const tableRef = bigquery.dataset(datasetId).table(tableId);

  try {
    // First, delete existing demo products
    console.log('🧹 Cleaning up existing demo products...');
    await bigquery.query({
      query: `DELETE FROM \`${datasetId}.${tableId}\` WHERE data_source = 'demo'`,
      location: 'US',
    });
    console.log('   ✅ Existing demo products removed\n');

    // Add product_id to each product
    const productsWithIds: DemoProduct[] = DEMO_PRODUCTS.map(p => ({
      ...p,
      product_id: `DEMO-${uuidv4()}`,
    }));

    console.log(`📦 Creating ${productsWithIds.length} demo products...\n`);

    // Insert in batches
    const batchSize = 500;
    for (let i = 0; i < productsWithIds.length; i += batchSize) {
      const batch = productsWithIds.slice(i, i + batchSize);
      await tableRef.insert(batch);
      console.log(`   ✅ Inserted batch ${Math.floor(i / batchSize) + 1} (${batch.length} products)`);
    }

    console.log('\n📊 Demo products created by category:');
    const categoryCount = new Map<string, number>();
    for (const product of productsWithIds) {
      categoryCount.set(product.category, (categoryCount.get(product.category) || 0) + 1);
    }
    for (const [category, count] of Array.from(categoryCount.entries()).sort((a, b) => b[1] - a[1])) {
      console.log(`   ${category.padEnd(20)}: ${count} products`);
    }

    console.log('\n🎨 Demo products created by color:');
    const colorCount = new Map<string, number>();
    for (const product of productsWithIds) {
      if (product.color) {
        colorCount.set(product.color, (colorCount.get(product.color) || 0) + 1);
      }
    }
    for (const [color, count] of Array.from(colorCount.entries()).sort((a, b) => b[1] - a[1])) {
      console.log(`   ${color?.padEnd(20)}: ${count} products`);
    }

    console.log('\n==============================================');
    console.log(`✅ Successfully created ${productsWithIds.length} demo products!`);
    console.log('==============================================');

  } catch (error) {
    console.error('❌ Error creating demo products:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  createDemoProducts()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

export { createDemoProducts };
