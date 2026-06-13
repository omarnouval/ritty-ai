'use client';

import { useState } from 'react';

interface RequestAgentModalProps {
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'trading', label: 'Trading & DeFi', icon: '📈' },
  { id: 'research', label: 'Research & Analysis', icon: '🔬' },
  { id: 'content', label: 'Content Generation', icon: '✍️' },
  { id: 'monitoring', label: 'Monitoring & Alerts', icon: '📡' },
  { id: 'code', label: 'Code & Dev Tools', icon: '💻' },
  { id: 'social', label: 'Social & Community', icon: '👥' },
  { id: 'custom', label: 'Custom / Other', icon: '⚙️' },
];

export function RequestAgentModal({ onClose }: RequestAgentModalProps) {
  const [category, setCategory] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [useCase, setUseCase] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!topic.trim() || !category) return;
    setIsSubmitting(true);
    
    // Store in localStorage for now (can be sent to backend later)
    const requests = JSON.parse(localStorage.getItem('ritty_agent_requests') || '[]');
    requests.push({
      category,
      topic: topic.trim(),
      description: description.trim(),
      useCase: useCase.trim(),
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('ritty_agent_requests', JSON.stringify(requests));
    
    // Simulate submission
    await new Promise(r => setTimeout(r, 800));
    setSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#111', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px', padding: '32px', maxWidth: '520px', width: '90%',
          maxHeight: '85vh', overflowY: 'auto',
          boxShadow: '0 0 60px rgba(64,255,175,0.08)',
        }}
      >
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>
              Request Submitted!
            </h2>
            <p style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
              We&apos;ll review your request and build the agent for you. 
              Check back on the marketplace soon!
            </p>
            <button
              onClick={onClose}
              style={{
                padding: '12px 32px', borderRadius: '12px',
                background: '#40FFAF', color: '#000',
                border: 'none', fontSize: '14px', fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }}>
                🛠️ Request Custom Agent
              </h2>
              <button
                onClick={onClose}
                style={{
                  background: 'none', border: 'none', color: '#666',
                  fontSize: '20px', cursor: 'pointer', padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: '#888', fontSize: '13px', marginBottom: '24px', lineHeight: '1.5' }}>
              Can&apos;t find what you need? Tell us what agent you want and we&apos;ll build it for you on Ritual Chain.
            </p>

            {/* Category */}
            <label style={{ color: '#aaa', fontSize: '12px', fontWeight: 600, marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Category *
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  style={{
                    padding: '8px 14px', borderRadius: '10px',
                    background: category === cat.id ? 'rgba(64,255,175,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${category === cat.id ? 'rgba(64,255,175,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    color: category === cat.id ? '#40FFAF' : '#888',
                    fontSize: '13px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    transition: 'all 0.15s',
                  }}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Topic */}
            <label style={{ color: '#aaa', fontSize: '12px', fontWeight: 600, marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Agent Topic *
            </label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Solana memecoin sniper, NFT rarity analyzer..."
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff', fontSize: '14px', outline: 'none',
                marginBottom: '20px', boxSizing: 'border-box',
              }}
            />

            {/* Description */}
            <label style={{ color: '#aaa', fontSize: '12px', fontWeight: 600, marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              What should it do?
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the features and capabilities you need..."
              rows={3}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff', fontSize: '14px', outline: 'none',
                marginBottom: '20px', resize: 'vertical', boxSizing: 'border-box',
              }}
            />

            {/* Use Case */}
            <label style={{ color: '#aaa', fontSize: '12px', fontWeight: 600, marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Your use case
            </label>
            <input
              type="text"
              value={useCase}
              onChange={e => setUseCase(e.target.value)}
              placeholder="e.g. I trade NFTs daily and need automated alerts..."
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff', fontSize: '14px', outline: 'none',
                marginBottom: '24px', boxSizing: 'border-box',
              }}
            />

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!topic.trim() || !category || isSubmitting}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                background: (!topic.trim() || !category) ? 'rgba(64,255,175,0.2)' : '#40FFAF',
                color: '#000', fontSize: '15px', fontWeight: 700,
                border: 'none', cursor: (!topic.trim() || !category) ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
