import React, { useId } from 'react';

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
            <rect x="0" y="0" width="500" height="225" />
          </clipPath>
          <clipPath id={bottomClipId}>
            <rect x="0" y="265" width="500" height="235" />
          </clipPath>
        </defs>

        {/* Yellow Brand Background */}
        <rect width="500" height="500" fill="#FFDE00" />

        {/* Top Half of TBC */}
        <g clipPath={`url(#${topClipId})`}>
          <text
            x="250"
            y="325"
            fontFamily="system-ui, -apple-system, 'Arial Black', Impact, 'Montserrat', sans-serif"
            fontWeight="900"
            fontSize="182"
            fill="#000000"
            textAnchor="middle"
            letterSpacing="4"
          >
            TBC
          </text>
        </g>

        {/* Bottom Half of TBC */}
        <g clipPath={`url(#${bottomClipId})`}>
          <text
            x="250"
            y="325"
            fontFamily="system-ui, -apple-system, 'Arial Black', Impact, 'Montserrat', sans-serif"
            fontWeight="900"
            fontSize="182"
            fill="#000000"
            textAnchor="middle"
            letterSpacing="4"
          >
            TBC
          </text>
        </g>

        {/* Sliced center text: THE BROTHERS & CO. */}
        <text
          x="250"
          y="253"
          fontFamily="system-ui, -apple-system, 'Arial Black', Impact, 'Montserrat', sans-serif"
          fontWeight="900"
          fontSize="20.5"
          fill="#000000"
          textAnchor="middle"
          letterSpacing="5"
        >
          THE BROTHERS &amp; CO.
        </text>
      </svg>
    </div>
  );
};
