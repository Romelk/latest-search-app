'use client';

import { Chips } from '@/lib/types';

interface RefinementChipsProps {
  chips: Chips;
  selectedChips: Record<string, string>;
  onChipSelect: (category: string, value: string) => void;
}

export default function RefinementChips({
  chips,
  selectedChips,
  onChipSelect,
}: RefinementChipsProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-500">Help me narrow this down:</p>

      {/* Horizontal chip groups with inline category labels */}
      <div className="flex flex-wrap items-center gap-4">
        {Object.entries(chips).map(([category, options]) => (
          <div key={category} className="flex items-center gap-2">
            {/* Category label inline */}
            <span className="text-sm font-medium capitalize text-gray-600">
              {category}:
            </span>

            {/* Chips inline with category */}
            <div className="flex flex-wrap gap-2">
              {options.map((option) => {
                const isSelected = selectedChips[category] === option;
                return (
                  <button
                    key={option}
                    onClick={() => onChipSelect(category, option)}
                    className={`
                      rounded-lg px-4 py-2 text-sm font-medium
                      shadow-sm ring-1 transition-all
                      ${
                        isSelected
                          ? 'bg-teal-600 text-white ring-teal-600 shadow-md'
                          : 'bg-white text-gray-700 ring-gray-200 hover:bg-teal-50 hover:text-teal-700 hover:ring-teal-200'
                      }
                    `}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
