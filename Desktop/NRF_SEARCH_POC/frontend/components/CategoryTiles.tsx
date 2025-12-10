'use client';

import Image from 'next/image';
import { Category } from '@/lib/types';

interface CategoryTilesProps {
  categories: Category[];
  onCategoryClick?: (category: Category) => void;
}

export default function CategoryTiles({ categories, onCategoryClick }: CategoryTilesProps) {
  return (
    <div className="mb-8">
      <h2 className="mb-4 text-2xl font-semibold text-gray-900">Shop by Category</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {categories.map((category) => (
          <div
            key={category.id}
            onClick={() => onCategoryClick?.(category)}
            className="group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:shadow-lg"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onCategoryClick?.(category);
              }
            }}
          >
            <div className="relative aspect-[3/2]">
              <Image
                src={category.image_url}
                alt={category.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900">{category.name}</h3>
              <p className="mt-1 text-sm text-gray-600">{category.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
