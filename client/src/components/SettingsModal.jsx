import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Check, ShieldAlert, Key, HelpCircle } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, theme }) {
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [showOpenai, setShowOpenai] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // '', 'saved'

  useEffect(() => {
    if (isOpen) {
      setOpenaiKey(localStorage.getItem('repograph_openai_api_key') || '');
      setAnthropicKey(localStorage.getItem('repograph_anthropic_api_key') || '');
      setSaveStatus('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('repograph_openai_api_key', openaiKey.trim());
    localStorage.setItem('repograph_anthropic_api_key', anthropicKey.trim());
    localStorage.removeItem('repograph_gemini_api_key');
    localStorage.removeItem('repograph_llm_provider');
    
    setSaveStatus('saved');
    setTimeout(() => {
      setSaveStatus('');
      onClose();
    }, 1200);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
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
        .btn-provider-active {
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%) !important;
          color: white !important;
          border: none !important;
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.35) !important;
        }
        .btn-provider-inactive {
          background: rgba(255, 255, 255, 0.03);
          color: var(--text-secondary);
          border: 1px solid var(--border-glass);
        }
        .btn-provider-inactive:hover {
          color: var(--text-primary);
          border-color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.06);
        }
        .input-credential {
          width: 100%;
          height: 42px;
          padding-left: 14px;
          padding-right: 40px;
          background: rgba(0, 0, 0, 0.18) !important;
          border: 1px solid var(--border-glass);
          border-radius: 12px;
          color: white !important; /* Keep input text highly visible on dark backgrounds */
          font-size: 13px;
          font-family: var(--font-body);
          transition: all 0.2s;
        }
        .input-credential:focus {
          border-color: var(--color-secondary);
          outline: none;
          background: rgba(0, 0, 0, 0.28) !important;
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.25);
        }
        .btn-cancel {
          background: none;
          border: 1px solid var(--border-glass);
          color: var(--text-secondary);
          padding: 8px 18px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-cancel:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
        }
        .close-btn-hover:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-primary) !important;
        }
      `}</style>
      <div 
        onClick={(e) => e.stopPropagation()} 
        style={{
          width: '100%',
          maxWidth: '480px',
          animation: 'scaleUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        <div 
          style={{ 
            background: theme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 14, 38, 0.90)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid var(--border-glass-bright)',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: theme === 'light' 
              ? '0 32px 80px rgba(8, 7, 33, 0.15), 0 0 40px rgba(124, 58, 237, 0.03)' 
              : '0 32px 80px rgba(0, 0, 0, 0.65), 0 0 50px rgba(124, 58, 237, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div 
                style={{ 
                  width: '38px', 
                  height: '38px', 
                  borderRadius: '10px', 
                  background: 'rgba(6, 182, 212, 0.15)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  border: '1px solid rgba(6, 182, 212, 0.3)' 
                }}
              >
                <Key size={18} className="text-secondary" style={{ color: 'var(--color-secondary)' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-title)' }}>
                  API Key Credentials
                </h2>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Bring your own key (BYOK) configurations
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="close-btn-hover"
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

          {/* Alert Security Warning */}
          <div 
            style={{ 
              display: 'flex',
              gap: '12px',
              padding: '14px',
              borderRadius: '14px',
              background: theme === 'light' ? 'rgba(239, 68, 68, 0.04)' : 'rgba(239, 68, 68, 0.06)', 
              border: '1px solid rgba(239, 68, 68, 0.18)',
              alignItems: 'flex-start'
            }}
          >
            <ShieldAlert size={16} style={{ color: '#fca5a5', marginTop: '2px', flexShrink: 0 }} />
            <p style={{ fontSize: '11px', lineHeight: '1.6', color: theme === 'light' ? '#b91c1c' : '#fca5a5', margin: 0 }}>
              Your API keys are stored securely inside your browser's local storage. They are only sent in request headers to run your code analyses and are never saved permanently on our servers.
            </p>
          </div>

          {/* Form Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Anthropic API Key Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Anthropic API Key (Claude)
                </label>
                <a 
                  href="https://console.anthropic.com/" 
                  target="_blank" 
                  rel="noreferrer"
                  style={{
                    fontSize: '10px',
                    color: 'var(--color-secondary)',
                    textDecoration: 'underline',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <HelpCircle size={12} /> Get API Key
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showAnthropic ? 'text' : 'password'}
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-... (used for repo overview & file summaries)"
                  className="input-credential"
                />
                <button
                  type="button"
                  onClick={() => setShowAnthropic(!showAnthropic)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255, 255, 255, 0.40)',
                    cursor: 'pointer',
                    border: 'none',
                    background: 'none',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showAnthropic ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* OpenAI API Key Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  OpenAI API Key (ChatGPT)
                </label>
                <a 
                  href="https://platform.openai.com/api-keys" 
                  target="_blank" 
                  rel="noreferrer"
                  style={{
                    fontSize: '10px',
                    color: 'var(--color-secondary)',
                    textDecoration: 'underline',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <HelpCircle size={12} /> Get API Key
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showOpenai ? 'text' : 'password'}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-proj-... (used for codebase chatbot)"
                  className="input-credential"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenai(!showOpenai)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255, 255, 255, 0.40)',
                    cursor: 'pointer',
                    border: 'none',
                    background: 'none',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showOpenai ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'end', gap: '10px', marginTop: '12px' }}>
            <button
              onClick={onClose}
              disabled={saveStatus === 'saved'}
              className="btn-cancel"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saved'}
              style={{
                height: '38px',
                padding: '0 24px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '12px',
                fontWeight: '700',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: saveStatus === 'saved' ? 'var(--color-success, #10b981)' : 'var(--color-secondary)',
                boxShadow: saveStatus === 'saved' ? '0 0 15px rgba(16, 185, 129, 0.3)' : '0 4px 15px rgba(0, 242, 254, 0.25)'
              }}
            >
              {saveStatus === 'saved' ? (
                <>
                  <Check size={14} /> Saved!
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
