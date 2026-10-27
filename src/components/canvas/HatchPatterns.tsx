import React from 'react';

export const HatchPatterns: React.FC = () => {
  return (
    <defs>
      {/* Illustrator-style Dot Mesh Pattern */}
      <pattern
        id="dot-mesh-merge"
        width="8"
        height="8"
        patternUnits="userSpaceOnUse"
      >
        <circle cx="4" cy="4" r="1.5" fill="#6366f1" fillOpacity="0.85" />
      </pattern>

      {/* Red Dot Mesh Pattern for Erase / Subtract */}
      <pattern
        id="dot-mesh-subtract"
        width="8"
        height="8"
        patternUnits="userSpaceOnUse"
      >
        <circle cx="4" cy="4" r="1.5" fill="#f43f5e" fillOpacity="0.85" />
      </pattern>

      {/* Diagonal Hatch for Hover Highlight */}
      <pattern
        id="diagonal-hatch"
        width="10"
        height="10"
        patternTransform="rotate(45 0 0)"
        patternUnits="userSpaceOnUse"
      >
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="10"
          stroke="#a5b4fc"
          strokeWidth="2.5"
          strokeOpacity="0.6"
        />
      </pattern>

      {/* Transparent Checkerboard Pattern */}
      <pattern
        id="transparency-checkers"
        width="16"
        height="16"
        patternUnits="userSpaceOnUse"
      >
        <rect width="16" height="16" fill="#141519" />
        <rect width="8" height="8" fill="#1e2025" />
        <rect x="8" y="8" width="8" height="8" fill="#1e2025" />
      </pattern>

      {/* Subtle Glow Filter */}
      <filter id="shape-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
  );
};
