import React, { useState, useEffect } from 'react';
import { 
  TreatmentBudget, 
  BudgetItem, 
  Patient, 
  ProfessionalDoctor, 
  Branch, 
  TreatmentTariffItem,
  ToothNumber
} from '../../types/clinical';
import { 
  X, 
  DollarSign, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  Printer, 
  MessageSquare, 
  FolderPlus,
  FileCheck,
  ShieldCheck
} from 'lucide-react';
import { BudgetPrintModal } from './BudgetPrintModal';

interface SimpleTreatmentRow {
  id: string;
  toothNumber?: number | '';
  name: string;
  price: number;
  quantity: number;
}

interface BudgetBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBudget: (budget: TreatmentBudget, shouldOpenPrint?: boolean, shouldOpenWhatsApp?: boolean) => void;
  patients: Patient[];
  doctors: ProfessionalDoctor[];
  branches: Branch[];
  tariffs?: TreatmentTariffItem[];
  defaultPatient?: Patient;
  initialItem?: { toothNumber?: number; name: string; price: number };
}

export const FDI_TOOTH_OPTIONS = [
  { label: 'Sin pieza / General', value: '' },
  { label: 'Arcada Superior Completa', value: 100 },
  { label: 'Arcada Inferior Completa', value: 200 },
  { label: 'Boca Completa (Ambas Arcadas)', value: 300 },
  // Cuadrante 1 (Sup. Der)
  { label: 'Pz. 18 - Tercer Molar Sup. Der.', value: 18 },
  { label: 'Pz. 17 - Segundo Molar Sup. Der.', value: 17 },
  { label: 'Pz. 16 - Primer Molar Sup. Der.', value: 16 },
  { label: 'Pz. 15 - Segundo Premolar Sup. Der.', value: 15 },
  { label: 'Pz. 14 - Primer Premolar Sup. Der.', value: 14 },
  { label: 'Pz. 13 - Canino Sup. Der.', value: 13 },
  { label: 'Pz. 12 - Incisivo Lateral Sup. Der.', value: 12 },
  { label: 'Pz. 11 - Incisivo Central Sup. Der.', value: 11 },
  // Cuadrante 2 (Sup. Izq)
  { label: 'Pz. 21 - Incisivo Central Sup. Izq.', value: 21 },
  { label: 'Pz. 22 - Incisivo Lateral Sup. Izq.', value: 22 },
  { label: 'Pz. 23 - Canino Sup. Izq.', value: 23 },
  { label: 'Pz. 24 - Primer Premolar Sup. Izq.', value: 24 },
  { label: 'Pz. 25 - Segundo Premolar Sup. Izq.', value: 25 },
  { label: 'Pz. 26 - Primer Molar Sup. Izq.', value: 26 },
  { label: 'Pz. 27 - Segundo Molar Sup. Izq.', value: 27 },
  { label: 'Pz. 28 - Tercer Molar Sup. Izq.', value: 28 },
  // Cuadrante 3 (Inf. Izq)
  { label: 'Pz. 31 - Incisivo Central Inf. Izq.', value: 31 },
  { label: 'Pz. 32 - Incisivo Lateral Inf. Izq.', value: 32 },
  { label: 'Pz. 33 - Canino Inf. Izq.', value: 33 },
  { label: 'Pz. 34 - Primer Premolar Inf. Izq.', value: 34 },
  { label: 'Pz. 35 - Segundo Premolar Inf. Izq.', value: 35 },
  { label: 'Pz. 36 - Primer Molar Inf. Izq.', value: 36 },
  { label: 'Pz. 37 - Segundo Molar Inf. Izq.', value: 37 },
  { label: 'Pz. 38 - Tercer Molar Inf. Izq.', value: 38 },
  // Cuadrante 4 (Inf. Der)
  { label: 'Pz. 41 - Incisivo Central Inf. Der.', value: 41 },
  { label: 'Pz. 42 - Incisivo Lateral Inf. Der.', value: 42 },
  { label: 'Pz. 43 - Canino Inf. Der.', value: 43 },
  { label: 'Pz. 44 - Primer Premolar Inf. Der.', value: 44 },
  { label: 'Pz. 45 - Segundo Premolar Inf. Der.', value: 45 },
  { label: 'Pz. 46 - Primer Molar Inf. Der.', value: 46 },
  { label: 'Pz. 47 - Segundo Molar Inf. Der.', value: 47 },
  { label: 'Pz. 48 - Tercer Molar Inf. Der.', value: 48 },
];

export const BudgetBuilderModal: React.FC<BudgetBuilderModalProps> = ({
  isOpen,
  onClose,
  onSaveBudget,
  patients,
  doctors,
  branches,
  defaultPatient,
  initialItem
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState(defaultPatient?.id || patients[0]?.id || '');
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.id || '');
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0]?.id || '');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  
  // Rows with tooth number, description and price (Starts empty with price 0, subtotal 0)
  const [rows, setRows] = useState<SimpleTreatmentRow[]>([
    {
      id: 'row-initial',
      toothNumber: initialItem?.toothNumber || '',
      name: initialItem?.name || '',
      price: initialItem?.price || 0,
      quantity: 1
    }
  ]);

  // Ensure there is always at least one row when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialItem) {
        setRows([{
          id: `row-init-${Date.now()}`,
          toothNumber: initialItem.toothNumber || '',
          name: initialItem.name || '',
          price: initialItem.price || 0,
          quantity: 1
        }]);
      } else if (rows.length === 0) {
        setRows([{
          id: `row-${Date.now()}`,
          toothNumber: '',
          name: '',
          price: 0,
          quantity: 1
        }]);
      }
    }
  }, [isOpen, initialItem]);

  const [notes, setNotes] = useState('Presupuesto válido por 30 días. Incluye controles y garantía clínica.');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [tempBudgetForPrint, setTempBudgetForPrint] = useState<TreatmentBudget | null>(null);

  if (!isOpen) return null;

  const currentPatient = patients.find(p => p.id === selectedPatientId) || patients[0];
  const currentDoctor = doctors.find(d => d.id === selectedDoctorId) || doctors[0];
  const currentBranch = branches.find(b => b.id === selectedBranchId) || branches[0];

  // Add empty manual row
  const handleAddEmptyRow = () => {
    setRows(prev => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        toothNumber: '',
        name: '',
        price: 0,
        quantity: 1
      }
    ]);
  };

  // Update row
  const handleUpdateRow = (id: string, updates: Partial<SimpleTreatmentRow>) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  // Remove row
  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) {
      // Reset the single row to blank with $0 instead of removing it
      setRows([{
        id: `row-${Date.now()}`,
        toothNumber: '',
        name: '',
        price: 0,
        quantity: 1
      }]);
      return;
    }
    setRows(prev => prev.filter(r => r.id !== id));
  };

  // Calculations (Starts at 0 if prices are 0)
  const subtotal = rows.reduce((acc, r) => acc + (Math.max(0, Number(r.price) || 0) * Math.max(1, Number(r.quantity) || 1)), 0);
  const discountAmount = Math.round(subtotal * (Math.max(0, Math.min(100, Number(discountPercent) || 0)) / 100));
  const totalFinal = Math.max(0, subtotal - discountAmount);

  const buildBudgetData = (): TreatmentBudget => {
    const validRows = rows.filter(r => r.name.trim().length > 0 || (Number(r.price) > 0));
    const items: BudgetItem[] = validRows.map((r, idx) => {
      const rowBase = (Number(r.price) || 0) * (Number(r.quantity) || 1);
      const rowDiscount = Math.round(rowBase * (discountPercent / 100));
      const rowTotal = rowBase - rowDiscount;
      return {
        id: `bi-${Date.now()}-${idx}`,
        tariffItemId: `manual-${idx}`,
        code: `TX-${idx + 1}`,
        description: r.name.trim() || 'Tratamiento Dental',
        toothNumber: r.toothNumber && typeof r.toothNumber === 'number' ? r.toothNumber : undefined,
        quantity: r.quantity || 1,
        unitPrice: Number(r.price) || 0,
        discountPercent: discountPercent,
        insuranceCoverageAmount: 0,
        patientCopay: rowTotal,
        total: rowTotal,
        status: 'PENDING'
      };
    });

    return {
      id: `bud-${Date.now()}`,
      budgetNumber: `PRE-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: currentPatient.id,
      patientName: `${currentPatient.firstName} ${currentPatient.lastName}`,
      doctorId: currentDoctor.id,
      doctorName: currentDoctor.name,
      branchId: currentBranch.id,
      createdAt: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'ACCEPTED',
      items,
      subtotal,
      discountTotal: discountAmount,
      insuranceTotal: 0,
      totalPatient: totalFinal,
      totalPaid: 0,
      balanceDue: totalFinal,
      notes
    };
  };

  // 1. Guardar y Agregar a la Ficha del Paciente
  const handleSaveToPatientChart = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const budget = buildBudgetData();
    if (budget.items.length === 0) {
      alert('Por favor ingresa al menos un tratamiento con precio.');
      return;
    }
    onSaveBudget(budget);
    onClose();
  };

  // 2. Descargar Presupuesto (PDF)
  const handleDownloadPDF = () => {
    const budget = buildBudgetData();
    if (budget.items.length === 0) {
      alert('Por favor ingresa al menos un tratamiento.');
      return;
    }
    setTempBudgetForPrint(budget);
    setShowPrintModal(true);
  };

  // 3. Enviar por WhatsApp
  const handleSendWhatsApp = () => {
    const budget = buildBudgetData();
    if (budget.items.length === 0) {
      alert('Por favor ingresa al menos un tratamiento.');
      return;
    }
    
    // Save to chart first if not saved
    onSaveBudget(budget, false, true);

    const phone = currentPatient.whatsapp || currentPatient.phone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const itemsList = budget.items
      .map(i => `• ${i.toothNumber ? `[Pieza ${i.toothNumber}] ` : ''}${i.description} (${i.quantity}x) - $${i.patientCopay.toLocaleString('es-CL')}`)
      .join('\n');

    const message = `🦷 *PRESUPUESTO ODONTOLÓGICO - CIMA DENTAL*\n\n` +
      `Estimado(a) *${budget.patientName}*,\n` +
      `Le compartimos el presupuesto para su plan de tratamiento:\n\n` +
      `📋 *N° Presupuesto:* ${budget.budgetNumber}\n` +
      `👨‍⚕️ *Doctor(a):* ${budget.doctorName}\n` +
      `📅 *Fecha:* ${budget.createdAt}\n\n` +
      `📝 *Tratamientos y Piezas Dentales:*\n${itemsList}\n\n` +
      `💵 *Subtotal:* $${budget.subtotal.toLocaleString('es-CL')}\n` +
      (budget.discountTotal > 0 ? `🏷️ *Descuento:* -$${budget.discountTotal.toLocaleString('es-CL')}\n` : '') +
      `💰 *TOTAL A PAGAR:* $${budget.totalPatient.toLocaleString('es-CL')}\n\n` +
      (budget.notes ? `📌 *Observaciones:* ${budget.notes}\n\n` : '') +
      `Quedamos a su disposición para resolver dudas o agendar sus horas. ¡Saludos cordiales!`;

    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
        <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[94vh] rounded-2xl shadow-2xl p-4 sm:p-6 flex flex-col gap-4 overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-100 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-teal-400" />
                Presupuesto Dental & Plan de Tratamiento
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Escribe el tratamiento, selecciona la pieza dental y define el precio manual.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveToPatientChart} className="flex flex-col gap-4 overflow-y-auto flex-1 pr-1">
            
            {/* Patient, Doctor & Branch Selector */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Paciente Destino (Ficha Clínica) *
                  </label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full bg-slate-900 border border-teal-500/40 rounded-lg p-2 text-xs text-teal-200 focus:outline-none focus:border-teal-400 font-bold"
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} — RUT: {p.documentId}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Profesional Tratante *
                  </label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.specialty})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Sucursal Clínica
                  </label>
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Informational banner reassuring the user */}
              <div className="flex items-center gap-2 text-[11px] text-teal-400/90 bg-teal-950/40 px-2.5 py-1 rounded-lg border border-teal-500/20">
                <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>
                  Este presupuesto se asociará a la ficha de <strong>{currentPatient.firstName} {currentPatient.lastName}</strong>. Puedes tener múltiples presupuestos acumulados para el mismo paciente sin duplicar su registro.
                </span>
              </div>
            </div>

            {/* Treatments List with FDI Tooth Picker, Manual Description, Quantity & Price */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-700/80 p-4 sm:p-5 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-wide">
                      Tratamientos & Piezas Dentales
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Ingresa el número de pieza dental, el tratamiento y el precio correspondiente
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-slate-800 text-teal-300 font-mono text-xs font-bold rounded-lg border border-slate-700 w-fit">
                  {rows.length} {rows.length === 1 ? 'procedimiento' : 'procedimientos'}
                </span>
              </div>

              {/* Rows List */}
              <div className="flex flex-col gap-4">
                {rows.map((row, idx) => (
                  <div 
                    key={row.id} 
                    className="p-4 bg-slate-950/90 rounded-xl border border-slate-700/70 hover:border-slate-600 transition-all shadow-md grid grid-cols-12 gap-3.5 items-end"
                  >
                    {/* Index Badge */}
                    <div className="col-span-12 sm:col-span-1 flex items-center justify-between sm:justify-start pb-1 sm:pb-0">
                      <span className="font-mono font-bold text-teal-400 bg-teal-950/60 px-2.5 py-1 rounded-md border border-teal-500/30 text-xs">
                        #{idx + 1}
                      </span>
                      <span className="sm:hidden text-xs text-slate-400 font-medium">Tratamiento dental</span>
                    </div>

                    {/* Tooth Number FDI */}
                    <div className="col-span-12 sm:col-span-3">
                      <label className="text-xs font-semibold text-slate-200 block mb-1.5 flex items-center gap-1">
                        <span>Pieza Dental (N°):</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          placeholder="Ej: 16"
                          value={row.toothNumber === '' ? '' : row.toothNumber}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : parseInt(e.target.value);
                            handleUpdateRow(row.id, { toothNumber: isNaN(val as number) ? '' : val });
                          }}
                          className="styled-input text-center font-bold text-slate-900 placeholder:text-slate-400 !h-11 !w-20 shrink-0"
                          title="Escribe directamente el número de la pieza dental (Ej: 16, 21, 38, 46)"
                        />
                        <select
                          value={row.toothNumber ?? ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : parseInt(e.target.value);
                            handleUpdateRow(row.id, { toothNumber: isNaN(val as number) ? '' : val });
                          }}
                          className="styled-input !h-11 text-xs text-slate-800 !py-0 !px-2 flex-1 min-w-0"
                        >
                          {FDI_TOOTH_OPTIONS.map((opt, optIdx) => (
                            <option key={optIdx} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Manual Treatment Name */}
                    <div className="col-span-12 sm:col-span-4">
                      <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                        Nombre del Tratamiento *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Obturación composite, Exodoncia, Limpieza..."
                        value={row.name}
                        onChange={(e) => handleUpdateRow(row.id, { name: e.target.value })}
                        className="styled-input text-slate-900 placeholder:text-slate-400 font-medium !h-11"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="col-span-4 sm:col-span-1">
                      <label className="text-xs font-semibold text-slate-200 block mb-1.5">Cant:</label>
                      <input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) => handleUpdateRow(row.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="styled-input text-center text-slate-900 font-bold !h-11 !px-1"
                      />
                    </div>

                    {/* Manual Price ($ CLP) */}
                    <div className="col-span-6 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-200 block mb-1.5">Precio ($ CLP) *</label>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        placeholder="0"
                        value={row.price === 0 && row.name === '' ? '' : row.price}
                        onChange={(e) => handleUpdateRow(row.id, { price: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="styled-input text-slate-900 font-mono font-bold text-sm !h-11 placeholder:text-slate-400"
                      />
                    </div>

                    {/* Remove Action */}
                    <div className="col-span-2 sm:col-span-1 flex justify-center pb-1">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.id)}
                        className="h-11 w-11 flex items-center justify-center text-slate-400 hover:text-red-400 bg-slate-900 hover:bg-red-950/40 border border-slate-800 hover:border-red-500/40 rounded-lg transition-all"
                        title="Eliminar este tratamiento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>

              {/* Prominent Button below rows to add a new treatment to the same budget */}
              <div className="mt-4 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleAddEmptyRow}
                  className="w-full py-3.5 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 hover:text-white border-2 border-dashed border-teal-500/50 hover:border-teal-400 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm group cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-teal-500/20 group-hover:bg-teal-500 flex items-center justify-center text-teal-300 group-hover:text-white transition-colors">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span>+ Agregar Nuevo Tratamiento a este Presupuesto</span>
                </button>
              </div>
            </div>

            {/* Totals & Discount */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-300 whitespace-nowrap">
                    Descuento Global (%):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                    className="w-20 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-amber-300 font-mono text-center font-bold focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-xs text-slate-400">%</span>
                </div>
                <div className="text-xs text-slate-400 space-y-0.5">
                  <div>Subtotal: <strong className="text-slate-300 font-mono">${subtotal.toLocaleString('es-CL')}</strong></div>
                  {discountAmount > 0 && (
                    <div className="text-amber-400">Descuento ({discountPercent}%): <strong className="font-mono">-${discountAmount.toLocaleString('es-CL')}</strong></div>
                  )}
                </div>
              </div>

              <div className="p-3.5 bg-teal-950/60 border border-teal-500/40 rounded-xl text-right flex flex-col items-end justify-center">
                <span className="text-xs text-teal-300 font-bold uppercase tracking-wider">Total a Pagar Paciente:</span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-teal-300 mt-0.5">
                  ${totalFinal.toLocaleString('es-CL')}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Condiciones Comerciales y Observaciones
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                placeholder="Presupuesto válido por 30 días..."
              />
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              
              <div className="flex flex-wrap items-center gap-2">
                {/* PDF Download CTA */}
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Printer className="w-4 h-4 text-teal-400" />
                  <span>Descargar / Imprimir PDF</span>
                </button>

                {/* WhatsApp CTA */}
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="px-3.5 py-2 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-700/20 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Enviar por WhatsApp</span>
                </button>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all"
                >
                  Cancelar
                </button>
                
                {/* Main Action: Guardar y Agregar a la Ficha del Paciente */}
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-600/30 flex items-center gap-2 transition-all"
                >
                  <FolderPlus className="w-4 h-4" />
                  Guardar & Agregar a Ficha del Paciente
                </button>
              </div>

            </div>
          </form>

        </div>
      </div>

      {/* Standalone Print Modal */}
      {showPrintModal && tempBudgetForPrint && (
        <BudgetPrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          budget={tempBudgetForPrint}
          patient={currentPatient}
          doctor={currentDoctor}
          branch={currentBranch}
          onSendWhatsApp={() => {
            setShowPrintModal(false);
            handleSendWhatsApp();
          }}
        />
      )}
    </>
  );
};
