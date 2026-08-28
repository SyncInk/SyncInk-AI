'use client';

import { useChat } from 'ai/react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User } from 'lucide-react';
import { useRef, useEffect } from 'react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
      <header className="flex items-center justify-center py-6 bg-gray-900 border-b border-gray-800 shadow-sm">
        <Bot className="w-8 h-8 text-blue-500 mr-3" />
        <h1 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          SyncInk AI
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Bot className="w-16 h-16 mb-4 text-gray-700" />
            <p className="text-xl font-medium text-center max-w-md">
              I am SyncInk AI. Ask me anything about the universe.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`flex max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-sm ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
                }`}
              >
                <div className="mr-4 mt-1 hidden sm:block">
                  {m.role === 'user' ? (
                    <User className="w-6 h-6 opacity-80" />
                  ) : (
                    <Bot className="w-6 h-6 text-blue-400" />
                  )}
                </div>
                <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-gray-900 max-w-none">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </main>

      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <form
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto relative flex items-center"
        >
          <input
            className="w-full bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-full py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={input}
            placeholder="Ask SyncInk AI anything..."
            onChange={handleInputChange}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-center text-xs text-gray-500 mt-3">
          SyncInk AI uses high-end LLMs to provide vast knowledge.
        </p>
      </div>
    </div>
  );
}
