import React from 'react';
import { TreatmentBudget, Patient, ProfessionalDoctor, Branch } from '../../types/clinical';
import { X, Printer, Download, MessageSquare, Share2, CheckCircle2, DollarSign, Calendar, User, Phone, MapPin, Building2 } from 'lucide-react';

interface BudgetPrintModalProps {
  budget: TreatmentBudget | null;
  patient?: Patient;
  doctor?: ProfessionalDoctor;
  branch?: Branch;
  isOpen: boolean;
  onClose: () => void;
  onSendWhatsApp?: (budget: TreatmentBudget) => void;
}

export const BudgetPrintModal: React.FC<BudgetPrintModalProps> = ({
  budget,
  patient,
  doctor,
  branch,
  isOpen,
  onClose,
  onSendWhatsApp
}) => {
  if (!isOpen || !budget) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (onSendWhatsApp) {
      onSendWhatsApp(budget);
    } else {
      // Build WhatsApp message
      const phone = patient?.phone || patient?.whatsapp || '';
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      
      const itemsList = budget.items
        .map(i => `• ${i.toothNumber ? `[Pieza ${i.toothNumber}] ` : ''}${i.description} (${i.quantity}x) - $${i.patientCopay.toLocaleString('es-CL')}`)
        .join('\n');

      const message = `🦷 *PRESUPUESTO ODONTOLÓGICO - CIMA DENTAL*\n\n` +
        `Estimado(a) *${budget.patientName}*,\n` +
        `Adjuntamos el detalle de su plan de tratamiento y presupuesto:\n\n` +
        `📋 *N° Presupuesto:* ${budget.budgetNumber}\n` +
        `👨‍⚕️ *Profesional:* ${budget.doctorName}\n` +
        `📅 *Fecha:* ${budget.createdAt}\n\n` +
        `📝 *Tratamientos Presupuestados:*\n${itemsList}\n\n` +
        `💵 *Subtotal:* $${budget.subtotal.toLocaleString('es-CL')}\n` +
        (budget.discountTotal > 0 ? `🏷️ *Descuento:* -$${budget.discountTotal.toLocaleString('es-CL')}\n` : '') +
        `💰 *TOTAL A PAGAR:* $${budget.totalPatient.toLocaleString('es-CL')}\n\n` +
        (budget.notes ? `📌 *Condiciones:* ${budget.notes}\n\n` : '') +
        `Quedamos atentos para coordinar sus citas. ¡Muchas gracias por su confianza!`;

      const url = cleanPhone 
        ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      
      window.open(url, '_blank');
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
                Vista de impresión y descarga lista para entregar al paciente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* WhatsApp CTA */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Enviar por WhatsApp</span>
            </button>

            {/* Print / Download PDF CTA */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Descargar / Imprimir PDF</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white text-slate-800 text-xs font-sans print:p-0 print:m-0">
          
          {/* Header Banner */}
          <div className="flex items-start justify-between border-b-2 border-teal-600 pb-5 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-black text-lg">
                  C
                </span>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-teal-800 tracking-tight">
                    CIMA DENTAL & MEDICAL
                  </h1>
                  <p className="text-[11px] text-slate-500 font-semibold tracking-wider uppercase">
                    Centro Odontológico & Especialidades Clínicas
                  </p>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
                <p>{branch?.address || 'Av. Providencia 1208, Piso 5'}, {branch?.city || 'Santiago'}</p>
                <p>Tel: {branch?.phone || '+56 2 2345 6789'} | Email: contacto@cimacloud.dental</p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block bg-teal-50 border border-teal-200 rounded-xl p-3 text-right">
                <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider block">
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
                <p><strong>RUT / DNI:</strong> {patient?.documentId || 'No registrado'}</p>
                <p><strong>Teléfono / WhatsApp:</strong> {patient?.phone || patient?.whatsapp || 'No registrado'}</p>
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
                        ${item.unitPrice.toLocaleString('es-CL')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        ${item.patientCopay.toLocaleString('es-CL')}
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
                <span className="font-mono font-semibold">${budget.subtotal.toLocaleString('es-CL')}</span>
              </div>
              {budget.discountTotal > 0 && (
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>Descuento Aplicado:</span>
                  <span className="font-mono">-${budget.discountTotal.toLocaleString('es-CL')}</span>
                </div>
              )}
              <div className="pt-2 border-t-2 border-teal-600 flex justify-between items-baseline text-slate-900">
                <span className="font-black uppercase text-sm">TOTAL A PAGAR:</span>
                <span className="font-mono font-black text-xl text-teal-800">
                  ${budget.totalPatient.toLocaleString('es-CL')}
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
    </div>
  );
};
