'use client';

import React from 'react';
import { SessionUsage } from '@/lib/types/toolkit';

interface CostTrackerProps {
  usage: SessionUsage | null;
}

export default function CostTracker({ usage }: CostTrackerProps) {
  if (!usage) {
    return null;
  }

  const { total_cost, remaining_budget, usage_percentage, warning_level } = usage;

  // Determine color based on warning level
  const getColorClasses = () => {
    switch (warning_level) {
      case 'exceeded':
        return {
          bar: 'bg-red-500',
          text: 'text-red-700',
          bg: 'bg-red-50 border-red-200',
        };
      case 'critical':
        return {
          bar: 'bg-orange-500',
          text: 'text-orange-700',
          bg: 'bg-orange-50 border-orange-200',
        };
      case 'approaching':
        return {
          bar: 'bg-yellow-500',
          text: 'text-yellow-700',
          bg: 'bg-yellow-50 border-yellow-200',
        };
      default:
        return {
          bar: 'bg-green-500',
          text: 'text-green-700',
          bg: 'bg-green-50 border-green-200',
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div className={`border rounded-lg p-4 ${colors.bg}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">AI Toolkit Budget</h3>
          <p className="text-xs text-gray-600 mt-0.5">
            Session usage tracking
          </p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${colors.text}`}>
            ${total_cost.toFixed(2)}
          </p>
          <p className="text-xs text-gray-600">
            of $100.00
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden mt-3">
        <div
          className={`absolute top-0 left-0 h-full ${colors.bar} transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(usage_percentage, 100)}%` }}
        />
      </div>

      <div className="flex justify-between items-center mt-2">
        <p className="text-xs text-gray-600">
          {usage_percentage.toFixed(1)}% used
        </p>
        <p className="text-xs font-medium text-gray-700">
          ${remaining_budget.toFixed(2)} remaining
        </p>
      </div>

      {/* Warning Messages */}
      {warning_level === 'exceeded' && (
        <div className="mt-3 text-xs text-red-700 bg-red-100 border border-red-300 rounded px-2 py-1.5">
          <span className="font-semibold">Budget exceeded!</span> Start a new session to continue.
        </div>
      )}
      {warning_level === 'critical' && (
        <div className="mt-3 text-xs text-orange-700 bg-orange-100 border border-orange-300 rounded px-2 py-1.5">
          <span className="font-semibold">Critical:</span> Less than $10 remaining
        </div>
      )}
      {warning_level === 'approaching' && (
        <div className="mt-3 text-xs text-yellow-700 bg-yellow-100 border border-yellow-300 rounded px-2 py-1.5">
          <span className="font-semibold">Notice:</span> Approaching budget limit
        </div>
      )}
    </div>
  );
}
