'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import SearchBar from '@/components/SearchBar';
import Carousel from '@/components/Carousel';
import CategoryTiles from '@/components/CategoryTiles';
import FiltersBar from '@/components/FiltersBar';
import RefinementChips from '@/components/RefinementChips';
import ChatPanel from '@/components/ChatPanel';
import ProductCard from '@/components/ProductCard';
import LookCard from '@/components/LookCard';
import {
  IntentMode,
  Entities,
  Chips,
  Product,
  SearchFilters,
  ChatMessage,
  Look,
  Category,
} from '@/lib/types';
import {
  detectIntent,
  searchResults,
  clarifyGoal,
  composeOutfits,
  getDeals,
  getTopSelling,
  getCategories,
  logAnalyticsEvent,
} from '@/lib/api/client';
import { generateSessionId } from '@/lib/utils';

export default function SearchPage() {
  const [sessionId, setSessionId] = useState('');
  const [query, setQuery] = useState('');
  const [intentMode, setIntentMode] = useState<IntentMode>('NONE');
  const [entities, setEntities] = useState<Entities>({});
  const [chips, setChips] = useState<Chips>({});
  const [selectedChips, setSelectedChips] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState<SearchFilters>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [looks, setLooks] = useState<Look[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isCompactMode, setIsCompactMode] = useState(false);

  // Home content
  const [dealsProducts, setDealsProducts] = useState<Product[]>([]);
  const [topSellingProducts, setTopSellingProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Scroll tracking for hybrid search bar
  const { scrollY } = useScroll();

  useEffect(() => {
    const id = sessionStorage.getItem('sessionId') || generateSessionId();
    setSessionId(id);
    sessionStorage.setItem('sessionId', id);

    loadHomeContent();
    logAnalyticsEvent(id, 'page_view', { route: '/search' });
  }, []);

  // Track scroll for compact mode transition
  useEffect(() => {
    const unsubscribe = scrollY.on('change', (latest) => {
      setIsCompactMode(latest > 50 || intentMode !== 'NONE');
    });
    return () => unsubscribe();
  }, [scrollY, intentMode]);

  const loadHomeContent = async () => {
    try {
      const [dealsData, topSellingData, categoriesData] = await Promise.all([
        getDeals(),
        getTopSelling(),
        getCategories(),
      ]);
      setDealsProducts(dealsData.products);
      setTopSellingProducts(topSellingData.products);
      setCategories(categoriesData.categories);
    } catch (error) {
      console.error('Error loading home content:', error);
    }
  };

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    setLoading(true);
    setStatusMessage('Understanding your request...');

    try {
      // Detect intent
      const intentResponse = await detectIntent(sessionId, searchQuery);
      setIntentMode(intentResponse.mode);
      setEntities(intentResponse.entities);

      if (intentResponse.chips) {
        setChips(intentResponse.chips);
      }

      // Handle different intent modes
      if (intentResponse.mode === 'CLEAR') {
        await handleClearIntent(searchQuery, intentResponse.entities);
      } else if (intentResponse.mode === 'AMBIGUOUS') {
        await handleAmbiguousIntent(searchQuery, intentResponse.entities, intentResponse.chips);
      } else if (intentResponse.mode === 'GOAL') {
        await handleGoalIntent(searchQuery, intentResponse.entities);
      }
    } catch (error) {
      console.error('Error handling search:', error);
      setStatusMessage('');
    } finally {
      setLoading(false);
    }
  };

  const handleClearIntent = async (q: string, ents: Entities) => {
    setStatusMessage('');
    const results = await searchResults(sessionId, q, ents);
    setProducts(results.results);
    logAnalyticsEvent(sessionId, 'search_clear', { query: q });
  };

  const handleAmbiguousIntent = async (q: string, ents: Entities, chps?: Chips) => {
    setStatusMessage('');
    if (chps) {
      setChips(chps);
    }
    logAnalyticsEvent(sessionId, 'search_ambiguous', { query: q });
  };

  const handleGoalIntent = async (q: string, ents: Entities) => {
    setShowChat(true);

    // Add system greeting
    const greetingMessage: ChatMessage = {
      id: '1',
      role: 'system',
      content: `Hi, I see you are looking for ${q}. I can help you with it. I just have a few questions to curate your search better.`,
    };
    setChatMessages([greetingMessage]);

    // Get clarifying question
    try {
      const clarificationResponse = await clarifyGoal(sessionId, q, ents);

      const questionMessage: ChatMessage = {
        id: '2',
        role: 'assistant',
        content: clarificationResponse.question,
        options: clarificationResponse.options,
      };
      setChatMessages((prev) => [...prev, questionMessage]);
      setStatusMessage('');
    } catch (error) {
      console.error('Error getting clarification:', error);
      setStatusMessage('');
    }

    logAnalyticsEvent(sessionId, 'search_goal', { query: q });
  };

  const handleChipSelect = async (category: string, value: string) => {
    const newSelectedChips = { ...selectedChips, [category]: value };
    setSelectedChips(newSelectedChips);

    // Build filters from selected chips
    const newFilters: SearchFilters = { ...filters };

    if (category === 'style') newFilters.style = value.toLowerCase();
    if (category === 'color') newFilters.color = value.toLowerCase();
    if (category === 'fit') newFilters.fit = value.toLowerCase();
    if (category === 'price') {
      if (value.includes('Under')) {
        newFilters.price_max = 2000;
      } else if (value.includes('to')) {
        newFilters.price_min = 2000;
        newFilters.price_max = 4000;
      } else {
        newFilters.price_min = 4000;
      }
    }

    setFilters(newFilters);

    // Search with updated filters
    const results = await searchResults(sessionId, query, entities, newFilters);
    setProducts(results.results);
  };

  const handleChatOptionSelect = async (option: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: option,
    };
    setChatMessages((prev) => [...prev, userMessage]);

    // Add mock follow-up message for demo
    setTimeout(() => {
      const followUpMessage: ChatMessage = {
        id: `assistant-followup-${Date.now()}`,
        role: 'assistant',
        content: `Great choice! I'll curate some looks with ${option.toLowerCase()} tones that would work perfectly for your occasion.`,
      };
      setChatMessages((prev) => [...prev, followUpMessage]);
    }, 500);

    // Compose outfits based on choice
    try {
      setStatusMessage('Curating your looks...');
      const choice = { palette: option };
      const outfitsResponse = await composeOutfits(sessionId, query, entities, choice);
      setLooks(outfitsResponse.looks);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: 'Here are a few looks I curated for you. You can see them below.',
      };
      setChatMessages((prev) => [...prev, assistantMessage]);
      setStatusMessage('');
    } catch (error) {
      console.error('Error composing outfits:', error);
      setStatusMessage('');
    }
  };

  const handleFilterChange = async (newFilters: SearchFilters) => {
    setFilters(newFilters);
    const results = await searchResults(sessionId, query, entities, newFilters);
    setProducts(results.results);
  };

  const showHomeContent = intentMode === 'NONE';
  const showResults = intentMode !== 'NONE';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hybrid Search Bar - Hero Mode (before search/scroll) */}
      {!isCompactMode && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="relative min-h-[60vh] bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50"
        >
          {/* Top Brand Bar */}
          <div className="border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600">
                  <span className="text-xl font-bold text-white">D</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Demo Retailer</span>
              </div>
            </div>
          </div>

          {/* Hero Content */}
          <div className="container mx-auto flex min-h-[calc(60vh-80px)] items-center px-4 py-12">
            <div className="w-full max-w-4xl">
              {/* Main Heading */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
              >
                <h1 className="mb-4 text-5xl font-bold leading-tight text-gray-900 md:text-6xl">
                  Find exactly
                  <br />
                  what you need
                </h1>
                <p className="max-w-2xl text-xl text-gray-600">
                  Search for specific products, explore categories, or describe your goal.
                  Our AI understands what you're looking for.
                </p>
              </motion.div>

              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-6"
              >
                <div className="rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-gray-900/5">
                  <SearchBar onSearch={handleSearch} initialValue={query} />
                </div>
              </motion.div>

              {/* Example Searches - Show only when NOT in AMBIGUOUS mode */}
              {intentMode !== 'AMBIGUOUS' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="space-y-2"
                >
                  <p className="text-sm font-medium text-gray-500">Popular searches:</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleSearch('blue formal shirt size 42')}
                      className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-teal-50 hover:text-teal-700 hover:ring-teal-200"
                    >
                      Blue formal shirt
                    </button>
                    <button
                      onClick={() => handleSearch('shirt')}
                      className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-teal-50 hover:text-teal-700 hover:ring-teal-200"
                    >
                      Shirt
                    </button>
                    <button
                      onClick={() => handleSearch('I need an outfit for my daughters annual day')}
                      className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-teal-50 hover:text-teal-700 hover:ring-teal-200"
                    >
                      Outfit for a special occasion
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Refinement Chips - Show only for AMBIGUOUS mode */}
              {intentMode === 'AMBIGUOUS' && Object.keys(chips).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-2"
                >
                  <RefinementChips
                    chips={chips}
                    selectedChips={selectedChips}
                    onChipSelect={handleChipSelect}
                  />
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Compact Mode - Sticky Header (after search/scroll) */}
      {isCompactMode && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600">
                  <span className="text-lg font-bold text-white">D</span>
                </div>
                <span className="hidden text-lg font-semibold text-gray-900 sm:inline">
                  Demo Retailer
                </span>
              </div>
              <div className="flex-1">
                <SearchBar onSearch={handleSearch} initialValue={query} />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Status Message */}
      {statusMessage && (
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-sm text-gray-600">{statusMessage}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {showHomeContent && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <Carousel title="Deals of the day" products={dealsProducts} />
              <Carousel title="Top selling products" products={topSellingProducts} />
              <CategoryTiles
                categories={categories}
                onCategoryClick={(cat) => handleSearch(cat.name)}
              />
            </motion.div>
          )}

          {showResults && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Filters Bar (for CLEAR and after chip selection in AMBIGUOUS) */}
              {(intentMode === 'CLEAR' || products.length > 0) && (
                <FiltersBar filters={filters} onFilterChange={handleFilterChange} />
              )}

              {/* Product Grid (CLEAR and AMBIGUOUS) */}
              {products.length > 0 && (
                <div>
                  <h2 className="mb-4 text-xl font-semibold text-gray-900">
                    {products.length} Products Found
                  </h2>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {products.map((product) => (
                      <ProductCard key={product.product_id} product={product} />
                    ))}
                  </div>
                </div>
              )}

              {/* Look Cards (GOAL) */}
              {looks.length > 0 && (
                <div>
                  {(intentMode === 'GOAL') && (
                    <FiltersBar filters={filters} onFilterChange={handleFilterChange} />
                  )}
                  <h2 className="mb-4 text-xl font-semibold text-gray-900">
                    Curated Looks for You
                  </h2>
                  <div className="grid gap-6 md:grid-cols-2">
                    {looks.map((look, idx) => (
                      <LookCard key={idx} look={look} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Panel (GOAL mode) */}
      {showChat && (
        <ChatPanel
          messages={chatMessages}
          onOptionSelect={handleChatOptionSelect}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}
