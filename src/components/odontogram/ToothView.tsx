import React from 'react';
import { ToothNumber, ToothState, ToothSurface, SurfaceCondition, WholeToothCondition } from '../../types/clinical';

interface ToothViewProps {
  toothNumber: ToothNumber;
  toothState?: ToothState;
  isSelected?: boolean;
  activeSurfaceTool?: SurfaceCondition;
  activeWholeTool?: WholeToothCondition;
  isPediatric?: boolean;
  onToothClick?: (toothNumber: ToothNumber) => void;
  onSurfaceClick?: (toothNumber: ToothNumber, surface: ToothSurface, e: React.MouseEvent) => void;
}

export const ToothView: React.FC<ToothViewProps> = ({
  toothNumber,
  toothState,
  isSelected = false,
  onToothClick,
  onSurfaceClick
}) => {
  const surfaces = toothState?.surfaces || {
    occlusal: 'healthy',
    vestibular: 'healthy',
    lingual: 'healthy',
    mesial: 'healthy',
    distal: 'healthy'
  };

  const whole = toothState?.wholeCondition || 'normal';

  // Surface fill color resolver
  const getSurfaceColor = (condition: SurfaceCondition): string => {
    switch (condition) {
      case 'caries':
        return '#ef4444'; // Red-500
      case 'composite':
        return '#3b82f6'; // Blue-500
      case 'amalgam':
        return '#64748b'; // Slate-500
      case 'sealant':
        return '#10b981'; // Emerald-500
      case 'fracture':
        return '#f97316'; // Orange-500
      case 'erosion':
        return '#a855f7'; // Purple-500
      case 'healthy':
      default:
        return '#ffffff';
    }
  };

  // Determine midline orientation:
  // For Quadrants 1 & 4 (Patient Right): Mesial is toward center (right side in visual upper right)
  // FDI Quadrants: 1 (18..11), 2 (21..28), 3 (31..38), 4 (41..48)
  // In Quadrant 1 and 4, the 1-tooth (11, 41) is near the midline.
  const quadrant = Math.floor(toothNumber / 10);
  const isUpper = quadrant === 1 || quadrant === 2 || quadrant === 5 || quadrant === 6;
  const isRightSide = quadrant === 1 || quadrant === 4 || quadrant === 5 || quadrant === 8;

  // Anatomical names
  const getToothName = (num: ToothNumber): string => {
    const lastDigit = num % 10;
    const isTemp = num > 50;
    if (isTemp) {
      if (lastDigit === 1) return 'Inc. Central Temp.';
      if (lastDigit === 2) return 'Inc. Lateral Temp.';
      if (lastDigit === 3) return 'Canino Temp.';
      if (lastDigit === 4) return '1° Molar Temp.';
      if (lastDigit === 5) return '2° Molar Temp.';
    } else {
      if (lastDigit === 1) return 'Incisivo Central';
      if (lastDigit === 2) return 'Incisivo Lateral';
      if (lastDigit === 3) return 'Canino';
      if (lastDigit === 4) return '1° Premolar';
      if (lastDigit === 5) return '2° Premolar';
      if (lastDigit === 6) return '1° Molar';
      if (lastDigit === 7) return '2° Molar';
      if (lastDigit === 8) return '3° Molar';
    }
    return `Pieza ${num}`;
  };

  // Check if any surface has caries/condition
  const hasConditions = Object.values(surfaces).some(c => c !== 'healthy') || whole !== 'normal';

  return (
    <div 
      className={`group relative flex flex-col items-center p-1.5 rounded-lg transition-all duration-150 cursor-pointer select-none ${
        isSelected 
          ? 'bg-teal-500/20 ring-2 ring-teal-400 shadow-md shadow-teal-500/10' 
          : 'hover:bg-slate-800/80 bg-slate-800/40 border border-slate-700/50'
      }`}
      onClick={() => onToothClick?.(toothNumber)}
      title={`${toothNumber} - ${getToothName(toothNumber)}`}
    >
      {/* Upper Arch Number Label */}
      {isUpper && (
        <div className="flex items-center gap-1 mb-1">
          <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
            hasConditions ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-300 bg-slate-700/50'
          }`}>
            {toothNumber}
          </span>
        </div>
      )}

      {/* Anatomical Crown Vector / Root Indicator */}
      <div className="relative w-12 h-12 my-0.5">
        {/* SVG Tooth Diagram (5 Surfaces: Top, Bottom, Left, Right, Center) */}
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full drop-shadow-sm transition-transform duration-100 group-hover:scale-105"
        >
          {/* Background border */}
          <rect x="2" y="2" width="96" height="96" rx="14" fill="#0f172a" stroke="#475569" strokeWidth="2" />

          {/* Top Surface (Vestibular in Upper, Lingual in Lower or vice versa) */}
          <polygon
            points="14,14 86,14 68,32 32,32"
            fill={getSurfaceColor(isUpper ? surfaces.vestibular : surfaces.lingual)}
            stroke="#334155"
            strokeWidth="1.5"
            className="transition-colors hover:opacity-80 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onSurfaceClick?.(toothNumber, isUpper ? 'vestibular' : 'lingual', e);
            }}
          />

          {/* Bottom Surface */}
          <polygon
            points="32,68 68,68 86,86 14,86"
            fill={getSurfaceColor(isUpper ? surfaces.lingual : surfaces.vestibular)}
            stroke="#334155"
            strokeWidth="1.5"
            className="transition-colors hover:opacity-80 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onSurfaceClick?.(toothNumber, isUpper ? 'lingual' : 'vestibular', e);
            }}
          />

          {/* Left Surface */}
          <polygon
            points="14,14 32,32 32,68 14,86"
            fill={getSurfaceColor(isRightSide ? surfaces.distal : surfaces.mesial)}
            stroke="#334155"
            strokeWidth="1.5"
            className="transition-colors hover:opacity-80 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onSurfaceClick?.(toothNumber, isRightSide ? 'distal' : 'mesial', e);
            }}
          />

          {/* Right Surface */}
          <polygon
            points="86,14 68,32 68,68 86,86"
            fill={getSurfaceColor(isRightSide ? surfaces.mesial : surfaces.distal)}
            stroke="#334155"
            strokeWidth="1.5"
            className="transition-colors hover:opacity-80 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onSurfaceClick?.(toothNumber, isRightSide ? 'mesial' : 'distal', e);
            }}
          />

          {/* Center Surface (Occlusal / Incisal) */}
          <rect
            x="32"
            y="32"
            width="36"
            height="36"
            rx="4"
            fill={getSurfaceColor(surfaces.occlusal)}
            stroke="#334155"
            strokeWidth="1.5"
            className="transition-colors hover:opacity-80 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onSurfaceClick?.(toothNumber, 'occlusal', e);
            }}
          />

          {/* Overlays for Whole-Tooth Conditions */}
          {whole === 'crown' && (
            <circle cx="50" cy="50" r="44" fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray="6 3" />
          )}

          {whole === 'implant' && (
            <g>
              <rect x="42" y="6" width="16" height="88" rx="4" fill="#06b6d4" opacity="0.85" stroke="#0891b2" strokeWidth="2" />
              <line x1="42" y1="25" x2="58" y2="25" stroke="#ffffff" strokeWidth="2" />
              <line x1="42" y1="45" x2="58" y2="45" stroke="#ffffff" strokeWidth="2" />
              <line x1="42" y1="65" x2="58" y2="65" stroke="#ffffff" strokeWidth="2" />
              <line x1="42" y1="80" x2="58" y2="80" stroke="#ffffff" strokeWidth="2" />
            </g>
          )}

          {whole === 'endodontics' && (
            <g>
              <line x1="50" y1="10" x2="50" y2="90" stroke="#ef4444" strokeWidth="4.5" strokeLinecap="round" />
              <circle cx="50" cy="18" r="5" fill="#ef4444" />
              <circle cx="50" cy="82" r="5" fill="#ef4444" />
            </g>
          )}

          {whole === 'missing' && (
            <g>
              <line x1="10" y1="10" x2="90" y2="90" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
              <line x1="90" y1="10" x2="10" y2="90" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
            </g>
          )}

          {whole === 'extraction_indicated' && (
            <g>
              <line x1="10" y1="10" x2="90" y2="90" stroke="#ef4444" strokeWidth="4.5" strokeLinecap="round" />
              <line x1="90" y1="10" x2="10" y2="90" stroke="#ef4444" strokeWidth="4.5" strokeLinecap="round" />
            </g>
          )}

          {whole === 'orthodontic_bracket' && (
            <rect x="36" y="36" width="28" height="28" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" rx="2" />
          )}

          {whole === 'prosthesis' && (
            <rect x="8" y="8" width="84" height="84" rx="8" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="4 2" />
          )}
        </svg>

        {/* Condition badges */}
        {toothState?.notes && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-slate-900" title="Tiene notas clínicas" />
        )}
      </div>

      {/* Lower Arch Number Label */}
      {!isUpper && (
        <div className="flex items-center gap-1 mt-1">
          <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
            hasConditions ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-300 bg-slate-700/50'
          }`}>
            {toothNumber}
          </span>
        </div>
      )}
    </div>
  );
};
