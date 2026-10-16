import React from 'react';

export interface FluxIconProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

export const FluxIcon: React.FC<FluxIconProps> = ({
  name,
  size = 24,
  color = '#FFFFFF',
  className = '',
  strokeWidth = 2.0
}) => {
  const renderPath = () => {
    switch (name) {
      case 'play':
        return (
          <path
            d="M7 4.5 L19.5 12 L7 19.5 Z"
            fill={color}
            stroke={color}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        );

      case 'pause':
        return (
          <>
            <rect x="5.5" y="4.5" width="4.4" height="15" rx="1.4" fill={color} />
            <rect x="14.1" y="4.5" width="4.4" height="15" rx="1.4" fill={color} />
          </>
        );

      case 'back':
        return (
          <>
            <path d="M20 12 L5 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <path
              d="M11 5.5 L4.5 12 L11 18.5"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        );

      case 'chevronLeft':
        return (
          <path
            d="M15 5 L8 12 L15 19"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );

      case 'chevronRight':
        return (
          <path
            d="M9 5 L16 12 L9 19"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );

      case 'chevronDown':
        return (
          <path
            d="M5.5 9 L12 15.5 L18.5 9"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );

      case 'chevronUp':
        return (
          <path
            d="M5.5 15 L12 8.5 L18.5 15"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );

      case 'close':
        return (
          <>
            <path d="M5.5 5.5 L18.5 18.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <path d="M18.5 5.5 L5.5 18.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          </>
        );

      case 'check':
        return (
          <path
            d="M4.5 12.5 L9.5 17.5 L19.5 6.5"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );

      case 'search':
        return (
          <>
            <circle cx="10.5" cy="10.5" r="6.5" stroke={color} strokeWidth={strokeWidth} />
            <path d="M15.4 15.4 L20.5 20.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          </>
        );

      case 'replay10':
        return (
          <>
            <path
              d="M12 5 A8 8 0 1 0 20 13"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <path
              d="M13.8 2.4 L10.6 5 L13.8 7.6"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text
              x="12"
              y="14"
              textAnchor="middle"
              dominantBaseline="middle"
              fill={color}
              fontSize="7"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              10
            </text>
          </>
        );

      case 'forward10':
        return (
          <>
            <path
              d="M12 5 A8 8 0 1 1 4 13"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <path
              d="M10.2 2.4 L13.4 5 L10.2 7.6"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text
              x="12"
              y="14"
              textAnchor="middle"
              dominantBaseline="middle"
              fill={color}
              fontSize="7"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              10
            </text>
          </>
        );

      case 'next':
        return (
          <>
            <path d="M5.5 5 L16 12 L5.5 19 Z" fill={color} stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M19.5 5 L19.5 19" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
          </>
        );

      case 'volume':
        return (
          <>
            <path
              d="M3.5 9.5 L7.5 9.5 L12.5 5 L12.5 19 L7.5 14.5 L3.5 14.5 Z"
              fill={color}
              stroke={color}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <path d="M15.5 8.5 A5 5 0 0 1 15.5 15.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <path d="M18.5 6 A9 9 0 0 1 18.5 18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          </>
        );

      case 'volumeLow':
        return (
          <>
            <path
              d="M3.5 9.5 L7.5 9.5 L12.5 5 L12.5 19 L7.5 14.5 L3.5 14.5 Z"
              fill={color}
              stroke={color}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <path d="M15.5 8.5 A5 5 0 0 1 15.5 15.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          </>
        );

      case 'volumeMuted':
        return (
          <>
            <path
              d="M3.5 9.5 L7.5 9.5 L12.5 5 L12.5 19 L7.5 14.5 L3.5 14.5 Z"
              fill={color}
              stroke={color}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <path d="M16.5 9.5 L21.5 14.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <path d="M21.5 9.5 L16.5 14.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          </>
        );

      case 'subtitles':
        return (
          <>
            <rect x="3" y="5" width="18" height="14" rx="3" stroke={color} strokeWidth={strokeWidth} />
            <path d="M7 10.5 L10.5 10.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <path d="M13 10.5 L17 10.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <path d="M7 14.5 L12 14.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <path d="M14.5 14.5 L17 14.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          </>
        );

      case 'fullscreen':
        return (
          <>
            <path d="M4 9 L4 4 L9 4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 4 L20 4 L20 9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 15 L20 20 L15 20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 20 L4 20 L4 15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          </>
        );

      case 'fullscreenExit':
        return (
          <>
            <path d="M9 4 L9 9 L4 9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 4 L15 9 L20 9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 15 L15 15 L15 20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 15 L9 15 L9 20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          </>
        );

      case 'folder':
        return (
          <path
            d="M3 6.5 L9.5 6.5 L11.5 9 L21 9 L21 18.5 L3 18.5 Z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        );

      case 'dots':
        return (
          <>
            <circle cx="5" cy="12" r="1.7" fill={color} />
            <circle cx="12" cy="12" r="1.7" fill={color} />
            <circle cx="19" cy="12" r="1.7" fill={color} />
          </>
        );

      case 'info':
        return (
          <>
            <circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
            <path d="M12 11 L12 16.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <circle cx="12" cy="7.8" r="1" fill={color} />
          </>
        );

      case 'home':
        return (
          <>
            <path d="M3.5 11 L12 4 L20.5 11" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 9.5 L6 19.5 L18 19.5 L18 9.5" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
          </>
        );

      case 'refresh':
        return (
          <>
            <path
              d="M12 4.5 A7.5 7.5 0 1 1 4.5 12"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <path
              d="M10 1.8 L13.4 4.5 L10 7.2"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        );

      case 'download':
        return (
          <>
            <path d="M12 4 L12 15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <path d="M7.5 10.8 L12 15.3 L16.5 10.8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4.5 15.5 L4.5 19.5 L19.5 19.5 L19.5 15.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          </>
        );

      case 'settings':
        return (
          <>
            <circle cx="12" cy="12" r="3.2" stroke={color} strokeWidth={strokeWidth} />
            <path
              d="M12 2 L12 5 M12 19 L12 22 M2 12 L5 12 M19 12 L22 12 M4.9 4.9 L7 7 M17 17 L19.1 19.1 M4.9 19.1 L7 17 M17 7 L19.1 4.9"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          </>
        );

      case 'swap':
        return (
          <>
            <path d="M7.5 6 L7.5 18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <path d="M4.5 9.5 L7.5 6 L10.5 9.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16.5 6 L16.5 18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <path d="M13.5 14.5 L16.5 18 L19.5 14.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          </>
        );

      case 'episodes':
      case 'playlist':
        return (
          <>
            <rect x="4" y="5.5" width="16" height="2.4" rx="1.2" fill={color} />
            <rect x="4" y="10.8" width="16" height="2.4" rx="1.2" fill={color} />
            <rect x="4" y="16.1" width="10" height="2.4" rx="1.2" fill={color} />
            <path d="M16.5 15 L20.5 17.5 L16.5 20 Z" fill={color} />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {renderPath()}
    </svg>
  );
};
