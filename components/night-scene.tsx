"use client";

function Star({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  return (
    <circle
      cx={x}
      cy={y}
      r={size}
      fill="#FFFDE7"
      className="animate-twinkle"
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

export function NightScene() {
  const stars = [
    { x: 50, y: 40, size: 1.5, delay: 0 },
    { x: 120, y: 80, size: 2, delay: 0.5 },
    { x: 200, y: 30, size: 1, delay: 1.2 },
    { x: 300, y: 60, size: 1.8, delay: 0.8 },
    { x: 380, y: 25, size: 1.2, delay: 1.5 },
    { x: 80, y: 120, size: 1, delay: 0.3 },
    { x: 250, y: 100, size: 2.2, delay: 1.8 },
    { x: 450, y: 50, size: 1.5, delay: 0.7 },
    { x: 180, y: 150, size: 1, delay: 2.0 },
    { x: 350, y: 130, size: 1.8, delay: 1.1 },
    { x: 420, y: 90, size: 1.2, delay: 0.4 },
    { x: 520, y: 40, size: 2, delay: 1.6 },
    { x: 580, y: 110, size: 1.5, delay: 0.9 },
    { x: 150, y: 180, size: 1, delay: 2.2 },
    { x: 480, y: 160, size: 1.3, delay: 1.3 },
    { x: 600, y: 70, size: 1.8, delay: 0.6 },
    { x: 700, y: 45, size: 1.2, delay: 1.9 },
    { x: 650, y: 120, size: 2, delay: 0.2 },
    { x: 30, y: 200, size: 1.5, delay: 1.4 },
    { x: 550, y: 180, size: 1, delay: 0.1 },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {/* Night sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F1123] via-[#161D2E] to-[#1A2340]" />

      {/* Stars */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
        {stars.map((star, i) => (
          <Star key={i} {...star} />
        ))}
      </svg>

      {/* Moon */}
      <div className="animate-moon-glow absolute top-10 right-10 md:top-16 md:right-24">
        <div className="relative h-16 w-16 md:h-20 md:w-20">
          <div className="absolute inset-0 rounded-full bg-[#FFFDE7]" />
          <div className="absolute top-1 right-0 h-14 w-14 rounded-full bg-[#0F1123] md:h-16 md:w-16" />
        </div>
      </div>

      {/* House silhouette with warm window */}
      <svg
        className="absolute bottom-0 left-4 md:left-12"
        width="200"
        height="160"
        viewBox="0 0 200 160"
        fill="none"
      >
        {/* House body */}
        <rect x="20" y="80" width="90" height="80" fill="#1A1A2E" rx="3" />
        {/* Roof */}
        <polygon points="10,80 65,35 120,80" fill="#12122A" />
        {/* Warm window glow */}
        <rect x="35" y="95" width="22" height="22" rx="2" fill="#FFE082" fillOpacity="0.8" />
        <line x1="46" y1="95" x2="46" y2="117" stroke="#E0A800" strokeWidth="1" strokeOpacity="0.5" />
        <line x1="35" y1="106" x2="57" y2="106" stroke="#E0A800" strokeWidth="1" strokeOpacity="0.5" />
        {/* Door */}
        <rect x="68" y="120" width="24" height="40" rx="2" fill="#12122A" />
        <circle cx="87" cy="140" r="2" fill="#FFE082" fillOpacity="0.5" />
        {/* Clothesline silhouette */}
        <line x1="120" y1="60" x2="120" y2="160" stroke="#2A2A4A" strokeWidth="2.5" />
        <line x1="190" y1="60" x2="190" y2="160" stroke="#2A2A4A" strokeWidth="2.5" />
        <line x1="120" y1="62" x2="190" y2="62" stroke="#2A2A4A" strokeWidth="1.5" />
        {/* Clothes silhouettes */}
        <g className="animate-sway" style={{ transformOrigin: "140px 62px" }}>
          <rect x="130" y="62" width="22" height="30" rx="2" fill="#1A1A2E" />
        </g>
        <g className="animate-sway" style={{ transformOrigin: "168px 62px", animationDelay: "0.7s" }}>
          <rect x="158" y="62" width="20" height="38" rx="2" fill="#1A1A2E" />
        </g>
        {/* Ground */}
        <rect x="0" y="155" width="200" height="5" fill="#0D1117" rx="1" />
      </svg>
    </div>
  );
}
