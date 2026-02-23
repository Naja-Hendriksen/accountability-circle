import { useEffect, useState } from 'react';

interface StarBurstProps {
  x: number;
  y: number;
  onComplete: () => void;
}

const PARTICLE_COUNT = 24;
const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(45, 93%, 58%)',   // gold
  'hsl(25, 95%, 60%)',   // orange
];

export function StarBurst({ x, y, onComplete }: StarBurstProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 900);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
    >
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
        const angle = (360 / PARTICLE_COUNT) * i;
        const distance = 60 + Math.random() * 90;
        const size = 6 + Math.random() * 8;
        const color = COLORS[i % COLORS.length];
        const delay = Math.random() * 0.08;

        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              backgroundColor: color,
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
          width: 16,
          height: 16,
          left: -8,
          top: -8,
          backgroundColor: 'hsl(45, 93%, 58%)',
          animation: 'starburst-flash 0.4s ease-out forwards',
        }}
      />
    </div>
  );
}
