'use client';

import { SearchFilters } from '@/lib/types';

interface FiltersBarProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
}

export default function FiltersBar({ filters, onFilterChange }: FiltersBarProps) {
  const categories = ['Shirt', 'Trousers', 'Kurti', 'Dress', 'Jeans', 'Shoes'];
  const colors = ['Blue', 'White', 'Black', 'Grey', 'Beige', 'Olive', 'Red'];
  const brands = ['Peter England', 'Van Heusen', 'Arrow', 'Allen Solly', 'Fabindia', 'Biba', 'Nike'];
  const fits = ['Regular', 'Slim', 'Comfort'];
  const styles = ['Formal', 'Casual', 'Ethnic', 'Smart Casual'];

  return (
    <div className="mb-6 flex flex-wrap gap-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Category</label>
        <select
          value={filters.category || ''}
          onChange={(e) => onFilterChange({ ...filters, category: e.target.value || undefined })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
        >
          <option value="">All</option>
          {categories.map((cat) => (
            <option key={cat} value={cat.toLowerCase()}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Color</label>
        <select
          value={filters.color || ''}
          onChange={(e) => onFilterChange({ ...filters, color: e.target.value || undefined })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
        >
          <option value="">All</option>
          {colors.map((color) => (
            <option key={color} value={color.toLowerCase()}>
              {color}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Brand</label>
        <select
          value={filters.brand || ''}
          onChange={(e) => onFilterChange({ ...filters, brand: e.target.value || undefined })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
        >
          <option value="">All</option>
          {brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Fit</label>
        <select
          value={filters.fit || ''}
          onChange={(e) => onFilterChange({ ...filters, fit: e.target.value || undefined })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
        >
          <option value="">All</option>
          {fits.map((fit) => (
            <option key={fit} value={fit.toLowerCase()}>
              {fit}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Style</label>
        <select
          value={filters.style || ''}
          onChange={(e) => onFilterChange({ ...filters, style: e.target.value || undefined })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
        >
          <option value="">All</option>
          {styles.map((style) => (
            <option key={style} value={style.toLowerCase()}>
              {style}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Price Range</label>
        <select
          onChange={(e) => {
            const value = e.target.value;
            if (value === '0-2000') {
              onFilterChange({ ...filters, price_min: 0, price_max: 2000 });
            } else if (value === '2000-4000') {
              onFilterChange({ ...filters, price_min: 2000, price_max: 4000 });
            } else if (value === '4000+') {
              onFilterChange({ ...filters, price_min: 4000, price_max: undefined });
            } else {
              onFilterChange({ ...filters, price_min: undefined, price_max: undefined });
            }
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
        >
          <option value="">All</option>
          <option value="0-2000">Under ₹2,000</option>
          <option value="2000-4000">₹2,000 - ₹4,000</option>
          <option value="4000+">Above ₹4,000</option>
        </select>
      </div>
    </div>
  );
}
