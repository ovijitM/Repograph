import React, { useState } from 'react';
import { X, Check, ShieldCheck, Sparkles, ExternalLink, Zap } from 'lucide-react';

/**
 * CheckoutModal — Real Stripe Checkout integration.
 * Clicking "Pay with Stripe" calls the backend to create a Checkout Session,
 * then redirects the user to the Stripe-hosted payment page.
 * On success/cancel, Stripe redirects back to the app with ?payment=success or ?payment=cancelled.
 */
export default function CheckoutModal({ isOpen, onClose, theme }) {
  const [selectedPack, setSelectedPack] = useState('popular');
  const [paymentStatus, setPaymentStatus] = useState(''); // '' | 'processing' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const packages = [
    {
      id: 'starter',
      credits: 1000,
      price: '$5.00',
      label: 'Starter',
      desc: '1,000 credits — good for small repos & light usage',
    },
    {
      id: 'popular',
      credits: 3000,
      price: '$12.00',
      label: 'Popular',
      desc: '3,000 credits — ideal for regular teams (Save 20%)',
      popular: true,
    },
    {
      id: 'pro',
      credits: 10000,
      price: '$35.00',
      label: 'Pro',
      desc: '10,000 credits — best value for power users (Save 30%)',
    },
  ];

  const activePack = packages.find(p => p.id === selectedPack);

  const handlePurchase = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setPaymentStatus('processing');

    try {
      const token = localStorage.getItem('repograph_auth_token');
      const res = await fetch('/api/auth/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ pack: selectedPack }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create payment session.');
      }

      // Redirect to Stripe-hosted checkout page
      window.location.href = data.url;
    } catch (err) {
      setPaymentStatus('error');
      setErrorMsg(err.message);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 350,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme === 'light' ? 'rgba(15, 14, 30, 0.45)' : 'rgba(3, 2, 14, 0.75)',
        backdropFilter: 'blur(16px)',
        padding: '24px',
        animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .pack-card {
          flex: 1; padding: 16px; border-radius: 14px;
          border: 1px solid var(--border-glass);
          background: rgba(255,255,255,0.02);
          cursor: pointer; transition: all 0.2s; text-align: center; position: relative;
        }
        .pack-card:hover { border-color: var(--border-glass-bright); background: rgba(255,255,255,0.05); }
        .pack-card.active { border-color: var(--color-secondary); background: rgba(6,182,212,0.08); box-shadow: 0 0 15px rgba(6,182,212,0.15); }
        .btn-pay-hover { transition: all 0.2s; }
        .btn-pay-hover:hover:not(:disabled) { transform: translateY(-1.5px); box-shadow: 0 6px 20px rgba(124,58,237,0.5) !important; filter: brightness(1.05); }
        .btn-pay-hover:disabled { opacity: 0.6; cursor: not-allowed; }
        .credit-row { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-secondary); }
      `}</style>

      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '520px', animation: 'scaleUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
        <div style={{
          background: theme === 'light' ? 'rgba(255,255,255,0.98)' : 'rgba(15,14,38,0.95)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid var(--border-glass-bright)',
          borderRadius: '24px',
          padding: '30px',
          boxShadow: theme === 'light' ? '0 32px 80px rgba(8,7,33,0.15)' : '0 32px 80px rgba(0,0,0,0.65)',
          display: 'flex', flexDirection: 'column', gap: '20px',
        }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(124,58,237,0.3)' }}>
                <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-title)' }}>Top Up Credits</h2>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Secure payment via Stripe. Credits added instantly.</p>
              </div>
            </div>
            <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '6px', borderRadius: '8px', cursor: 'pointer', border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={18} />
            </button>
          </div>

          {/* How credits are used */}
          <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: '12px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '9px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>⚡ Credit Usage</div>
            <div className="credit-row"><span>Small repo (&lt;50 files)</span><span style={{ fontWeight: 700, color: '#a78bfa' }}>−50 credits</span></div>
            <div className="credit-row"><span>Medium repo (50–200 files)</span><span style={{ fontWeight: 700, color: '#a78bfa' }}>−150 credits</span></div>
            <div className="credit-row"><span>Large repo (&gt;200 files)</span><span style={{ fontWeight: 700, color: '#a78bfa' }}>−300 credits</span></div>
            <div className="credit-row"><span>AI chat message</span><span style={{ fontWeight: 700, color: '#67e8f9' }}>−5 credits</span></div>
          </div>

          {/* Package selection */}
          <form onSubmit={handlePurchase} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Select Pack</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {packages.map((pack) => (
                  <div
                    key={pack.id}
                    onClick={() => setSelectedPack(pack.id)}
                    className={`pack-card ${selectedPack === pack.id ? 'active' : ''}`}
                  >
                    {pack.popular && (
                      <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--color-primary)', color: 'white', fontSize: '8px', fontWeight: '800', padding: '2px 8px', borderRadius: '100px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        Popular
                      </div>
                    )}
                    <div style={{ fontSize: '16px', fontWeight: '900', color: 'var(--text-primary)' }}>
                      {(pack.credits).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', margin: '1px 0 4px 0' }}>credits</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--color-secondary)' }}>{pack.price}</div>
                    <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.3' }}>{pack.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            {activePack && (
              <div style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: '10px', padding: '10px 14px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <Zap size={11} style={{ display: 'inline', marginRight: 5, color: '#67e8f9' }} />
                {activePack.desc}
              </div>
            )}

            {errorMsg && (
              <div style={{ fontSize: '11px', color: 'var(--color-accent)', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.18)', borderRadius: '8px', padding: '8px 12px' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={paymentStatus === 'processing'}
                style={{ background: 'none', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)', borderRadius: '12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', height: '40px', padding: '0 20px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={paymentStatus === 'processing'}
                className="btn-pay-hover"
                style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', height: '40px', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '7px', boxShadow: '0 4px 15px rgba(124,58,237,0.25)' }}
              >
                {paymentStatus === 'processing' ? (
                  'Redirecting to Stripe...'
                ) : (
                  <>Pay {activePack?.price} <ExternalLink size={12} /></>
                )}
              </button>
            </div>
          </form>

          {/* Trust seal */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
            <ShieldCheck size={12} style={{ color: 'var(--color-success)' }} />
            Secured by Stripe — your card details never touch our servers.
          </div>
        </div>
      </div>
    </div>
  );
}
