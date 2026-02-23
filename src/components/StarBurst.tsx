import { useEffect, useState, useCallback } from 'react';

interface StarBurstProps {
  x: number;
  y: number;
  onComplete: () => void;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(45, 93%, 58%)',
  'hsl(25, 95%, 60%)',
  'hsl(340, 80%, 60%)',
  'hsl(200, 80%, 55%)',
];

const SHAPES = ['circle', 'square', 'star'] as const;

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function StarBurst({ x, y, onComplete }: StarBurstProps) {
  const [visible, setVisible] = useState(true);

  const stableOnComplete = useCallback(onComplete, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      stableOnComplete();
    }, 1400);
    return () => clearTimeout(timer);
  }, [stableOnComplete]);

  if (!visible) return null;

  // Screen center for firework target
  const cx = typeof window !== 'undefined' ? window.innerWidth / 2 : 400;
  const cy = typeof window !== 'undefined' ? window.innerHeight / 2 : 300;

  return (
    <>
      {/* Ring 1: Outward burst from click point */}
      <div
        className="fixed pointer-events-none z-50"
        style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
      >
        {Array.from({ length: 20 }).map((_, i) => {
          const angle = (360 / 20) * i + randomBetween(-8, 8);
          const distance = randomBetween(50, 120);
          const size = randomBetween(5, 10);
          const color = COLORS[i % COLORS.length];
          const delay = randomBetween(0, 0.06);
          const shape = SHAPES[i % SHAPES.length];

          return (
            <div
              key={`r1-${i}`}
              className="absolute"
              style={{
                width: size,
                height: size,
                backgroundColor: color,
                borderRadius: shape === 'circle' ? '50%' : shape === 'star' ? '2px' : '1px',
                transform: shape === 'star' ? 'rotate(45deg)' : undefined,
                left: 0,
                top: 0,
                animation: `starburst-particle 0.7s ${delay}s ease-out forwards`,
                ['--angle' as string]: `${angle}deg`,
                ['--distance' as string]: `${distance}px`,
              }}
            />
          );
        })}

        {/* Center flash */}
        <div
          className="absolute rounded-full"
          style={{
            width: 18,
            height: 18,
            left: -9,
            top: -9,
            backgroundColor: 'hsl(45, 93%, 58%)',
            animation: 'starburst-flash 0.4s ease-out forwards',
          }}
        />
      </div>

      {/* Ring 2: Confetti flying toward center of screen */}
      {Array.from({ length: 16 }).map((_, i) => {
        const size = randomBetween(6, 12);
        const color = COLORS[i % COLORS.length];
        const delay = 0.1 + randomBetween(0, 0.15);
        const shape = SHAPES[(i + 1) % SHAPES.length];
        // Scatter around center
        const targetX = cx + randomBetween(-120, 120);
        const targetY = cy + randomBetween(-80, 80);
        const duration = randomBetween(0.5, 0.8);

        return (
          <div
            key={`r2-${i}`}
            className="fixed pointer-events-none z-50"
            style={{
              left: x,
              top: y,
              width: size,
              height: size,
              backgroundColor: color,
              borderRadius: shape === 'circle' ? '50%' : shape === 'star' ? '2px' : '1px',
              transform: shape === 'star' ? 'rotate(45deg)' : undefined,
              animation: `starburst-fly ${duration}s ${delay}s cubic-bezier(0.2, 0.8, 0.3, 1) forwards`,
              ['--target-x' as string]: `${targetX}px`,
              ['--target-y' as string]: `${targetY}px`,
              opacity: 0,
            }}
          />
        );
      })}

      {/* Ring 3: Secondary burst at screen center (delayed) */}
      <div
        className="fixed pointer-events-none z-50"
        style={{ left: cx, top: cy, transform: 'translate(-50%, -50%)' }}
      >
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (360 / 24) * i + randomBetween(-10, 10);
          const distance = randomBetween(40, 160);
          const size = randomBetween(4, 9);
          const color = COLORS[i % COLORS.length];
          const delay = 0.5 + randomBetween(0, 0.1);
          const shape = SHAPES[i % SHAPES.length];

          return (
            <div
              key={`r3-${i}`}
              className="absolute"
              style={{
                width: size,
                height: size,
                backgroundColor: color,
                borderRadius: shape === 'circle' ? '50%' : shape === 'star' ? '2px' : '1px',
                transform: shape === 'star' ? 'rotate(45deg)' : undefined,
                left: 0,
                top: 0,
                opacity: 0,
                animation: `starburst-particle 0.8s ${delay}s ease-out forwards`,
                ['--angle' as string]: `${angle}deg`,
                ['--distance' as string]: `${distance}px`,
              }}
            />
          );
        })}

        {/* Center firework flash */}
        <div
          className="absolute rounded-full"
          style={{
            width: 24,
            height: 24,
            left: -12,
            top: -12,
            backgroundColor: 'hsl(45, 93%, 70%)',
            opacity: 0,
            animation: 'starburst-flash 0.5s 0.5s ease-out forwards',
          }}
        />
      </div>
    </>
  );
}
