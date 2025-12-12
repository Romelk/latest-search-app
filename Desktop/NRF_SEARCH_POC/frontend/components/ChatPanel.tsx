'use client';

import { ChatMessage } from '@/lib/types';
import { X, Bot, User, Send } from 'lucide-react';
import { useState } from 'react';

interface ChatPanelProps {
  messages: ChatMessage[];
  onOptionSelect?: (option: string) => void;
  onFreeTextSubmit?: (text: string) => void;
  onClose?: () => void;
  allowFreeText?: boolean;
}

export default function ChatPanel({
  messages,
  onOptionSelect,
  onFreeTextSubmit,
  onClose,
  allowFreeText = false
}: ChatPanelProps) {
  const [freeText, setFreeText] = useState('');

  const handleFreeTextSubmit = () => {
    if (freeText.trim() && onFreeTextSubmit) {
      onFreeTextSubmit(freeText.trim());
      setFreeText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFreeTextSubmit();
    }
  };

  return (
    <div className="fixed bottom-0 right-0 z-50 flex h-[500px] w-full flex-col overflow-hidden rounded-t-2xl border border-gray-200/50 bg-white/95 shadow-2xl backdrop-blur-xl md:bottom-6 md:right-6 md:h-[650px] md:w-[450px] md:rounded-2xl">
      {/* Header with Gradient */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Style Assistant</h3>
            <p className="text-xs text-white/80">Here to help you find the perfect outfit</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-all hover:bg-white/20"
            aria-label="Close chat"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className="animate-fadeIn"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Message Bubble with Avatar */}
            <div
              className={`flex items-start gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-gray-500 to-gray-600'
                    : message.role === 'assistant'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                    : 'bg-gradient-to-br from-blue-400 to-blue-600'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="h-4 w-4 text-white" />
                ) : (
                  <Bot className="h-4 w-4 text-white" />
                )}
              </div>

              {/* Message Content */}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                  message.role === 'user'
                    ? 'bg-gray-200 text-gray-900'
                    : message.role === 'assistant'
                    ? 'bg-gray-50 text-gray-800 border border-gray-200'
                    : 'bg-blue-50 text-blue-900 border border-blue-200'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>

            {/* Option Chips */}
            {message.options && message.options.length > 0 && (
              <div className="ml-11 mt-3 space-y-2">
                {message.options.map((option, optionIndex) => (
                  <button
                    key={option}
                    onClick={() => onOptionSelect?.(option)}
                    className="group block w-full transform rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-700 transition-all duration-200 hover:scale-[1.02] hover:border-blue-400 hover:bg-blue-50 hover:shadow-md active:scale-[0.98]"
                    style={{ animationDelay: `${optionIndex * 0.05}s` }}
                  >
                    <span className="flex items-center justify-between">
                      <span>{option}</span>
                      <span className="transform text-blue-500 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100">
                        →
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Free Text Input Area (for Step 0) */}
      {allowFreeText && (
        <div className="border-t border-gray-200 bg-gray-50/50 p-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share more details about the occasion or what you have in mind..."
                className="w-full resize-none rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                rows={2}
              />
            </div>
            <button
              onClick={handleFreeTextSubmit}
              disabled={!freeText.trim()}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
