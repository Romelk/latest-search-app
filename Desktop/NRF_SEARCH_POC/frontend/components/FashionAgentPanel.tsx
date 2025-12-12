'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, User, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'tool' | 'error' | 'image' | 'carousel';
  content: string;
  toolName?: string;
  imageUrl?: string;
  carouselItems?: Array<{
    id: string;
    imageUrl?: string;
    title?: string;
    description?: string;
  }>;
}

interface FashionAgentPanelProps {
  onClose?: () => void;
}

const FASHION_AGENT_URL = 'http://localhost:8001';

export default function FashionAgentPanel({ onClose }: FashionAgentPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [carouselIndices, setCarouselIndices] = useState<Record<string, number>>({});

  useEffect(() => {
    // Create session and connect
    createSession().then((sid) => {
      setSessionId(sid);
      connectWebSocket(sid);
    });

    return () => {
      wsRef.current?.close();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createSession = async (): Promise<string> => {
    try {
      const response = await fetch(`${FASHION_AGENT_URL}/agent/session`, {
        method: 'POST'
      });
      const data = await response.json();
      return data.sessionId;
    } catch (error) {
      console.error('Failed to create Fashion Agent session:', error);
      return 'fallback-' + Date.now();
    }
  };

  const connectWebSocket = (sid: string) => {
    const socket = new WebSocket(`ws://localhost:8001/agent/ws/${sid}`);

    socket.onopen = () => {
      console.log('Fashion Agent WebSocket connected');
      setIsConnected(true);
      addMessage({
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Hi! I\'m Alex, your autonomous fashion stylist. I can help you with trends, outfit suggestions, and even generate visual looks for you! What would you like to explore?'
      });
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleMessage(data);
    };

    socket.onerror = (error) => {
      console.error('Fashion Agent WebSocket error:', error);
      setIsConnected(false);
    };

    socket.onclose = () => {
      console.log('Fashion Agent WebSocket closed');
      setIsConnected(false);
      // Reconnect after 3 seconds
      setTimeout(() => {
        if (sid) connectWebSocket(sid);
      }, 3000);
    };

    wsRef.current = socket;
  };

  const pendingImages = useRef<Array<{ imageUrl: string; timestamp: number }>>([]);
  const imageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMessage = (data: any) => {
    console.log('Fashion Agent received:', data);

    switch (data.type) {
      case 'text':
        setIsTyping(false);
        addMessage({
          id: Date.now().toString(),
          type: 'assistant',
          content: data.content
        });
        break;

      case 'tool_use':
        addMessage({
          id: Date.now().toString(),
          type: 'tool',
          content: `🔧 Using tool: ${data.tool_name}`,
          toolName: data.tool_name
        });
        break;

      case 'tool_result':
        // Handle image generation results
        if (data.result && data.result.image_base64) {
          const imageUrl = data.result.image_base64.startsWith('data:')
            ? data.result.image_base64
            : `data:image/png;base64,${data.result.image_base64}`;

          // Add to pending images
          pendingImages.current.push({ imageUrl, timestamp: Date.now() });

          // Clear existing timeout
          if (imageTimeoutRef.current) {
            clearTimeout(imageTimeoutRef.current);
          }

          // Wait 500ms for more images, then render as carousel if multiple
          imageTimeoutRef.current = setTimeout(() => {
            if (pendingImages.current.length > 1) {
              // Multiple images - create carousel
              addMessage({
                id: Date.now().toString(),
                type: 'carousel',
                content: `${pendingImages.current.length} outfit variations`,
                carouselItems: pendingImages.current.map((img, idx) => ({
                  id: `img-${idx}`,
                  imageUrl: img.imageUrl,
                  title: `Variation ${idx + 1}`,
                  description: 'Swipe to explore different styling options'
                }))
              });
            } else if (pendingImages.current.length === 1) {
              // Single image - display normally
              addMessage({
                id: Date.now().toString(),
                type: 'image',
                content: 'Generated outfit visualization',
                imageUrl: pendingImages.current[0].imageUrl
              });
            }
            pendingImages.current = [];
          }, 500);
        }
        break;

      case 'done':
        setIsTyping(false);
        break;

      case 'error':
        setIsTyping(false);
        addMessage({
          id: Date.now().toString(),
          type: 'error',
          content: data.error || 'An error occurred'
        });
        break;
    }
  };

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const sendMessage = () => {
    const text = inputValue.trim();
    if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    // Add user message
    addMessage({
      id: Date.now().toString(),
      type: 'user',
      content: text
    });

    // Send to Fashion Agent backend
    wsRef.current.send(JSON.stringify({
      type: 'message',
      message: text
    }));

    setInputValue('');
    setIsTyping(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 z-50 flex h-[500px] w-full flex-col overflow-hidden rounded-t-2xl border border-orange-200/50 bg-gradient-to-br from-orange-50/95 to-pink-50/95 shadow-2xl backdrop-blur-xl md:bottom-6 md:left-6 md:h-[650px] md:w-[450px] md:rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-orange-200/50 bg-gradient-to-r from-orange-500 to-pink-600 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Fashion Agent (Alex)</h3>
            <p className="text-xs text-white/80">Autonomous styling with visual tools</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-all hover:bg-white/20"
            aria-label="Close fashion agent"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        )}
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-orange-100 px-4 py-2 text-center text-xs text-orange-800">
          Connecting to Fashion Agent...
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-orange-200">
        {messages.map((msg, index) => (
          <div
            key={msg.id}
            className="animate-fadeIn"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div
              className={`flex items-start gap-3 ${
                msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                  msg.type === 'user'
                    ? 'bg-gradient-to-br from-pink-400 to-pink-600'
                    : msg.type === 'tool'
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                    : 'bg-gradient-to-br from-orange-400 to-orange-600'
                }`}
              >
                {msg.type === 'user' ? (
                  <User className="h-4 w-4 text-white" />
                ) : (
                  <Sparkles className="h-4 w-4 text-white" />
                )}
              </div>

              {/* Message Content */}
              <div
                className={`${msg.type === 'carousel' ? 'max-w-[90%]' : 'max-w-[75%]'} rounded-2xl shadow-sm ${
                  msg.type === 'user'
                    ? 'bg-gradient-to-br from-pink-500 to-pink-600 text-white px-4 py-3'
                    : msg.type === 'tool'
                    ? 'bg-yellow-50/80 text-yellow-900 backdrop-blur-sm px-4 py-3'
                    : msg.type === 'error'
                    ? 'bg-red-50/80 text-red-900 backdrop-blur-sm px-4 py-3'
                    : msg.type === 'carousel'
                    ? 'bg-white/90 backdrop-blur-sm p-4'
                    : 'bg-white/80 text-gray-800 backdrop-blur-sm px-4 py-3'
                }`}
              >
                {msg.type === 'carousel' && msg.carouselItems && msg.carouselItems.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">{msg.content}</p>
                    {/* Carousel Container */}
                    <div className="relative">
                      <div className="overflow-hidden rounded-lg">
                        <div
                          className="flex transition-transform duration-300 ease-in-out"
                          style={{
                            transform: `translateX(-${(carouselIndices[msg.id] || 0) * 100}%)`
                          }}
                        >
                          {msg.carouselItems.map((item, idx) => (
                            <div
                              key={item.id}
                              className="min-w-full"
                            >
                              <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-lg p-3 space-y-2">
                                {item.imageUrl && (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.title || `Variation ${idx + 1}`}
                                    className="w-full h-48 object-cover rounded-lg"
                                  />
                                )}
                                {item.title && (
                                  <h4 className="font-semibold text-sm text-gray-800">{item.title}</h4>
                                )}
                                {item.description && (
                                  <p className="text-xs text-gray-600 leading-relaxed">{item.description}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Navigation Controls */}
                      {msg.carouselItems.length > 1 && (
                        <>
                          <button
                            onClick={() => {
                              const current = carouselIndices[msg.id] || 0;
                              const newIndex = current > 0 ? current - 1 : msg.carouselItems!.length - 1;
                              setCarouselIndices(prev => ({ ...prev, [msg.id]: newIndex }));
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                            aria-label="Previous"
                          >
                            <ChevronLeft className="h-4 w-4 text-gray-700" />
                          </button>
                          <button
                            onClick={() => {
                              const current = carouselIndices[msg.id] || 0;
                              const newIndex = current < msg.carouselItems!.length - 1 ? current + 1 : 0;
                              setCarouselIndices(prev => ({ ...prev, [msg.id]: newIndex }));
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                            aria-label="Next"
                          >
                            <ChevronRight className="h-4 w-4 text-gray-700" />
                          </button>
                          {/* Dots Indicator */}
                          <div className="flex justify-center gap-1.5 mt-3">
                            {msg.carouselItems.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => setCarouselIndices(prev => ({ ...prev, [msg.id]: idx }))}
                                className={`h-2 rounded-full transition-all ${
                                  idx === (carouselIndices[msg.id] || 0)
                                    ? 'w-6 bg-orange-500'
                                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                                }`}
                                aria-label={`Go to item ${idx + 1}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    {msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt="Generated outfit"
                        className="mt-3 max-w-full rounded-lg"
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-orange-400" style={{ animationDelay: '0ms' }}></span>
                <span className="h-2 w-2 animate-bounce rounded-full bg-orange-400" style={{ animationDelay: '150ms' }}></span>
                <span className="h-2 w-2 animate-bounce rounded-full bg-orange-400" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-orange-200/50 bg-white/50 p-4 backdrop-blur-sm">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about trends, outfit ideas, styling advice..."
              className="w-full resize-none rounded-xl border-2 border-orange-200 bg-white/80 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 backdrop-blur-sm transition-all focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
              rows={2}
              disabled={!isConnected}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!isConnected || !inputValue.trim()}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 text-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
            aria-label="Send message"
          >
            {isConnected ? (
              <Sparkles className="h-5 w-5" />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
