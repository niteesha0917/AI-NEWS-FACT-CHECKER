import { useEffect, useRef, useState } from 'react';

// Circumference of circle with r=40: 2π*40 ≈ 251.33
const CIRCUMFERENCE = 251.33;

export default function TruthGauge({ score = 0, size = 180, animate = true }) {
  const [displayScore, setDisplayScore] = useState(animate ? 0 : score);
  const dashOffset = CIRCUMFERENCE - (CIRCUMFERENCE * displayScore) / 100;

  // Determine color based on score
  const getColor = (s) => {
    if (s >= 85) return '#16a34a';       // Green — True
    if (s >= 70) return '#059669';       // Emerald — Mostly True
    if (s >= 50) return '#ca8a04';       // Amber — Misleading
    if (s >= 30) return '#ea580c';       // Orange — Mostly False
    return '#dc2626';                    // Red — False
  };

  const color = getColor(displayScore);

  useEffect(() => {
    if (!animate) { setDisplayScore(score); return; }
    const start = performance.now();
    const duration = 1500;
    const raf = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [score, animate]);

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="gauge-svg"
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background circle */}
        <circle
          cx="50" cy="50" r="40"
          fill="none"
          stroke="var(--color-surface-container-high)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Score fill */}
        <circle
          cx="50" cy="50" r="40"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1.5s ease-out, stroke 0.5s ease' }}
        />
      </svg>

      {/* Center text */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: size * 0.22,
          fontWeight: 700,
          color,
          lineHeight: 1,
        }}>
          {displayScore}
        </span>
        <span style={{
          fontSize: size * 0.08,
          color: 'var(--color-on-surface-variant)',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          /100
        </span>
      </div>
    </div>
  );
}
