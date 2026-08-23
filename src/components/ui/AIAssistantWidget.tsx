'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiXMark, 
  HiPaperAirplane, 
  HiPhone,
  HiCalendar,
  HiArrowPath
} from 'react-icons/hi2';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Welcome to **Indira Thakur Photography**! I am your AI Concierge. How may I assist you today with our newborn, maternity, or event storytelling sessions?',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const msgId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`;
    const userMessage: Message = {
      id: msgId,
      role: 'user',
      content: query,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.reply || 'Thank you for your inquiry. How else may I assist you?',
          },
        ]);
      } else {
        throw new Error('API Error');
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            'I apologize for the interruption. You can contact Indira directly on [WhatsApp](https://wa.me/919819620484) or visit our [Contact Page](/contact).',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'What services are offered?',
    'How do I book a shoot?',
    'Where is the studio located?',
    'View gallery categories',
  ];

  // Helper to render markdown-like links [Text](url)
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);

    return parts.map((part, i) => {
      const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (match) {
        const label = match[1];
        const url = match[2];

        if (url.startsWith('http') || url.startsWith('https://wa.me')) {
          return (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C39E96] underline hover:text-[#2B2625] font-medium"
            >
              {label}
            </a>
          );
        } else {
          return (
            <Link
              key={i}
              href={url}
              onClick={() => setIsOpen(false)}
              className="text-[#C39E96] underline hover:text-[#2B2625] font-medium"
            >
              {label}
            </Link>
          );
        }
      }

      // Handle bold **text**
      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      return boldParts.map((bPart, j) => {
        if (bPart.startsWith('**') && bPart.endsWith('**')) {
          return <strong key={j} className="font-semibold text-[#2B2625]">{bPart.slice(2, -2)}</strong>;
        }
        return bPart;
      });
    });
  };

  return (
    <>
      {/* FLOATING TRIGGER BUTTON */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-[#2B2625] text-white rounded-full shadow-2xl border border-[#C39E96]/60 cursor-pointer overflow-hidden hover:border-[#C39E96] transition-all duration-300 hover:shadow-[0_12px_28px_rgba(43,38,37,0.4)]"
          aria-label="Toggle Concierge Assistant"
        >
          <div className="flex items-center justify-center relative">
            <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 text-[#C39E96] group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
            <span className="absolute font-serif text-[10px] sm:text-[11px] font-semibold text-white group-hover:text-[#C39E96] tracking-tighter transition-colors duration-300 -mt-0.5">
              IT
            </span>
          </div>

          <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C39E96] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C39E96]"></span>
          </span>
        </motion.button>
      </div>

      {/* CHAT POPOVER WINDOW */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[min(380px,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] h-[520px] max-h-[80vh] bg-white rounded-2xl border border-[#E7DDD2] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-[#2B2625] text-white flex items-center justify-between border-b border-[#C39E96]/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-[#C39E96]/60 flex items-center justify-center text-[#C39E96] relative">
                  <MessageCircle className="w-5 h-5 text-[#C39E96]" strokeWidth={1.5} />
                  <span className="absolute font-serif text-[9px] font-bold text-white -mt-0.5">IT</span>
                </div>
                <div>
                  <h3 className="font-serif text-base font-medium leading-none text-white tracking-wide">
                    Indira Concierge
                  </h3>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#C39E96] block mt-1">
                    Luxury Booking & Photography Assistant
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close Assistant"
              >
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Quick CTAs Bar */}
            <div className="bg-[#FAF6F3] px-4 py-2 border-b border-[#E7DDD2] flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#7C706D]">
              <a
                href="https://wa.me/919819620484"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-[#C39E96] transition-colors"
              >
                <HiPhone className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </a>
              <span className="text-[#E7DDD2]">|</span>
              <Link
                href="/contact"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-1.5 hover:text-[#C39E96] transition-colors"
              >
                <HiCalendar className="w-3.5 h-3.5 text-[#C39E96]" />
                <span>Book Shoot</span>
              </Link>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#FAF6F3]/50">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                      msg.role === 'user'
                        ? 'bg-[#2B2625] text-white rounded-tr-xs'
                        : 'bg-white text-[#2B2625] border border-[#E7DDD2] rounded-tl-xs'
                    }`}
                  >
                    {renderFormattedText(msg.content)}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#E7DDD2] rounded-2xl rounded-tl-xs px-4 py-3 text-xs text-[#7C706D] flex items-center gap-2">
                    <HiArrowPath className="w-3.5 h-3.5 animate-spin text-[#C39E96]" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            {messages.length < 5 && !loading && (
              <div className="px-3 py-2 bg-white border-t border-[#E7DDD2]/60 overflow-x-auto whitespace-nowrap flex gap-1.5 scrollbar-none">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    className="px-2.5 py-1 bg-[#FAF6F3] hover:bg-[#2B2625] hover:text-white border border-[#E7DDD2] text-[11px] text-[#7C706D] rounded-full transition-colors shrink-0"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 bg-white border-t border-[#E7DDD2] flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about shoots, pricing, gallery..."
                className="flex-1 px-3.5 py-2.5 bg-[#FAF6F3] border border-[#E7DDD2] rounded-full text-xs text-[#2B2625] focus:outline-none focus:border-[#C39E96] transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-9 h-9 bg-[#2B2625] text-white rounded-full flex items-center justify-center hover:bg-[#C39E96] transition-colors disabled:opacity-40 shrink-0"
                aria-label="Send Message"
              >
                <HiPaperAirplane className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
