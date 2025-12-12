'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchBar from '@/components/SearchBar';
import Carousel from '@/components/Carousel';
import CategoryTiles from '@/components/CategoryTiles';
import FiltersBar from '@/components/FiltersBar';
import RefinementChips from '@/components/RefinementChips';
import ChatPanel from '@/components/ChatPanel';
import FashionAgentPanel from '@/components/FashionAgentPanel';
import FashionToolkitPanel from '@/components/FashionToolkitPanel';
import ProductCard from '@/components/ProductCard';
import LookCard from '@/components/LookCard';
import ProductDetailModal from '@/components/ProductDetailModal';
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
  const [showFashionAgent, setShowFashionAgent] = useState(false);
  const [showToolkit, setShowToolkit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Home content
  const [dealsProducts, setDealsProducts] = useState<Product[]>([]);
  const [topSellingProducts, setTopSellingProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const id = sessionStorage.getItem('sessionId') || generateSessionId();
    setSessionId(id);
    sessionStorage.setItem('sessionId', id);

    loadHomeContent();
    logAnalyticsEvent(id, 'page_view', { route: '/search' });
  }, []);

  // Simple scroll-based sticky header - pin when scrolled past threshold
  useEffect(() => {
    let ticking = false;
    let lastCompactState = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPosition = window.scrollY;
          const shouldBeCompact = scrollPosition > 100;

          // Only update state if it actually changed
          if (shouldBeCompact !== lastCompactState) {
            lastCompactState = shouldBeCompact;
            setIsCompactMode(shouldBeCompact);
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    setConversationHistory(''); // Reset conversation history for new search

    // Add system greeting
    const greetingMessage: ChatMessage = {
      id: '1',
      role: 'system',
      content: `Hi, I see you are looking for ${q}. I can help you with it. I just have a few questions to curate your search better.`,
    };
    setChatMessages([greetingMessage]);

    // Get first clarifying question (no conversation history yet)
    try {
      const clarificationResponse = await clarifyGoal(sessionId, q, ents, '');

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
    // Toggle behavior: if clicking the same chip, deselect it
    const isCurrentlySelected = selectedChips[category] === value;

    const newSelectedChips = { ...selectedChips };
    if (isCurrentlySelected) {
      // Deselect - remove this category from selected chips
      delete newSelectedChips[category];
    } else {
      // Select - set new value for this category
      newSelectedChips[category] = value;
    }
    setSelectedChips(newSelectedChips);

    // Build filters from selected chips
    const newFilters: SearchFilters = { ...filters };

    // Clear previous filter for this category
    if (category === 'style') delete newFilters.style;
    if (category === 'color') delete newFilters.color;
    if (category === 'fit') delete newFilters.fit;
    if (category === 'price') {
      delete newFilters.price_min;
      delete newFilters.price_max;
    }

    // Only apply filter if chip is selected (not deselected)
    if (!isCurrentlySelected) {
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

    // Build conversation history from all messages
    const history = [...chatMessages, userMessage]
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    setConversationHistory(history);

    try {
      // Call clarify-goal with updated conversation history
      const clarificationResponse = await clarifyGoal(sessionId, query, entities, history);

      if (clarificationResponse.gathering_info) {
        // Still gathering information - show next question
        const questionMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: clarificationResponse.question,
          options: clarificationResponse.options,
        };
        setChatMessages((prev) => [...prev, questionMessage]);
      } else if (clarificationResponse.ready_to_compose) {
        // All information gathered - user just selected a final style option
        // Add acknowledgment message
        const ackMessage: ChatMessage = {
          id: `assistant-ack-${Date.now()}`,
          role: 'assistant',
          content: `Perfect! I'll curate some looks in the ${option.toLowerCase()} style that would work beautifully for your occasion.`,
        };
        setChatMessages((prev) => [...prev, ackMessage]);

        // Compose outfits based on selected style
        setStatusMessage('Curating your looks...');
        const choice = { style: option };
        const outfitsResponse = await composeOutfits(sessionId, query, entities, choice);
        setLooks(outfitsResponse.looks);

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: 'Here are a few looks I curated for you. You can see them below.',
        };
        setChatMessages((prev) => [...prev, assistantMessage]);
        setStatusMessage('');
      }
    } catch (error) {
      console.error('Error in chat interaction:', error);
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
          className="relative min-h-[35vh] bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50"
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
          <div className="container mx-auto flex min-h-[calc(35vh-80px)] items-center px-4 py-6">
            <div className="w-full max-w-4xl">
              {/* Main Heading */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-6"
              >
                <h1 className="mb-3 text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
                  Find exactly
                  <br />
                  what you need
                </h1>
                <p className="max-w-2xl text-lg text-gray-600">
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
            <div className="flex flex-col gap-3">
              {/* Search bar row */}
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

              {/* Refinement chips row - Show only for AMBIGUOUS mode */}
              {intentMode === 'AMBIGUOUS' && Object.keys(chips).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-gray-100 pt-3"
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

      {/* Status Message */}
      {statusMessage && (
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-sm text-gray-600">{statusMessage}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 pb-32">
        <AnimatePresence mode="wait">
          {showHomeContent && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <Carousel
                title="Deals of the day"
                products={dealsProducts}
                onProductClick={(product) => setSelectedProduct(product)}
              />
              <Carousel
                title="Top selling products"
                products={topSellingProducts}
                onProductClick={(product) => setSelectedProduct(product)}
              />
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
                      <ProductCard
                        key={product.product_id}
                        product={product}
                        onClick={() => setSelectedProduct(product)}
                      />
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
      <AnimatePresence>
        {showChat && (
          <ChatPanel
            messages={chatMessages}
            onOptionSelect={handleChatOptionSelect}
            onFreeTextSubmit={async (text) => {
              // User provided free-text elaboration - re-run intent detection with the new text
              const updatedQuery = `${query}. ${text}`;
              const intentResult = await detectIntent(sessionId, updatedQuery);

              // Re-run clarifier with updated entities
              const clarifyResult = await clarifyGoal(sessionId, updatedQuery, intentResult.entities, conversationHistory);

              // Add user message
              setChatMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'user',
                content: text,
              }]);

              // Add AI response
              setChatMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: clarifyResult.question,
                options: clarifyResult.options,
              }]);

              setConversationHistory(prev => `${prev}\nUser: ${text}\nAssistant: ${clarifyResult.question}`);
            }}
            onClose={() => setShowChat(false)}
            allowFreeText={chatMessages.length > 0 && chatMessages[chatMessages.length - 1].content.includes("Could you share a bit more")}
          />
        )}
      </AnimatePresence>

      {/* Floating Chat Button - Shows when chat is closed and there are messages (RIGHT SIDE) */}
      <AnimatePresence>
        {!showChat && chatMessages.length > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowChat(true)}
            className="fixed bottom-6 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl ring-4 ring-white transition-all hover:bg-blue-700 hover:shadow-blue-500/50"
            aria-label="Open chat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-7 w-7"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
              />
            </svg>
            {/* Notification Badge - if there are new messages */}
            {chatMessages.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-white">
                {chatMessages.length > 9 ? '9+' : chatMessages.length}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Fashion Agent Panel (LEFT SIDE) */}
      <AnimatePresence>
        {showFashionAgent && (
          <FashionAgentPanel onClose={() => setShowFashionAgent(false)} />
        )}
      </AnimatePresence>

      {/* Floating Fashion Agent Button - Always visible on LEFT SIDE */}
      <AnimatePresence>
        {!showFashionAgent && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFashionAgent(true)}
            className="fixed bottom-6 left-6 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-pink-600 text-white shadow-2xl ring-4 ring-white transition-all hover:shadow-orange-500/50"
            aria-label="Open Fashion Agent"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-8 w-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
              />
            </svg>
            {/* Badge indicating "AI Fashion Agent" */}
            <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-xs font-bold text-white ring-2 ring-white">
              AI
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* AI Fashion Toolkit Panel (RIGHT SIDE) */}
      <AnimatePresence>
        {showToolkit && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-50 h-screen w-full overflow-y-auto bg-white shadow-2xl md:w-[500px]"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white p-4">
              <h2 className="text-lg font-bold text-gray-900">AI Fashion Toolkit</h2>
              <button
                onClick={() => setShowToolkit(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close toolkit"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <FashionToolkitPanel />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating AI Toolkit Button - Always visible on RIGHT SIDE */}
      <AnimatePresence>
        {!showToolkit && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowToolkit(true)}
            className="fixed bottom-6 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl ring-4 ring-white transition-all hover:shadow-indigo-500/50"
            aria-label="Open AI Fashion Toolkit"
          >
            <span className="text-3xl">✨</span>
            {/* Badge indicating "New" */}
            <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-emerald-500 text-xs font-bold text-white ring-2 ring-white">
              AI
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
