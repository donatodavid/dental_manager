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
  FileText,
  Trash2,
  RotateCcw,
  Download,
  AlertTriangle,
  Loader2,
  X,
  Phone,
  Pencil
} from 'lucide-react';
import { downloadBudgetPdf, shareBudgetViaWhatsAppPdf } from '../../utils/budgetExporter';
import { ClinicalDatabase } from '../../services/db';

interface BillingDashboardProps {
  budgets: TreatmentBudget[];
  payments: PaymentTransaction[];
  cashSession: CashRegisterSession;
  patients: Patient[];
  doctors: ProfessionalDoctor[];
  branches: Branch[];
  tariffs: TreatmentTariffItem[];
  onSaveBudget: (budget: TreatmentBudget) => void;
  onDeleteBudget?: (budgetId: string) => void;
  onProcessPayment: (payment: PaymentTransaction) => void;
  onUpdateCashSession: (session: CashRegisterSession) => void;
  onResetMonthlyEarnings?: () => void;
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
  onDeleteBudget,
  onProcessPayment,
  onUpdateCashSession,
  onResetMonthlyEarnings,
  activeRole,
  currentBranchId
}) => {
  const [activeTab, setActiveTab] = useState<'BUDGETS' | 'PAYMENTS'>('BUDGETS');
  const [searchTerm, setSearchTerm] = useState('');
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<TreatmentBudget | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<TreatmentBudget | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBudgetForPayment, setSelectedBudgetForPayment] = useState<TreatmentBudget | undefined>(undefined);
  const [selectedPatientForPayment, setSelectedPatientForPayment] = useState<Patient | undefined>(undefined);
  const [showCashRegisterModal, setShowCashRegisterModal] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [downloadingBudgetId, setDownloadingBudgetId] = useState<string | null>(null);

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

  // Direct download budget handler
  const handleDirectDownloadBudget = async (budget: TreatmentBudget) => {
    try {
      setDownloadingBudgetId(budget.id);
      const patientObj = patients.find(p => p.id === budget.patientId);
      const doctorObj = doctors.find(d => d.id === budget.doctorId);
      await downloadBudgetPdf(budget, patientObj, doctorObj);
    } catch (err) {
      console.error('Error downloading budget:', err);
      setSelectedBudgetForPrint(budget);
    } finally {
      setDownloadingBudgetId(null);
    }
  };

  const [sharingBudgetId, setSharingBudgetId] = useState<string | null>(null);
  const [waToastMessage, setWaToastMessage] = useState<string | null>(null);

  // WhatsApp quick share handler (Official PDF document, no written text)
  const handleSendWhatsApp = async (budget: TreatmentBudget) => {
    try {
      setSharingBudgetId(budget.id);
      const patientObj = patients.find(p => p.id === budget.patientId);
      const doctorObj = doctors.find(d => d.id === budget.doctorId);
      const settings = ClinicalDatabase.getClinicSettings();

      const result = await shareBudgetViaWhatsAppPdf(budget, patientObj, doctorObj, settings);
      if (result.message) {
        setWaToastMessage(result.message);
        setTimeout(() => setWaToastMessage(null), 6500);
      }
    } catch (err: any) {
      console.error('Error sharing budget PDF via WhatsApp:', err);
    } finally {
      setSharingBudgetId(null);
    }
  };

  const handleConfirmResetEarnings = () => {
    if (onResetMonthlyEarnings) {
      onResetMonthlyEarnings();
    }
    setShowResetConfirmModal(false);
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      
      {/* WhatsApp Image Notification Toast */}
      {waToastMessage && (
        <div className="bg-emerald-900 text-emerald-50 px-4 py-3 rounded-2xl shadow-lg border border-emerald-700 flex items-center justify-between gap-3 text-xs sm:text-sm animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <span className="p-1 bg-emerald-500/20 text-emerald-300 rounded-lg font-bold text-base">📸</span>
            <span className="font-medium">{waToastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setWaToastMessage(null)}
            className="p-1 hover:bg-emerald-800 text-emerald-300 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Financial KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Ingresos Totales Cobrados */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Ingresos Recaudados (Mes)</span>
            <div className="flex items-center gap-1.5">
              {activeRole !== 'PATIENT' && onResetMonthlyEarnings && (
                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(true)}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                  title="Reiniciar las ganancias del mes"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Reiniciar</span>
                </button>
              )}
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-2xl">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-slate-900">
              ${(totalRevenue ?? 0).toLocaleString('es-CL')}
            </span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[11px] text-slate-400 font-medium">
                {payments.length} transacciones registradas
              </span>
              {activeRole !== 'PATIENT' && onResetMonthlyEarnings && payments.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(true)}
                  className="text-[10px] text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
                >
                  Reiniciar mes
                </button>
              )}
            </div>
          </div>
        </div>

        {/* KPI 2: Saldos Pendientes de Cobro */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Saldos por Cobrar (Cuentas)</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-2xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-amber-700">
              ${(totalOutstanding ?? 0).toLocaleString('es-CL')}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
              En tratamientos activos
            </span>
          </div>
        </div>

        {/* KPI 3: Presupuestos Aceptados */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Presupuestos Aprobados</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-2xl">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-slate-900">
              ${(totalBudgetsValue ?? 0).toLocaleString('es-CL')}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
              {budgets.length} planes emitidos
            </span>
          </div>
        </div>

        {/* KPI 4: Arqueo Caja Activa */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Arqueo de Caja Diaria</span>
            <button
              type="button"
              onClick={() => setShowCashRegisterModal(true)}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Ver Caja</span>
            </button>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-emerald-700">
              ${(cashSession?.expectedCashTotal ?? cashSession?.openingCash ?? 0).toLocaleString('es-CL')}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
              Estado: <strong className="text-emerald-700">{cashSession?.status || 'OPEN'}</strong>
            </span>
          </div>
        </div>

      </div>

      {/* Main Container: Controls & Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
        
        {/* Sub-Header Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          
          {/* Tabs */}
          <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('BUDGETS')}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
                activeTab === 'BUDGETS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Presupuestos & Planes ({budgets.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PAYMENTS')}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
                activeTab === 'PAYMENTS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Cobros & Comprobantes ({payments.length})</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por N° presupuesto, boleta o paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-full pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          {/* Action CTAs */}
          {activeRole !== 'PATIENT' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenQuickPayment}
                className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Cobro Rápido</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBudgetToEdit(null);
                  setShowBudgetModal(true);
                }}
                className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nuevo Presupuesto</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Presupuestos Odontológicos */}
        {activeTab === 'BUDGETS' && (
          <div className="p-4 sm:p-5 flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBudgets.map(b => (
                <div key={b.id} className="bg-slate-50/50 hover:bg-white rounded-3xl border border-slate-200/90 p-5 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all">
                  
                  {/* Budget Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200/80">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                            {b.budgetNumber}
                          </span>
                          <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {b.status}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 mt-2">{b.patientName}</h4>
                        {(() => {
                          const phoneNum = b.patientPhone || patients.find(p => p.id === b.patientId)?.phone;
                          return phoneNum ? (
                            <p className="text-xs text-teal-700 font-medium flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-teal-600 inline" />
                              <span>{phoneNum}</span>
                            </p>
                          ) : null;
                        })()}
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">Tratante: {b.doctorName}</p>
                      </div>

                      <span className="text-xs text-slate-400 font-mono font-medium">{b.createdAt}</span>
                    </div>

                    {/* Items List with Pieces */}
                    <div className="my-3 flex flex-col gap-1.5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Tratamientos & Piezas ({b.items.length}):
                      </span>
                      <div className="flex flex-col gap-1.5 text-xs max-h-48 overflow-y-auto pr-1">
                        {b.items.map((item, idx) => (
                          <div key={item.id || idx} className="flex justify-between items-center bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              {item.toothNumber && item.toothNumber > 0 ? (
                                <span className="shrink-0 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full">
                                  Pz. {item.toothNumber}
                                </span>
                              ) : (
                                <span className="shrink-0 bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-medium">
                                  General
                                </span>
                              )}
                              <span className="text-slate-800 truncate font-medium">
                                {item.description}
                              </span>
                            </div>
                            <span className="font-mono font-bold text-slate-900 shrink-0">
                              ${item.patientCopay.toLocaleString('es-CL')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary and Action CTAs (Download PDF, WhatsApp, Payment) */}
                  <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">Total / Saldo:</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-black font-mono text-slate-900">
                          ${b.totalPatient.toLocaleString('es-CL')}
                        </span>
                        {b.balanceDue > 0 && (
                          <span className="text-xs font-mono font-bold text-amber-700">
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
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-xs transition-all cursor-pointer"
                        title="Enviar por WhatsApp al Paciente"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      {/* Direct Download PDF */}
                      <button
                        type="button"
                        onClick={() => handleDirectDownloadBudget(b)}
                        disabled={downloadingBudgetId === b.id}
                        className="p-2 bg-teal-50 hover:bg-teal-100 disabled:opacity-50 text-teal-700 border border-teal-200 rounded-full text-xs transition-all cursor-pointer"
                        title="Descargar Presupuesto Oficial (PDF)"
                      >
                        {downloadingBudgetId === b.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                        ) : (
                          <Download className="w-4 h-4 text-teal-600" />
                        )}
                      </button>

                      {/* Print / View Modal */}
                      <button
                        type="button"
                        onClick={() => setSelectedBudgetForPrint(b)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-full text-xs transition-all cursor-pointer"
                        title="Ver / Imprimir Presupuesto"
                      >
                        <Printer className="w-4 h-4 text-blue-600" />
                      </button>

                      {/* Edit Budget CTA */}
                      {activeRole !== 'PATIENT' && (
                        <button
                          type="button"
                          onClick={() => {
                            setBudgetToEdit(b);
                            setShowBudgetModal(true);
                          }}
                          className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-full text-xs transition-all cursor-pointer"
                          title="Editar Presupuesto"
                        >
                          <Pencil className="w-4 h-4 text-amber-600" />
                        </button>
                      )}

                      {/* Delete Budget CTA */}
                      {activeRole !== 'PATIENT' && onDeleteBudget && (
                        <button
                          type="button"
                          onClick={() => setBudgetToDelete(b)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-full text-xs transition-all cursor-pointer"
                          title="Eliminar Presupuesto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Charge payment if balance due */}
                      {b.balanceDue > 0 && activeRole !== 'PATIENT' && (
                        <button
                          type="button"
                          onClick={() => handleOpenPaymentForBudget(b)}
                          className="py-1.5 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
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
              <div className="p-8 text-center text-slate-400 text-xs">
                No se encontraron presupuestos con los filtros aplicados.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Historial de Cobros y Comprobantes */}
        {activeTab === 'PAYMENTS' && (
          <div className="flex flex-col">
            {/* Payments Toolbar with Reset Monthly Earnings */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Resumen Contable del Periodo:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                  Total Recaudado: ${totalRevenue.toLocaleString('es-CL')}
                </span>
                <span className="text-slate-500 font-mono">
                  ({filteredPayments.length} comprobantes)
                </span>
              </div>

              {activeRole !== 'PATIENT' && onResetMonthlyEarnings && (
                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(true)}
                  className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reiniciar las ganancias del mes</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
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
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredPayments.map(pay => (
                    <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-blue-600">
                        {pay.receiptNumber}
                      </td>
                      <td className="p-4 font-bold text-slate-900">
                        {pay.patientName}
                      </td>
                      <td className="p-4 text-slate-500 font-mono">
                        {pay.date} {pay.time}
                      </td>
                      <td className="p-4 max-w-xs truncate text-slate-600 font-medium">
                        {pay.concept}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-mono font-semibold">
                          {pay.paymentMethod}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-black text-slate-900 text-sm">
                        ${pay.amount.toLocaleString('es-CL')}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
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
                <div className="p-8 text-center text-slate-400 text-xs">
                  No hay transacciones registradas para este criterio.
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* MODAL: Confirmación de Reinicio de Ganancias del Mes */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            
            <div className="flex items-start justify-between gap-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">
                ¿Reiniciar las ganancias del mes?
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Estás a punto de restablecer el acumulado de ingresos y ganancias mensuales a <strong>$0 CLP</strong> para comenzar un nuevo ciclo de facturación.
              </p>
            </div>

            {/* Current Month Statistics Summary Box */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-xs flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Registros a reiniciar:
              </span>
              <div className="flex justify-between items-center text-slate-700">
                <span>Total de ingresos acumulados:</span>
                <span className="font-mono font-black text-rose-600 text-sm">
                  ${totalRevenue.toLocaleString('es-CL')} CLP
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span>Transacciones y comprobantes:</span>
                <span className="font-mono font-bold text-slate-900">
                  {payments.length} transacciones
                </span>
              </div>
            </div>

            <p className="text-[11px] text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200/90 leading-tight">
              ⚠️ Esta acción eliminará el historial de pagos del mes en el módulo de Cobro para reiniciar el contador contable.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmResetEarnings}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirmar y Reiniciar</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: Creador / Editor de Presupuestos */}
      <BudgetBuilderModal
        isOpen={showBudgetModal}
        onClose={() => {
          setShowBudgetModal(false);
          setBudgetToEdit(null);
        }}
        onSaveBudget={(budget, shouldPrint, shouldWa) => {
          onSaveBudget(budget);
          setShowBudgetModal(false);
          setBudgetToEdit(null);
          if (shouldPrint) {
            setSelectedBudgetForPrint(budget);
          }
        }}
        patients={patients}
        doctors={doctors}
        branches={branches}
        tariffs={tariffs}
        budgetToEdit={budgetToEdit}
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
          onDeleteBudget={(id) => {
            setSelectedBudgetForPrint(null);
            onDeleteBudget?.(id);
          }}
          onEditBudget={(b) => {
            setSelectedBudgetForPrint(null);
            setBudgetToEdit(b);
            setShowBudgetModal(true);
          }}
        />
      )}

      {/* MODAL: Confirmación de Eliminación de Presupuesto */}
      {budgetToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-xs">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base text-slate-900">
                  ¿Eliminar presupuesto?
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  ¿Estás seguro de que deseas eliminar el presupuesto <strong className="text-slate-900 font-mono">{budgetToDelete.budgetNumber}</strong> de <strong className="text-slate-800">{budgetToDelete.patientName}</strong>?
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                    Total: ${(budgetToDelete.totalPatient || 0).toLocaleString('es-CL')}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    ({budgetToDelete.items.length} tratamientos)
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200/80 p-3.5 rounded-2xl text-xs text-rose-700 leading-relaxed">
              ⚠️ <strong>Advertencia:</strong> Esta acción no se puede deshacer y removerá este presupuesto del historial contable y clínico.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBudgetToDelete(null)}
                className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteBudget) {
                    onDeleteBudget(budgetToDelete.id);
                  }
                  setBudgetToDelete(null);
                }}
                className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, Eliminar Presupuesto</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
