'use client';

import React, { useState, useEffect } from 'react';
import { StyleAnalysisResult, CompatibilityResult, SessionUsage, UploadedImage } from '@/lib/types/toolkit';
import { analyzeStyle, checkCompatibility, getSessionUsage } from '@/lib/api/toolkit.client';
import ImageUploadZone from './toolkit/ImageUploadZone';
import CostTracker from './toolkit/CostTracker';
import StyleAnalysisCard from './toolkit/StyleAnalysisCard';
import CompatibilityScoreCard from './toolkit/CompatibilityScoreCard';

type ToolType = 'style_analyzer' | 'compatibility_checker' | null;

export default function FashionToolkitPanel() {
  const [selectedTool, setSelectedTool] = useState<ToolType>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [styleAnalysis, setStyleAnalysis] = useState<StyleAnalysisResult | null>(null);
  const [compatibilityAnalysis, setCompatibilityAnalysis] = useState<CompatibilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionUsage, setSessionUsage] = useState<SessionUsage | null>(null);

  // Load initial session usage
  useEffect(() => {
    loadSessionUsage();
  }, []);

  const loadSessionUsage = async () => {
    try {
      const usage = await getSessionUsage();
      setSessionUsage(usage);
    } catch (err) {
      console.error('Failed to load session usage:', err);
    }
  };

  const handleToolSelect = (tool: ToolType) => {
    setSelectedTool(tool);
    setImages([]);
    setStyleAnalysis(null);
    setCompatibilityAnalysis(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!selectedTool) {
      setError('Please select a tool first');
      return;
    }

    if (selectedTool === 'style_analyzer' && images.length === 0) {
      setError('Please upload an image first');
      return;
    }

    if (selectedTool === 'compatibility_checker' && images.length < 2) {
      setError('Please upload 2 images to check compatibility');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setStyleAnalysis(null);
    setCompatibilityAnalysis(null);

    try {
      if (selectedTool === 'style_analyzer') {
        const response = await analyzeStyle(images[0].dataUrl);
        setStyleAnalysis(response.result);
        setSessionUsage(response.session_usage);
      } else if (selectedTool === 'compatibility_checker') {
        const response = await checkCompatibility(images[0].dataUrl, images[1].dataUrl);
        setCompatibilityAnalysis(response.result);
        setSessionUsage(response.session_usage);
      }
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError(err.message || 'Failed to analyze. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setImages([]);
    setStyleAnalysis(null);
    setCompatibilityAnalysis(null);
    setError(null);
  };

  const getMaxImages = () => {
    if (selectedTool === 'style_analyzer') return 1;
    if (selectedTool === 'compatibility_checker') return 2;
    return 1;
  };

  const getButtonText = () => {
    if (isAnalyzing) {
      return selectedTool === 'style_analyzer' ? 'Analyzing Your Style...' : 'Checking Compatibility...';
    }
    if (sessionUsage?.warning_level === 'exceeded') {
      return 'Budget Exceeded - Start New Session';
    }
    return selectedTool === 'style_analyzer' ? 'Analyze My Style with AI' : 'Check Compatibility';
  };

  const hasResult = styleAnalysis || compatibilityAnalysis;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center space-x-2">
              <span>✨</span>
              <span>AI Fashion Toolkit</span>
            </h2>
            <p className="text-indigo-100 text-sm mt-1">
              Powered by Claude Vision - Advanced fashion analysis
            </p>
          </div>
          <div className="text-3xl">👔</div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Cost Tracker */}
        <CostTracker usage={sessionUsage} />

        {/* Tool Selection */}
        {!selectedTool && !hasResult && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Choose Your Tool</h3>

            {/* Feature 1: Style Analyzer */}
            <button
              onClick={() => handleToolSelect('style_analyzer')}
              className="w-full text-left bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 hover:border-indigo-400 rounded-lg p-4 transition-all group"
            >
              <div className="flex items-start space-x-3">
                <div className="text-3xl group-hover:scale-110 transition-transform">👔</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Analyze My Style</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Upload a photo of your outfit to get AI-powered style analysis including colors,
                    category, occasion suitability, and personalized tips.
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>📸 1 image</span>
                    <span>💰 $0.03</span>
                    <span>⏱️ ~10 seconds</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Feature 2: Compatibility Checker */}
            <button
              onClick={() => handleToolSelect('compatibility_checker')}
              className="w-full text-left bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 hover:border-blue-400 rounded-lg p-4 transition-all group"
            >
              <div className="flex items-start space-x-3">
                <div className="text-3xl group-hover:scale-110 transition-transform">🔄</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Outfit Compatibility Checker</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Upload photos of two clothing items and get AI analysis on how well they match.
                    Includes color harmony, style coherence, and styling tips.
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>📸 2 images</span>
                    <span>💰 $0.06</span>
                    <span>⏱️ ~15 seconds</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Coming Soon */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-600 mb-3">Coming Soon</h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: '🔍', name: 'Visual Search' },
                  { icon: '👗', name: 'Virtual Try-On' },
                  { icon: '📊', name: 'Style Profile' },
                ].map((feature) => (
                  <div
                    key={feature.name}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-2 opacity-60 text-center"
                  >
                    <div className="text-xl mb-1">{feature.icon}</div>
                    <div className="text-xs font-medium text-gray-700">{feature.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Selected Tool View */}
        {selectedTool && !hasResult && (
          <div className="space-y-4">
            {/* Back Button */}
            <button
              onClick={() => setSelectedTool(null)}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center space-x-1"
            >
              <span>←</span>
              <span>Back to tool selection</span>
            </button>

            {/* Current Tool Header */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">
                  {selectedTool === 'style_analyzer' ? '👔' : '🔄'}
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedTool === 'style_analyzer' ? 'Analyze My Style' : 'Outfit Compatibility Checker'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedTool === 'style_analyzer'
                      ? 'Upload 1 outfit photo'
                      : 'Upload 2 clothing item photos'}
                  </p>
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <ImageUploadZone
              maxImages={getMaxImages()}
              onImagesChange={setImages}
              disabled={isAnalyzing}
            />

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Analyze Button */}
            {images.length === getMaxImages() && (
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || sessionUsage?.warning_level === 'exceeded'}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
                  isAnalyzing || sessionUsage?.warning_level === 'exceeded'
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
                }`}
              >
                {isAnalyzing ? (
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{getButtonText()}</span>
                  </span>
                ) : (
                  getButtonText()
                )}
              </button>
            )}
          </div>
        )}

        {/* Results View */}
        {hasResult && (
          <div className="space-y-4">
            {/* Style Analysis Result */}
            {styleAnalysis && (
              <StyleAnalysisCard
                analysis={styleAnalysis}
                imagePreview={images[0]?.preview}
              />
            )}

            {/* Compatibility Result */}
            {compatibilityAnalysis && (
              <CompatibilityScoreCard
                compatibility={compatibilityAnalysis}
                image1Preview={images[0]?.preview}
                image2Preview={images[1]?.preview}
              />
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  handleReset();
                  setSelectedTool(null);
                }}
                className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Try Different Tool
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2 px-4 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium rounded-lg transition-colors"
              >
                Analyze Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
