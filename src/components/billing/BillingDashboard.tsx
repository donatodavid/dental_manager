import React, { useState } from 'react';
import { 
  TreatmentBudget, 
  PaymentTransaction, 
  CashRegisterSession, 
  Patient, 
  ProfessionalDoctor, 
  Branch, 
  TreatmentTariffItem,
  UserRole
} from '../../types/clinical';
import { BudgetBuilderModal } from './BudgetBuilderModal';
import { PaymentCheckoutModal } from './PaymentCheckoutModal';
import { CashRegisterModal } from './CashRegisterModal';
import { BudgetPrintModal } from './BudgetPrintModal';
import { 
  DollarSign, 
  CreditCard, 
  Landmark, 
  Plus, 
  Receipt, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Printer, 
  ArrowUpRight, 
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
  MessageSquare,
  FileText
} from 'lucide-react';

interface BillingDashboardProps {
  budgets: TreatmentBudget[];
  payments: PaymentTransaction[];
  cashSession: CashRegisterSession;
  patients: Patient[];
  doctors: ProfessionalDoctor[];
  branches: Branch[];
  tariffs: TreatmentTariffItem[];
  onSaveBudget: (budget: TreatmentBudget) => void;
  onProcessPayment: (payment: PaymentTransaction) => void;
  onUpdateCashSession: (session: CashRegisterSession) => void;
  activeRole: UserRole;
  currentBranchId: string;
}

export const BillingDashboard: React.FC<BillingDashboardProps> = ({
  budgets,
  payments,
  cashSession,
  patients,
  doctors,
  branches,
  tariffs,
  onSaveBudget,
  onProcessPayment,
  onUpdateCashSession,
  activeRole,
  currentBranchId
}) => {
  const [activeTab, setActiveTab] = useState<'BUDGETS' | 'PAYMENTS'>('BUDGETS');
  const [searchTerm, setSearchTerm] = useState('');
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBudgetForPayment, setSelectedBudgetForPayment] = useState<TreatmentBudget | undefined>(undefined);
  const [selectedPatientForPayment, setSelectedPatientForPayment] = useState<Patient | undefined>(undefined);
  const [showCashRegisterModal, setShowCashRegisterModal] = useState(false);

  // Print & WhatsApp Modals
  const [selectedBudgetForPrint, setSelectedBudgetForPrint] = useState<TreatmentBudget | null>(null);

  // Filter budgets
  const filteredBudgets = budgets.filter(b => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      b.budgetNumber.toLowerCase().includes(term) ||
      b.patientName.toLowerCase().includes(term) ||
      b.doctorName.toLowerCase().includes(term);
    const matchesBranch = currentBranchId === 'ALL' || b.branchId === currentBranchId;
    return matchesSearch && matchesBranch;
  });

  // Filter payments
  const filteredPayments = payments.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      p.receiptNumber.toLowerCase().includes(term) ||
      p.patientName.toLowerCase().includes(term) ||
      p.concept.toLowerCase().includes(term);
    const matchesBranch = currentBranchId === 'ALL' || p.branchId === currentBranchId;
    return matchesSearch && matchesBranch;
  });

  // Key KPI metrics
  const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalOutstanding = budgets.reduce((acc, b) => acc + b.balanceDue, 0);
  const totalBudgetsValue = budgets.reduce((acc, b) => acc + b.totalPatient, 0);

  const activeBranch = branches.find(b => b.id === currentBranchId) || branches[0];

  const handleOpenPaymentForBudget = (budget: TreatmentBudget) => {
    const patientObj = patients.find(p => p.id === budget.patientId) || patients[0];
    setSelectedBudgetForPayment(budget);
    setSelectedPatientForPayment(patientObj);
    setShowPaymentModal(true);
  };

  const handleOpenQuickPayment = () => {
    setSelectedBudgetForPayment(undefined);
    setSelectedPatientForPayment(patients[0]);
    setShowPaymentModal(true);
  };

  // WhatsApp quick share handler
  const handleSendWhatsApp = (budget: TreatmentBudget) => {
    const patient = patients.find(p => p.id === budget.patientId);
    const phone = patient?.whatsapp || patient?.phone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const itemsList = budget.items
      .map(i => `• ${i.toothNumber ? `[Pieza ${i.toothNumber}] ` : ''}${i.description} (${i.quantity}x) - $${i.patientCopay.toLocaleString('es-CL')}`)
      .join('\n');

    const message = `🦷 *PRESUPUESTO ODONTOLÓGICO - CIMA DENTAL*\n\n` +
      `Estimado(a) *${budget.patientName}*,\n` +
      `Le adjuntamos el detalle de su presupuesto dental:\n\n` +
      `📋 *N° Presupuesto:* ${budget.budgetNumber}\n` +
      `👨‍⚕️ *Doctor(a):* ${budget.doctorName}\n` +
      `📅 *Fecha:* ${budget.createdAt}\n\n` +
      `📝 *Tratamientos Presupuestados:*\n${itemsList}\n\n` +
      `💵 *Subtotal:* $${budget.subtotal.toLocaleString('es-CL')}\n` +
      (budget.discountTotal > 0 ? `🏷️ *Descuento:* -$${budget.discountTotal.toLocaleString('es-CL')}\n` : '') +
      `💰 *TOTAL A PAGAR:* $${budget.totalPatient.toLocaleString('es-CL')}\n\n` +
      (budget.notes ? `📌 *Condiciones:* ${budget.notes}\n\n` : '') +
      `Quedamos a su disposición para coordinar sus próximas horas. ¡Muchas gracias!`;

    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top Financial KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Ingresos Totales Cobrados */}
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Ingresos Recaudados (Mes)</span>
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-emerald-300">
              ${totalRevenue.toLocaleString('es-CL')}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {payments.length} transacciones registradas
            </span>
          </div>
        </div>

        {/* KPI 2: Saldos Pendientes de Cobro */}
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Saldos por Cobrar (Cuentas)</span>
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-amber-300">
              ${totalOutstanding.toLocaleString('es-CL')}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              En tratamientos activos
            </span>
          </div>
        </div>

        {/* KPI 3: Presupuestos Aceptados */}
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Presupuestos Aprobados</span>
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-blue-300">
              ${totalBudgetsValue.toLocaleString('es-CL')}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {budgets.length} planes emitidos
            </span>
          </div>
        </div>

        {/* KPI 4: Arqueo Caja Activa */}
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Arqueo de Caja Diaria</span>
            <button
              type="button"
              onClick={() => setShowCashRegisterModal(true)}
              className="p-1.5 bg-slate-700 hover:bg-teal-600/30 text-teal-400 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Ver Caja</span>
            </button>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-teal-300">
              ${cashSession.expectedCashTotal.toLocaleString('es-CL')}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Estado: <strong className="text-emerald-400">{cashSession.status}</strong>
            </span>
          </div>
        </div>

      </div>

      {/* Main Container: Controls & Tabs */}
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 shadow-xl overflow-hidden flex flex-col">
        
        {/* Sub-Header Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-4">
          
          {/* Tabs */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('BUDGETS')}
              className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                activeTab === 'BUDGETS' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Presupuestos & Planes ({budgets.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PAYMENTS')}
              className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                activeTab === 'PAYMENTS' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Cobros & Comprobantes ({payments.length})</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por N° presupuesto, boleta o paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Action CTAs */}
          {activeRole !== 'PATIENT' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenQuickPayment}
                className="py-2 px-3 bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <CreditCard className="w-4 h-4 text-teal-400" />
                <span>Cobro Rápido</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBudgetModal(true)}
                className="py-2 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-teal-600/30 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Presupuesto</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Presupuestos Odontológicos */}
        {activeTab === 'BUDGETS' && (
          <div className="p-4 sm:p-5 flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBudgets.map(b => (
                <div key={b.id} className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-md">
                  
                  {/* Budget Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-teal-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {b.budgetNumber}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {b.status}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-100 mt-1.5">{b.patientName}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Tratante: {b.doctorName}</p>
                      </div>

                      <span className="text-xs text-slate-500 font-mono">{b.createdAt}</span>
                    </div>

                    {/* Items List with Pieces */}
                    <div className="my-3 flex flex-col gap-1.5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Tratamientos & Piezas ({b.items.length}):
                      </span>
                      <div className="flex flex-col gap-1.5 text-xs max-h-48 overflow-y-auto pr-1">
                        {b.items.map((item, idx) => (
                          <div key={item.id || idx} className="flex justify-between items-center bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              {item.toothNumber && item.toothNumber > 0 ? (
                                <span className="shrink-0 bg-teal-950 text-teal-300 border border-teal-500/40 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded">
                                  Pz. {item.toothNumber}
                                </span>
                              ) : (
                                <span className="shrink-0 bg-slate-800 text-slate-400 text-[10px] px-1.5 py-0.5 rounded">
                                  General
                                </span>
                              )}
                              <span className="text-slate-300 truncate font-medium">
                                {item.description}
                              </span>
                            </div>
                            <span className="font-mono font-semibold text-slate-200 shrink-0">
                              ${item.patientCopay.toLocaleString('es-CL')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary and Action CTAs (Download PDF, WhatsApp, Payment) */}
                  <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">Total / Saldo:</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-bold font-mono text-teal-300">
                          ${b.totalPatient.toLocaleString('es-CL')}
                        </span>
                        {b.balanceDue > 0 && (
                          <span className="text-xs font-mono text-amber-400">
                            (Saldo: ${b.balanceDue.toLocaleString('es-CL')})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* WhatsApp Share */}
                      <button
                        type="button"
                        onClick={() => handleSendWhatsApp(b)}
                        className="p-2 bg-emerald-950/70 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-700/50 rounded-xl text-xs transition-all"
                        title="Enviar por WhatsApp al Paciente"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      {/* Download / Print PDF */}
                      <button
                        type="button"
                        onClick={() => setSelectedBudgetForPrint(b)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs transition-all"
                        title="Descargar / Imprimir Presupuesto (PDF)"
                      >
                        <Printer className="w-4 h-4 text-teal-400" />
                      </button>

                      {/* Charge payment if balance due */}
                      {b.balanceDue > 0 && activeRole !== 'PATIENT' && (
                        <button
                          type="button"
                          onClick={() => handleOpenPaymentForBudget(b)}
                          className="py-1.5 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/20"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Cobrar</span>
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>

            {filteredBudgets.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs">
                No se encontraron presupuestos con los filtros aplicados.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Historial de Cobros y Comprobantes */}
        {activeTab === 'PAYMENTS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">N° Comprobante</th>
                  <th className="p-4">Paciente</th>
                  <th className="p-4">Fecha & Hora</th>
                  <th className="p-4">Concepto</th>
                  <th className="p-4">Medio de Pago</th>
                  <th className="p-4 text-right">Monto (CLP)</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredPayments.map(pay => (
                  <tr key={pay.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-teal-400">
                      {pay.receiptNumber}
                    </td>
                    <td className="p-4 font-semibold text-slate-200">
                      {pay.patientName}
                    </td>
                    <td className="p-4 text-slate-400 font-mono">
                      {pay.date} {pay.time}
                    </td>
                    <td className="p-4 max-w-xs truncate text-slate-300">
                      {pay.concept}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700 text-[11px] font-mono">
                        {pay.paymentMethod}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-teal-300 text-sm">
                      ${pay.amount.toLocaleString('es-CL')}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                        title="Reimprimir Comprobante"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredPayments.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs">
                No hay transacciones registradas para este criterio.
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODAL: Creador de Presupuestos */}
      <BudgetBuilderModal
        isOpen={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        onSaveBudget={onSaveBudget}
        patients={patients}
        doctors={doctors}
        branches={branches}
        tariffs={tariffs}
      />

      {/* MODAL: Checkout / Cobro */}
      {showPaymentModal && selectedPatientForPayment && (
        <PaymentCheckoutModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          budget={selectedBudgetForPayment}
          patient={selectedPatientForPayment}
          doctors={doctors}
          branches={branches}
          onProcessPayment={onProcessPayment}
        />
      )}

      {/* MODAL: Arqueo Caja */}
      <CashRegisterModal
        isOpen={showCashRegisterModal}
        onClose={() => setShowCashRegisterModal(false)}
        session={cashSession}
        payments={payments}
        branch={activeBranch}
        onUpdateSession={onUpdateCashSession}
      />

      {/* MODAL: Vista de Impresión / Descarga PDF de Presupuesto */}
      {selectedBudgetForPrint && (
        <BudgetPrintModal
          isOpen={Boolean(selectedBudgetForPrint)}
          onClose={() => setSelectedBudgetForPrint(null)}
          budget={selectedBudgetForPrint}
          patient={patients.find(p => p.id === selectedBudgetForPrint.patientId)}
          doctor={doctors.find(d => d.id === selectedBudgetForPrint.doctorId)}
          branch={branches.find(b => b.id === selectedBudgetForPrint.branchId)}
          onSendWhatsApp={() => {
            const b = selectedBudgetForPrint;
            setSelectedBudgetForPrint(null);
            handleSendWhatsApp(b);
          }}
        />
      )}

    </div>
  );
};
