'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  txHash?: string;
  explorer?: string;
}

interface ChatBoxProps {
  agentId: number;
  agentName: string;
  agentCategory: string;
  agentIcon: string | React.ReactNode | React.ComponentType<any>;
  remainingTime: number; // seconds
  walletAddress?: string;
  onExtend?: () => void;
  onSwitch?: () => void;
}

export function ChatBox({ agentId, agentName, agentCategory, agentIcon, remainingTime, walletAddress, onExtend, onSwitch }: ChatBoxProps) {
  const storageKey = typeof window !== 'undefined'
    ? `ritty_chat_${walletAddress || (window as any).__ritty_user_address || 'anon'}_agent${agentId}`
    : `ritty_chat_anon_agent${agentId}`;
  
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
  const [chatLanguage, setChatLanguage] = useState<string | null>(null);
  const [onchainMode, setOnchainMode] = useState(false); // default: fast off-chain
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0 && remainingTime > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, storageKey, remainingTime]);

  // Clear chat history when rental expires (with delay to avoid false clear on mount)
  const [expireChecked, setExpireChecked] = useState(false);
  useEffect(() => {
    // Wait 2 seconds before checking expiry — timer needs time to populate
    const timer = setTimeout(() => setExpireChecked(true), 2000);
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    if (expireChecked && remainingTime <= 0 && messages.length > 0) {
      localStorage.removeItem(storageKey);
      setMessages([]);
    }
  }, [expireChecked, remainingTime, storageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Add welcome message for new chats
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'agent',
        content: `Hi! I'm your ${agentName} agent. How can I help you today?`,
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

    // Detect language from first message
    const userMessage = input.trim();
    if (!chatLanguage) {
      // Simple detection: if contains Indonesian keywords → id, else → en
      const indoWords = /\b(gua|gue|gw|lo|lu|yang|ini|itu|ada|gak|nggak|bisa|mau|apa|kenapa|gimana|kapan|dimana|siapa|halo|hai|bang|bro|sis|kak|cok|anjg|anjing|wkwk|oke|ok|gas|jos|mantap|keren|bagus|jelek|sulit|mudah|susah|gampang)\b/i;
      const lang = indoWords.test(userMessage) ? 'id' : 'en';
      setChatLanguage(lang);
    }

    const userMsg: Message = { role: 'user', content: userMessage, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    const messageToSend = input.trim();
    setInput('');
    setIsTyping(true);

    const payload = {
      agentCategory,
      agentId,
      message: messageToSend,
      userAddress: walletAddress || '0x0000000000000000000000000000000000000000',
      chatLanguage: chatLanguage || 'en',
    };

    const callApi = (endpoint: string) =>
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((r) => r.json());

    try {
      let data: any;
      let usedOnchain = false;

      if (onchainMode) {
        // On-chain inference via 0x0802 (verifiable, slower)
        try {
          data = await callApi('/api/chat-onchain');
          if (data?.success) {
            usedOnchain = true;
          } else {
            // On-chain failed (model down / executor busy / settling) → fall back to fast off-chain
            data = await callApi('/api/chat');
          }
        } catch {
          data = await callApi('/api/chat');
        }
      } else {
        // Fast off-chain (MIMO) — default
        data = await callApi('/api/chat');
      }

      const agentMsg: Message = {
        role: 'agent',
        content: data?.success ? data.data.response : (data?.error || 'Sorry, I encountered an error. Please try again.'),
        timestamp: new Date(),
        txHash: usedOnchain && data?.success ? data.data.txHash : undefined,
        explorer: usedOnchain && data?.success ? data.data.explorer : undefined,
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
          <span className="text-xl">
            {typeof agentIcon === 'string'
              ? agentIcon
              : React.isValidElement(agentIcon)
                ? agentIcon
                : agentIcon
                  ? React.createElement(agentIcon as React.ComponentType<any>, { size: 22, style: { color: '#40FFAF' } })
                  : null}
          </span>
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
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'text-white rounded-br-md'
                  : 'text-gray-200 rounded-bl-md'
              }`}
              style={{
                background: msg.role === 'user' ? 'rgba(64,255,175,0.15)' : 'rgba(255,255,255,0.05)',
                border: msg.role === 'user' ? '1px solid rgba(64,255,175,0.2)' : '1px solid rgba(255,255,255,0.06)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.content}
            </div>
            {msg.txHash && (
              <a
                href={msg.explorer || `https://explorer.ritualfoundation.org/tx/${msg.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 text-[10px] flex items-center gap-1 transition hover:opacity-80"
                style={{ color: '#40FFAF' }}
                title="This response was generated on-chain via Ritual precompile 0x0802"
              >
                <span style={{ fontSize: '8px' }}>●</span>
                Verified on-chain · {msg.txHash.slice(0, 6)}…{msg.txHash.slice(-4)} ↗
              </a>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="px-4 py-2.5 rounded-2xl rounded-bl-md text-sm text-gray-400" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="animate-pulse">{onchainMode ? 'Running inference on-chain… (~15s)' : 'Thinking…'}</span>
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
          <>
            {/* Mode toggle: Fast (off-chain) vs On-chain (verifiable) */}
            <div className="flex items-center justify-between mb-2.5 px-1">
              <span className="text-[10px] text-gray-500">
                {onchainMode ? '🔗 Verifiable on Ritual · ~15s' : '⚡ Fast mode · ~2s'}
              </span>
              <button
                onClick={() => setOnchainMode((v) => !v)}
                className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg transition"
                style={{
                  background: onchainMode ? 'rgba(64,255,175,0.12)' : 'rgba(255,255,255,0.05)',
                  border: onchainMode ? '1px solid rgba(64,255,175,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  color: onchainMode ? '#40FFAF' : '#9ca3af',
                }}
                title={onchainMode
                  ? 'On-chain: each response generated via Ritual precompile 0x0802, verifiable on explorer (slower)'
                  : 'Fast: off-chain inference for instant replies'}
              >
                <span style={{ fontSize: '7px' }}>{onchainMode ? '●' : '○'}</span>
                {onchainMode ? 'On-chain' : 'Fast'}
              </button>
            </div>
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type your message... (Shift+Enter for new line)"
                rows={1}
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#40FFAF]/40 transition placeholder-gray-600 resize-none max-h-32 overflow-y-auto"
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
          </>
        )}
      </div>
    </div>
  );
}
