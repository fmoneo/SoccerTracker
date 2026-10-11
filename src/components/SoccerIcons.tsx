import React from 'react';

/**
 * Minimalist Corner Flag Icon:
 * Features pitch boundary lines meeting at the corner,
 * a clean quarter-circle corner arc, a vertical flagpole,
 * and a minimalist wavy flag banner.
 */
export const CornerFlagIcon: React.FC<{
  size?: number;
  className?: string;
  color?: string;
}> = ({ size = 22, className = '', color = 'currentColor' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Corner field lines meeting at base vertex (12, 16) */}
      <path d="M 3 21.5 L 12 16.5 L 21 21.5" />
      {/* Semicircle / quarter corner arc */}
      <path d="M 6.8 19.3 C 8.6 18.2 15.4 18.2 17.2 19.3" />
      {/* Vertical flagpole */}
      <path d="M 12 16.5 V 3" />
      {/* Flag with wave at top */}
      <path
        d="M 12 3.5 C 14.5 2.2 17 4.2 19.5 3.2 V 9.5 C 17 10.5 14.5 8.5 12 9.8 Z"
        fill={color}
        fillOpacity="0.25"
      />
    </svg>
  );
};

/**
 * Realistic Referee Assistant Flag Icon (Offside):
 * Positioned at a 45° angle with silver pole, dark grip handle,
 * and a quartered/checkered yellow and red flag cloth.
 */
export const OffsideFlagIcon: React.FC<{
  size?: number;
  className?: string;
}> = ({ size = 22, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Rotated 45 degrees around center (14, 14) */}
      <g transform="rotate(45 14 14)">
        {/* Flag Pole */}
        <rect x="7" y="2" width="2" height="23" rx="0.8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.5" />
        {/* Handle Grip */}
        <rect x="6" y="20" width="4" height="6.5" rx="1.2" fill="#334155" stroke="#1e293b" strokeWidth="0.8" />

        {/* Checkered Flag Cloth - Yellow & Red Quadrants */}
        {/* Top-Left: Yellow */}
        <path
          d="M 9 3.5 C 11.5 2.8 13.5 4.2 15.5 3.5 L 15.5 9.2 C 13.5 9.9 11.5 8.5 9 9.2 Z"
          fill="#fbbf24"
          stroke="#1e293b"
          strokeWidth="0.75"
          strokeLinejoin="round"
        />
        {/* Top-Right: Red */}
        <path
          d="M 15.5 3.5 C 17.5 2.8 19.8 4 22 3.3 L 22 9 C 19.8 9.7 17.5 8.5 15.5 9.2 Z"
          fill="#ef4444"
          stroke="#1e293b"
          strokeWidth="0.75"
          strokeLinejoin="round"
        />
        {/* Bottom-Left: Red */}
        <path
          d="M 9 9.2 C 11.5 8.5 13.5 9.9 15.5 9.2 L 15.5 15 C 13.5 15.7 11.5 14.3 9 15 Z"
          fill="#ef4444"
          stroke="#1e293b"
          strokeWidth="0.75"
          strokeLinejoin="round"
        />
        {/* Bottom-Right: Yellow */}
        <path
          d="M 15.5 9.2 C 17.5 8.5 19.8 9.7 22 9 L 22 14.8 C 19.8 15.5 17.5 14.3 15.5 15 Z"
          fill="#fbbf24"
          stroke="#1e293b"
          strokeWidth="0.75"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};

/**
 * Satellite Icon (for Shot Off-Target):
 * A clean, minimalist satellite with solar panels and a signal dish,
 * nodding to the iconic Spanish commentator "¡Se va! ¡Se va! GOLAZO!" call.
 */
export const SatelliteIcon: React.FC<{
  size?: number;
  className?: string;
  color?: string;
}> = ({ size = 22, className = '', color = 'currentColor' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Satellite body */}
      <rect x="10" y="10" width="5" height="4" rx="0.8" />
      {/* Left solar panel */}
      <rect x="3" y="10.5" width="5.5" height="3" rx="0.5" fillOpacity="0.2" fill={color} />
      <line x1="8.5" y1="12" x2="10" y2="12" />
      {/* Right solar panel */}
      <rect x="15.5" y="10.5" width="5.5" height="3" rx="0.5" fillOpacity="0.2" fill={color} />
      <line x1="15.5" y1="12" x2="17" y2="12" />
      {/* Dish arm from body */}
      <line x1="12.5" y1="10" x2="12.5" y2="7" />
      {/* Dish bowl */}
      <path d="M9.5 7 Q12.5 4.5 15.5 7" />
      {/* Signal pulse dot at dish focus */}
      <circle cx="12.5" cy="5.5" r="0.6" fill={color} stroke="none" />
      {/* Signal wave lines going bottom-right */}
      <path d="M14.5 14.5 Q17 17 16 20" strokeOpacity="0.6" />
      <circle cx="16" cy="20" r="1" fill={color} stroke="none" fillOpacity="0.7" />
    </svg>
  );
};

/**
 * Goal Kick Icon:
 * Depicts the corner of the small goalie box and a soccer ball (matches user reference sketch).
 */
export const GoalKickIcon: React.FC<{
  size?: number;
  className?: string;
  color?: string;
}> = ({ size = 22, className = '', color = 'currentColor' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Corner of the small goalie box: vertical line up to corner, turning right */}
      <path d="M 5 21 L 5 9.5 L 9.8 9.5" />
      {/* Soccer ball circle sitting on the goal area line */}
      <circle cx="14.2" cy="9.5" r="4.4" fill={color} fillOpacity="0.2" />
      <circle cx="14.2" cy="9.5" r="4.4" />
      {/* Line continuation to the right with end tick */}
      <path d="M 18.6 9.8 L 21 10 L 21 8.5" />
    </svg>
  );
};
