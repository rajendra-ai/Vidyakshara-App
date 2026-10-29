import React from "react";
import { QuestionDiagramType } from "../../types/domain";

interface MathFormulaProps {
  expression: string;
  block?: boolean;
  className?: string;
}

/**
 * Renders mathematical and scientific expressions cleanly with proper
 * typographic subscripts, superscripts, operators, and serif/monospace math tokens.
 * Never exposes raw LaTeX control sequences.
 */
export function MathFormula({
  expression,
  block = false,
  className = "",
}: MathFormulaProps) {
  // Clean any accidental raw LaTeX sequences if ever passed
  const cleaned = expression
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1) / ($2)")
    .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
    .replace(/\\int_\{([^}]+)\}\^\{([^}]+)\}/g, "∫[$1 to $2]")
    .replace(/\\cdot/g, "·")
    .replace(/\\times/g, "×")
    .replace(/\$/g, "");

  // Tokenize sub/superscript patterns like q_enclosed, E°_cell, x^2, ∫[a to b]
  const parts = cleaned.split(/(\∫\[[^\]]+\]|[A-Za-z0-9°]+_[A-Za-z0-9_]+|[A-Za-z0-9)]+\^[A-Za-z0-9−+-]+)/g);

  const rendered = parts.map((part, idx) => {
    if (!part) return null;

    if (part.startsWith("∫[")) {
      const bounds = part.slice(2, -1);
      const [lower, upper] = bounds.split(" to ");
      return (
        <span key={idx} className="inline-flex items-center mx-0.5 font-serif">
          <span className="text-base leading-none">∫</span>
          <span className="inline-flex flex-col text-[10px] leading-tight ml-0.5 font-mono">
            <span>{upper}</span>
            <span>{lower}</span>
          </span>
        </span>
      );
    }

    if (part.includes("_")) {
      const [base, sub] = part.split(/_(.+)/);
      return (
        <span key={idx} className="inline-baseline">
          <span className="font-serif italic">{base}</span>
          <sub className="text-[0.75em] font-mono not-italic ml-0.2">{sub}</sub>
        </span>
      );
    }

    if (part.includes("^")) {
      const [base, sup] = part.split(/\^(.+)/);
      return (
        <span key={idx} className="inline-baseline">
          <span>{base}</span>
          <sup className="text-[0.75em] font-mono ml-0.2">{sup}</sup>
        </span>
      );
    }

    return <span key={idx}>{part}</span>;
  });

  if (block) {
    return (
      <div
        className={`px-4 py-3 rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] font-mono text-xs sm:text-sm text-[#14241B] overflow-x-auto ${className}`}
      >
        {rendered}
      </div>
    );
  }

  return (
    <span className={`font-mono text-[#14241B] ${className}`}>{rendered}</span>
  );
}

export function QuestionDiagramSvg({
  type,
}: {
  type: QuestionDiagramType;
}) {
  if (type === "gaussian-cube") {
    return (
      <svg
        viewBox="0 0 320 120"
        className="w-full max-w-[320px] h-auto rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] p-2"
        role="img"
        aria-label="Gaussian surface diagram with enclosed charge"
      >
        {/* Cube / Sphere schematic */}
        <rect
          x="75"
          y="22"
          width="76"
          height="76"
          fill="#EAF2EC"
          fillOpacity="0.6"
          stroke="#164A31"
          strokeWidth="1.75"
        />
        <rect
          x="95"
          y="12"
          width="76"
          height="76"
          fill="none"
          stroke="#164A31"
          strokeWidth="1.25"
          strokeDasharray="3 3"
        />
        <line x1="75" y1="22" x2="95" y2="12" stroke="#164A31" strokeWidth="1.25" />
        <line x1="151" y1="22" x2="171" y2="12" stroke="#164A31" strokeWidth="1.25" />
        <line x1="75" y1="98" x2="95" y2="88" stroke="#164A31" strokeWidth="1.25" />
        <line x1="151" y1="98" x2="171" y2="88" stroke="#164A31" strokeWidth="1.25" />

        <circle cx="123" cy="55" r="7" fill="#164A31" />
        <text
          x="123"
          y="58"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="8"
          fontFamily="IBM Plex Mono"
        >
          +q
        </text>
        <text
          x="192"
          y="52"
          fill="#14241B"
          fontSize="10"
          fontFamily="IBM Plex Mono"
          fontWeight="600"
        >
          6 Symmetric Faces
        </text>
        <text
          x="192"
          y="68"
          fill="#48564D"
          fontSize="9.5"
          fontFamily="IBM Plex Mono"
        >
          Φ_face = q / (6ε₀)
        </text>
      </svg>
    );
  }

  if (type === "projectile-apex") {
    return (
      <svg
        viewBox="0 0 320 115"
        className="w-full max-w-[320px] h-auto rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] p-2"
        role="img"
        aria-label="Projectile trajectory diagram showing horizontal velocity at highest point"
      >
        <line x1="25" y1="95" x2="295" y2="95" stroke="#48564D" strokeWidth="1.5" />
        <path
          d="M 35 95 Q 155 10 275 95"
          fill="none"
          stroke="#164A31"
          strokeWidth="2.2"
        />
        {/* Apex point and horizontal velocity vector */}
        <circle cx="155" cy="52" r="4" fill="#164A31" />
        <line x1="155" y1="52" x2="205" y2="52" stroke="#184E77" strokeWidth="2" />
        <polygon points="205,52 198,48 198,56" fill="#184E77" />
        <text
          x="155"
          y="40"
          textAnchor="middle"
          fill="#184E77"
          fontSize="9.5"
          fontFamily="IBM Plex Mono"
          fontWeight="600"
        >
          v_top = u cos θ (v_y = 0)
        </text>
        <text
          x="52"
          y="88"
          fill="#14241B"
          fontSize="9.5"
          fontFamily="IBM Plex Mono"
        >
          θ = 60°
        </text>
      </svg>
    );
  }

  if (type === "equilibrium-vessel") {
    return (
      <svg
        viewBox="0 0 320 110"
        className="w-full max-w-[320px] h-auto rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] p-2"
        role="img"
        aria-label="Reversible chemical equilibrium reaction diagram"
      >
        <rect
          x="25"
          y="22"
          width="270"
          height="66"
          rx="6"
          fill="#FFFFFF"
          stroke="#164A31"
          strokeWidth="1.5"
        />
        <text
          x="160"
          y="48"
          textAnchor="middle"
          fill="#14241B"
          fontSize="11"
          fontFamily="IBM Plex Mono"
          fontWeight="600"
        >
          2 SO₂(g) + O₂(g) ⇌ 2 SO₃(g) + Heat
        </text>
        <text
          x="160"
          y="70"
          textAnchor="middle"
          fill="#48564D"
          fontSize="9.5"
          fontFamily="IBM Plex Mono"
        >
          3 gas moles (Left) ⇌ 2 gas moles (Right) | ΔH &lt; 0
        </text>
      </svg>
    );
  }

  if (type === "daniell-cell") {
    return (
      <svg
        viewBox="0 0 320 110"
        className="w-full max-w-[320px] h-auto rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] p-2"
        role="img"
        aria-label="Galvanic cell diagram showing anode and cathode compartments"
      >
        <rect x="35" y="30" width="90" height="60" rx="4" fill="#EBF3F9" stroke="#184E77" strokeWidth="1.5" />
        <rect x="195" y="30" width="90" height="60" rx="4" fill="#EAF2EC" stroke="#164A31" strokeWidth="1.5" />
        <path d="M 105 45 L 105 20 L 215 20 L 215 45" fill="none" stroke="#48564D" strokeWidth="2" />
        <text x="80" y="64" textAnchor="middle" fontSize="9.5" fontFamily="IBM Plex Mono" fill="#184E77" fontWeight="600">
          Anode (Oxidation)
        </text>
        <text x="240" y="64" textAnchor="middle" fontSize="9.5" fontFamily="IBM Plex Mono" fill="#164A31" fontWeight="600">
          Cathode (Reduction)
        </text>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 320 110"
      className="w-full max-w-[320px] h-auto rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] p-2"
      role="img"
      aria-label="Oxygen-haemoglobin dissociation curve diagram"
    >
      <line x1="35" y1="90" x2="285" y2="90" stroke="#14241B" strokeWidth="1.4" />
      <line x1="35" y1="18" x2="35" y2="90" stroke="#14241B" strokeWidth="1.4" />
      <path d="M 35 90 C 75 88, 95 26, 255 24" fill="none" stroke="#164A31" strokeWidth="2.2" />
      <path d="M 35 90 C 105 88, 130 34, 275 30" fill="none" stroke="#184E77" strokeWidth="1.6" strokeDasharray="4 3" />
      <text x="150" y="45" fontSize="9.5" fontFamily="IBM Plex Mono" fill="#164A31" fontWeight="600">
        Alveoli (Left) vs Active Tissue (Right)
      </text>
    </svg>
  );
}
