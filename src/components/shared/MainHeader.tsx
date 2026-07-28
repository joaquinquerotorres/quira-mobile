import React from 'react';
import './MainHeader.css';

interface MainHeaderProps {
  title?: string;           
  subtitle?: string; 
  extraInfo?: string;
}

const MainHeader: React.FC<MainHeaderProps> = ({ 
  title, 
  subtitle, 
  extraInfo,
}) => {
    return (
        <div className="header-bg animate__animated animate__fadeIn">
            <h2>{title}</h2>
            <p>{subtitle}</p>
            {extraInfo && 
                <div style={{color: 'rgba(255,255,255,0.9)', fontSize: '0.72rem', fontWeight: 600, marginTop: '4px', background:'rgba(255,255,255,0.1)', display:'inline-block', padding:'3px 8px', borderRadius:'8px', lineHeight: 1.2}}>
                    {extraInfo}
                </div>
            }
        </div>
    )
};

export default MainHeader;