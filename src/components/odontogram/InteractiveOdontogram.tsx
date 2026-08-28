import React, { useState } from 'react';
import { 
  ToothNumber, 
  ToothState, 
  ToothSurface, 
  SurfaceCondition, 
  WholeToothCondition, 
  OdontogramData,
  OdontogramType,
  Patient
} from '../../types/clinical';
import { ToothView } from './ToothView';
import { createDefaultToothState } from '../../data/initialData';
import { 
  Sparkles, 
  RotateCcw, 
  Plus, 
  FileText, 
  Check, 
  AlertCircle, 
  ChevronRight, 
  DollarSign, 
  Save, 
  Info,
  HelpCircle
} from 'lucide-react';

interface InteractiveOdontogramProps {
  patient: Patient;
  odontogram: OdontogramData;
  onUpdateOdontogram: (updated: OdontogramData) => void;
  onAddTreatmentToBudget?: (toothNumber: ToothNumber, condition: string, estimatedPrice?: number) => void;
  readOnly?: boolean;
}

export const InteractiveOdontogram: React.FC<InteractiveOdontogramProps> = ({
  patient,
  odontogram,
  onUpdateOdontogram,
  onAddTreatmentToBudget,
  readOnly = false
}) => {
  const [selectedToothNumber, setSelectedToothNumber] = useState<ToothNumber | null>(16);
  const [activeToolType, setActiveToolType] = useState<'surface' | 'whole'>('surface');
  const [activeSurfaceCondition, setActiveSurfaceCondition] = useState<SurfaceCondition>('caries');
  const [activeWholeCondition, setActiveWholeCondition] = useState<WholeToothCondition>('crown');
  const [activeMode, setActiveMode] = useState<OdontogramType>(odontogram.type || 'ADULT');
  const [inspectorNotes, setInspectorNotes] = useState<string>('');
  const [saveToast, setSaveToast] = useState(false);

  const teethData = odontogram.teeth || {};
  const selectedToothState = selectedToothNumber ? (teethData[selectedToothNumber] || createDefaultToothState(selectedToothNumber)) : null;

  // FDI Quadrant tooth list generator
  const adultUpperRight: ToothNumber[] = [18, 17, 16, 15, 14, 13, 12, 11];
  const adultUpperLeft: ToothNumber[] = [21, 22, 23, 24, 25, 26, 27, 28];
  const adultLowerRight: ToothNumber[] = [48, 47, 46, 45, 44, 43, 42, 41];
  const adultLowerLeft: ToothNumber[] = [31, 32, 33, 34, 35, 36, 37, 38];

  const pediatricUpperRight: ToothNumber[] = [55, 54, 53, 52, 51];
  const pediatricUpperLeft: ToothNumber[] = [61, 62, 63, 64, 65];
  const pediatricLowerRight: ToothNumber[] = [85, 84, 83, 82, 81];
  const pediatricLowerLeft: ToothNumber[] = [71, 72, 73, 74, 75];

  // Surface click handler (applies active surface condition immediately)
  const handleSurfaceClick = (toothNum: ToothNumber, surface: ToothSurface, e: React.MouseEvent) => {
    if (readOnly) return;
    e.stopPropagation();
    setSelectedToothNumber(toothNum);

    const currentTooth = teethData[toothNum] || createDefaultToothState(toothNum);
    const updatedSurfaces = {
      ...currentTooth.surfaces,
      [surface]: activeSurfaceCondition
    };

    const updatedTooth: ToothState = {
      ...currentTooth,
      surfaces: updatedSurfaces
    };

    const newOdontogram: OdontogramData = {
      ...odontogram,
      updatedAt: new Date().toISOString().split('T')[0],
      teeth: {
        ...teethData,
        [toothNum]: updatedTooth
      }
    };

    onUpdateOdontogram(newOdontogram);
  };

  // Whole tooth condition applicator
  const applyWholeCondition = (toothNum: ToothNumber, condition: WholeToothCondition) => {
    if (readOnly) return;
    const currentTooth = teethData[toothNum] || createDefaultToothState(toothNum);
    const updatedTooth: ToothState = {
      ...currentTooth,
      wholeCondition: condition
    };

    const newOdontogram: OdontogramData = {
      ...odontogram,
      updatedAt: new Date().toISOString().split('T')[0],
      teeth: {
        ...teethData,
        [toothNum]: updatedTooth
      }
    };

    onUpdateOdontogram(newOdontogram);
  };

  // Reset tooth to healthy
  const handleResetTooth = (toothNum: ToothNumber) => {
    if (readOnly) return;
    const newOdontogram: OdontogramData = {
      ...odontogram,
      updatedAt: new Date().toISOString().split('T')[0],
      teeth: {
        ...teethData,
        [toothNum]: createDefaultToothState(toothNum)
      }
    };
    onUpdateOdontogram(newOdontogram);
  };

  // Save notes on tooth
  const handleSaveToothNotes = () => {
    if (!selectedToothNumber || readOnly) return;
    const currentTooth = teethData[selectedToothNumber] || createDefaultToothState(selectedToothNumber);
    const updatedTooth: ToothState = {
      ...currentTooth,
      notes: inspectorNotes
    };

    const newOdontogram: OdontogramData = {
      ...odontogram,
      updatedAt: new Date().toISOString().split('T')[0],
      teeth: {
        ...teethData,
        [selectedToothNumber]: updatedTooth
      }
    };

    onUpdateOdontogram(newOdontogram);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  // Helper to get diagnostic count
  const allTeethList: ToothState[] = Object.values(teethData);
  const cariesCount = allTeethList.filter(t => Object.values(t.surfaces).includes('caries')).length;
  const restorationsCount = allTeethList.filter(t => Object.values(t.surfaces).includes('composite') || Object.values(t.surfaces).includes('amalgam')).length;
  const missingCount = allTeethList.filter(t => t.wholeCondition === 'missing').length;
  const implantsCount = allTeethList.filter(t => t.wholeCondition === 'implant').length;
  const crownsCount = allTeethList.filter(t => t.wholeCondition === 'crown').length;

  return (
    <div className="flex flex-col gap-5">
      {/* Top Controls: Mode Switcher & Diagnostic Key Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/10 rounded-lg border border-teal-500/30">
            <Sparkles className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-base">Odontograma Interactivo Digital (Sistema FDI)</h3>
            <p className="text-xs text-slate-400">
              Mapeo anatómico de 5 caras con registro de tratamientos, hallazgos y sincronización de presupuestos
            </p>
          </div>
        </div>

        {/* Dentition selector */}
        <div className="flex items-center bg-slate-900/80 p-1 rounded-lg border border-slate-700">
          <button
            type="button"
            onClick={() => {
              setActiveMode('ADULT');
              onUpdateOdontogram({ ...odontogram, type: 'ADULT' });
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeMode === 'ADULT'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Adulto (32 piezas)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMode('PEDIATRIC');
              onUpdateOdontogram({ ...odontogram, type: 'PEDIATRIC' });
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeMode === 'PEDIATRIC'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pediátrico (20 piezas)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMode('MIXED');
              onUpdateOdontogram({ ...odontogram, type: 'MIXED' });
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeMode === 'MIXED'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dentición Mixta
          </button>
        </div>
      </div>

      {/* Main Grid: Left is Tools & Interactive Dental Chart, Right is Tooth Surgical Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Odontogram Visual Chart & Toolbar */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          
          {/* Diagnostic Tool Palette */}
          {!readOnly && (
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                  Herramientas de Diagnóstico & Aplicador Directo
                </span>
                <span className="text-xs text-slate-400">Haz clic en una cara dental para aplicar la condición</span>
              </div>

              {/* Tool Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {/* Caries */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveToolType('surface');
                    setActiveSurfaceCondition('caries');
                  }}
                  className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium border transition-all ${
                    activeToolType === 'surface' && activeSurfaceCondition === 'caries'
                      ? 'bg-red-500/20 border-red-500 text-red-300 ring-1 ring-red-400'
                      : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded bg-red-500 border border-red-400"></span>
                  <span>Caries (Rojo)</span>
                </button>

                {/* Composite */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveToolType('surface');
                    setActiveSurfaceCondition('composite');
                  }}
                  className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium border transition-all ${
                    activeToolType === 'surface' && activeSurfaceCondition === 'composite'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300 ring-1 ring-blue-400'
                      : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded bg-blue-500 border border-blue-400"></span>
                  <span>Resina / Comp.</span>
                </button>

                {/* Sellante */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveToolType('surface');
                    setActiveSurfaceCondition('sealant');
                  }}
                  className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium border transition-all ${
                    activeToolType === 'surface' && activeSurfaceCondition === 'sealant'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-400'
                      : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-400"></span>
                  <span>Sellante (Verde)</span>
                </button>

                {/* Amalgama */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveToolType('surface');
                    setActiveSurfaceCondition('amalgam');
                  }}
                  className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium border transition-all ${
                    activeToolType === 'surface' && activeSurfaceCondition === 'amalgam'
                      ? 'bg-slate-500/20 border-slate-400 text-slate-200 ring-1 ring-slate-400'
                      : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded bg-slate-500 border border-slate-400"></span>
                  <span>Amalgama</span>
                </button>

                {/* Fractura */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveToolType('surface');
                    setActiveSurfaceCondition('fracture');
                  }}
                  className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium border transition-all ${
                    activeToolType === 'surface' && activeSurfaceCondition === 'fracture'
                      ? 'bg-orange-500/20 border-orange-500 text-orange-300 ring-1 ring-orange-400'
                      : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded bg-orange-500 border border-orange-400"></span>
                  <span>Fractura</span>
                </button>

                {/* Sano / Borrar */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveToolType('surface');
                    setActiveSurfaceCondition('healthy');
                  }}
                  className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium border transition-all ${
                    activeToolType === 'surface' && activeSurfaceCondition === 'healthy'
                      ? 'bg-teal-500/20 border-teal-500 text-teal-300 ring-1 ring-teal-400'
                      : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded bg-white border border-slate-400"></span>
                  <span>Sano / Limpiar</span>
                </button>
              </div>
            </div>
          )}

          {/* FDI Dental Arch Visualization Container */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl overflow-x-auto">
            
            {/* Top Header Labels */}
            <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-widest pb-3 border-b border-slate-800">
              <span className="text-teal-400">Cuadrante 1 (Derecho Superior)</span>
              <span className="text-slate-500">Línea Media Maxilar</span>
              <span className="text-teal-400">Cuadrante 2 (Izquierdo Superior)</span>
            </div>

            {/* Upper Arch (Maxilla) */}
            <div className="py-4">
              {activeMode === 'ADULT' || activeMode === 'MIXED' ? (
                <div className="flex justify-center items-center gap-1 sm:gap-2">
                  {/* Quadrant 1 */}
                  <div className="flex gap-1">
                    {adultUpperRight.map(num => (
                      <ToothView
                        key={num}
                        toothNumber={num}
                        toothState={teethData[num]}
                        isSelected={selectedToothNumber === num}
                        onToothClick={(n) => {
                          setSelectedToothNumber(n);
                          setInspectorNotes(teethData[n]?.notes || '');
                        }}
                        onSurfaceClick={handleSurfaceClick}
                      />
                    ))}
                  </div>

                  {/* Midline Divider */}
                  <div className="h-20 w-0.5 bg-teal-500/40 mx-1 flex flex-col justify-between items-center py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                  </div>

                  {/* Quadrant 2 */}
                  <div className="flex gap-1">
                    {adultUpperLeft.map(num => (
                      <ToothView
                        key={num}
                        toothNumber={num}
                        toothState={teethData[num]}
                        isSelected={selectedToothNumber === num}
                        onToothClick={(n) => {
                          setSelectedToothNumber(n);
                          setInspectorNotes(teethData[n]?.notes || '');
                        }}
                        onSurfaceClick={handleSurfaceClick}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Pediatric Upper Arch if Pediatric or Mixed */}
              {(activeMode === 'PEDIATRIC' || activeMode === 'MIXED') && (
                <div className="flex justify-center items-center gap-1 sm:gap-2 mt-4 pt-4 border-t border-slate-800/80">
                  <div className="flex gap-1">
                    {pediatricUpperRight.map(num => (
                      <ToothView
                        key={num}
                        toothNumber={num}
                        toothState={teethData[num]}
                        isSelected={selectedToothNumber === num}
                        isPediatric
                        onToothClick={(n) => {
                          setSelectedToothNumber(n);
                          setInspectorNotes(teethData[n]?.notes || '');
                        }}
                        onSurfaceClick={handleSurfaceClick}
                      />
                    ))}
                  </div>

                  <div className="h-16 w-0.5 bg-amber-500/40 mx-1"></div>

                  <div className="flex gap-1">
                    {pediatricUpperLeft.map(num => (
                      <ToothView
                        key={num}
                        toothNumber={num}
                        toothState={teethData[num]}
                        isSelected={selectedToothNumber === num}
                        isPediatric
                        onToothClick={(n) => {
                          setSelectedToothNumber(n);
                          setInspectorNotes(teethData[n]?.notes || '');
                        }}
                        onSurfaceClick={handleSurfaceClick}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Occlusal Plane Separator */}
            <div className="relative my-3 flex items-center justify-center">
              <div className="w-full border-t-2 border-dashed border-slate-800"></div>
              <span className="absolute px-3 py-0.5 bg-slate-900 text-[11px] font-mono text-slate-400 rounded-full border border-slate-700">
                Plano Oclusal / Oclusión
              </span>
            </div>

            {/* Lower Arch (Mandible) */}
            <div className="py-4">
              {/* Pediatric Lower Arch if Pediatric or Mixed */}
              {(activeMode === 'PEDIATRIC' || activeMode === 'MIXED') && (
                <div className="flex justify-center items-center gap-1 sm:gap-2 mb-4 pb-4 border-b border-slate-800/80">
                  <div className="flex gap-1">
                    {pediatricLowerRight.map(num => (
                      <ToothView
                        key={num}
                        toothNumber={num}
                        toothState={teethData[num]}
                        isSelected={selectedToothNumber === num}
                        isPediatric
                        onToothClick={(n) => {
                          setSelectedToothNumber(n);
                          setInspectorNotes(teethData[n]?.notes || '');
                        }}
                        onSurfaceClick={handleSurfaceClick}
                      />
                    ))}
                  </div>

                  <div className="h-16 w-0.5 bg-amber-500/40 mx-1"></div>

                  <div className="flex gap-1">
                    {pediatricLowerLeft.map(num => (
                      <ToothView
                        key={num}
                        toothNumber={num}
                        toothState={teethData[num]}
                        isSelected={selectedToothNumber === num}
                        isPediatric
                        onToothClick={(n) => {
                          setSelectedToothNumber(n);
                          setInspectorNotes(teethData[n]?.notes || '');
                        }}
                        onSurfaceClick={handleSurfaceClick}
                      />
                    ))}
                  </div>
                </div>
              )}

              {activeMode === 'ADULT' || activeMode === 'MIXED' ? (
                <div className="flex justify-center items-center gap-1 sm:gap-2">
                  {/* Quadrant 4 */}
                  <div className="flex gap-1">
                    {adultLowerRight.map(num => (
                      <ToothView
                        key={num}
                        toothNumber={num}
                        toothState={teethData[num]}
                        isSelected={selectedToothNumber === num}
                        onToothClick={(n) => {
                          setSelectedToothNumber(n);
                          setInspectorNotes(teethData[n]?.notes || '');
                        }}
                        onSurfaceClick={handleSurfaceClick}
                      />
                    ))}
                  </div>

                  {/* Midline Divider */}
                  <div className="h-20 w-0.5 bg-teal-500/40 mx-1 flex flex-col justify-between items-center py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                  </div>

                  {/* Quadrant 3 */}
                  <div className="flex gap-1">
                    {adultLowerLeft.map(num => (
                      <ToothView
                        key={num}
                        toothNumber={num}
                        toothState={teethData[num]}
                        isSelected={selectedToothNumber === num}
                        onToothClick={(n) => {
                          setSelectedToothNumber(n);
                          setInspectorNotes(teethData[n]?.notes || '');
                        }}
                        onSurfaceClick={handleSurfaceClick}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Bottom Footer Labels */}
            <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-widest pt-3 border-t border-slate-800">
              <span className="text-teal-400">Cuadrante 4 (Derecho Inferior)</span>
              <span className="text-slate-500">Línea Media Mandibular</span>
              <span className="text-teal-400">Cuadrante 3 (Izquierdo Inferior)</span>
            </div>
          </div>

          {/* Diagnostic Key & Stats Quick Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60 flex items-center gap-3">
              <div className="w-3 h-8 bg-red-500 rounded-sm"></div>
              <div>
                <span className="text-xs text-slate-400 block">Caries / Cavidades</span>
                <span className="text-base font-bold text-red-400">{cariesCount} {cariesCount === 1 ? 'pieza' : 'piezas'}</span>
              </div>
            </div>

            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60 flex items-center gap-3">
              <div className="w-3 h-8 bg-blue-500 rounded-sm"></div>
              <div>
                <span className="text-xs text-slate-400 block">Restauraciones</span>
                <span className="text-base font-bold text-blue-400">{restorationsCount} {restorationsCount === 1 ? 'pieza' : 'piezas'}</span>
              </div>
            </div>

            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60 flex items-center gap-3">
              <div className="w-3 h-8 bg-amber-500 rounded-sm"></div>
              <div>
                <span className="text-xs text-slate-400 block">Coronas / Prótesis</span>
                <span className="text-base font-bold text-amber-400">{crownsCount}</span>
              </div>
            </div>

            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60 flex items-center gap-3">
              <div className="w-3 h-8 bg-cyan-500 rounded-sm"></div>
              <div>
                <span className="text-xs text-slate-400 block">Implantes</span>
                <span className="text-base font-bold text-cyan-400">{implantsCount}</span>
              </div>
            </div>

            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60 flex items-center gap-3">
              <div className="w-3 h-8 bg-slate-500 rounded-sm"></div>
              <div>
                <span className="text-xs text-slate-400 block">Piezas Ausentes</span>
                <span className="text-base font-bold text-slate-300">{missingCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Tooth Surgical Inspector & Budget Generator Sync */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700 flex flex-col h-full">
            
            {/* Inspector Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-teal-500/20 text-teal-300 text-sm font-mono font-bold rounded-md border border-teal-500/40">
                  Pieza {selectedToothNumber || '--'}
                </span>
                <h4 className="text-sm font-semibold text-slate-200">
                  {selectedToothNumber ? `Inspector Clínico de Pieza` : 'Selecciona un diente'}
                </h4>
              </div>

              {selectedToothNumber && !readOnly && (
                <button
                  type="button"
                  onClick={() => handleResetTooth(selectedToothNumber)}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 hover:bg-slate-700 px-2 py-1 rounded"
                  title="Restablecer diente a estado sano"
                >
                  <RotateCcw className="w-3 h-3" />
                  Sano
                </button>
              )}
            </div>

            {selectedToothNumber && selectedToothState ? (
              <div className="flex flex-col gap-4 mt-4 flex-1">
                
                {/* Surface Status Overview */}
                <div>
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                    Estado por Caras Anatómicas
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(selectedToothState.surfaces).map(([surf, cond]) => (
                      <div 
                        key={surf} 
                        className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex items-center justify-between"
                      >
                        <span className="capitalize text-slate-400">{surf}:</span>
                        <span className={`font-semibold capitalize ${
                          cond === 'caries' ? 'text-red-400' :
                          cond === 'composite' ? 'text-blue-400' :
                          cond === 'sealant' ? 'text-emerald-400' :
                          cond === 'fracture' ? 'text-orange-400' :
                          cond === 'amalgam' ? 'text-slate-300' : 'text-slate-500'
                        }`}>
                          {cond === 'healthy' ? 'Sano' : cond}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Whole Tooth Procedure Buttons */}
                {!readOnly && (
                  <div>
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                      Procedimientos / Estado Global
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => applyWholeCondition(selectedToothNumber, 'crown')}
                        className={`p-2 rounded-lg text-xs font-medium border text-left flex items-center justify-between ${
                          selectedToothState.wholeCondition === 'crown' 
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300' 
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>👑 Corona / Prótesis</span>
                        {selectedToothState.wholeCondition === 'crown' && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => applyWholeCondition(selectedToothNumber, 'implant')}
                        className={`p-2 rounded-lg text-xs font-medium border text-left flex items-center justify-between ${
                          selectedToothState.wholeCondition === 'implant' 
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' 
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>🔩 Implante</span>
                        {selectedToothState.wholeCondition === 'implant' && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => applyWholeCondition(selectedToothNumber, 'endodontics')}
                        className={`p-2 rounded-lg text-xs font-medium border text-left flex items-center justify-between ${
                          selectedToothState.wholeCondition === 'endodontics' 
                            ? 'bg-red-500/20 border-red-400 text-red-300' 
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>⚡ Endodoncia</span>
                        {selectedToothState.wholeCondition === 'endodontics' && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => applyWholeCondition(selectedToothNumber, 'extraction_indicated')}
                        className={`p-2 rounded-lg text-xs font-medium border text-left flex items-center justify-between ${
                          selectedToothState.wholeCondition === 'extraction_indicated' 
                            ? 'bg-red-500/20 border-red-400 text-red-300' 
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>❌ Extracción Req.</span>
                        {selectedToothState.wholeCondition === 'extraction_indicated' && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => applyWholeCondition(selectedToothNumber, 'missing')}
                        className={`p-2 rounded-lg text-xs font-medium border text-left flex items-center justify-between ${
                          selectedToothState.wholeCondition === 'missing' 
                            ? 'bg-slate-700 border-slate-500 text-slate-200' 
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>➖ Pieza Ausente</span>
                        {selectedToothState.wholeCondition === 'missing' && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => applyWholeCondition(selectedToothNumber, 'orthodontic_bracket')}
                        className={`p-2 rounded-lg text-xs font-medium border text-left flex items-center justify-between ${
                          selectedToothState.wholeCondition === 'orthodontic_bracket' 
                            ? 'bg-sky-500/20 border-sky-400 text-sky-300' 
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>🦷 Bracket Ortodoncia</span>
                        {selectedToothState.wholeCondition === 'orthodontic_bracket' && <Check className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Direct Action: Add to Budget plan */}
                {onAddTreatmentToBudget && (
                  <div className="bg-teal-950/40 p-3 rounded-xl border border-teal-500/30">
                    <span className="text-xs font-bold text-teal-300 uppercase tracking-wider block mb-2 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      Sincronizar con Presupuesto
                    </span>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onAddTreatmentToBudget(
                            selectedToothNumber,
                            `Restauración Composite Pieza ${selectedToothNumber}`,
                            55000
                          );
                        }}
                        className="w-full py-1.5 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold flex items-center justify-between transition-all"
                      >
                        <span>+ Presupuestar Restauración ($55.000)</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onAddTreatmentToBudget(
                            selectedToothNumber,
                            `Tratamiento de Conducto / Endodoncia Pieza ${selectedToothNumber}`,
                            145000
                          );
                        }}
                        className="w-full py-1.5 px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-between transition-all"
                      >
                        <span>+ Presupuestar Endodoncia ($145.000)</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Tooth Clinical Notes */}
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Notas Clínicas de la Pieza
                    </label>
                    {saveToast && (
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 animate-pulse">
                        <Check className="w-3 h-3" /> Guardado
                      </span>
                    )}
                  </div>
                  <textarea
                    value={inspectorNotes}
                    onChange={(e) => setInspectorNotes(e.target.value)}
                    disabled={readOnly}
                    rows={3}
                    placeholder="Ej. Caries dentinaria profunda Oclusomesial, sensibilidad leve al frío..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 resize-none flex-1"
                  />
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={handleSaveToothNotes}
                      className="mt-2 py-1.5 px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Guardar Nota en Ficha
                    </button>
                  )}
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-center p-4">
                <Info className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">Haz clic en cualquier pieza dental o cara del odontograma para inspeccionar su estado clínico y aplicar diagnósticos.</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
