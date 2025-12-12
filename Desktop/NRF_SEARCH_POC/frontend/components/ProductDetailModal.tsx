'use client';

import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import { useState } from 'react';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
}

export default function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Get all available images
  const allImages = product.image_urls && product.image_urls.length > 0
    ? product.image_urls
    : [product.image_url];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-600 shadow-lg hover:bg-gray-100"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid gap-6 p-6 md:grid-cols-2">
          {/* Image section */}
          <div className="space-y-4">
            {/* Main image */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100">
              <Image
                src={allImages[selectedImageIndex]}
                alt={product.title}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Image thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded border-2 transition-all ${
                      selectedImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.title} - view ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product details */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{product.title}</h2>
              <p className="mt-1 text-lg text-gray-600">{product.brand}</p>
            </div>

            {/* Rating */}
            {product.rating && product.rating > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded bg-green-600 px-2 py-1 text-white">
                  <span className="font-medium">{product.rating.toFixed(1)}</span>
                  <span>★</span>
                </div>
                {product.rating_count && product.rating_count > 0 && (
                  <span className="text-sm text-gray-600">
                    {product.rating_count.toLocaleString()} ratings
                  </span>
                )}
              </div>
            )}

            {/* Price */}
            <div className="border-t border-b border-gray-200 py-4">
              <div className="flex items-center gap-3">
                <p className="text-3xl font-bold text-gray-900">{formatPrice(product.price)}</p>
                {product.original_price && product.original_price > product.price && (
                  <>
                    <p className="text-xl text-gray-500 line-through">
                      {formatPrice(product.original_price)}
                    </p>
                    {product.discount_percentage && product.discount_percentage > 0 && (
                      <span className="rounded bg-green-100 px-2 py-1 text-sm font-medium text-green-800">
                        {product.discount_percentage}% OFF
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Product attributes */}
            <div className="space-y-2">
              {product.category && (
                <div className="flex gap-2">
                  <span className="font-medium text-gray-700">Category:</span>
                  <span className="text-gray-600 capitalize">{product.category}</span>
                </div>
              )}
              {product.color && (
                <div className="flex gap-2">
                  <span className="font-medium text-gray-700">Color:</span>
                  <span className="text-gray-600 capitalize">{product.color}</span>
                </div>
              )}
              {product.size && (
                <div className="flex gap-2">
                  <span className="font-medium text-gray-700">Size:</span>
                  <span className="text-gray-600">{product.size}</span>
                </div>
              )}
              {product.fit && (
                <div className="flex gap-2">
                  <span className="font-medium text-gray-700">Fit:</span>
                  <span className="text-gray-600 capitalize">{product.fit}</span>
                </div>
              )}
              {product.style && (
                <div className="flex gap-2">
                  <span className="font-medium text-gray-700">Style:</span>
                  <span className="text-gray-600 capitalize">{product.style}</span>
                </div>
              )}
              {product.occasion_tags && product.occasion_tags.length > 0 && (
                <div className="flex gap-2">
                  <span className="font-medium text-gray-700">Occasions:</span>
                  <div className="flex flex-wrap gap-2">
                    {product.occasion_tags.map((tag, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="space-y-2">
                <h3 className="font-medium text-gray-700">Description</h3>
                <p className="text-gray-600">{product.description}</p>
              </div>
            )}

            {/* Product ID */}
            <div className="text-sm text-gray-500">Product ID: {product.product_id}</div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-4">
              {product.product_url && (
                <a
                  href={product.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-lg bg-blue-600 px-6 py-3 text-center font-medium text-white hover:bg-blue-700"
                >
                  View on Myntra
                </a>
              )}
              <button
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
