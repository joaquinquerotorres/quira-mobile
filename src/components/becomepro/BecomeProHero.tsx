import React from 'react';
import './BecomeProHero.css';

interface BecomeProHeroProps {
  title: string;
  subtitle: string;
}

export const BecomeProHero: React.FC<BecomeProHeroProps> = ({ title, subtitle }) => (
  <div className="become-pro-hero animate__animated animate__fadeIn">
    <h2>{title}</h2>
    <p>{subtitle}</p>
  </div>
);
