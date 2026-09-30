import React, { useId } from 'react';
import logoPaths from './tbcLogoPaths.json';

interface TBCLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  rounded?: 'none' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  className?: string;
  onClick?: () => void;
  title?: string;
}

export const TBCLogo: React.FC<TBCLogoProps> = ({
  size = 'md',
  rounded = '2xl',
  className = '',
  onClick,
  title = 'TBC - The Brothers & Co.',
}) => {
  const rawId = useId();
  const topClipId = `top_${rawId.replace(/:/g, '')}`;
  const bottomClipId = `bot_${rawId.replace(/:/g, '')}`;

  let dimension = 40;
  if (typeof size === 'number') {
    dimension = size;
  } else {
    switch (size) {
      case 'xs':
        dimension = 24;
        break;
      case 'sm':
        dimension = 32;
        break;
      case 'md':
        dimension = 40;
        break;
      case 'lg':
        dimension = 48;
        break;
      case 'xl':
        dimension = 64;
        break;
    }
  }

  const roundedClasses: Record<string, string> = {
    none: 'rounded-none',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full',
  };

  const roundedClass = roundedClasses[rounded] || 'rounded-2xl';

  return (
    <div
      onClick={onClick}
      title={title}
      style={{ width: dimension, height: dimension }}
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden shadow-sm select-none transition-transform ${roundedClass} ${className}`}
    >
      <svg
        viewBox="0 0 500 500"
        className="w-full h-full block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id={topClipId}>
            <rect x="0" y="0" width="500" height="233" />
          </clipPath>
          <clipPath id={bottomClipId}>
            <rect x="0" y="267" width="500" height="233" />
          </clipPath>
        </defs>

        {/* Authentic Canary Yellow Background (#FEDB00) */}
        <rect width="500" height="500" fill="#FEDB00" />

        {/* Top Half of TBC Vector Paths */}
        <g clipPath={`url(#${topClipId})`}>
          <path d={logoPaths.tbcCombinedPath} fill="#000000" />
        </g>

        {/* Bottom Half of TBC Vector Paths */}
        <g clipPath={`url(#${bottomClipId})`}>
          <path d={logoPaths.tbcCombinedPath} fill="#000000" />
        </g>

        {/* Center Sliced Gap: THE BROTHERS & CO. Vector Paths */}
        <path d={logoPaths.subCombinedPath} fill="#000000" />
      </svg>
    </div>
  );
};
