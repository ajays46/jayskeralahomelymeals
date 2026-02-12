import React, { useState, useRef, useEffect } from 'react';
import { FiMessageCircle, FiX, FiSend } from 'react-icons/fi';
import axiosInstance from '../../api/axios';

const MAX_MESSAGE_LENGTH = 2000;

// Suggested prompts by category (per FRONTEND_ASSISTANT_CHAT_INTEGRATION.md §9)
const SUGGESTED_PROMPTS_BY_CATEGORY = [
  {
    label: 'Deliveries & Routes',
    prompts: [
      'How many lunch deliveries tomorrow?',
      "What's the delivery count for today?",
      'Plan a route with 2 drivers for tomorrow lunch',
      'Show route map for today lunch',
      "What's the stop order for this route?"
    ]
  },
  {
    label: 'Drivers & Fleet',
    prompts: [
      'List all drivers',
      "Show Adharsh's route for today",
      'Where is driver John right now?',
      'Track vehicle KL 40 W 4598',
      'Where are all drivers?'
    ]
  },
  {
    label: 'Weather & Zones',
    prompts: [
      "What's the weather in zone North Kochi?",
      'Weather forecast for tomorrow',
      'Weather for all delivery zones',
      'List our delivery zones',
      'Deliveries in zone zone-a1 for today lunch'
    ]
  },
  {
    label: 'Performance & Settings',
    prompts: [
      'How is Adharsh performing?',
      'Driver performance report',
      'What are the route planning settings?',
      'Check traffic on route X'
    ]
  }
];

function getErrorMessage(res) {
  const data = res?.data;
  const code = data?.code;
  const msg = data?.error || res?.message || 'Something went wrong';
  if (res?.status === 401) return 'Please log in again.';
  if (res?.status === 400 && code === 'VALIDATION_ERROR') return msg;
  if (res?.status === 403 && (code === 'USER_REQUIRED' || code === 'ROLE_FORBIDDEN')) return 'This feature is for delivery managers and administrators only.';
  if (res?.status === 429) return 'Too many requests. Please try again in a minute.';
  if (res?.status === 504) return 'The assistant is taking too long. Please try again.';
  if (res?.status === 500) return 'The assistant is temporarily unavailable. Please try again.';
  return msg;
}

/**
 * AssistantChat - Route optimization assistant chat panel.
 * Props: companyId (required), userId (required)
 */
export default function AssistantChat({ companyId, userId }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  const sendMessage = async (text) => {
    const content = (text || input).trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!content || loading) return;
    if (!companyId || !userId) {
      setError('User or company not set. Please refresh.');
      return;
    }

    setError(null);
    const userMessage = { role: 'user', content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const { data } = await axiosInstance.post(
        '/assistant/chat',
        { messages: nextMessages, max_tokens: 512, temperature: 0.7 },
        {
          headers: {
            'X-Company-ID': companyId,
            'X-User-ID': userId
          }
        }
      );
      setMessages(prev => [...prev, data.message]);
    } catch (err) {
      const message = getErrorMessage(err.response || err);
      setError(message);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestedPrompt = (prompt) => {
    sendMessage(prompt);
  };

  const canSend = input.trim().length > 0 && input.length <= MAX_MESSAGE_LENGTH && !loading;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="Open assistant chat"
      >
        <FiMessageCircle className="w-7 h-7" />
      </button>

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[min(400px,calc(100vw-3rem))] h-[min(520px,70vh)] flex flex-col bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-700 border-b border-gray-600">
            <div className="flex items-center gap-2">
              <FiMessageCircle className="w-5 h-5 text-blue-400" />
              <span className="font-semibold text-white">Route Assistant</span>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setMessages([]); setError(null); }}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  New chat
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded"
                aria-label="Close chat"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && !loading && (
              <div className="space-y-4">
                <p className="text-gray-400 text-sm">Ask about deliveries, drivers, routes, weather, or performance.</p>
                {SUGGESTED_PROMPTS_BY_CATEGORY.map((category) => (
                  <div key={category.label} className="space-y-2">
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{category.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {category.prompts.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => handleSuggestedPrompt(prompt)}
                          className="text-left px-3 py-2 text-sm rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-100'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-lg bg-gray-700 text-gray-400 text-sm">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="px-4 py-2 bg-red-900/30 border-t border-red-800 text-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                maxLength={MAX_MESSAGE_LENGTH + 1}
                className="flex-1 px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!canSend}
                className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send"
              >
                <FiSend className="w-5 h-5" />
              </button>
            </div>
            {input.length > MAX_MESSAGE_LENGTH * 0.9 && (
              <p className="mt-1 text-xs text-amber-400">
                {input.length} / {MAX_MESSAGE_LENGTH} characters
              </p>
            )}
          </form>
        </div>
      )}
    </>
  );
}
