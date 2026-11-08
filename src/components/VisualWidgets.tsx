import React, { useMemo } from 'react';

/**
 * Deterministic SVG QR Code Pattern for thermal label preview & printing
 */
export function QRCodePattern({ value, size = 120 }: { value: string; size?: number }) {
  const gridSize = 21;
  const cells = useMemo(() => {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    const matrix: boolean[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

    const drawFinder = (r0: number, c0: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          matrix[r0 + r][c0 + c] = isBorder || isInner;
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(0, gridSize - 7);
    drawFinder(gridSize - 7, 0);

    let seed = Math.abs(hash);
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const inTopLeft = r < 8 && c < 8;
        const inTopRight = r < 8 && c >= gridSize - 8;
        const inBottomLeft = r >= gridSize - 8 && c < 8;
        if (!inTopLeft && !inTopRight && !inBottomLeft) {
          seed = (seed * 1664525 + 1013904223) % 4294967296;
          matrix[r][c] = (seed & 3) !== 0;
        }
      }
    }
    return matrix;
  }, [value]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${gridSize} ${gridSize}`}
      className="bg-white p-2 rounded-lg border border-zinc-200 shrink-0"
      shapeRendering="crispEdges"
      aria-label={`QR Code pour ${value}`}
    >
      {cells.map((row, rIdx) =>
        row.map((filled, cIdx) =>
          filled ? <rect key={`${rIdx}-${cIdx}`} x={cIdx} y={rIdx} width={1} height={1} fill="#09090b" /> : null
        )
      )}
    </svg>
  );
}

/**
 * High-precision Bambu Lab Reusable Spool Vector Illustration
 */
export function SpoolVisualizerSVG({
  hex,
  isOut = false,
  size = 52
}: {
  hex: string;
  isOut?: boolean;
  size?: number;
}) {
  const isLightFilament =
    hex.toLowerCase() === '#ffffff' ||
    hex.toLowerCase() === '#faf8f5' ||
    hex.toLowerCase() === '#f8fafc' ||
    hex.toLowerCase() === '#f1f5f9';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={`shrink-0 transition-transform duration-150 ${isOut ? 'opacity-45 grayscale-[30%]' : ''}`}
      aria-hidden="true"
    >
      {/* Outer Bambu Spool Flange */}
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="#18181b"
        stroke={isLightFilament ? '#52525b' : '#27272a'}
        strokeWidth="2"
      />
      {/* Filament Winding Ring */}
      <circle
        cx="32"
        cy="32"
        r="25"
        fill={hex}
        stroke={isLightFilament ? '#d4d4d8' : 'rgba(255,255,255,0.12)'}
        strokeWidth="1.5"
      />
      {/* Subtle Filament Thread Grooves */}
      <circle
        cx="32"
        cy="32"
        r="21.5"
        fill="none"
        stroke={isLightFilament ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.14)'}
        strokeWidth="1"
        strokeDasharray="6 3"
      />
      <circle
        cx="32"
        cy="32"
        r="18"
        fill="none"
        stroke={isLightFilament ? 'rgba(0,0,0,0.07)' : 'rgba(0,0,0,0.22)'}
        strokeWidth="1"
      />
      {/* Inner Hub / RFID Core */}
      <circle cx="32" cy="32" r="12" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
      {/* RFID Chip Notch Marks */}
      <line x1="32" y1="20" x2="32" y2="23" stroke="#71717a" strokeWidth="1.5" />
      <line x1="32" y1="41" x2="32" y2="44" stroke="#71717a" strokeWidth="1.5" />
      <line x1="20" y1="32" x2="23" y2="32" stroke="#71717a" strokeWidth="1.5" />
      <line x1="41" y1="32" x2="44" y2="32" stroke="#71717a" strokeWidth="1.5" />
      {/* Center Bore */}
      <circle cx="32" cy="32" r="6.5" fill="#09090b" stroke="#27272a" strokeWidth="1" />
    </svg>
  );
}

/**
 * Stacked Financial Breakdown Bar for ForgeCalc
 */
export function CostDistributionBar({
  material,
  machine,
  labor,
  buffer,
  profit
}: {
  material: number;
  machine: number;
  labor: number;
  buffer: number;
  profit: number;
}) {
  const total = Math.max(0.01, material + machine + labor + buffer + profit);
  const segments = [
    { label: 'Matière 1ère', val: material, pct: (material / total) * 100, color: 'bg-sky-500' },
    { label: 'Élec & Machine', val: machine, pct: (machine / total) * 100, color: 'bg-amber-500' },
    { label: "Main d'œuvre", val: labor, pct: (labor / total) * 100, color: 'bg-purple-500' },
    { label: 'Risque & Pack', val: buffer, pct: (buffer / total) * 100, color: 'bg-rose-500' },
    { label: 'Marge Nette', val: profit, pct: (profit / total) * 100, color: 'bg-emerald-500' }
  ];

  return (
    <div className="space-y-2.5">
      <div className="h-3 w-full rounded-lg bg-zinc-200 dark:bg-zinc-950 overflow-hidden flex p-0.5 gap-0.5 border border-zinc-300 dark:border-zinc-800">
        {segments.map(seg =>
          seg.pct > 0 ? (
            <div
              key={seg.label}
              style={{ width: `${Math.max(3, seg.pct)}%` }}
              className={`h-full ${seg.color} first:rounded-l-md last:rounded-r-md transition-all duration-300`}
              title={`${seg.label}: ${seg.val.toFixed(2)} € (${seg.pct.toFixed(0)}%)`}
            />
          ) : null
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] text-zinc-600 dark:text-zinc-400">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-xs ${seg.color}`} />
            <span>{seg.label}</span>
            <span className="font-mono tabular-nums font-semibold text-zinc-900 dark:text-zinc-200">
              {Math.round(seg.pct)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
