import React from 'react';
import './AuthLogo.css';

interface AuthLogoProps {
  size?: 'big' | 'compact';
}

export const AuthLogo: React.FC<AuthLogoProps> = ({ size = 'big' }) => (
  <div className={`auth-logo auth-logo--${size}`}>
    <span className="auth-logo-text-main">Qu</span>
    <span className="auth-logo-text-main auth-logo-i-wrapper">
      i<span className="auth-logo-smart-dot" />
    </span>
    <span className="auth-logo-text-main">r</span>
    <span className="auth-logo-text-secondary">a</span>
  </div>
);
