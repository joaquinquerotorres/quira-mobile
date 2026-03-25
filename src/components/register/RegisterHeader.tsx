import React from 'react';
import { AuthLogo } from '../auth/AuthLogo';
import './RegisterHeader.css';

export const RegisterHeader: React.FC = () => (
  <div className="register-header">
    <AuthLogo size="big" />
    <h2 className="register-title">Crea tu cuenta</h2>
    <p className="register-subtitle">Empieza a gestionar tu hogar hoy mismo.</p>
  </div>
);
