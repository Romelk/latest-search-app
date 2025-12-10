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
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Help me narrow this down
      </h3>
      <div className="space-y-4">
        {Object.entries(chips).map(([category, options]) => (
          <div key={category}>
            <p className="mb-2 text-sm font-medium capitalize text-gray-700">{category}</p>
            <div className="flex flex-wrap gap-2">
              {options.map((option) => {
                const isSelected = selectedChips[category] === option;
                return (
                  <button
                    key={option}
                    onClick={() => onChipSelect(category, option)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
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
