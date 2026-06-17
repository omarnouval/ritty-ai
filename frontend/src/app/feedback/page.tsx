'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Heart } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import MobileMenu from '@/components/MobileMenu';
import { useTranslations } from '@/lib/i18n/LanguageContext';
import { useNotifications } from '@/components/NotificationProvider';
import dynamic from 'next/dynamic';
const ColorBends = dynamic(() => import('@/components/reactbits/ColorBends'), { ssr: false });

export default function FeedbackPage() {
  const { isConnected } = useAccount();
  const { t } = useTranslations();
  const { addNotification } = useNotifications();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, category, message }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        setName('');
        setEmail('');
        setCategory('general');
        setMessage('');
        addNotification({
          type: 'feedback_sent',
          title: 'Feedback Sent!',
          message: 'Thank you for your feedback! We read every submission 🙏',
        });
      } else {
        setError(data.error || 'Failed to submit feedback');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen relative" style={{ background: '#050505' }}>
      {/* ColorBends Background */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ opacity: 0.3 }}>
        <ColorBends
          colors={['#40FFAF', '#0D9373', '#0A7558']}
          speed={0.15}
          frequency={0.8}
          noise={0.1}
          rotation={45}
          transparent={true}
          warpStrength={1}
          mouseInfluence={1}
          parallax={0.5}
        />
      </div>
      {/* Nav */}
      <nav className="relative z-10 flex justify-between items-center px-4 md:px-6 lg:px-12 py-4" style={{ borderBottom: '1px solid #161616' }}>
        <Link href="/" className="flex items-center gap-2 md:gap-3">
          <img src="/ritty-logo.png" alt="Ritty.ai" className="h-8 md:h-10 w-auto" />
          <span className="text-lg md:text-xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Ritty.ai</span>
        </Link>
        <div className="hidden md:flex items-center gap-10">
          <Link href="/agent-rent" className="text-sm transition-colors hover:text-white" style={{ color: '#A1A1AA' }}>{t('buttons.marketplace')}</Link>
          <Link href="/how-it-works" className="text-sm transition-colors hover:text-white" style={{ color: '#A1A1AA' }}>{t('nav.howItWorks')}</Link>
          <Link href="/feedback" className="text-sm transition-colors hover:text-white" style={{ color: '#40FFAF' }}>Feedback</Link>
          {isConnected && (
            <Link href="/dashboard" className="text-sm transition-colors hover:text-white" style={{ color: '#A1A1AA' }}>{t('nav.dashboard')}</Link>
          )}
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <ConnectButton />
          <LanguageSwitcher />
          <MobileMenu />
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 md:px-6 py-16 md:py-24">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight neon-text" style={{ fontFamily: 'Orbitron, sans-serif', color: '#fff' }}>
            Feedback
          </h1>
          <p className="text-sm md:text-base" style={{ color: '#fff', opacity: 0.7 }}>
            Help us improve Ritty.ai. Your feedback goes directly to our team.
          </p>
        </div>

        {submitted ? (
          /* Success State */
          <div className="text-center rounded-2xl p-12" style={{ background: '#0A0A0A', border: '1px solid #161616' }}>
            <Heart size={48} className="mx-auto mb-4" style={{ color: '#40FFAF' }} fill="currentColor" />
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#fff' }}>
              Thank you!
            </h2>
            <p className="text-sm mb-6" style={{ color: '#fff', opacity: 0.7 }}>
              Your feedback has been received. We read every submission.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="text-sm font-medium px-6 py-2.5 rounded-xl transition-all"
              style={{ background: '#40FFAF', color: '#050505' }}
            >
              Submit another
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="rounded-2xl p-8" style={{ background: '#0A0A0A', border: '1px solid #161616' }}>
            {/* Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: '#fff' }}>
                Name (optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>

            {/* Email */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: '#fff' }}>
                Email (optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>

            {/* Category */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: '#fff' }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none appearance-none cursor-pointer"
                style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <option value="general">General Feedback</option>
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="agent">Agent Quality</option>
                <option value="ui">UI/UX</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Message */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: '#fff' }}>
                Message *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what you think..."
                required
                rows={5}
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#40FFAF', color: '#050505' }}
            >
              {isSubmitting ? 'Sending...' : 'Send Feedback'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
