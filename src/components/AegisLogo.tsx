import React from 'react';

interface AegisLogoProps {
  className?: string;
  size?: number | string;
}

export const AegisLogo: React.FC<AegisLogoProps> = ({ className = '', size = '100%' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 1. Symmetrical 6-sided Hexagonal Shield */}
      <path
        d="M 50 8 L 90 24 L 90 70 L 50 92 L 10 70 L 10 24 Z"
        fill="#141414"
        stroke="#141414"
        strokeWidth="1.5"
        strokeLinejoin="miter"
      />

      {/* 2. White Monogram Base (AE-form stylized letter) */}
      <path
        d="M 25 75 L 50 25 L 65 55 L 75 55 L 75 75 Z"
        fill="#EEECE8"
      />

      {/* 3. Subtractive Black Triangular Cutout (A Counter) */}
      <path
        d="M 50 39 L 56.5 51 L 43.5 51 Z"
        fill="#141414"
      />

      {/* 4. Subtractive Parallel Horizontal Black Slot */}
      <path
        d="M 40 59 L 77 59 L 77 66 L 36.5 66 Z"
        fill="#141414"
      />

      {/* 5. Vibrant Neon-Green Downwards-Pointing Triangle */}
      <path
        d="M 46 80 L 54 80 L 50 85 Z"
        fill="#8BEC1C"
      />
    </svg>
  );
};
