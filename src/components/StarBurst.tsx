import { useEffect, useState } from 'react';

interface StarBurstProps {
  x: number;
  y: number;
  onComplete: () => void;
}

const PARTICLE_COUNT = 12;
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
    }, 600);
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
        const distance = 20 + Math.random() * 15;
        const size = 4 + Math.random() * 4;
        const color = COLORS[i % COLORS.length];
        const delay = Math.random() * 0.05;

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
              animation: `starburst-particle 0.5s ${delay}s ease-out forwards`,
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
          width: 10,
          height: 10,
          left: -5,
          top: -5,
          backgroundColor: 'hsl(45, 93%, 58%)',
          animation: 'starburst-flash 0.4s ease-out forwards',
        }}
      />
    </div>
  );
}
