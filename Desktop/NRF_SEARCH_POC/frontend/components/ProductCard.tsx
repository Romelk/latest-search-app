'use client';

import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <div
      className="group cursor-pointer rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-lg"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.();
        }
      }}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-gray-100">
        <Image
          src={product.image_url}
          alt={product.title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="font-medium text-gray-900 line-clamp-2">{product.title}</h3>
        <p className="text-sm text-gray-600">{product.brand}</p>
        <p className="text-lg font-semibold text-gray-900">{formatPrice(product.price)}</p>
      </div>
    </div>
  );
}
