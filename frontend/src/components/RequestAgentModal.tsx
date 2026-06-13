'use client';

import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const AGENT_TYPES = [
  'Research & Analysis',
  'Trading & DeFi',
  'Marketing & Growth',
  'Content Creation',
  'Coding & Development',
  'Community Management',
  'Data Analytics',
  'Other',
];

export default function RequestAgentModal({ isOpen, onClose }: Props) {
  const [agentType, setAgentType] = useState('');
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: contact,
          category: 'request',
          message: `🛠️ AGENT REQUEST\n\nType: ${agentType}\nDescription: ${description}\nContact: ${contact || 'Not provided'}`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Failed to submit request');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setAgentType('');
    setDescription('');
    setName('');
    setContact('');
    setSubmitted(false);
    setError('');
    onClose();
  };

  const selectStyle: React.CSSProperties = {
    background: '#0A0A0A',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#fff',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: '#0A0A0A', border: '1px solid rgba(64,255,175,0.2)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">🛠️</span>
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Request Custom Agent</h2>
          </div>
          <button onClick={resetAndClose} className="text-gray-500 hover:text-white transition text-xl">×</button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-white mb-2">Request Submitted!</h3>
            <p className="text-sm text-gray-400 mb-6">We&apos;ll review your request and get back to you.</p>
            <button
              onClick={resetAndClose}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-black transition hover:opacity-80"
              style={{ background: '#40FFAF' }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Agent Type */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Agent Type *</label>
              <select
                value={agentType}
                onChange={(e) => setAgentType(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none cursor-pointer"
                style={selectStyle}
              >
                <option value="" style={{ background: '#0A0A0A', color: '#9ca3af' }}>Select type...</option>
                {AGENT_TYPES.map((type) => (
                  <option key={type} value={type} style={{ background: '#0A0A0A', color: '#fff' }}>{type}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">What should the agent do? *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                placeholder="Describe the agent's capabilities, tasks, and any specific requirements..."
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>

            {/* Name + Contact */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Contact</label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Telegram / Email"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || !agentType || !description.trim()}
              className="w-full py-3 rounded-xl text-sm font-bold text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
              style={{ background: '#40FFAF' }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
