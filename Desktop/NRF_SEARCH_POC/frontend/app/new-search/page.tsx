'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { generateSessionId } from '@/lib/utils';

type IntentMode = 'CLEAR' | 'AMBIGUOUS' | 'GOAL' | null;

interface PopularSearch {
  query: string;
  count: number;
}

export default function NewSearchPage() {
  const [sessionId, setSessionId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [intentMode, setIntentMode] = useState<IntentMode>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasChatMessage, setHasChatMessage] = useState(false);
  const [chatInputValue, setChatInputValue] = useState('');
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>([
    { query: 'Blue formal shirt', count: 1523 },
    { query: 'Running shoes', count: 1204 },
    { query: 'Wedding outfit', count: 892 },
    { query: 'Casual wear', count: 765 },
    { query: 'Summer dresses', count: 654 },
    { query: 'Office blazer', count: 543 },
  ]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = sessionStorage.getItem('sessionId') || generateSessionId();
      sessionStorage.setItem('sessionId', id);
      setSessionId(id);
    }
  }, []);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setSearchQuery(query);
    setHasSearched(true);
    setIsChatOpen(true); // Auto-open chat after search

    // TODO: Call intent detection API
    // For now, simple heuristic
    if (query.split(' ').length > 10) {
      setIntentMode('GOAL');
    } else if (query.split(' ').length > 3) {
      setIntentMode('CLEAR');
    } else {
      setIntentMode('AMBIGUOUS');
    }
  };

  const handlePopularSearchClick = (query: string) => {
    handleSearch(query);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const handleChatInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputValue.trim()) return;

    // Transform from tiles to conversation mode
    setHasChatMessage(true);
    // TODO: Send message to backend
    console.log('Chat message:', chatInputValue);
    setChatInputValue('');
  };

  // State 1: Initial Landing (Before Search)
  if (!hasSearched) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
        {/* Header */}
        <div className="absolute left-8 top-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600">
            <span className="text-2xl font-bold text-white">D</span>
          </div>
          <span className="text-xl font-semibold text-gray-900">Demo Retailer</span>
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex max-w-4xl flex-col items-center px-8 text-center"
        >
          {/* Tagline */}
          <h1 className="mb-12 text-4xl font-bold leading-tight tracking-tight md:text-5xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 bg-clip-text text-transparent">
            Welcome to the Search that Understands YOU
          </h1>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="w-full max-w-2xl mb-8">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ask anything..."
                className="w-full px-6 py-5 text-lg rounded-full border-2 border-purple-200 focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-100 transition-all shadow-lg"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full hover:from-purple-600 hover:to-pink-700 transition-all"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </form>

          {/* Popular Searches */}
          <div className="flex flex-wrap gap-3 justify-center max-w-3xl">
            {popularSearches.map((search, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePopularSearchClick(search.query)}
                className="px-5 py-2.5 bg-white border-2 border-purple-200 text-purple-700 rounded-full hover:bg-purple-50 hover:border-purple-400 transition-all shadow-md hover:shadow-lg font-medium text-sm"
              >
                {search.query}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <div className="absolute bottom-8 text-sm text-gray-500">
          Powered by Google Cloud Vertex AI
        </div>

        {/* Floating Chat Button (Always Available - Initial State) */}
        {!isChatOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full shadow-2xl flex items-center justify-center z-40 hover:shadow-purple-500/50 transition-all"
          >
            <img
              src="/icons/coco-logo.png"
              alt="Open Coco Chat"
              className="w-10 h-10 rounded-full"
            />
          </motion.button>
        )}

        {/* Floating Chat Bubble (Initial State) */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-6 right-6 w-[520px] h-[760px] bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 rounded-3xl shadow-2xl border border-purple-200/50 flex flex-col overflow-hidden z-50"
            >
              {/* Chat Header */}
              <div className="px-6 py-4 bg-white/80 backdrop-blur-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-md overflow-hidden bg-white border-2 border-purple-100">
                      <img
                        src="/icons/coco-logo.png"
                        alt="Coco AI Assistant"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Coco</h3>
                    <p className="text-xs text-gray-500">AI Shopping Assistant</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-white/50 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Main Content Area */}
              <div className={`flex-1 px-6 py-6 ${hasChatMessage ? 'overflow-y-auto' : 'overflow-hidden'}`}>
                {!hasChatMessage ? (
                  <>
                    {/* Greeting */}
                    <div className="text-center mb-6">
                      <p className="text-sm text-gray-500 mb-1">Good day!</p>
                      <h2 className="text-2xl font-bold text-gray-900">How can I help you today?</h2>
                    </div>

                    {/* Search Input */}
                    <form onSubmit={handleChatInputSubmit} className="mb-6">
                      <div className="relative">
                        <input
                          type="text"
                          value={chatInputValue}
                          onChange={(e) => setChatInputValue(e.target.value)}
                          placeholder="Ask anything..."
                          className="w-full pl-4 pr-12 py-3.5 rounded-2xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none focus:ring-0 text-sm transition-all bg-white shadow-sm"
                        />
                        <button
                          type="submit"
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all flex items-center justify-center"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                      </div>
                    </form>

                    {/* Capability Tiles - Grid Layout */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Left Column - 2 tiles stretched vertically */}
                      <div className="flex flex-col gap-3">
                        {[
                          { icon: 'analyze-style.png', label: 'Analyze Style', desc: 'AI analysis of your fashion', route: '/toolkit?tool=analyze-style' },
                          { icon: 'match-checker.png', label: 'Match Checker', desc: 'Do these items go together?', route: '/toolkit?tool=match-checker' }
                        ].map((tool, idx) => (
                          <motion.button
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => window.location.href = tool.route}
                            className="flex-1 flex flex-col items-center justify-center gap-3 p-5 bg-white rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all group"
                          >
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center flex-shrink-0">
                              <img
                                src={`/icons/${tool.icon}`}
                                alt={tool.label}
                                className="w-8 h-8"
                              />
                            </div>
                            <div className="text-center">
                              <h3 className="font-semibold text-gray-900 text-sm mb-1">{tool.label}</h3>
                              <p className="text-xs text-gray-500 leading-tight">{tool.desc}</p>
                            </div>
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </motion.button>
                        ))}
                      </div>

                      {/* Right Column - 3 tiles */}
                      <div className="flex flex-col gap-3">
                        {[
                          { icon: 'visual-search.png', label: 'Visual Search', desc: 'Find similar items by image', route: '/toolkit?tool=visual-search' },
                          { icon: 'try-on.png', label: 'Try-On', desc: 'Virtual fitting room', route: '/toolkit?tool=try-on' },
                          { icon: 'style-profile.png', label: 'Style Profile', desc: 'Build your fashion DNA', route: '/toolkit?tool=style-profile' }
                        ].map((tool, idx) => (
                          <motion.button
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: (idx + 2) * 0.05 }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => window.location.href = tool.route}
                            className="flex-1 flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all group"
                          >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center flex-shrink-0">
                              <img
                                src={`/icons/${tool.icon}`}
                                alt={tool.label}
                                className="w-7 h-7"
                              />
                            </div>
                            <div className="text-center">
                              <h3 className="font-semibold text-gray-900 text-xs mb-0.5">{tool.label}</h3>
                              <p className="text-[11px] text-gray-500 leading-tight">{tool.desc}</p>
                            </div>
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Greeting - stays visible */}
                    <div className="text-center mb-6">
                      <p className="text-sm text-gray-500 mb-1">Good day!</p>
                      <h2 className="text-2xl font-bold text-gray-900">How can I help you today?</h2>
                    </div>

                    {/* Chat Conversation Area */}
                    <div className="space-y-3 mb-4 flex-1">
                      {/* Bot Welcome Message */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2.5 items-start"
                      >
                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden bg-white border border-purple-100">
                          <img
                            src="/icons/coco-logo.png"
                            alt="Coco"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 max-w-[85%]">
                          <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                            <p className="text-sm text-gray-800 leading-[1.6]">
                              I'd be happy to help you with that! Let me gather some information to provide you with the best recommendations.
                            </p>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-1 ml-0.5">Just now</p>
                        </div>
                      </motion.div>
                    </div>

                    {/* Toolkit Icons Bar - Rounded box without borders */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="px-5 pb-4"
                    >
                      <div className="flex items-center justify-center gap-3 p-3 bg-gray-50 rounded-2xl">
                        {[
                          { icon: 'analyze-style.png', label: 'Analyze Style', route: '/toolkit?tool=analyze-style' },
                          { icon: 'match-checker.png', label: 'Match Checker', route: '/toolkit?tool=match-checker' },
                          { icon: 'visual-search.png', label: 'Visual Search', route: '/toolkit?tool=visual-search' },
                          { icon: 'try-on.png', label: 'Try-On', route: '/toolkit?tool=try-on' },
                          { icon: 'style-profile.png', label: 'Style Profile', route: '/toolkit?tool=style-profile' }
                        ].map((tool, idx) => (
                          <motion.button
                            key={idx}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ scale: 1.15, y: -3 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => window.location.href = tool.route}
                            className="group relative w-11 h-11 flex items-center justify-center rounded-full bg-white hover:bg-purple-50 border border-gray-200 hover:border-purple-300 transition-all shadow-sm"
                            title={tool.label}
                          >
                            <img
                              src={`/icons/${tool.icon}`}
                              alt={tool.label}
                              className="w-6 h-6 opacity-80 group-hover:opacity-100 transition-opacity"
                            />
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </div>

              {/* Chat Input (always shown) */}
              <div className="px-6 py-4 bg-white/60 backdrop-blur-sm">
                <form onSubmit={handleChatInputSubmit} className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={chatInputValue}
                      onChange={(e) => setChatInputValue(e.target.value)}
                      placeholder="Type your message..."
                      className="w-full pl-4 pr-11 py-3 rounded-full border-2 border-purple-200 focus:border-purple-400 focus:outline-none focus:ring-0 text-sm transition-all bg-white/80 backdrop-blur-sm"
                    />
                    <button
                      type="submit"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full hover:from-purple-600 hover:to-pink-700 transition-all flex items-center justify-center shadow-md hover:shadow-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // State 2: After Search (Active Conversation State)
  return (
    <div className="h-screen flex flex-col bg-white relative">
      {/* Header with Search Bar */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600">
              <span className="text-xl font-bold text-white">D</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">Demo Retailer</span>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full px-5 py-2.5 rounded-full border-2 border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-all"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Close Button */}
          <button
            onClick={() => setHasSearched(false)}
            className="text-gray-500 hover:text-gray-700 font-medium text-sm"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main Content: Full Width Product Grid */}
      <div className="flex-1 overflow-hidden">
        {/* Product Grid (Full Width) */}
        <div className="w-full h-full overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Intent Mode: <span className="font-semibold text-purple-600">{intentMode}</span>
              </p>
              <p className="text-sm text-gray-600">
                Searching for: <span className="font-semibold">{searchQuery}</span>
              </p>
            </div>

            {/* Placeholder Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-8">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-square bg-gray-100 rounded-lg mb-3" />
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              ))}
            </div>

            <p className="mt-6 text-center text-sm text-gray-500">
              Results: Loading products...
            </p>
          </div>
        </div>
      </div>

      {/* Floating Chat Bubble (Bottom Right) */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 w-[520px] h-[760px] bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 rounded-3xl shadow-2xl border border-purple-200/50 flex flex-col overflow-hidden z-50"
          >
            {/* Chat Header */}
            <div className="px-6 py-4 bg-white/80 backdrop-blur-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Coco Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-md overflow-hidden bg-white border-2 border-purple-100">
                    <img
                      src="/icons/coco-logo.png"
                      alt="Coco AI Assistant"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Coco</h3>
                  <p className="text-xs text-gray-500">AI Shopping Assistant</p>
                </div>
              </div>
              {/* Close Button */}
              <button
                onClick={() => setIsChatOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/50 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
            {/* Bot Welcome Message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2.5 items-start"
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden bg-white border border-purple-100">
                <img
                  src="/icons/coco-logo.png"
                  alt="Coco"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 max-w-[85%]">
                <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <p className="text-sm text-gray-800 leading-[1.6]">
                    Great! I found <span className="font-semibold text-purple-600">150 products</span> matching your search. Let me help you find exactly what you're looking for.
                  </p>
                </div>
                <p className="text-[11px] text-gray-400 mt-1 ml-0.5">Just now</p>
              </div>
            </motion.div>

            {/* Bot Question */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex gap-2.5 items-start"
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden bg-white border border-purple-100">
                <img
                  src="/icons/coco-logo.png"
                  alt="Coco"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 max-w-[85%]">
                <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <p className="text-sm text-gray-800 leading-[1.6] font-medium">
                    What's your budget range?
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Smart Filter Chips - directly below question */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex flex-wrap gap-2 ml-12 pl-0.5"
            >
              {['Under $50', '$50 - $100', '$100 - $200', '$200+'].map((chip, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-4 py-2 bg-white border border-purple-200 text-purple-700 rounded-full hover:bg-purple-50 hover:border-purple-400 transition-all text-[13px] font-medium shadow-sm hover:shadow"
                >
                  {chip}
                </motion.button>
              ))}
            </motion.div>

            {/* Example User Response */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex gap-2.5 items-start justify-end"
            >
              <div className="flex-1 flex justify-end max-w-[85%]">
                <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl rounded-tr-sm px-4 py-3 shadow-md">
                  <p className="text-sm text-white leading-[1.6] font-medium">
                    $50 - $100
                  </p>
                </div>
              </div>
              <div className="w-9 h-9 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="text-base">👤</span>
              </div>
            </motion.div>

            {/* Follow-up Bot Response */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="flex gap-2.5 items-start"
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden bg-white border border-purple-100">
                <img
                  src="/icons/coco-logo.png"
                  alt="Coco"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 max-w-[85%]">
                <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <p className="text-sm text-gray-800 leading-[1.6]">
                    Perfect! I've filtered the results to show items between $50-$100. What style are you looking for?
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Style chips */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="flex flex-wrap gap-2 ml-12 pl-0.5"
            >
              {['Casual', 'Formal', 'Business Casual', 'Smart Casual'].map((chip, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-4 py-2 bg-white border border-purple-200 text-purple-700 rounded-full hover:bg-purple-50 hover:border-purple-400 transition-all text-[13px] font-medium shadow-sm hover:shadow"
                >
                  {chip}
                </motion.button>
              ))}
            </motion.div>
          </div>

          {/* Toolkit Icons Bar */}
          <div className="px-6 py-3 bg-white/40 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-3 p-3 bg-white/60 rounded-2xl">
              {[
                { icon: 'analyze-style.png', label: 'Analyze Style', route: '/toolkit?tool=analyze-style' },
                { icon: 'match-checker.png', label: 'Match Checker', route: '/toolkit?tool=match-checker' },
                { icon: 'visual-search.png', label: 'Visual Search', route: '/toolkit?tool=visual-search' },
                { icon: 'try-on.png', label: 'Try-On', route: '/toolkit?tool=try-on' },
                { icon: 'style-profile.png', label: 'Style Profile', route: '/toolkit?tool=style-profile' }
              ].map((tool, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.15, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.href = tool.route}
                  className="group relative w-11 h-11 flex items-center justify-center rounded-full bg-white hover:bg-purple-50 border border-gray-200 hover:border-purple-300 transition-all shadow-sm"
                  title={tool.label}
                >
                  <img
                    src={`/icons/${tool.icon}`}
                    alt={tool.label}
                    className="w-6 h-6 opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-800 text-white text-[11px] rounded-md px-2.5 py-1.5 whitespace-nowrap shadow-lg font-medium">
                      {tool.label}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-[5px] border-transparent border-t-gray-800" />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

            {/* Chat Input */}
            <div className="px-6 py-4 bg-white/60 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="w-full pl-4 pr-11 py-3 rounded-full border-2 border-purple-200 focus:border-purple-400 focus:outline-none focus:ring-0 text-sm transition-all bg-white/80 backdrop-blur-sm"
                  />
                  <button className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full hover:from-purple-600 hover:to-pink-700 transition-all flex items-center justify-center shadow-md hover:shadow-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Button (when chat is closed) */}
      {!isChatOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full shadow-2xl flex items-center justify-center z-40 hover:shadow-purple-500/50 transition-all"
        >
          <img
            src="/icons/coco-logo.png"
            alt="Open Chat"
            className="w-10 h-10 rounded-full"
          />
          {/* Notification Badge */}
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">1</span>
          </div>
        </motion.button>
      )}
    </div>
  );
}
