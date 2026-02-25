import React, { useState, useRef, useEffect } from 'react';
import { FiMessageCircle, FiX, FiSend } from 'react-icons/fi';
import { useAssistantChat } from '../../hooks/deliverymanager/useAssistantChat';

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

/**
 * Renders assistant message content with improved formatting:
 * - Preserves line breaks and spacing
 * - Turns "- item" lines into bullet list items
 * - Renders [ACTIVE] / [INACTIVE] as small badges
 */
function AssistantMessageContent({ content }) {
  if (typeof content !== 'string' || !content.trim()) return null;

  const lines = content.split(/\r?\n/);
  const elements = [];
  let listItems = [];
  const flushList = () => {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={elements.length} className="assistant-chat-list mt-1.5 mb-1.5 space-y-1 pl-4 list-disc list-outside text-gray-200">
        {listItems.map((line, j) => (
          <li key={j} className="leading-relaxed">
            <FormattedLine text={line} />
          </li>
        ))}
      </ul>
    );
    listItems = [];
  };

  const FormattedLine = ({ text }) => {
    const parts = [];
    let remaining = text;
    const badgeRegex = /\[(ACTIVE|INACTIVE)\]/gi;
    let lastIndex = 0;
    let match;
    const re = new RegExp(badgeRegex.source, 'gi');
    while ((match = re.exec(remaining)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={`t-${lastIndex}`}>{remaining.slice(lastIndex, match.index)}</span>);
      }
      const isActive = match[1].toUpperCase() === 'ACTIVE';
      parts.push(
        <span
          key={`b-${match.index}`}
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ml-0.5 ${
            isActive ? 'bg-emerald-500/25 text-emerald-300' : 'bg-gray-500/40 text-gray-400'
          }`}
        >
          {match[0]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < remaining.length) {
      parts.push(<span key={`t-${lastIndex}`}>{remaining.slice(lastIndex)}</span>);
    }
    return parts.length > 0 ? <>{parts}</> : text;
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    const isBullet = /^\s*[-•]\s+/.test(line) || (trimmed && trimmed.startsWith('- '));
    const bulletMatch = line.match(/^\s*[-•]\s+(.*)$/);
    const listContent = bulletMatch ? bulletMatch[1].trim() : (isBullet ? trimmed.replace(/^\s*[-•]\s+/, '') : trimmed);

    if (isBullet && listContent) {
      // Split by " - " in case one line has multiple items (e.g. " - name1 [ACTIVE] - name2 [ACTIVE]")
      const segments = listContent.split(/\s+-\s+/).map(s => s.trim()).filter(Boolean);
      segments.forEach(seg => listItems.push(seg));
    } else {
      flushList();
      if (trimmed) {
        elements.push(
          <p key={i} className="assistant-chat-paragraph leading-relaxed text-gray-200">
            <FormattedLine text={trimmed} />
          </p>
        );
      } else if (listItems.length > 0 && i > 0) {
        // keep collecting list items
      } else {
        elements.push(<br key={i} />);
      }
    }
  });
  flushList();

  return (
    <div className="assistant-chat-content space-y-1 text-sm">
      {elements}
    </div>
  );
}

/**
 * AssistantChat - Route optimization assistant chat panel.
 * Props: companyId (required), userId (required)
 */
export default function AssistantChat({ companyId, userId }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { mutateAsync: sendChatMessage, isPending: loading, error: mutationError, reset: resetMutation } = useAssistantChat();

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Refocus input after API response so user can keep typing without clicking again
  const prevLoadingRef = useRef(loading);
  useEffect(() => {
    if (prevLoadingRef.current && !loading && open) {
      const id = requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      return () => cancelAnimationFrame(id);
    }
    prevLoadingRef.current = loading;
  }, [loading, open]);

  // Focus input when chat panel opens so user can type right away
  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  const sendMessage = async (text) => {
    const content = (text || input).trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!content || loading) return;
    if (!companyId || !userId) {
      setError('User or company not set. Please refresh.');
      return;
    }

    setError(null);
    resetMutation();
    const userMessage = { role: 'user', content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');

    try {
      const assistantMessage = await sendChatMessage({ nextMessages, companyId, userId });
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err?.message || 'Something went wrong');
      setMessages(prev => prev.slice(0, -1));
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
      <style>{`
        .assistant-chat-messages::-webkit-scrollbar { display: none; }
        .assistant-chat-bubble {
          line-height: 1.5;
          word-break: break-word;
        }
        .assistant-chat-content p + p { margin-top: 0.5rem; }
        .assistant-chat-list li { margin-top: 0.25rem; }
      `}</style>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="Open assistant chat"
      >
        <FiMessageCircle className="w-7 h-7" />
      </button>

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[min(400px,calc(100vw-3rem))] h-[min(520px,70vh)] flex flex-col border border-gray-700 rounded-xl shadow-2xl overflow-hidden bg-[#0a0a12]">
          <img
            src="/chatboat.jpeg"
            alt=""
            className="absolute inset-0 w-full h-full object-contain object-center pointer-events-none"
            aria-hidden
          />
          <div className="relative z-10 flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-700/90 backdrop-blur-sm border-b border-gray-600">
            <div className="flex items-center gap-2">
              <FiMessageCircle className="w-5 h-5 text-blue-400" />
              <span className="font-semibold text-white">Ask Jaice</span>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setMessages([]); setError(null); resetMutation(); }}
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

          <div
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/30 backdrop-blur-[2px] assistant-chat-messages"
            style={{ scrollbarWidth: 'none' }}
          >
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
                  className={`max-w-[85%] px-4 py-3 rounded-xl text-sm shadow-sm assistant-chat-bubble ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-gray-700/95 text-gray-100 border border-gray-600/50 rounded-bl-md'
                  }`}
                >
                  {msg.role === 'user' ? (
                    msg.content
                  ) : (
                    <AssistantMessageContent content={msg.content} />
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] px-4 py-3 rounded-xl rounded-bl-md bg-gray-700/95 text-gray-400 text-sm border border-gray-600/50 shadow-sm flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
                  <span>Thinking...</span>
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

          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700 bg-gray-900/80 backdrop-blur-sm">
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
        </div>
      )}
    </>
  );
}
