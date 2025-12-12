'use client';

import React from 'react';
import { CompatibilityResult } from '@/lib/types/toolkit';

interface CompatibilityScoreCardProps {
  compatibility: CompatibilityResult;
  image1Preview?: string;
  image2Preview?: string;
}

export default function CompatibilityScoreCard({
  compatibility,
  image1Preview,
  image2Preview,
}: CompatibilityScoreCardProps) {
  const {
    compatibility_score,
    color_harmony,
    style_match,
    occasion_fit,
    overall_verdict,
    improvement_suggestions,
    styling_tips,
  } = compatibility;

  // Determine verdict color and icon
  const getVerdictStyles = () => {
    switch (overall_verdict) {
      case 'excellent':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-300',
          icon: '🌟',
          message: 'Perfect Match!',
        };
      case 'good':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          border: 'border-blue-300',
          icon: '👍',
          message: 'Great Combination',
        };
      case 'acceptable':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-300',
          icon: '👌',
          message: 'Works Well',
        };
      case 'poor':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-300',
          icon: '⚠️',
          message: 'Needs Improvement',
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-300',
          icon: '❓',
          message: 'Unknown',
        };
    }
  };

  const verdictStyles = getVerdictStyles();

  // Get color for score (0-100)
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Get color for sub-score (0-10)
  const getSubScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-blue-500';
    if (score >= 4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Image Previews */}
      {(image1Preview || image2Preview) && (
        <div className="relative grid grid-cols-2 gap-2 p-4 bg-gray-50">
          {image1Preview && (
            <div className="relative">
              <img
                src={image1Preview}
                alt="Item 1"
                className="w-full h-32 object-cover rounded-lg"
              />
              <div className="absolute top-2 left-2 bg-white px-2 py-1 rounded text-xs font-semibold">
                Item 1
              </div>
            </div>
          )}
          {image2Preview && (
            <div className="relative">
              <img
                src={image2Preview}
                alt="Item 2"
                className="w-full h-32 object-cover rounded-lg"
              />
              <div className="absolute top-2 left-2 bg-white px-2 py-1 rounded text-xs font-semibold">
                Item 2
              </div>
            </div>
          )}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg">
            <span className="text-2xl">🔄</span>
          </div>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Overall Score */}
        <div className="text-center">
          <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full border-2 ${verdictStyles.border} ${verdictStyles.bg}`}>
            <span className="text-2xl">{verdictStyles.icon}</span>
            <span className={`font-bold ${verdictStyles.text}`}>{verdictStyles.message}</span>
          </div>

          <div className="mt-4">
            <div className="text-5xl font-bold text-gray-900">{compatibility_score}</div>
            <div className="text-sm text-gray-600 mt-1">Compatibility Score</div>
          </div>

          {/* Score Bar */}
          <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
            <div
              className={`h-4 rounded-full transition-all ${getScoreColor(compatibility_score)}`}
              style={{ width: `${compatibility_score}%` }}
            />
          </div>
        </div>

        {/* Detailed Scores */}
        <div className="grid grid-cols-2 gap-4">
          {/* Color Harmony */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xl">🎨</span>
              <div className="text-xs font-semibold text-gray-600 uppercase">Color Harmony</div>
            </div>
            <div className="flex items-baseline space-x-1 mb-2">
              <span className="text-2xl font-bold text-gray-900">{color_harmony.score}</span>
              <span className="text-sm text-gray-500">/10</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getSubScoreColor(color_harmony.score)}`}
                style={{ width: `${(color_harmony.score / 10) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">{color_harmony.reasoning}</p>
          </div>

          {/* Style Match */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xl">👔</span>
              <div className="text-xs font-semibold text-gray-600 uppercase">Style Match</div>
            </div>
            <div className="flex items-baseline space-x-1 mb-2">
              <span className="text-2xl font-bold text-gray-900">{style_match.score}</span>
              <span className="text-sm text-gray-500">/10</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getSubScoreColor(style_match.score)}`}
                style={{ width: `${(style_match.score / 10) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">{style_match.reasoning}</p>
          </div>
        </div>

        {/* Suitable Occasions */}
        {occasion_fit.compatible_occasions && occasion_fit.compatible_occasions.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Perfect For</h4>
            <div className="flex flex-wrap gap-2">
              {occasion_fit.compatible_occasions.map((occasion, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 capitalize"
                >
                  {occasion}
                </span>
              ))}
            </div>
            {occasion_fit.reasoning && (
              <p className="text-sm text-gray-600 mt-2">{occasion_fit.reasoning}</p>
            )}
          </div>
        )}

        {/* Improvement Suggestions */}
        {improvement_suggestions && improvement_suggestions.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">How to Improve</h4>
            <ul className="space-y-2">
              {improvement_suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-orange-500 mt-0.5">💡</span>
                  <span className="text-sm text-gray-700">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Styling Tips */}
        {styling_tips && styling_tips.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Styling Tips</h4>
            <ul className="space-y-2">
              {styling_tips.map((tip, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
