'use client';

import { Product, CompleteTheLookResponse } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { performVisualSearch } from '@/lib/api/toolkit.client';
import { VisualSearchResult } from '@/lib/types/toolkit';
import VisualSearchResults from './toolkit/VisualSearchResults';
import { getCompleteTheLook } from '@/lib/api/client';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
}

export default function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showVisualSearch, setShowVisualSearch] = useState(false);
  const [visualSearchResults, setVisualSearchResults] = useState<VisualSearchResult | null>(null);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Complete the Look state
  const [completeTheLook, setCompleteTheLook] = useState<CompleteTheLookResponse | null>(null);
  const [isLoadingOutfits, setIsLoadingOutfits] = useState(false);
  const [selectedComplementaryProduct, setSelectedComplementaryProduct] = useState<Product | null>(null);

  // Get all available images
  const allImages = product.image_urls && product.image_urls.length > 0
    ? product.image_urls
    : [product.image_url];

  const handleViewSimilar = async () => {
    setIsLoadingSimilar(true);
    setSearchError(null);

    try {
      const response = await performVisualSearch({
        productId: product.product_id,
        productImageUrl: allImages[selectedImageIndex],
        limit: 12,
      });

      setVisualSearchResults(response.result);
      setShowVisualSearch(true);
    } catch (error: any) {
      console.error('Visual search failed:', error);
      setSearchError(error.message || 'Failed to find similar items. Please try again.');
    } finally {
      setIsLoadingSimilar(false);
    }
  };

  const handleBackToProduct = () => {
    setShowVisualSearch(false);
    setVisualSearchResults(null);
    setSearchError(null);
  };

  // Load Complete the Look recommendations
  const loadCompleteTheLook = async () => {
    setIsLoadingOutfits(true);
    try {
      const response = await getCompleteTheLook(product.product_id, 4);
      setCompleteTheLook(response);
    } catch (error) {
      console.error('Failed to load Complete the Look:', error);
      // Silently fail - feature is optional
    } finally {
      setIsLoadingOutfits(false);
    }
  };

  // Load Complete the Look when modal opens
  useEffect(() => {
    loadCompleteTheLook();
  }, [product.product_id]);

  const handleComplementaryItemClick = (item: Product) => {
    setSelectedComplementaryProduct(item);
  };

  const handleBackToOriginalProduct = () => {
    setSelectedComplementaryProduct(null);
  };

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

        {!showVisualSearch ? (
          // Product Details View
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

              {/* Complete the Look */}
              {!isLoadingOutfits && completeTheLook && completeTheLook.complementary_items.length > 0 && (
                <div className="space-y-3 border-t pt-4">
                  <h3 className="font-medium text-gray-700">Complete the Look</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {completeTheLook.complementary_items.slice(0, 4).map((item) => (
                      <button
                        key={item.product_id}
                        onClick={() => handleComplementaryItemClick(item)}
                        className="group relative overflow-hidden rounded-lg border border-gray-200 transition-all hover:border-blue-500 hover:shadow-md"
                      >
                        <div className="relative aspect-[3/4] bg-gray-100">
                          <Image
                            src={item.image_url}
                            alt={item.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-medium text-gray-800 line-clamp-1">{item.brand}</p>
                          <p className="text-xs text-gray-600 line-clamp-1">{item.title}</p>
                          <p className="text-sm font-semibold text-gray-900">{formatPrice(item.price)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  {completeTheLook.total_outfits > 0 && (
                    <p className="text-xs text-gray-500 text-center">
                      Part of {completeTheLook.total_outfits} complete outfit{completeTheLook.total_outfits > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}

              {/* Loading skeleton for Complete the Look */}
              {isLoadingOutfits && (
                <div className="space-y-3 border-t pt-4">
                  <div className="h-6 w-40 animate-pulse rounded bg-gray-200"></div>
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="aspect-[3/4] animate-pulse rounded-lg bg-gray-200"></div>
                        <div className="space-y-1">
                          <div className="h-3 w-16 animate-pulse rounded bg-gray-200"></div>
                          <div className="h-3 w-full animate-pulse rounded bg-gray-200"></div>
                          <div className="h-4 w-12 animate-pulse rounded bg-gray-200"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Product ID */}
              <div className="text-sm text-gray-500">Product ID: {product.product_id}</div>

              {/* Error message */}
              {searchError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                  {searchError}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col gap-3 pt-4">
                <div className="flex gap-3">
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

                {/* View Similar button */}
                <button
                  onClick={handleViewSimilar}
                  disabled={isLoadingSimilar}
                  className="w-full rounded-lg border-2 border-indigo-500 px-6 py-3 font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoadingSimilar ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Finding Similar Items...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>View Similar Items</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Visual Search Results View
          <div className="p-6">
            {/* Back button */}
            <button
              onClick={handleBackToProduct}
              className="mb-4 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Product Details
            </button>

            {/* Visual search results */}
            {visualSearchResults && (
              <VisualSearchResults
                result={visualSearchResults}
                onProductClick={(product) => {
                  // Could navigate to that product's detail view
                  console.log('Product clicked:', product);
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Nested modal for complementary product */}
      {selectedComplementaryProduct && (
        <ProductDetailModal
          product={selectedComplementaryProduct}
          onClose={handleBackToOriginalProduct}
        />
      )}
    </div>
  );
}
