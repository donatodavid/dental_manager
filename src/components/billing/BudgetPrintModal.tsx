import React, { useState, useEffect } from 'react';
import { TreatmentBudget, Patient, ProfessionalDoctor, Branch, ClinicSettings } from '../../types/clinical';
import { X, Printer, Download, MessageSquare, Share2, CheckCircle2, DollarSign, Calendar, User, Phone, MapPin, Building2, Trash2, Loader2, Image as ImageIcon, Pencil, AlertTriangle } from 'lucide-react';
import { downloadBudgetPdf, downloadBudgetPng, shareBudgetViaWhatsAppPdf } from '../../utils/budgetExporter';
import { ClinicalDatabase } from '../../services/db';

interface BudgetPrintModalProps {
  budget: TreatmentBudget | null;
  patient?: Patient;
  doctor?: ProfessionalDoctor;
  branch?: Branch;
  isOpen: boolean;
  onClose: () => void;
  onSendWhatsApp?: (budget: TreatmentBudget) => void;
  onDeleteBudget?: (budgetId: string) => void;
  onEditBudget?: (budget: TreatmentBudget) => void;
}

export const BudgetPrintModal: React.FC<BudgetPrintModalProps> = ({
  budget,
  patient,
  doctor,
  branch,
  isOpen,
  onClose,
  onSendWhatsApp,
  onDeleteBudget,
  onEditBudget
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings>(() => ClinicalDatabase.getClinicSettings());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setClinicSettings(ClinicalDatabase.getClinicSettings());
    }
  }, [isOpen]);

  if (!isOpen || !budget) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      await downloadBudgetPdf(budget, patient, doctor, clinicSettings);
    } catch (err) {
      console.error('Error downloading budget PDF:', err);
      // Fallback to print dialog
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPng = async () => {
    try {
      setIsDownloading(true);
      await downloadBudgetPng(budget, patient, doctor, clinicSettings);
    } catch (err) {
      console.error('Error downloading budget PNG:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`¿Estás seguro de eliminar el presupuesto ${budget.budgetNumber}? Esta acción no se puede deshacer.`)) {
      onDeleteBudget?.(budget.id);
      onClose();
    }
  };

  const [isSharingWa, setIsSharingWa] = useState(false);
  const [waToast, setWaToast] = useState<string | null>(null);

  const handleShareWhatsApp = async () => {
    if (onSendWhatsApp) {
      onSendWhatsApp(budget);
      return;
    }

    try {
      setIsSharingWa(true);
      const res = await shareBudgetViaWhatsAppPdf(budget, patient, doctor, clinicSettings);
      if (res.message) {
        setWaToast(res.message);
        setTimeout(() => setWaToast(null), 6500);
      }
    } catch (err) {
      console.error('Error sharing budget PDF:', err);
    } finally {
      setIsSharingWa(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-white text-slate-900 border border-slate-300 w-full max-w-4xl max-h-[96vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Top Bar (Hidden in print) */}
        <div className="print:hidden bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-teal-600/30 text-teal-400 rounded-lg">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-100">
                Presupuesto Odontológico Oficial {budget.budgetNumber}
              </h3>
              <p className="text-xs text-slate-400">
                {clinicSettings.name} — {clinicSettings.city}. Emisión, descarga en PDF e impresión oficial.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* WhatsApp CTA */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              disabled={isSharingWa}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              title="Enviar documento PDF del presupuesto por WhatsApp"
            >
              {isSharingWa ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              <span className="hidden sm:inline">WhatsApp (PDF)</span>
            </button>

            {/* Direct Download PDF CTA (Exact match to platform generation) */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition-all cursor-pointer"
              title="Descargar Presupuesto Oficial en PDF con formato exacto"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Descargar Presupuesto (PDF)</span>
            </button>

            {/* Direct Download PNG CTA */}
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isDownloading}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer"
              title="Descargar Presupuesto como Imagen (PNG)"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* Print CTA */}
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer"
              title="Imprimir documento en impresora"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Edit Budget CTA */}
            {onEditBudget && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditBudget(budget);
                }}
                className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Editar Presupuesto"
              >
                <Pencil className="w-4 h-4" />
                <span className="hidden sm:inline">Editar</span>
              </button>
            )}

            {/* Delete Budget CTA */}
            {onDeleteBudget && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Eliminar Presupuesto"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Eliminar</span>
              </button>
            )}

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* WhatsApp Image Notification Toast */}
        {waToast && (
          <div className="bg-emerald-900 text-emerald-50 px-4 py-3 border-b border-emerald-700 flex items-center justify-between gap-3 text-xs sm:text-sm animate-in slide-in-from-top-2 print:hidden">
            <div className="flex items-center gap-2.5">
              <span className="p-1 bg-emerald-500/20 text-emerald-300 rounded-lg font-bold text-base">📸</span>
              <span className="font-medium">{waToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setWaToast(null)}
              className="p-1 hover:bg-emerald-800 text-emerald-300 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Printable Document Body */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white text-slate-800 text-xs font-sans print:p-0 print:m-0">
          
          {/* Header Banner */}
          <div className="flex items-start justify-between border-b-2 border-teal-700 pb-5 mb-6">
            <div className="flex items-start gap-4">
              <img 
                src={clinicSettings.logoUrl || "/pagnina.png"} 
                alt={clinicSettings.name || "Consulta Dental"} 
                className="h-16 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-teal-900 tracking-tight uppercase">
                  {clinicSettings.name || "DAARON CONSULTA DENTAL"}
                </h1>
                <p className="text-[11px] text-slate-500 font-semibold tracking-wider uppercase">
                  Centro Odontológico & Especialidades Clínicas
                </p>
                <div className="text-[11px] text-slate-600 mt-1.5 space-y-0.5">
                  <p>{clinicSettings.address}, {clinicSettings.city}</p>
                  <p>Tel: {clinicSettings.phone || "+56 9 8408 5590"} | Horario: {clinicSettings.hours}</p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block bg-teal-50/80 border border-teal-200 rounded-xl p-3 text-right">
                <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider block">
                  PRESUPUESTO ODONTOLÓGICO
                </span>
                <span className="text-lg sm:text-xl font-mono font-black text-slate-900 block mt-0.5">
                  {budget.budgetNumber}
                </span>
                <span className="text-[11px] text-slate-600 block mt-1">
                  <strong>Emisión:</strong> {budget.createdAt}
                </span>
                <span className="text-[11px] text-slate-600 block">
                  <strong>Validez:</strong> 30 días ({budget.validUntil})
                </span>
              </div>
            </div>
          </div>

          {/* Patient and Professional Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
            <div>
              <h4 className="font-bold text-teal-800 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <User className="w-3.5 h-3.5 text-teal-600" />
                Datos del Paciente
              </h4>
              <div className="space-y-1 text-slate-700 text-xs">
                <p><strong>Nombre:</strong> {budget.patientName}</p>
                <p><strong>RUT / DNI:</strong> {budget.patientRut || patient?.documentId || 'No registrado'}</p>
                <p><strong>Teléfono / WhatsApp:</strong> {budget.patientPhone || patient?.phone || patient?.whatsapp || 'No registrado'}</p>
                <p><strong>Previsión / Seguro:</strong> {patient?.insuranceProvider || 'Particular'}</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-teal-800 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                Profesional & Sucursal
              </h4>
              <div className="space-y-1 text-slate-700 text-xs">
                <p><strong>Odontólogo:</strong> {budget.doctorName}</p>
                <p><strong>Especialidad:</strong> {doctor?.specialty || 'Odontología General'}</p>
                <p><strong>Reg. Profesional:</strong> {doctor?.licenseNumber || 'REG-MED-84920'}</p>
                <p><strong>Sucursal de Atención:</strong> {branch?.name || 'Sucursal Providencia'}</p>
              </div>
            </div>
          </div>

          {/* Treatments Table */}
          <div className="mb-6">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
              Plan de Tratamiento & Detalle por Pieza Dental
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-teal-700 text-white text-[11px] uppercase font-bold tracking-wider">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 w-28 text-center">Pieza Dental</th>
                    <th className="py-2.5 px-3">Tratamiento / Procedimiento</th>
                    <th className="py-2.5 px-3 w-16 text-center">Cant</th>
                    <th className="py-2.5 px-3 w-28 text-right">Precio Unit.</th>
                    <th className="py-2.5 px-3 w-28 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800 text-xs">
                  {budget.items.map((item, idx) => (
                    <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500 font-bold">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-teal-700">
                        {item.toothNumber && item.toothNumber > 0 ? (
                          <span className="inline-block bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded text-[11px]">
                            Pieza {item.toothNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">General</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {item.description}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        {item.quantity || 1}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        ${(item?.unitPrice ?? 0).toLocaleString('es-CL')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        ${(item?.patientCopay ?? 0).toLocaleString('es-CL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Totals */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div className="flex-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[11px] text-slate-600">
              <strong className="text-slate-900 block mb-1">Condiciones & Observaciones:</strong>
              <p>{budget.notes || 'Presupuesto válido por 30 días a partir de su fecha de emisión. Incluye controles de seguimiento.'}</p>
            </div>

            <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Tratamientos:</span>
                <span className="font-mono font-semibold">${(budget?.subtotal ?? 0).toLocaleString('es-CL')}</span>
              </div>
              {(budget?.discountTotal ?? 0) > 0 && (
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>Descuento Aplicado:</span>
                  <span className="font-mono">-${(budget?.discountTotal ?? 0).toLocaleString('es-CL')}</span>
                </div>
              )}
              <div className="pt-2 border-t-2 border-teal-600 flex justify-between items-baseline text-slate-900">
                <span className="font-black uppercase text-sm">TOTAL A PAGAR:</span>
                <span className="font-mono font-black text-xl text-teal-800">
                  ${(budget?.totalPatient ?? 0).toLocaleString('es-CL')}
                </span>
              </div>
            </div>
          </div>

          {/* Signature Boxes */}
          <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-300 text-center">
            <div>
              <div className="border-b border-dashed border-slate-400 h-14 mb-2 mx-8" />
              <p className="font-bold text-slate-900">{budget.doctorName}</p>
              <p className="text-[10px] text-slate-500">Firma & Timbre Odontólogo Tratante</p>
            </div>
            <div>
              <div className="border-b border-dashed border-slate-400 h-14 mb-2 mx-8" />
              <p className="font-bold text-slate-900">{budget.patientName}</p>
              <p className="text-[10px] text-slate-500">Firma de Aceptación Paciente / Tutor</p>
            </div>
          </div>

        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 flex flex-col gap-4 text-slate-100">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-xs">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base text-white">
                  ¿Eliminar presupuesto?
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  ¿Estás seguro de que deseas eliminar el presupuesto <strong className="text-white font-mono">{budget.budgetNumber}</strong>?
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700">
                    ${budget.totalPatient.toLocaleString('es-CL')}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    ({budget.items.length} tratamientos)
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-rose-950/40 border border-rose-900/50 p-3.5 rounded-2xl text-xs text-rose-300 leading-relaxed">
              ⚠️ <strong>Advertencia:</strong> Esta acción no se puede deshacer. Se removerá del historial contable y clínico.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteBudget?.(budget.id);
                  setShowDeleteConfirm(false);
                  onClose();
                }}
                className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
