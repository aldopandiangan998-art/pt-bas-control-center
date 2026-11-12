import { useMemo } from 'react';
import { Truck, Check, SlidersHorizontal, Scale } from 'lucide-react';
import { calculateKubikasi } from '../../utils/formatters';

export const TRUCK_PRESETS = [
  { name: 'Tronton 28', p: 650, l: 250, t: 200, label: '32.5 m³' },
  { name: 'Dump Index 24', p: 620, l: 240, t: 160, label: '23.8 m³' },
  { name: 'Colt Diesel (CDD)', p: 420, l: 190, t: 100, label: '8.0 m³' },
  { name: 'Engkel Standar', p: 310, l: 160, t: 100, label: '5.0 m³' },
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

  // Scaled dimensions for technical blueprint SVG
  const svgWidth = 340;
  const svgHeight = 135;
  const scale = 0.38;

  const boxWidth = Math.min(240, Math.max(130, panjangCm * scale * 0.9));
  const boxHeight = Math.min(65, Math.max(28, tinggiCm * scale * 0.85));
  const effectiveHeight = Math.max(10, Math.min(boxHeight + 15, calc.tinggiHasilKoreksi * scale * 0.85));

  return (
    <div className="bg-[#141414] border border-[#242424] rounded-lg p-3.5 space-y-3">
      {/* Blueprint Header */}
      <div className="flex items-center justify-between border-b border-[#222222] pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
          <Truck className="w-3.5 h-3.5 text-[#F4511E]" />
          <span>Skematik Dimensi Bak Truk</span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="text-neutral-400">TK:</span>
          <span className="font-bold text-[#F4511E]">{calc.tinggiHasilKoreksi} cm</span>
        </div>
      </div>

      {/* Preset Armada Buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider mr-1">Preset:</span>
        {TRUCK_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => onApplyPreset && onApplyPreset(preset.p, preset.l, preset.t)}
            className="px-2 py-0.5 rounded bg-[#1C1C1C] hover:bg-[#282828] border border-[#2E2E2E] hover:border-[#F4511E] text-[10px] text-neutral-300 hover:text-white transition-colors font-mono flex items-center gap-1"
          >
            <span>{preset.name}</span>
            <span className="text-[#F4511E] font-bold">[{preset.label}]</span>
          </button>
        ))}
      </div>

      {/* CAD-Style Blueprint Schematic */}
      <div className="relative bg-[#0A0A0A] border border-[#1E1E1E] rounded tech-grid p-2 flex flex-col items-center justify-center select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-sm h-28"
        >
          {/* Truck Cabin Outline */}
          <path
            d="M 12 100 L 12 65 L 30 48 L 48 48 L 48 100 Z"
            fill="#181818"
            stroke="#383838"
            strokeWidth="1.2"
          />
          <polygon points="20,64 30,52 42,52 42,64" fill="#0D0D0D" stroke="#333" strokeWidth="1" />
          <circle cx="28" cy="104" r="8" fill="#141414" stroke="#555" strokeWidth="1.5" />

          {/* Dump Bed Blueprint */}
          <g transform="translate(54, 25)">
            {/* Background container */}
            <rect
              x="0"
              y={svgHeight - 48 - boxHeight}
              width={boxWidth}
              height={boxHeight}
              fill="#121212"
              stroke="#444"
              strokeWidth="1.2"
            />

            {/* Hatched Fill for Material volume */}
            <defs>
              <pattern id="hatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(244, 81, 30, 0.4)" strokeWidth="1.5" />
              </pattern>
            </defs>
            <rect
              x="1.5"
              y={svgHeight - 48 - effectiveHeight}
              width={boxWidth - 3}
              height={effectiveHeight}
              fill="url(#hatch)"
              stroke="#F4511E"
              strokeWidth="1"
            />

            {/* Dimension Line: Panjang (P) */}
            <line x1="0" y1={svgHeight - 48 + 8} x2={boxWidth} y2={svgHeight - 48 + 8} stroke="#777" strokeWidth="0.8" />
            <text
              x={boxWidth / 2}
              y={svgHeight - 48 + 18}
              fill="#888"
              fontSize="8"
              fontFamily="monospace"
              textAnchor="middle"
            >
              P: {panjangCm} cm
            </text>

            {/* Dimension Line: Tinggi (T) */}
            <line x1={boxWidth + 6} y1={svgHeight - 48 - boxHeight} x2={boxWidth + 6} y2={svgHeight - 48} stroke="#777" strokeWidth="0.8" />
            <text
              x={boxWidth + 10}
              y={svgHeight - 48 - boxHeight / 2 + 3}
              fill="#888"
              fontSize="8"
              fontFamily="monospace"
              textAnchor="start"
            >
              T: {tinggiCm} cm
            </text>

            {/* Wheels */}
            <circle cx={boxWidth - 38} cy={svgHeight - 48 + 4} r="8" fill="#141414" stroke="#555" strokeWidth="1.5" />
            <circle cx={boxWidth - 16} cy={svgHeight - 48 + 4} r="8" fill="#141414" stroke="#555" strokeWidth="1.5" />
          </g>
        </svg>

        {/* Blueprint Measurement Readout */}
        <div className="w-full grid grid-cols-2 gap-2 mt-1 pt-1.5 border-t border-[#1C1C1C] text-center font-mono">
          <div className="text-left pl-2">
            <span className="text-[9px] text-neutral-500 uppercase block">Kapasitas Default:</span>
            <span className="text-xs font-bold text-neutral-300">
              {calc.volumeDefault} m³
            </span>
          </div>

          <div className="text-right pr-2">
            <span className="text-[9px] text-orange-400 uppercase font-semibold block">
              Kubikasi Akhir (TK):
            </span>
            <span className="text-xs font-bold text-[#F4511E]">
              {calc.volumeAkhir} m³
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
