import { useMemo } from 'react';
import { Truck, Scale, Sparkles, Lock } from 'lucide-react';
import { calculateKubikasi } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';

export const TRUCK_PRESETS = [
  { name: 'Tronton 28', p: 650, l: 250, t: 200, label: '32.5 m³' },
  { name: 'Dump Index 24', p: 620, l: 240, t: 160, label: '23.8 m³' },
  { name: 'Colt Diesel (CDD)', p: 420, l: 190, t: 100, label: '8.0 m³' },
  { name: 'Engkel Standar', p: 310, l: 160, t: 100, label: '5.0 m³' },
];

/**
 * Get default truck classification based on default dimensions (p, l, t).
 * Important: This function uses the DEFAULT height (t), never the corrected height (tk),
 * so adjusting the correction value does NOT change the default classification.
 */
export function getTruckClassification(panjangCm, lebarCm, tinggiCm) {
  const p = Number(panjangCm) || 0;
  const l = Number(lebarCm) || 0;
  const t = Number(tinggiCm) || 0;
  if (p === 0 || l === 0 || t === 0) return null;

  // 1. Exact preset match
  const exact = TRUCK_PRESETS.find(
    (pr) => pr.p === p && pr.l === l && pr.t === t
  );
  if (exact) return exact;

  // 2. Volume-based classification using default height
  const vol = (p * l * t) / 1000000;
  if (vol >= 28) {
    return { name: 'Tronton 28', p, l, t, label: `${vol.toFixed(1)} m³` };
  } else if (vol >= 16) {
    return { name: 'Dump Index 24', p, l, t, label: `${vol.toFixed(1)} m³` };
  } else if (vol >= 6.5) {
    return { name: 'Colt Diesel (CDD)', p, l, t, label: `${vol.toFixed(1)} m³` };
  } else if (vol > 0) {
    return { name: 'Engkel Standar', p, l, t, label: `${vol.toFixed(1)} m³` };
  }
  return null;
}

export default function TruckVisualizer({
  panjangCm = 650,
  lebarCm = 250,
  tinggiCm = 200,
  koreksiCm = 0,
  onApplyPreset,
  isLocked = false,
  selectedNopol = '',
}) {
  const { isDark } = useApp();

  const calc = useMemo(() => {
    return calculateKubikasi(panjangCm, lebarCm, tinggiCm, koreksiCm);
  }, [panjangCm, lebarCm, tinggiCm, koreksiCm]);

  // Determine active preset strictly from default dimensions (p, l, t), so koreksiCm does not alter classification
  const activePreset = useMemo(() => {
    return getTruckClassification(panjangCm, lebarCm, tinggiCm);
  }, [panjangCm, lebarCm, tinggiCm]);

  // Scaled dimensions for technical blueprint SVG
  const svgWidth = 340;
  const svgHeight = 145;
  const scale = 0.38;

  const boxWidth = Math.min(235, Math.max(130, panjangCm * scale * 0.9));
  const boxHeight = Math.min(65, Math.max(28, tinggiCm * scale * 0.85));
  const effectiveHeight = Math.max(10, Math.min(boxHeight + 15, calc.tinggiHasilKoreksi * scale * 0.85));
  const defaultHeightPx = Math.max(10, Math.min(boxHeight + 15, (Number(tinggiCm) || 0) * scale * 0.85));

  // High-contrast CAD Blueprint styling optimized for Light Mode & Dark Mode
  const cabinFill = isDark ? '#1C2025' : '#E2E8F0';
  const cabinStroke = isDark ? '#475569' : '#0F172A';
  const windowFill = isDark ? '#0D1520' : '#E0F2FE';
  const windowStroke = isDark ? '#38BDF8' : '#0284C7';
  const chassisFill = isDark ? '#2B3138' : '#1E293B';
  const bedFill = isDark ? '#111316' : '#FFFFFF';
  const bedStroke = isDark ? '#475569' : '#0F172A';
  const bedRibColor = isDark ? '#1F252D' : '#E2E8F0';
  const wheelTireFill = isDark ? '#0B0D0F' : '#0F172A';
  const wheelTireStroke = isDark ? '#4B5563' : '#334155';
  const wheelRimFill = isDark ? '#1F242A' : '#E2E8F0';
  const wheelRimStroke = isDark ? '#4B5563' : '#94A3B8';
  const dimLineColor = isDark ? '#94A3B8' : '#0F172A';
  const dimTextColor = isDark ? '#F1F5F9' : '#0F172A';
  const dimPillBg = isDark ? '#14171A' : '#FFFFFF';
  const dimPillBorder = isDark ? '#333B44' : '#CBD5E1';

  return (
    <div className={`rounded-xl p-3.5 space-y-2.5 select-none shadow-md transition-colors ${
      isDark ? 'bg-[#14171A] border border-[#22262A]' : 'bg-white border border-slate-200 shadow-sm'
    }`}>
      {/* Blueprint Header */}
      <div className={`flex items-center justify-between border-b pb-2 ${isDark ? 'border-[#202326]' : 'border-slate-200'}`}>
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${isDark ? 'text-neutral-300' : 'text-slate-800'}`}>
          <Truck className="w-3.5 h-3.5 text-[#F4511E]" />
          <span>Skematik Dimensi Bak Truk CAD</span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className={isDark ? 'text-neutral-400' : 'text-slate-500'}>TK:</span>
          <span className="font-bold text-[#F4511E]">{calc.tinggiHasilKoreksi} cm</span>
          {Number(koreksiCm) !== 0 && (
            <span className="text-[10px] text-amber-500 font-bold">({koreksiCm > 0 ? `+${koreksiCm}` : koreksiCm})</span>
          )}
        </div>
      </div>

      {/* Preset Armada Buttons / Klasifikasi Default Armada */}
      <div className="space-y-1.5">
        <div className={`flex items-center justify-between text-[10px] font-mono uppercase tracking-wider ${
          isDark ? 'text-neutral-400' : 'text-slate-500'
        }`}>
          <span className="flex items-center gap-1">
            {isLocked && <Lock className="w-3 h-3 text-amber-500" />}
            <span>Klasifikasi Default Armada:</span>
          </span>
          <div className="flex items-center gap-1.5">
            {activePreset && (
              <span className="text-[#F4511E] font-bold">{activePreset.name}</span>
            )}
            {isLocked && (
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                Otomatis ({selectedNopol || 'Terkunci'})
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {TRUCK_PRESETS.map((preset) => {
            const isSelected = activePreset?.name === preset.name;
            return (
              <button
                key={preset.name}
                type="button"
                disabled={isLocked}
                onClick={() => {
                  if (!isLocked && onApplyPreset) {
                    onApplyPreset(preset.p, preset.l, preset.t);
                  }
                }}
                className={`px-2 py-1.5 rounded-md text-[11px] transition-all font-mono flex items-center justify-between gap-1 truncate ${
                  isSelected
                    ? 'bg-[#F4511E] text-white font-bold shadow-xs border border-[#F4511E]'
                    : isLocked
                    ? isDark
                      ? 'bg-[#141619] border border-[#23272C] text-neutral-500 cursor-not-allowed opacity-60'
                      : 'bg-slate-50 border border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                    : isDark
                    ? 'bg-[#181B1E] hover:bg-[#202326] border border-[#2D3339] text-neutral-300 hover:text-white cursor-pointer'
                    : 'bg-slate-100 hover:bg-slate-200/80 border border-slate-300 text-slate-800 hover:text-slate-950 font-medium shadow-2xs cursor-pointer'
                }`}
                title={
                  isLocked
                    ? `Klasifikasi default terkunci otomatis dari data armada ${selectedNopol}`
                    : `${preset.name}: P=${preset.p} L=${preset.l} T=${preset.t} cm`
                }
              >
                <span className="truncate">{preset.name}</span>
                <span className={isSelected ? 'text-white font-bold shrink-0' : 'text-[#F4511E] font-bold shrink-0'}>
                  {preset.label}
                </span>
              </button>
            );
          })}
        </div>

        {isLocked && (
          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono pt-0.5">
            <Lock className="w-3 h-3 text-amber-500 shrink-0" />
            <span>Klasifikasi default terkunci otomatis berdasarkan armada <strong>{selectedNopol}</strong>. Nilai koreksi muatan tidak mengubah klasifikasi default.</span>
          </div>
        )}
      </div>

      {/* CAD-Style Blueprint Schematic */}
      <div className={`relative rounded-lg tech-grid p-2.5 flex flex-col items-center justify-center border transition-colors ${
        isDark ? 'bg-[#0A0C0E] border-[#202326]' : 'bg-slate-50/70 border-slate-300 shadow-2xs'
      }`}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-sm h-28"
        >
          {/* Defs: Hatch Pattern */}
          <defs>
            <pattern id="hatch" width="7" height="7" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="7" stroke="#F4511E" strokeWidth="1.8" strokeOpacity={isDark ? 0.7 : 0.85} />
            </pattern>
          </defs>

          {/* Ground Baseline */}
          <line
            x1="6"
            y1="126"
            x2={svgWidth - 6}
            y2="126"
            stroke={isDark ? '#334155' : '#CBD5E1'}
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* Chassis Frame Connecting Entire Vehicle */}
          <rect
            x="8"
            y="108"
            width={boxWidth + 50}
            height="5"
            rx="1.5"
            fill={chassisFill}
          />

          {/* Front Bumper & Rear Mudguard */}
          <rect x="7" y="103" width="6" height="8" rx="1" fill={isDark ? '#374151' : '#0F172A'} />
          <rect x={boxWidth + 48} y="104" width="6" height="7" rx="1" fill={isDark ? '#374151' : '#0F172A'} />

          {/* Truck Cabin Outline */}
          <path
            d="M 12 110 L 12 72 L 30 52 L 50 52 L 50 110 Z"
            fill={cabinFill}
            stroke={cabinStroke}
            strokeWidth="1.8"
          />
          {/* Cabin Sunshade / Visor */}
          <line x1="28" y1="50" x2="52" y2="50" stroke={cabinStroke} strokeWidth="2.5" strokeLinecap="round" />
          {/* Windshield Window */}
          <polygon
            points="20,72 30,56 46,56 46,72"
            fill={windowFill}
            stroke={windowStroke}
            strokeWidth="1.4"
          />
          {/* Cabin Door Line & Handle */}
          <path d="M 32 72 L 32 106 L 48 106 L 48 72" fill="none" stroke={isDark ? '#333B44' : '#94A3B8'} strokeWidth="1" />
          <line x1="35" y1="78" x2="41" y2="78" stroke="#F4511E" strokeWidth="2" strokeLinecap="round" />
          {/* Front Headlight */}
          <rect x="10" y="86" width="3.5" height="11" rx="1" fill="#F59E0B" stroke="#D97706" strokeWidth="0.8" />
          {/* Side Mirror */}
          <rect x="46" y="62" width="3" height="8" rx="1" fill={cabinStroke} />

          {/* Front Wheel */}
          <circle cx="30" cy="116" r="10" fill={wheelTireFill} stroke={wheelTireStroke} strokeWidth="1.6" />
          <circle cx="30" cy="116" r="5.5" fill={wheelRimFill} stroke={wheelRimStroke} strokeWidth="1" />
          <circle cx="30" cy="116" r="2" fill="#F4511E" />

          {/* Dump Bed Blueprint */}
          <g transform="translate(54, 25)">
            {/* Background container (Clean white in light mode, dark in dark mode) */}
            <rect
              x="0"
              y={87 - boxHeight}
              width={boxWidth}
              height={boxHeight}
              fill={bedFill}
              stroke={bedStroke}
              strokeWidth="1.8"
              rx="1"
            />

            {/* Top Reinforced Rail */}
            <rect
              x="-2"
              y={87 - boxHeight - 2.5}
              width={boxWidth + 4}
              height="3.5"
              rx="1"
              fill={isDark ? '#374151' : '#1E293B'}
            />

            {/* Cab Protector Shield */}
            <path
              d={`M -3 ${87 - boxHeight - 7} L 0 ${87 - boxHeight - 7} L 0 ${87 - boxHeight} L -3 ${87 - boxHeight} Z`}
              fill={isDark ? '#374151' : '#1E293B'}
            />

            {/* Vertical Stiffeners / Reinforcement Ribs */}
            {[0.25, 0.5, 0.75].map((ratio, i) => (
              <line
                key={i}
                x1={boxWidth * ratio}
                y1={87 - boxHeight + 2}
                x2={boxWidth * ratio}
                y2={85}
                stroke={bedRibColor}
                strokeWidth="1.5"
              />
            ))}

            {/* Material Base Color Tint */}
            <rect
              x="1.5"
              y={87 - effectiveHeight}
              width={boxWidth - 3}
              height={effectiveHeight}
              fill={isDark ? 'rgba(244, 81, 30, 0.2)' : 'rgba(244, 81, 30, 0.16)'}
            />

            {/* Hatched Fill for Material Volume */}
            <rect
              x="1.5"
              y={87 - effectiveHeight}
              width={boxWidth - 3}
              height={effectiveHeight}
              fill="url(#hatch)"
            />

            {/* Top Level Edge of Cargo */}
            <line
              x1="1.5"
              y1={87 - effectiveHeight}
              x2={boxWidth - 1.5}
              y2={87 - effectiveHeight}
              stroke="#F4511E"
              strokeWidth="2.4"
            />

            {/* If Height is Corrected: Show Default Height Reference Line */}
            {Number(koreksiCm) !== 0 && (
              <line
                x1="1.5"
                y1={87 - defaultHeightPx}
                x2={boxWidth - 1.5}
                y2={87 - defaultHeightPx}
                stroke={isDark ? '#64748B' : '#94A3B8'}
                strokeDasharray="3 3"
                strokeWidth="1.2"
              />
            )}

            {/* Dimension Line: Panjang (P) */}
            <line x1="0" y1="105" x2={boxWidth} y2="105" stroke={dimLineColor} strokeWidth="1.2" />
            <line x1="0" y1="101" x2="0" y2="109" stroke={dimLineColor} strokeWidth="1.5" />
            <line x1={boxWidth} y1="101" x2={boxWidth} y2="109" stroke={dimLineColor} strokeWidth="1.5" />
            {/* Dimension Pill (P) */}
            <rect
              x={boxWidth / 2 - 36}
              y="97"
              width="72"
              height="16"
              rx="4"
              fill={dimPillBg}
              stroke={dimPillBorder}
              strokeWidth="1"
            />
            <text
              x={boxWidth / 2}
              y="109"
              fill={dimTextColor}
              fontSize="9"
              fontWeight="bold"
              fontFamily="monospace"
              textAnchor="middle"
            >
              P: {panjangCm} cm
            </text>

            {/* Dimension Line: Tinggi (T) */}
            <line x1={boxWidth + 8} y1={87 - boxHeight} x2={boxWidth + 8} y2="87" stroke={dimLineColor} strokeWidth="1.2" />
            <line x1={boxWidth + 4} y1={87 - boxHeight} x2={boxWidth + 12} y2={87 - boxHeight} stroke={dimLineColor} strokeWidth="1.5" />
            <line x1={boxWidth + 4} y1="87" x2={boxWidth + 12} y2="87" stroke={dimLineColor} strokeWidth="1.5" />
            {/* Dimension Pill (T) */}
            <rect
              x={boxWidth + 14}
              y={87 - boxHeight / 2 - 8}
              width="64"
              height="16"
              rx="4"
              fill={dimPillBg}
              stroke={dimPillBorder}
              strokeWidth="1"
            />
            <text
              x={boxWidth + 46}
              y={87 - boxHeight / 2 + 4}
              fill={dimTextColor}
              fontSize="9"
              fontWeight="bold"
              fontFamily="monospace"
              textAnchor="middle"
            >
              T: {tinggiCm} cm
            </text>

            {/* Rear Wheels */}
            <circle cx={boxWidth - 40} cy="91" r="10" fill={wheelTireFill} stroke={wheelTireStroke} strokeWidth="1.6" />
            <circle cx={boxWidth - 40} cy="91" r="5.5" fill={wheelRimFill} stroke={wheelRimStroke} strokeWidth="1" />
            <circle cx={boxWidth - 40} cy="91" r="2" fill="#F4511E" />

            <circle cx={boxWidth - 15} cy="91" r="10" fill={wheelTireFill} stroke={wheelTireStroke} strokeWidth="1.6" />
            <circle cx={boxWidth - 15} cy="91" r="5.5" fill={wheelRimFill} stroke={wheelRimStroke} strokeWidth="1" />
            <circle cx={boxWidth - 15} cy="91" r="2" fill="#F4511E" />
          </g>
        </svg>

        {/* Blueprint Measurement Readout */}
        <div className={`w-full grid grid-cols-2 gap-2 mt-1.5 pt-2 border-t text-center font-mono ${
          isDark ? 'border-[#1C1F22]' : 'border-slate-200'
        }`}>
          <div className="text-left pl-2">
            <span className={`text-[10px] uppercase block ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>Kapasitas Default:</span>
            <span className={`text-xs font-bold ${isDark ? 'text-neutral-200' : 'text-slate-900'}`}>
              {calc.volumeDefault} m³
            </span>
          </div>

          <div className="text-right pr-2">
            <span className="text-[10px] text-orange-500 uppercase font-bold block">
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
