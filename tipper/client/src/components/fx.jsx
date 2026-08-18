import { useState, useEffect, useRef, useMemo } from 'react';

// Compteur animé (ease-out cubic)
export function useCountUp(target, duration = 900) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    let raf; const start = performance.now(); const a = from.current;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setV(a + (target - a) * e);
      if (p < 1) raf = requestAnimationFrame(tick); else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

export function Money({ value, format }) {
  const v = useCountUp(Number(value) || 0);
  return <>{format ? format(v) : Math.round(v)}</>;
}

// Anneau de progression circulaire à dégradé
export function Ring({ progress = 0, size = 56, stroke = 6, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(1, progress)));
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="ringg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#16181d" />
          <stop offset="1" stopColor="#8a8f9c" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke="url(#ringg)" strokeWidth={stroke} fill="none"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.2,0.7,0.2,1)' }} />
      <text x="50%" y="53%" textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.36}>{children}</text>
    </svg>
  );
}

export function Skeleton({ h = 16, w = '100%', r = 8, style }) {
  return <div className="sk" style={{ height: h, width: w, borderRadius: r, ...style }} />;
}

export function SkeletonMission() {
  return (
    <div className="mission" style={{ pointerEvents: 'none' }}>
      <div className="top">
        <Skeleton h={64} w={64} r={18} />
        <div style={{ flex: 1 }}>
          <Skeleton h={14} w="55%" style={{ marginBottom: 8 }} />
          <Skeleton h={11} w="90%" style={{ marginBottom: 6 }} />
          <Skeleton h={11} w="70%" />
        </div>
      </div>
      <div className="m-foot"><Skeleton h={12} w="40%" /><div style={{ marginLeft: 'auto' }}><Skeleton h={34} w={72} r={13} /></div></div>
    </div>
  );
}

// Tilt 3D au survol/pression
export function Tilt({ children, className, style, max = 9, onClick }) {
  const ref = useRef();
  const move = (e) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${px * max}deg) rotateX(${-py * max}deg) scale(1.01)`;
  };
  const leave = () => { if (ref.current) ref.current.style.transform = ''; };
  return (
    <div ref={ref} className={className} style={{ transition: 'transform 0.25s ease', ...style }}
      onPointerMove={move} onPointerLeave={leave} onPointerCancel={leave} onClick={onClick}>
      {children}
    </div>
  );
}

// Confettis (CSS, auto-nettoyés)
export function Confetti({ count = 42 }) {
  const pieces = useMemo(() => Array.from({ length: count }).map((_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.4,
    dur: 1.8 + Math.random() * 1.6,
    rot: Math.random() * 360,
    color: ['#9a6bff', '#38d6ff', '#36e0a0', '#ff7a45', '#ff4d8d', '#ffc24b'][i % 6],
    w: 6 + Math.random() * 8,
  })), [count]);
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p, i) => (
        <span key={i} style={{ left: `${p.left}%`, background: p.color, width: p.w, height: p.w * 0.55,
          animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, '--rot': `${p.rot}deg` }} />
      ))}
    </div>
  );
}
