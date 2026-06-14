'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

interface ChatBoxProps {
  agentName: string;
  agentCategory: string;
  agentIcon: string;
  remainingTime: number; // seconds
  onExtend?: () => void;
  onSwitch?: () => void;
}

export function ChatBox({ agentName, agentCategory, agentIcon, remainingTime, onExtend, onSwitch }: ChatBoxProps) {
  const storageKey = typeof window !== 'undefined'
    ? `ritty_chat_${(window as any).__ritty_user_address || 'anon'}_${agentCategory}`
    : `ritty_chat_anon_${agentCategory}`;
  
  // Load messages from localStorage
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
          }
        } catch {
          // Corrupted data — clear it
          localStorage.removeItem(storageKey);
        }
      }
    } catch {}
    return [];
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0 && remainingTime > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, storageKey, remainingTime]);

  // Clear chat history when rental expires
  useEffect(() => {
    if (remainingTime <= 0 && messages.length > 0) {
      localStorage.removeItem(storageKey);
      setMessages([]);
    }
  }, [remainingTime, storageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Add welcome message for new chats
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'agent',
        content: `Hi! I'm your ${agentCategory} agent. How can I help you today?`,
        timestamp: new Date(),
      }]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return 'Expired';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m remaining`;
    if (m > 0) return `${m}m ${s}s remaining`;
    return `${s}s remaining`;
  };

  const handleSend = async () => {
    if (!input.trim() || remainingTime <= 0) return;

    const userMsg: Message = { role: 'user', content: input.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    const messageToSend = input.trim();
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentCategory,
          message: messageToSend,
          userAddress: '0x0000000000000000000000000000000000000000',
        }),
      });

      const data = await response.json();
      
      const agentMsg: Message = {
        role: 'agent',
        content: data.success ? data.data.response : 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMsg]);
    } catch (error) {
      const agentMsg: Message = {
        role: 'agent',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden" style={{ background: 'rgba(17,17,17,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <span className="text-xl">{agentIcon}</span>
          <div>
            <p className="text-white text-sm font-medium">{agentName}</p>
            <p className="text-xs" style={{ color: remainingTime > 3600 ? '#40FFAF' : remainingTime > 600 ? '#FFA500' : '#FF4444' }}>
              {formatTime(remainingTime)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {onSwitch && (
            <button onClick={onSwitch} className="text-xs px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition" style={{ background: 'rgba(255,255,255,0.05)' }}>
              Switch Agent
            </button>
          )}
          {onExtend && (
            <button onClick={onExtend} className="text-xs px-3 py-1.5 rounded-lg text-black font-medium transition" style={{ background: '#40FFAF' }}>
              Extend
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ maxHeight: '400px' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'text-white rounded-br-md'
                  : 'text-gray-200 rounded-bl-md'
              }`}
              style={{
                background: msg.role === 'user' ? 'rgba(64,255,175,0.15)' : 'rgba(255,255,255,0.05)',
                border: msg.role === 'user' ? '1px solid rgba(64,255,175,0.2)' : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="px-4 py-2.5 rounded-2xl rounded-bl-md text-sm text-gray-400" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="animate-pulse">Typing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {remainingTime <= 0 ? (
          <div className="text-center py-2">
            <p className="text-sm text-gray-400 mb-2">Rental expired</p>
            <button onClick={onExtend} className="text-sm px-5 py-2 rounded-xl text-black font-medium" style={{ background: '#40FFAF' }}>
              Renew Rental
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#40FFAF]/40 transition placeholder-gray-600"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-black disabled:opacity-40 transition"
              style={{ background: '#40FFAF' }}
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
