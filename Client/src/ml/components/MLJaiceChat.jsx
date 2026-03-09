/**
 * MLJaiceChat - Jaice assistant chat for ML company (CXO / Delivery Manager).
 * Ref: JAICE_FRONTEND_GUIDE_5004.md. Uses /api/ml-assistant proxy to 5004.
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdChat, MdClose, MdSend, MdRefresh } from 'react-icons/md';
import { useJaiceGreeting, useJaiceChat, useJaiceDebugConfig } from '../../hooks/mlHooks/useJaice';

const JAICE_ACCENT = '#0d9488';

const QUICK_PROMPTS = [
  'Show delivery partner CXO summary for today',
  'Who is online now?',
  'Show active Swiggy drivers',
  'Show delivery partner revenue summary',
  'How many active delivery partner drivers?',
];

const MLJaiceChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [llmWarning, setLlmWarning] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const wasPendingRef = useRef(false);

  const { data: greetingData, isLoading: greetingLoading, error: greetingError } = useJaiceGreeting(
    { enabled: open }
  );
  const { data: debugData } = useJaiceDebugConfig({ enabled: open });
  const chatMutation = useJaiceChat({
    onError: (err) => {
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.error || err?.message || 'Something went wrong.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${msg}${code === 'NO_LLM_CONFIG' ? ' Jaice is available, but the AI provider is not configured yet.' : ''}` },
      ]);
      setTimeout(() => inputRef.current?.focus(), 0);
    },
  });

  useEffect(() => {
    if (open && greetingData?.greeting && messages.length === 0) {
      setMessages([{ role: 'assistant', content: greetingData.greeting }]);
    }
  }, [open, greetingData?.greeting, messages.length]);

  useEffect(() => {
    const noLlm = debugData && debugData.SARVAM_API_KEY_set === false;
    setLlmWarning(!!noLlm);
  }, [debugData]);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Refocus input when chat response arrives (isPending: true -> false)
  useEffect(() => {
    const isPending = chatMutation.isPending;
    if (wasPendingRef.current && !isPending && open) {
      const focusInput = () => {
        const el = inputRef.current;
        if (el && typeof el.focus === 'function') {
          el.focus();
        }
      };
      requestAnimationFrame(() => {
        requestAnimationFrame(focusInput);
      });
    }
    wasPendingRef.current = isPending;
  }, [open, chatMutation.isPending]);

  const handleSend = () => {
    const text = (input || '').trim();
    if (!text || chatMutation.isPending) return;
    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    chatMutation.mutate(
      { messages: nextMessages },
      {
        onSuccess: (data) => {
          const reply = data?.message;
          if (reply?.content) {
            setMessages((prev) => [...prev, { role: 'assistant', content: reply.content }]);
          }
        },
      }
    );
  };

  const handleQuickPrompt = (prompt) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const handleNewChat = () => {
    setMessages([]);
    if (greetingData?.greeting) {
      setMessages([{ role: 'assistant', content: greetingData.greeting }]);
    }
  };

  const isForbidden = greetingError?.response?.status === 403 || greetingError?.response?.data?.code === 'ROLE_FORBIDDEN';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white hover:opacity-90 active:scale-95 transition-all"
        style={{ backgroundColor: JAICE_ACCENT }}
        aria-label="Open Jaice chat"
      >
        <MdChat className="w-7 h-7" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 sm:z-50"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
              style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
            >
              <div
                className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0"
                style={{ backgroundColor: `${JAICE_ACCENT}12` }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: JAICE_ACCENT }}>
                    <MdChat className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">Ask Jaice</h2>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleNewChat}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                    title="New chat"
                  >
                    <MdRefresh className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                    aria-label="Close"
                  >
                    <MdClose className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {llmWarning && (
                <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-amber-800 text-sm">
                  Jaice is available, but the AI provider is not configured yet.
                </div>
              )}

              {isForbidden ? (
                <div className="flex-1 flex items-center justify-center p-6 text-center text-gray-500 text-sm">
                  Access denied. Only DELIVERY_MANAGER, CEO, CFO, and ADMIN can use the assistant chat.
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {greetingLoading && messages.length === 0 && (
                      <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
                      </div>
                    )}
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                            msg.role === 'user'
                              ? 'text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                          style={msg.role === 'user' ? { backgroundColor: JAICE_ACCENT } : {}}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {chatMutation.isPending && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-2xl px-4 py-2.5 text-sm text-gray-500">
                          …
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {messages.length <= 1 && (
                    <div className="px-4 pb-2 shrink-0">
                      <p className="text-xs text-gray-500 mb-2">Quick prompts</p>
                      <div className="flex flex-wrap gap-2">
                        {QUICK_PROMPTS.map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            onClick={() => handleQuickPrompt(prompt)}
                            className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 border-t border-gray-200 shrink-0">
                    <div className="flex gap-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="Type a message..."
                        className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent text-gray-900"
                        style={{ ['--tw-ring-color']: JAICE_ACCENT }}
                        autoFocus
                      />
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleSend}
                        disabled={!input.trim() || chatMutation.isPending}
                        className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white disabled:opacity-50"
                        style={{ backgroundColor: JAICE_ACCENT }}
                      >
                        <MdSend className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MLJaiceChat;
