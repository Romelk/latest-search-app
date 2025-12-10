'use client';

import { ChatMessage } from '@/lib/types';
import { X } from 'lucide-react';

interface ChatPanelProps {
  messages: ChatMessage[];
  onOptionSelect?: (option: string) => void;
  onClose?: () => void;
}

export default function ChatPanel({ messages, onOptionSelect, onClose }: ChatPanelProps) {
  return (
    <div className="fixed bottom-0 right-0 z-50 flex h-[500px] w-full flex-col border-t border-gray-200 bg-white shadow-2xl md:h-[600px] md:w-[400px] md:border-l md:border-t-0">
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900">Shopping Assistant</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
            aria-label="Close chat"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message) => (
          <div key={message.id}>
            <div
              className={`rounded-lg p-4 ${
                message.role === 'user'
                  ? 'ml-8 bg-teal-600 text-white'
                  : message.role === 'assistant'
                  ? 'mr-8 bg-gray-100 text-gray-900'
                  : 'bg-blue-50 text-blue-900'
              }`}
            >
              <p className="text-sm">{message.content}</p>
            </div>

            {message.options && message.options.length > 0 && (
              <div className="ml-4 mt-2 space-y-2">
                {message.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => onOptionSelect?.(option)}
                    className="block w-full rounded-lg border border-teal-600 px-4 py-2 text-left text-sm text-teal-600 transition-all hover:bg-teal-50"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
