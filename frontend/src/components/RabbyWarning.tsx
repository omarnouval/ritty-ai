'use client';

export function RabbyWarning({ onClose }: { onClose: () => void }) {
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
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#111', border: '1px solid rgba(255,100,100,0.3)',
          borderRadius: '16px', padding: '32px', maxWidth: '420px', width: '90%',
          boxShadow: '0 0 40px rgba(255,60,60,0.15)',
        }}
      >
        <div style={{ fontSize: '28px', marginBottom: '12px' }}>⚠️</div>
        <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>
          Rabby Wallet Not Supported
        </h2>
        <p style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.6', marginBottom: '16px' }}>
          Rabby wallet forces <span style={{ color: '#ff6b6b' }}>EIP-7702 (type 4)</span> transactions,
          which Ritual Chain doesn&apos;t support yet. Transactions will fail.
        </p>
        <p style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
          Please switch to <strong style={{ color: '#40FFAF' }}>MetaMask</strong> or{' '}
          <strong style={{ color: '#40FFAF' }}>OKX Wallet</strong> to use Ritty.ai.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '10px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.08)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)', fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
