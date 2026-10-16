import React from 'react';
import { posterStyle, posterBottom, posterTop } from '../theme';

interface PosterArtProps {
  seed: string;
  bigText?: string;
  isFolder?: boolean;
  hovered?: boolean;
  className?: string;
}

export const PosterArt: React.FC<PosterArtProps> = ({
  seed,
  bigText = '',
  isFolder = false,
  hovered = false,
  className = ''
}) => {
  const composition = posterStyle(seed);
  const bottomColor = posterBottom(seed);
  const topColor = posterTop(seed);

  return (
    <div
      className={`relative w-full h-full overflow-hidden transition-transform duration-500 ease-out select-none ${className}`}
      style={{
        background: `linear-gradient(180deg, ${topColor} 0%, ${bottomColor} 100%)`
      }}
    >
      {/* Background artwork with parallax hover */}
      <div
        className={`absolute inset-0 transition-transform duration-500 ease-out ${
          hovered ? 'scale-105 -translate-x-1' : 'scale-100 translate-x-0'
        }`}
      >
        {/* Composition 0: Bokeh */}
        {!isFolder && composition === 0 && (
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute rounded-full bg-white/5"
              style={{
                width: '120%',
                height: '120%',
                right: '-20%',
                top: '-30%'
              }}
            />
            <div
              className="absolute rounded-full bg-[#5865F2]/15"
              style={{
                width: '80%',
                height: '80%',
                right: '-10%',
                top: '40%'
              }}
            />
            <div
              className="absolute rounded-full bg-white/5"
              style={{
                width: '40%',
                height: '40%',
                right: '40%',
                top: '10%'
              }}
            />
          </div>
        )}

        {/* Composition 1: Diagonal stripes */}
        {!isFolder && composition === 1 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-white/5 transform -rotate-32 origin-center"
                style={{
                  width: '240%',
                  height: i % 2 === 0 ? '10px' : '4px',
                  top: `${30 + (i - 3) * 14}%`,
                  left: `${-20 + (i - 3) * 8}%`
                }}
              />
            ))}
          </div>
        )}

        {/* Composition 2: Concentric rings */}
        {!isFolder && composition === 2 && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(4)].map((_, i) => {
              const size = 60 + i * 45;
              return (
                <div
                  key={i}
                  className="absolute rounded-full border"
                  style={{
                    width: `${size}%`,
                    height: `${size}%`,
                    borderColor: i === 0 ? 'rgba(88, 101, 242, 0.35)' : 'rgba(255, 255, 255, 0.08)',
                    top: '40%',
                    right: '-20%',
                    transform: 'translate(0, -50%)'
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Composition 3: Horizon / sliced sun */}
        {!isFolder && composition === 3 && (
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute rounded-full bg-white/10"
              style={{
                width: '70%',
                height: '70%',
                right: '5%',
                top: '25%'
              }}
            />
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  backgroundColor: bottomColor,
                  height: `${3 + i * 2}px`,
                  width: '74%',
                  right: '3%',
                  top: `${60 + i * 8}%`
                }}
              />
            ))}
          </div>
        )}

        {/* Composition 4: Monolith */}
        {!isFolder && composition === 4 && (
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute h-full bg-white/5"
              style={{ width: '22%', right: '15%' }}
            />
            <div
              className="absolute h-full bg-[#5865F2]/40"
              style={{ width: '2px', right: '15%' }}
            />
            <div
              className="absolute h-full bg-white/[0.03]"
              style={{ width: '6%', right: '40%' }}
            />
          </div>
        )}

        {/* Composition 5: Dot grid */}
        {!isFolder && composition === 5 && (
          <div className="absolute inset-0 pointer-events-none p-4">
            <div className="grid grid-cols-6 gap-3.5 justify-end">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full"
                  style={{
                    backgroundColor: i % 7 === 0 ? 'rgba(88, 101, 242, 0.45)' : 'rgba(255, 255, 255, 0.12)'
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Giant outlined watermark: year / episode / initial */}
        {!isFolder && bigText && (
          <div className="absolute right-3.5 top-1/2 -translate-y-[55%] pointer-events-none select-none">
            <span
              className="font-black tracking-tight leading-none text-white/5"
              style={{
                fontSize:
                  bigText.length <= 1 ? '10rem' : bigText.length <= 2 ? '7.5rem' : bigText.length <= 4 ? '5rem' : '3.5rem',
                WebkitTextStroke: '1px rgba(255, 255, 255, 0.18)'
              }}
            >
              {bigText}
            </span>
          </div>
        )}

        {/* Folder: Stacked sheets matching FolderArt */}
        {isFolder && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-28 h-20">
              {/* Back tilted sheet */}
              <div className="absolute inset-0 rounded-lg bg-white/5 border border-white/10 transform rotate-6 translate-x-2 -translate-y-1" />
              {/* Middle sheet */}
              <div className="absolute inset-0 rounded-lg bg-white/10 border border-white/15 transform -rotate-2 -translate-y-2" />
              {/* Front folder body */}
              <div className="absolute inset-0 rounded-lg bg-[#313338]/90 border border-white/20 shadow-xl flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-white/60"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom subtle shadow vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
    </div>
  );
};
