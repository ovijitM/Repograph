import React, { useState } from 'react';
import { X, Check, ShieldCheck, Sparkles, CreditCard } from 'lucide-react';

export default function CheckoutModal({ isOpen, onClose, theme, onPurchaseSuccess }) {
  const [selectedPack, setSelectedPack] = useState(10); // 10, 30, 100
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(''); // '', 'processing', 'success', 'error'
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const packages = [
    { credits: 10, price: '$5.00', desc: 'Starter pack for small projects' },
    { credits: 30, price: '$12.00', desc: 'Popular pack for regular use (Save 20%)', popular: true },
    { credits: 100, price: '$35.00', desc: 'Best value for active development (Save 30%)' }
  ];

  const handlePurchase = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!cardName.trim() || !cardNumber.trim() || !cardExpiry.trim() || !cardCvc.trim()) {
      setErrorMsg('Please complete all mock payment details.');
      return;
    }

    setPaymentStatus('processing');

    try {
      const token = localStorage.getItem('repograph_auth_token');
      const res = await fetch('/api/auth/buy-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: selectedPack }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Mock transaction failed.');
      }

      setPaymentStatus('success');
      setTimeout(() => {
        onPurchaseSuccess(data.credits);
        // Reset states
        setCardName('');
        setCardNumber('');
        setCardExpiry('');
        setCardCvc('');
        setPaymentStatus('');
        onClose();
      }, 1500);
    } catch (err) {
      setPaymentStatus('error');
      setErrorMsg(err.message);
    }
  };

  const activePack = packages.find(p => p.credits === selectedPack);
  const isDark = theme === 'dark';

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
        animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .pack-card {
          flex: 1;
          padding: 16px;
          border-radius: 14px;
          border: 1px solid var(--border-glass);
          background: rgba(255, 255, 255, 0.02);
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          position: relative;
        }
        .pack-card:hover {
          border-color: var(--border-glass-bright);
          background: rgba(255, 255, 255, 0.05);
        }
        .pack-card.active {
          border-color: var(--color-secondary);
          background: rgba(6, 182, 212, 0.08);
          box-shadow: 0 0 15px rgba(6, 182, 212, 0.15);
        }
        .checkout-input {
          width: 100%;
          height: 38px;
          background: rgba(0, 0, 0, 0.18) !important;
          border: 1px solid var(--border-glass);
          border-radius: 10px;
          padding: 0 12px;
          color: white !important;
          font-size: 12px;
          font-family: var(--font-body);
          transition: all 0.2s;
        }
        .checkout-input:focus {
          border-color: var(--color-secondary);
          outline: none;
          background: rgba(0, 0, 0, 0.28) !important;
        }
        .btn-pay-hover {
          transition: all 0.2s;
        }
        .btn-pay-hover:hover:not(:disabled) {
          transform: translateY(-1.5px);
          box-shadow: 0 6px 20px rgba(124, 58, 237, 0.5) !important;
          filter: brightness(1.05);
        }
        .btn-pay-hover:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-cancel-hover {
          transition: all 0.2s;
        }
        .btn-cancel-hover:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-primary) !important;
          border-color: var(--text-secondary) !important;
        }
      `}</style>

      <div 
        onClick={(e) => e.stopPropagation()} 
        style={{
          width: '100%',
          maxWidth: '540px',
          animation: 'scaleUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        <div 
          style={{ 
            background: theme === 'light' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(15, 14, 38, 0.95)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid var(--border-glass-bright)',
            borderRadius: '24px',
            padding: '30px',
            boxShadow: theme === 'light' 
              ? '0 32px 80px rgba(8, 7, 33, 0.15)' 
              : '0 32px 80px rgba(0, 0, 0, 0.65)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div 
                style={{ 
                  width: '38px', 
                  height: '38px', 
                  borderRadius: '10px', 
                  background: 'rgba(124, 58, 237, 0.15)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  border: '1px solid rgba(124, 58, 237, 0.3)' 
                }}
              >
                <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-title)' }}>
                  Buy Repository Credits
                </h2>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Choose a credit pack to analyze more codebases.
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              style={{
                color: 'var(--text-muted)',
                padding: '6px',
                borderRadius: '8px',
                cursor: 'pointer',
                border: 'none',
                background: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {paymentStatus === 'success' ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '40px 0', gap: '16px', textAlign: 'center'
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Check size={32} style={{ color: 'var(--color-success)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                  Payment Successful!
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                  Added {selectedPack} credits to your account.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePurchase} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Credit Packages Select */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Select Package
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {packages.map((pack) => (
                    <div 
                      key={pack.credits}
                      onClick={() => setSelectedPack(pack.credits)}
                      className={`pack-card ${selectedPack === pack.credits ? 'active' : ''}`}
                    >
                      {pack.popular && (
                        <div style={{
                          position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                          background: 'var(--color-primary)', color: 'white', fontSize: '8px', fontWeight: '800',
                          padding: '2px 8px', borderRadius: '100px', textTransform: 'uppercase'
                        }}>
                          Popular
                        </div>
                      )}
                      <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-primary)' }}>
                        {pack.credits} Credits
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-secondary)', margin: '4px 0' }}>
                        {pack.price}
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                        {pack.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment details */}
              <div style={{ 
                display: 'flex', flexDirection: 'column', gap: '12px',
                borderTop: '1px solid var(--border-glass)', pt: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)' }}>
                  <CreditCard size={13} /> SECURE MOCK CHECKOUT
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '9px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cardholder Name</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Alex Mercer"
                    className="checkout-input"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '9px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4000 1234 5678 9010"
                    className="checkout-input"
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '9px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Expiry</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="checkout-input"
                    />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '9px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CVC</label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      placeholder="123"
                      className="checkout-input"
                    />
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div style={{ fontSize: '11px', color: 'var(--color-accent)', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.18)', borderRadius: '8px', padding: '8px 12px' }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Action Buttons */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'end', 
                  gap: '10px', 
                  marginTop: '12px', 
                  borderTop: '1px solid var(--border-glass)', 
                  paddingTop: '20px' 
                }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  disabled={paymentStatus === 'processing'}
                  className="btn-cancel-hover"
                  style={{
                    background: 'none',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-secondary)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    height: '40px',
                    padding: '0 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxSizing: 'border-box'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentStatus === 'processing'}
                  className="btn-pay-hover"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    height: '40px',
                    padding: '0 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 15px rgba(124, 58, 237, 0.25)',
                    flex: 1,
                    boxSizing: 'border-box'
                  }}
                >
                  {paymentStatus === 'processing' ? 'Processing Transaction...' : `Pay ${activePack.price} to Buy Credits`}
                </button>
              </div>
            </form>
          )}

          {/* Secure Trust Seal */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
            <ShieldCheck size={12} style={{ color: 'var(--color-success)' }} /> Encrypted mock transaction. No real funds are moved.
          </div>
        </div>
      </div>
    </div>
  );
}
