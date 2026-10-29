import React, { useState, useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { InteractiveSimulationSpec } from "../../types/domain";
import { Button } from "../ui/Primitives";

interface ConceptSimulatorProps {
  spec: InteractiveSimulationSpec;
}

export function ConceptSimulator({ spec }: ConceptSimulatorProps) {
  const [primaryVal, setPrimaryVal] = useState<number>(spec.defaultValue);
  const [secondaryVal, setSecondaryVal] = useState<number>(
    spec.secondaryDefault ?? 2
  );

  useEffect(() => {
    setPrimaryVal(spec.defaultValue);
    setSecondaryVal(spec.secondaryDefault ?? 2);
  }, [spec]);

  const handleReset = () => {
    setPrimaryVal(spec.defaultValue);
    setSecondaryVal(spec.secondaryDefault ?? 2);
  };

  return (
    <div className="bg-white border border-[#E2E5DC] rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#E2E5DC] flex flex-wrap items-center justify-between gap-4 bg-[#FAF8F3]">
        <div>
          <span className="text-xs font-medium text-[#164A31]">
            Interactive Concept Lab
          </span>
          <h3 className="text-base font-semibold text-[#14241B] mt-0.5">
            {spec.title}
          </h3>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleReset}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Parameters
        </Button>
      </div>

      {/* Two-Zone Sandbox Layout: Left/Top Interactive Stage (65%) + Right/Bottom Control & Concept Deck (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* Zone 1: Interactive Stage */}
        <div className="lg:col-span-8 p-6 bg-[#FAF8F3]/60 border-b lg:border-b-0 lg:border-r border-[#E2E5DC] flex flex-col justify-between">
          <div className="w-full bg-white border border-[#E2E5DC] rounded-lg p-4 flex items-center justify-center min-h-[260px]">
            {spec.type === "electrostatics-flux" && (
              <GaussianFluxSvg q={primaryVal} r={secondaryVal} />
            )}
            {spec.type === "bohr-dissociation" && (
              <BohrDissociationSvg pH={primaryVal} pCO2={secondaryVal} />
            )}
            {spec.type === "projectile-kinematics" && (
              <ProjectileSvg angle={primaryVal} speed={secondaryVal} />
            )}
            {spec.type === "chemical-equilibrium" && (
              <EquilibriumSvg qVal={primaryVal} temp={secondaryVal} />
            )}
          </div>
          <p className="text-xs text-[#48564D] mt-3 leading-relaxed">
            {spec.caption}
          </p>
        </div>

        {/* Zone 2: Control & Concept Deck */}
        <div className="lg:col-span-4 p-6 flex flex-col justify-between gap-6 bg-white">
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between text-xs font-medium text-[#14241B] mb-2">
                <label htmlFor="sim-slider-primary">{spec.parameterLabel}</label>
                <span className="font-mono tabular-nums text-[#164A31] font-semibold">
                  {primaryVal} {spec.unit}
                </span>
              </div>
              <input
                id="sim-slider-primary"
                type="range"
                min={spec.min}
                max={spec.max}
                step={spec.step}
                value={primaryVal}
                onChange={(e) => setPrimaryVal(Number(e.target.value))}
                className="w-full accent-[#164A31] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono tabular-nums text-[#6E7B72] mt-1">
                <span>
                  {spec.min} {spec.unit}
                </span>
                <span>
                  {spec.max} {spec.unit}
                </span>
              </div>
            </div>

            {spec.secondaryLabel && (
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-[#14241B] mb-2">
                  <label htmlFor="sim-slider-secondary">
                    {spec.secondaryLabel}
                  </label>
                  <span className="font-mono tabular-nums text-[#164A31] font-semibold">
                    {secondaryVal} {spec.secondaryUnit}
                  </span>
                </div>
                <input
                  id="sim-slider-secondary"
                  type="range"
                  min={spec.secondaryMin ?? 1}
                  max={spec.secondaryMax ?? 10}
                  step={1}
                  value={secondaryVal}
                  onChange={(e) => setSecondaryVal(Number(e.target.value))}
                  className="w-full accent-[#164A31] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono tabular-nums text-[#6E7B72] mt-1">
                  <span>
                    {spec.secondaryMin} {spec.secondaryUnit}
                  </span>
                  <span>
                    {spec.secondaryMax} {spec.secondaryUnit}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Live Readout Box */}
          <div className="p-4 rounded-lg bg-[#EBF3F9] border border-[#C5DDF0] space-y-2">
            <div className="text-xs font-semibold text-[#184E77]">
              Live Physical Readout
            </div>
            {spec.type === "electrostatics-flux" && (
              <div className="space-y-1.5 text-xs text-[#14241B] font-mono tabular-nums">
                <div>
                  Net Flux Φ = {(primaryVal * 112.9).toFixed(1)} × 10³ N·m²/C
                </div>
                <div>
                  Surface |E| ={" "}
                  {((Math.abs(primaryVal) * 9.0) / (secondaryVal * secondaryVal)).toFixed(2)}{" "}
                  × 10³ N/C
                </div>
                <div className="font-sans text-[11px] text-[#184E77] pt-1">
                  {primaryVal === 0
                    ? "● ZERO NET FLUX (q_in = 0)"
                    : primaryVal > 0
                    ? "▲ OUTWARD FLUX (Positive q_in)"
                    : "▼ INWARD FLUX (Negative q_in)"}
                </div>
              </div>
            )}

            {spec.type === "bohr-dissociation" && (
              <div className="space-y-1.5 text-xs text-[#14241B] font-mono tabular-nums">
                <div>
                  Half-Saturation P₅₀ ={" "}
                  {(26.5 + (7.4 - primaryVal) * 18 + (secondaryVal - 40) * 0.25).toFixed(1)}{" "}
                  mmHg
                </div>
                <div className="font-sans text-[11px] text-[#184E77] pt-1">
                  {primaryVal < 7.35 || secondaryVal > 45
                    ? "▲ RIGHT SHIFT — Active Tissue Unloading O₂"
                    : primaryVal > 7.45 || secondaryVal < 35
                    ? "● LEFT SHIFT — High Lung O₂ Affinity"
                    : "● NOMINAL RESTING ARTERIAL STATE"}
                </div>
              </div>
            )}

            {spec.type === "projectile-kinematics" && (
              <div className="space-y-1.5 text-xs text-[#14241B] font-mono tabular-nums">
                {(() => {
                  const rad = (primaryVal * Math.PI) / 180;
                  const g = 9.8;
                  const range = ((speedSq(secondaryVal) * Math.sin(2 * rad)) / g).toFixed(1);
                  const hMax = (
                    (speedSq(secondaryVal) * Math.pow(Math.sin(rad), 2)) /
                    (2 * g)
                  ).toFixed(1);
                  return (
                    <>
                      <div>Horizontal Range R = {range} m</div>
                      <div>Max Height H_max = {hMax} m</div>
                      <div className="font-sans text-[11px] text-[#184E77] pt-1">
                        {primaryVal === 45
                          ? "● MAXIMUM RANGE ANGLE (θ = 45°)"
                          : `Complementary same-range angle: ${90 - primaryVal}°`}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {spec.type === "chemical-equilibrium" && (
              <div className="space-y-1.5 text-xs text-[#14241B] font-mono tabular-nums">
                <div>Equilibrium Constant Kc = 4.0</div>
                <div>Current Quotient Q = {primaryVal.toFixed(1)}</div>
                <div className="font-sans text-[11px] text-[#184E77] pt-1">
                  {primaryVal < 4
                    ? "▲ Q < Kc : Forward Shift (Forms Products)"
                    : primaryVal > 4
                    ? "▼ Q > Kc : Backward Shift (Forms Reactants)"
                    : "● Q = Kc : Dynamic Equilibrium Reached"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function speedSq(v: number) {
  return v * v;
}

function GaussianFluxSvg({ q, r }: { q: number; r: number }) {
  const radiusPx = 32 + r * 14;
  const rayCount = Math.min(12, Math.max(0, Math.abs(q) * 2));
  const isPositive = q > 0;

  return (
    <svg viewBox="0 0 420 220" className="w-full max-w-[420px] h-auto">
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M 20 0 L 0 0 0 20"
            fill="none"
            stroke="#ECEAE2"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="420" height="220" fill="url(#grid)" rx="6" />

      {/* Gaussian Sphere Boundary */}
      <circle
        cx="210"
        cy="110"
        r={radiusPx}
        fill="#EAF2EC"
        fillOpacity="0.45"
        stroke="#164A31"
        strokeWidth="2"
        strokeDasharray="6 4"
      />

      {/* Field Rays */}
      {Array.from({ length: rayCount }).map((_, idx) => {
        const angle = (idx * 2 * Math.PI) / rayCount;
        const x1 = 210 + Math.cos(angle) * 18;
        const y1 = 110 + Math.sin(angle) * 18;
        const x2 = 210 + Math.cos(angle) * 95;
        const y2 = 110 + Math.sin(angle) * 95;
        const midX = 210 + Math.cos(angle) * 62;
        const midY = 110 + Math.sin(angle) * 62;
        return (
          <g key={idx}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isPositive ? "#164A31" : "#184E77"}
              strokeWidth="1.75"
            />
            <circle
              cx={midX}
              cy={midY}
              r="3"
              fill={isPositive ? "#164A31" : "#184E77"}
            />
          </g>
        );
      })}

      {/* Central Charge */}
      <circle
        cx="210"
        cy="110"
        r="14"
        fill={q === 0 ? "#6E7B72" : isPositive ? "#164A31" : "#184E77"}
      />
      <text
        x="210"
        y="114"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="10"
        fontFamily="IBM Plex Mono, monospace"
        fontWeight="600"
      >
        {q > 0 ? `+${q}` : q}
      </text>

      {/* Labels */}
      <text
        x="14"
        y="24"
        fill="#14241B"
        fontSize="11"
        fontWeight="600"
      >
        Gaussian Surface (R = {r} m)
      </text>
      <text
        x="14"
        y="204"
        fill="#48564D"
        fontSize="11"
        fontFamily="IBM Plex Mono, monospace"
      >
        {q === 0
          ? "Zero enclosed charge → Net flux Φ = 0"
          : `Active field lines crossing surface: ${rayCount} (${
              isPositive ? "Outward" : "Inward"
            })`}
      </text>
    </svg>
  );
}

function BohrDissociationSvg({ pH, pCO2 }: { pH: number; pCO2: number }) {
  // Shift factor: positive shifts curve right
  const shift = (7.4 - pH) * 35 + (pCO2 - 40) * 0.55;

  const buildPath = (offset: number) => {
    const pts: string[] = [];
    for (let x = 0; x <= 100; x += 5) {
      const pO2 = x;
      const p50 = Math.max(12, Math.min(55, 26 + offset));
      const sat = Math.pow(pO2, 2.7) / (Math.pow(p50, 2.7) + Math.pow(pO2, 2.7));
      const svgX = 50 + (x / 100) * 320;
      const svgY = 185 - sat * 145;
      pts.push(`${x === 0 ? "M" : "L"} ${svgX.toFixed(1)} ${svgY.toFixed(1)}`);
    }
    return pts.join(" ");
  };

  return (
    <svg viewBox="0 0 420 220" className="w-full max-w-[420px] h-auto">
      {/* Axes */}
      <line x1="50" y1="185" x2="380" y2="185" stroke="#48564D" strokeWidth="1.5" />
      <line x1="50" y1="30" x2="50" y2="185" stroke="#48564D" strokeWidth="1.5" />

      {/* 50% Saturation dashed reference line */}
      <line
        x1="50"
        y1="112.5"
        x2="375"
        y2="112.5"
        stroke="#C5DDF0"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      <text x="20" y="116" fontSize="10" fill="#6E7B72" fontFamily="IBM Plex Mono">
        50%
      </text>
      <text x="16" y="44" fontSize="10" fill="#6E7B72" fontFamily="IBM Plex Mono">
        100%
      </text>

      {/* Baseline Nominal Curve (pH 7.4, pCO2 40) */}
      <path
        d={buildPath(0)}
        fill="none"
        stroke="#94A39B"
        strokeWidth="1.75"
        strokeDasharray="4 3"
      />

      {/* Active Shifted Curve */}
      <path
        d={buildPath(shift)}
        fill="none"
        stroke="#164A31"
        strokeWidth="2.75"
      />

      <text x="145" y="208" fontSize="11" fill="#14241B" fontWeight="500">
        Partial Pressure of O₂ (pO₂ in mmHg)
      </text>
      <text x="64" y="26" fontSize="11" fill="#164A31" fontWeight="600">
        Solid: Active Curve (pH {pH.toFixed(1)}, pCO₂ {pCO2} mmHg) · Dashed: Normal (pH 7.4)
      </text>
    </svg>
  );
}

function ProjectileSvg({ angle, speed }: { angle: number; speed: number }) {
  const rad = (angle * Math.PI) / 180;
  const g = 9.8;
  const maxPossibleR = (40 * 40) / g; // ~163m
  const scaleX = 330 / maxPossibleR;
  const scaleY = 140 / (maxPossibleR / 2);

  const pts: string[] = [];
  const totalT = (2 * speed * Math.sin(rad)) / g;
  for (let i = 0; i <= 30; i++) {
    const t = (totalT * i) / 30;
    const x = speed * Math.cos(rad) * t;
    const y = Math.max(0, speed * Math.sin(rad) * t - 0.5 * g * t * t);
    const sx = 45 + x * scaleX;
    const sy = 185 - y * scaleY;
    pts.push(`${i === 0 ? "M" : "L"} ${sx.toFixed(1)} ${sy.toFixed(1)}`);
  }

  return (
    <svg viewBox="0 0 420 220" className="w-full max-w-[420px] h-auto">
      <line x1="45" y1="185" x2="390" y2="185" stroke="#48564D" strokeWidth="1.5" />
      <line x1="45" y1="25" x2="45" y2="185" stroke="#48564D" strokeWidth="1.5" />

      <path d={pts.join(" ")} fill="none" stroke="#164A31" strokeWidth="2.75" />

      <circle cx="45" cy="185" r="4.5" fill="#164A31" />
      <text x="58" y="28" fontSize="11" fill="#14241B" fontWeight="600">
        Parabolic Flight Path (θ = {angle}°, u = {speed} m/s)
      </text>
      <text x="155" y="208" fontSize="11" fill="#48564D" fontFamily="IBM Plex Mono">
        Horizontal Ground Distance x (m)
      </text>
    </svg>
  );
}

function EquilibriumSvg({ qVal, temp }: { qVal: number; temp: number }) {
  const kc = 4.0;
  const diff = kc - qVal;
  const reactantHeight = Math.max(25, Math.min(125, 110 - qVal * 10));
  const productHeight = Math.max(25, Math.min(125, 40 + qVal * 10));

  return (
    <svg viewBox="0 0 420 220" className="w-full max-w-[420px] h-auto">
      <line x1="45" y1="180" x2="375" y2="180" stroke="#48564D" strokeWidth="1.5" />

      {/* Reactants Bar */}
      <rect
        x="85"
        y={180 - reactantHeight}
        width="65"
        height={reactantHeight}
        rx="4"
        fill="#184E77"
      />
      <text x="117" y="198" textAnchor="middle" fontSize="11" fill="#14241B" fontWeight="600">
        Reactants
      </text>

      {/* Equilibrium Arrows in Middle */}
      <text
        x="210"
        y="108"
        textAnchor="middle"
        fontSize="16"
        fontFamily="IBM Plex Mono"
        fontWeight="700"
        fill="#164A31"
      >
        {diff > 0 ? "⇌ (Forward ▸)" : diff < 0 ? "(◂ Backward) ⇌" : "⇌ Balanced"}
      </text>
      <text
        x="210"
        y="130"
        textAnchor="middle"
        fontSize="10"
        fontFamily="IBM Plex Mono"
        fill="#48564D"
      >
        T = {temp} K | Kc = 4.0
      </text>

      {/* Products Bar */}
      <rect
        x="270"
        y={180 - productHeight}
        width="65"
        height={productHeight}
        rx="4"
        fill="#164A31"
      />
      <text x="302" y="198" textAnchor="middle" fontSize="11" fill="#14241B" fontWeight="600">
        Products
      </text>

      <text x="50" y="26" fontSize="11" fill="#14241B" fontWeight="600">
        Reaction Quotient Q = {qVal.toFixed(1)} vs Equilibrium Constant Kc = 4.0
      </text>
    </svg>
  );
}
