import React, { useState } from 'react';
import logoImg from '../../../../frontend/public/logo.png';
import iconImg from '../../../../frontend/public/icon.png';

interface ApexBeeLogoProps {
  className?: string;
  variant?: 'full' | 'icon';
  height?: number;
  subtitle?: string;
}

export const ApexBeeLogo: React.FC<ApexBeeLogoProps> = ({
  className = '',
  variant = 'full',
  height = 36,
  subtitle,
}) => {
  const [imgError, setImgError] = useState(false);

  if (variant === 'icon') {
    return (
      <div className={`flex items-center space-x-2.5 ${className}`}>
        {!imgError ? (
          <img
            src={iconImg}
            alt="ApexBee"
            onError={() => setImgError(true)}
            className="rounded-xl object-contain shadow-md"
            style={{ height: `${height}px`, width: 'auto' }}
          />
        ) : (
          <div
            className="rounded-xl bg-[#0A1128] border border-amber-500/40 flex items-center justify-center p-1.5 shadow-md"
            style={{ height: `${height}px`, width: `${height}px` }}
          >
            <span className="text-amber-400 font-black text-xs">🐝</span>
          </div>
        )}
        {subtitle && (
          <span className="text-[11px] font-bold text-amber-400 tracking-wider uppercase font-heading">
            {subtitle}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center space-x-2">
        {!imgError ? (
          <img
            src={logoImg}
            alt="ApexBee"
            onError={() => setImgError(true)}
            className="object-contain"
            style={{ height: `${height}px`, width: 'auto', maxHeight: `${height}px` }}
          />
        ) : (
          <div className="flex items-center space-x-1.5">
            <span className="text-xl font-extrabold text-white tracking-tight font-heading">
              Apex<span className="text-[#F3BA12]">Bee</span>
            </span>
            <span className="text-base">🐝</span>
          </div>
        )}
      </div>
      {subtitle && (
        <span className="text-[9.5px] font-extrabold text-amber-400 tracking-wider uppercase mt-0.5 font-heading">
          {subtitle}
        </span>
      )}
    </div>
  );
};

export default ApexBeeLogo;
