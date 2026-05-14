"use client";

export function DayScene() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {/* Sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#87CEEB] via-[#B8E4F7] to-[#E8F5FD]" />

      {/* Sun */}
      <div className="absolute top-8 right-12 md:top-12 md:right-24">
        <div className="h-20 w-20 rounded-full bg-[#FFD93D] shadow-[0_0_60px_20px_rgba(255,217,61,0.4)]" />
      </div>

      {/* Cloud 1 - top left */}
      <svg
        className="animate-float-cloud absolute top-16 left-8 md:left-20"
        width="140"
        height="60"
        viewBox="0 0 140 60"
        fill="none"
      >
        <ellipse cx="70" cy="40" rx="60" ry="20" fill="white" fillOpacity="0.9" />
        <ellipse cx="45" cy="30" rx="30" ry="22" fill="white" fillOpacity="0.95" />
        <ellipse cx="90" cy="28" rx="35" ry="24" fill="white" fillOpacity="0.9" />
        <ellipse cx="68" cy="22" rx="28" ry="20" fill="white" />
      </svg>

      {/* Cloud 2 - mid right */}
      <svg
        className="animate-float-cloud-reverse absolute top-28 right-4 md:right-32"
        width="120"
        height="50"
        viewBox="0 0 120 50"
        fill="none"
      >
        <ellipse cx="60" cy="35" rx="50" ry="15" fill="white" fillOpacity="0.85" />
        <ellipse cx="40" cy="25" rx="25" ry="18" fill="white" fillOpacity="0.9" />
        <ellipse cx="75" cy="22" rx="30" ry="20" fill="white" fillOpacity="0.85" />
      </svg>

      {/* Cloud 3 - small bottom area */}
      <svg
        className="animate-float-cloud-slow absolute bottom-44 left-1/4"
        width="100"
        height="45"
        viewBox="0 0 100 45"
        fill="none"
      >
        <ellipse cx="50" cy="30" rx="45" ry="14" fill="white" fillOpacity="0.7" />
        <ellipse cx="35" cy="22" rx="22" ry="16" fill="white" fillOpacity="0.8" />
        <ellipse cx="65" cy="20" rx="25" ry="17" fill="white" fillOpacity="0.75" />
      </svg>

      {/* House with clothesline - bottom */}
      <svg
        className="absolute bottom-0 left-4 md:left-12"
        width="260"
        height="180"
        viewBox="0 0 260 180"
        fill="none"
      >
        {/* House body */}
        <rect x="20" y="90" width="100" height="90" fill="#F4845F" rx="4" />
        {/* Roof */}
        <polygon points="10,90 70,40 130,90" fill="#C73E1D" />
        {/* Door */}
        <rect x="55" y="130" width="28" height="40" rx="3" fill="#8B4513" />
        <circle cx="77" cy="152" r="2.5" fill="#FFD93D" />
        {/* Window */}
        <rect x="30" y="105" width="20" height="20" rx="2" fill="#87CEEB" />
        <line x1="40" y1="105" x2="40" y2="125" stroke="white" strokeWidth="1.5" />
        <line x1="30" y1="115" x2="50" y2="115" stroke="white" strokeWidth="1.5" />

        {/* Clothesline pole 1 */}
        <line x1="130" y1="70" x2="130" y2="180" stroke="#8B6914" strokeWidth="3" />
        {/* Clothesline pole 2 */}
        <line x1="250" y1="70" x2="250" y2="180" stroke="#8B6914" strokeWidth="3" />
        {/* Clothesline */}
        <line x1="130" y1="72" x2="250" y2="72" stroke="#6B5B3E" strokeWidth="2" />

        {/* Hanging clothes */}
        <g className="animate-sway" style={{ transformOrigin: "155px 72px" }}>
          <rect x="140" y="72" width="30" height="40" rx="2" fill="#FF6B6B" />
          <line x1="148" y1="72" x2="148" y2="75" stroke="#6B5B3E" strokeWidth="1" />
          <line x1="162" y1="72" x2="162" y2="75" stroke="#6B5B3E" strokeWidth="1" />
        </g>
        <g className="animate-sway" style={{ transformOrigin: "190px 72px", animationDelay: "0.5s" }}>
          <rect x="178" y="72" width="25" height="50" rx="2" fill="#4ECDC4" />
          <line x1="185" y1="72" x2="185" y2="75" stroke="#6B5B3E" strokeWidth="1" />
          <line x1="197" y1="72" x2="197" y2="75" stroke="#6B5B3E" strokeWidth="1" />
        </g>
        <g className="animate-sway" style={{ transformOrigin: "225px 72px", animationDelay: "1s" }}>
          <rect x="212" y="72" width="28" height="35" rx="2" fill="#FFE66D" />
          <line x1="220" y1="72" x2="220" y2="75" stroke="#6B5B3E" strokeWidth="1" />
          <line x1="233" y1="72" x2="233" y2="75" stroke="#6B5B3E" strokeWidth="1" />
        </g>

        {/* Grass */}
        <rect x="0" y="170" width="260" height="10" fill="#7BC74D" rx="2" />
      </svg>
    </div>
  );
}
