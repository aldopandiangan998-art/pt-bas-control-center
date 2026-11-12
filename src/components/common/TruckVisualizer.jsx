import { useMemo } from 'react';
import { Truck, Scale, Check, Sliders } from 'lucide-react';
import { calculateKubikasi } from '../../utils/formatters';

export const TRUCK_PRESETS = [
  { name: 'Tronton Index 28 (Bak Standar)', p: 650, l: 250, t: 200, label: '32.5 m³' },
  { name: 'Dump Index 24 (Sirtu Curah)', p: 620, l: 240, t: 160, label: '23.8 m³' },
  { name: 'Colt Diesel Double (CDD)', p: 420, l: 190, t: 100, label: '8.0 m³' },
  { name: 'Dump Engkel 5 m³', p: 310, l: 160, t: 100, label: '5.0 m³' },
];

export default function TruckVisualizer({
  panjangCm = 650,
  lebarCm = 250,
  tinggiCm = 200,
  koreksiCm = 0,
  onApplyPreset,
}) {
  const calc = useMemo(() => {
    return calculateKubikasi(panjangCm, lebarCm, tinggiCm, koreksiCm);
  }, [panjangCm, lebarCm, tinggiCm, koreksiCm]);

  // Scaled dimensions for SVG visualization
  const svgWidth = 320;
  const svgHeight = 140;
  const scale = 0.38;

  const boxWidth = Math.min(260, Math.max(140, panjangCm * scale * 0.9));
  const boxHeight = Math.min(75, Math.max(30, tinggiCm * scale * 0.9));
  const effectiveHeight = Math.max(10, Math.min(boxHeight + 20, (calc.tinggiHasilKoreksi) * scale * 0.9));

  return (
    <div className="bg-[#181818] border border-[#2D2D2D] rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#F4511E]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
            Skematik Bak Armada & Dimensi Kubikasi
          </h4>
        </div>

        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30">
          TK: {calc.tinggiHasilKoreksi} cm
        </span>
      </div>

      {/* Preset Armada Buttons */}
      <div>
        <span className="text-[10px] text-neutral-400 block mb-1.5 flex items-center gap-1">
          <Sliders className="w-3 h-3" />
          Preset Tipe Armada PT BAS:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {TRUCK_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => onApplyPreset && onApplyPreset(preset.p, preset.l, preset.t)}
              className="px-2.5 py-1 rounded-lg bg-[#242424] hover:bg-[#333] hover:border-[#F4511E] border border-[#3A3A3A] text-[11px] text-neutral-300 hover:text-white transition-all flex items-center gap-1.5"
            >
              <span>{preset.name}</span>
              <span className="text-[10px] font-mono text-[#F4511E] font-bold">({preset.label})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive 2.5D SVG Schematic */}
      <div className="relative bg-[#111111] border border-[#262626] rounded-xl p-3 flex flex-col items-center justify-center overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-sm h-32 select-none"
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#222" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width={svgWidth} height={svgHeight} fill="url(#grid)" />

          {/* Truck Cabin Silhouette on Left */}
          <path
            d="M 15 105 L 15 70 L 35 50 L 55 50 L 55 105 Z"
            fill="#2A2A2A"
            stroke="#444"
            strokeWidth="1.5"
          />
          {/* Window */}
          <polygon points="25,68 35,56 48,56 48,68" fill="#1A1A1A" stroke="#555" strokeWidth="1" />
          {/* Front Wheel */}
          <circle cx="35" cy="110" r="10" fill="#1C1C1C" stroke="#777" strokeWidth="2" />
          <circle cx="35" cy="110" r="4" fill="#F4511E" />

          {/* Dump Bed Outline (Bak Truk) */}
          <g transform="translate(60, 25)">
            {/* Bed Container Outline */}
            <rect
              x="0"
              y={svgHeight - 45 - boxHeight}
              width={boxWidth}
              height={boxHeight}
              fill="#222"
              stroke="#555"
              strokeWidth="1.5"
              rx="2"
            />

            {/* Effective Material Volume Fill (shows correction level) */}
            <rect
              x="2"
              y={svgHeight - 45 - effectiveHeight}
              width={boxWidth - 4}
              height={effectiveHeight}
              fill="rgba(244, 81, 30, 0.25)"
              stroke="#F4511E"
              strokeWidth="1.2"
              strokeDasharray={koreksiCm !== 0 ? "4 2" : "none"}
              rx="1"
            />

            {/* Dimension Indicators: P (Panjang) */}
            <line
              x1="0"
              y1={svgHeight - 45 + 10}
              x2={boxWidth}
              y2={svgHeight - 45 + 10}
              stroke="#888"
              strokeWidth="1"
            />
            <text
              x={boxWidth / 2}
              y={svgHeight - 45 + 22}
              fill="#AAA"
              fontSize="9"
              fontFamily="monospace"
              textAnchor="middle"
            >
              P: {panjangCm} cm
            </text>

            {/* Dimension Indicator: T (Tinggi) */}
            <line
              x1={boxWidth + 8}
              y1={svgHeight - 45 - boxHeight}
              x2={boxWidth + 8}
              y2={svgHeight - 45}
              stroke="#888"
              strokeWidth="1"
            />
            <text
              x={boxWidth + 14}
              y={svgHeight - 45 - boxHeight / 2 + 3}
              fill="#AAA"
              fontSize="9"
              fontFamily="monospace"
              textAnchor="start"
            >
              T: {tinggiCm} cm
            </text>

            {/* Rear Dual Wheels */}
            <circle cx={boxWidth - 45} cy={svgHeight - 45 + 5} r="10" fill="#1C1C1C" stroke="#777" strokeWidth="2" />
            <circle cx={boxWidth - 45} cy={svgHeight - 45 + 5} r="4" fill="#F4511E" />
            <circle cx={boxWidth - 20} cy={svgHeight - 45 + 5} r="10" fill="#1C1C1C" stroke="#777" strokeWidth="2" />
            <circle cx={boxWidth - 20} cy={svgHeight - 45 + 5} r="4" fill="#F4511E" />
          </g>
        </svg>

        {/* Live Calculation Metric Row */}
        <div className="w-full grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#222] text-center">
          <div>
            <span className="text-[10px] text-neutral-400 block">Kapasitas Bak Default:</span>
            <span className="text-sm font-mono font-bold text-neutral-300">
              {calc.volumeDefault} m³
            </span>
          </div>

          <div>
            <span className="text-[10px] text-orange-400/90 block font-semibold">
              Hasil Muatan Riil (TK):
            </span>
            <span className="text-sm font-mono font-bold text-[#F4511E]">
              {calc.volumeAkhir} m³
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
