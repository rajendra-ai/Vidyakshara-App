import React from "react";
import { SubjectId } from "../../types/domain";

interface SubjectIllustrationProps {
  subjectId: SubjectId;
  className?: string;
}

export function SubjectIllustration({
  subjectId,
  className = "w-full h-28",
}: SubjectIllustrationProps) {
  if (subjectId === "physics") {
    return (
      <svg
        viewBox="0 0 280 110"
        className={`rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] ${className}`}
        role="img"
        aria-label="Physics illustration showing Gaussian electric flux and projectile trajectory"
      >
        {/* Subtle coordinate grid */}
        <line x1="20" y1="88" x2="260" y2="88" stroke="#E2E5DC" strokeWidth="1" />
        <line x1="20" y1="22" x2="20" y2="88" stroke="#E2E5DC" strokeWidth="1" />

        {/* Parabolic trajectory curve */}
        <path
          d="M 24 86 Q 92 14 160 86"
          fill="none"
          stroke="#164A31"
          strokeWidth="2.2"
        />
        <circle cx="92" cy="50" r="4" fill="#D8F3A2" stroke="#164A31" strokeWidth="1.5" />

        {/* Gaussian sphere & radial field vectors on right */}
        <circle
          cx="215"
          cy="55"
          r="28"
          fill="#EAF2EC"
          stroke="#164A31"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <line x1="215" y1="18" x2="215" y2="92" stroke="#164A31" strokeWidth="1.2" />
        <line x1="178" y1="55" x2="252" y2="55" stroke="#164A31" strokeWidth="1.2" />
        <circle cx="215" cy="55" r="8" fill="#164A31" />
        <text
          x="215"
          y="58"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="8"
          fontFamily="IBM Plex Mono, monospace"
          fontWeight="600"
        >
          +q
        </text>
        <text
          x="28"
          y="24"
          fill="#48564D"
          fontSize="9"
          fontFamily="IBM Plex Mono, monospace"
        >
          Φ = q_in / ε₀
        </text>
      </svg>
    );
  }

  if (subjectId === "chemistry") {
    return (
      <svg
        viewBox="0 0 280 110"
        className={`rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] ${className}`}
        role="img"
        aria-label="Chemistry illustration showing reversible reaction equilibrium and electrochemical cell"
      >
        {/* Left & Right Energy / Concentration Wells */}
        <rect
          x="26"
          y="42"
          width="56"
          height="46"
          rx="4"
          fill="#EBF3F9"
          stroke="#184E77"
          strokeWidth="1.5"
        />
        <text
          x="54"
          y="68"
          textAnchor="middle"
          fill="#184E77"
          fontSize="10"
          fontFamily="IBM Plex Mono, monospace"
          fontWeight="600"
        >
          N₂+3H₂
        </text>

        {/* Reversible arrows */}
        <line x1="96" y1="58" x2="154" y2="58" stroke="#164A31" strokeWidth="1.8" />
        <polygon points="154,58 147,54 147,62" fill="#164A31" />
        <line x1="154" y1="68" x2="96" y2="68" stroke="#48564D" strokeWidth="1.5" />
        <polygon points="96,68 103,64 103,72" fill="#48564D" />
        <text
          x="125"
          y="46"
          textAnchor="middle"
          fill="#164A31"
          fontSize="9"
          fontFamily="IBM Plex Mono, monospace"
          fontWeight="600"
        >
          Q ⇌ Kc
        </text>

        <rect
          x="168"
          y="30"
          width="84"
          height="58"
          rx="4"
          fill="#EAF2EC"
          stroke="#164A31"
          strokeWidth="1.5"
        />
        <text
          x="210"
          y="56"
          textAnchor="middle"
          fill="#164A31"
          fontSize="10"
          fontFamily="IBM Plex Mono, monospace"
          fontWeight="600"
        >
          2 NH₃(g)
        </text>
        <text
          x="210"
          y="72"
          textAnchor="middle"
          fill="#48564D"
          fontSize="8.5"
          fontFamily="IBM Plex Mono, monospace"
        >
          ΔG = −nFE
        </text>
      </svg>
    );
  }

  if (subjectId === "mathematics") {
    return (
      <svg
        viewBox="0 0 280 110"
        className={`rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] ${className}`}
        role="img"
        aria-label="Mathematics illustration showing bounded definite integral area under curve"
      >
        {/* Shaded integral area */}
        <path
          d="M 55 86 C 95 78, 125 26, 195 28 L 195 86 Z"
          fill="#D8F3A2"
          fillOpacity="0.65"
        />
        {/* Smooth function curve */}
        <path
          d="M 30 88 C 85 82, 120 22, 225 26"
          fill="none"
          stroke="#164A31"
          strokeWidth="2.2"
        />
        {/* Axes */}
        <line x1="25" y1="86" x2="255" y2="86" stroke="#14241B" strokeWidth="1.4" />
        <line x1="40" y1="16" x2="40" y2="94" stroke="#14241B" strokeWidth="1.4" />
        {/* Bounds a and b */}
        <line
          x1="55"
          y1="82"
          x2="55"
          y2="86"
          stroke="#164A31"
          strokeWidth="1.5"
        />
        <line
          x1="195"
          y1="28"
          x2="195"
          y2="86"
          stroke="#164A31"
          strokeWidth="1.5"
          strokeDasharray="3 2"
        />
        <text
          x="52"
          y="99"
          fill="#14241B"
          fontSize="9"
          fontFamily="IBM Plex Mono, monospace"
        >
          a
        </text>
        <text
          x="192"
          y="99"
          fill="#14241B"
          fontSize="9"
          fontFamily="IBM Plex Mono, monospace"
        >
          b
        </text>
        <text
          x="88"
          y="68"
          fill="#14241B"
          fontSize="9.5"
          fontFamily="IBM Plex Mono, monospace"
          fontWeight="600"
        >
          ∫ f(a+b−x) dx
        </text>
      </svg>
    );
  }

  // Biology
  return (
    <svg
      viewBox="0 0 280 110"
      className={`rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] ${className}`}
      role="img"
      aria-label="Biology illustration showing sigmoid oxygen haemoglobin dissociation curve and Bohr shift"
    >
      <line x1="32" y1="88" x2="250" y2="88" stroke="#14241B" strokeWidth="1.4" />
      <line x1="32" y1="18" x2="32" y2="88" stroke="#14241B" strokeWidth="1.4" />
      {/* Normal curve */}
      <path
        d="M 32 88 C 68 86, 85 26, 220 24"
        fill="none"
        stroke="#164A31"
        strokeWidth="2.2"
      />
      {/* Bohr right-shifted curve */}
      <path
        d="M 32 88 C 92 87, 118 32, 238 28"
        fill="none"
        stroke="#184E77"
        strokeWidth="1.8"
        strokeDasharray="4 3"
      />
      <text
        x="125"
        y="46"
        fill="#164A31"
        fontSize="9"
        fontFamily="IBM Plex Mono, monospace"
        fontWeight="600"
      >
        O₂-Hb Curve
      </text>
      <text
        x="145"
        y="66"
        fill="#184E77"
        fontSize="8.5"
        fontFamily="IBM Plex Mono, monospace"
      >
        Bohr Shift ▸
      </text>
    </svg>
  );
}
