import React from 'react';

export default function GlassCard({ children, className = '', interactive = false, ...props }) {
  return (
    <div 
      className={`glass-panel ${interactive ? 'interactive' : ''} ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
}
