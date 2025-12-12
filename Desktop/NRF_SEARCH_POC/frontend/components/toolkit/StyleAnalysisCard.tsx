'use client';

import React from 'react';
import { StyleAnalysisResult } from '@/lib/types/toolkit';

interface StyleAnalysisCardProps {
  analysis: StyleAnalysisResult;
  imagePreview?: string;
}

export default function StyleAnalysisCard({ analysis, imagePreview }: StyleAnalysisCardProps) {
  const {
    dominant_colors,
    color_hex_codes,
    style_category,
    clothing_items,
    fit_type,
    occasions,
    season,
    formality_score,
    style_confidence,
    improvement_tips,
  } = analysis;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Header with Image */}
      {imagePreview && (
        <div className="relative h-48 bg-gray-100">
          <img
            src={imagePreview}
            alt="Analyzed outfit"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm font-semibold text-indigo-600">
            Analysis Complete
          </div>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Style Category */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Your Style</h3>
          <div className="flex items-center space-x-2">
            <span className="text-3xl">👔</span>
            <span className="text-2xl font-bold text-indigo-600 capitalize">
              {style_category}
            </span>
          </div>
          <div className="flex items-center space-x-4 mt-2">
            <div className="text-sm text-gray-600">
              <span className="font-semibold">Fit:</span> {fit_type}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-semibold">Season:</span> {season}
            </div>
          </div>
        </div>

        {/* Color Palette */}
        {color_hex_codes && color_hex_codes.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Color Palette</h4>
            <div className="flex space-x-2">
              {color_hex_codes.slice(0, 6).map((hex, index) => (
                <div key={index} className="flex flex-col items-center space-y-1">
                  <div
                    className="w-12 h-12 rounded-lg border-2 border-gray-200 shadow-sm"
                    style={{ backgroundColor: hex }}
                    title={dominant_colors[index] || hex}
                  />
                  <span className="text-xs text-gray-600 capitalize">
                    {dominant_colors[index] || hex}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scores */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase mb-1">
              Formality
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-bold text-gray-900">{formality_score}</span>
              <span className="text-sm text-gray-500">/10</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all"
                style={{ width: `${(formality_score / 10) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase mb-1">
              Confidence
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-bold text-gray-900">{style_confidence}</span>
              <span className="text-sm text-gray-500">/10</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${(style_confidence / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Clothing Items */}
        {clothing_items && clothing_items.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Detected Items</h4>
            <div className="flex flex-wrap gap-2">
              {clothing_items.map((item, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Occasions */}
        {occasions && occasions.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Suitable Occasions</h4>
            <div className="flex flex-wrap gap-2">
              {occasions.map((occasion, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 capitalize"
                >
                  {occasion}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Improvement Tips */}
        {improvement_tips && improvement_tips.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Styling Tips</h4>
            <ul className="space-y-2">
              {improvement_tips.map((tip, index) => (
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
