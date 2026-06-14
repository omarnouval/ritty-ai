'use client';

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseAbi } from 'viem';

const MARKETPLACE_ADDRESS = '0xAFDBA0921A3D108DF0282Eed99a44AFDbdBAF9cE';
const MARKETPLACE_ABI = parseAbi([
  'function rateAgent(uint256 _agentId, uint8 _rating) external',
]);

interface Props {
  isOpen: boolean;
  agentId: string;
  agentName: string;
  onClose: () => void;
}

const RATING_LABELS = ['', 'Terrible', 'Bad', 'Okay', 'Good', 'Excellent'];
const RATING_EMOJIS = ['', '😤', '😕', '😐', '😊', '🤩'];

export default function ReviewModal({ isOpen, agentId, agentName, onClose }: Props) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) return;

    try {
      writeContract({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: 'rateAgent',
        args: [BigInt(agentId), rating],
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Rating failed:', err);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: '#0A0A0A', border: '1px solid rgba(64,255,175,0.2)' }}>
        {submitted && isSuccess ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">⭐</div>
            <h3 className="text-xl font-bold text-white mb-2">Thanks for your review!</h3>
            <p className="text-sm text-gray-400 mb-6">Your rating helps other users find the best agents.</p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-black transition hover:opacity-80"
              style={{ background: '#40FFAF' }}
            >
              Done
            </button>
          </div>
        ) : (
          <div className="p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="text-3xl mb-2">⭐</div>
              <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>Rate Your Experience</h3>
              <p className="text-sm text-gray-400 mt-1">How was <span className="text-white font-medium">{agentName}</span>?</p>
            </div>

            {/* Stars */}
            <div className="flex justify-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="text-3xl transition-transform hover:scale-125"
                  style={{ cursor: 'pointer' }}
                >
                  {star <= displayRating ? '★' : '☆'}
                </button>
              ))}
            </div>

            {/* Rating label */}
            <div className="text-center mb-6 h-6">
              {displayRating > 0 && (
                <span className="text-sm" style={{ color: displayRating >= 4 ? '#40FFAF' : displayRating >= 3 ? '#fbbf24' : '#ef4444' }}>
                  {RATING_EMOJIS[displayRating]} {RATING_LABELS[displayRating]}
                </span>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={rating === 0 || isPending || isConfirming}
              className="w-full py-3 rounded-xl text-sm font-bold text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
              style={{ background: '#40FFAF' }}
            >
              {isPending ? 'Confirm in wallet...' : isConfirming ? 'Submitting...' : 'Submit Rating'}
            </button>

            {/* Skip */}
            <button
              onClick={onClose}
              className="w-full py-2 mt-2 text-xs text-gray-500 hover:text-gray-300 transition"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
