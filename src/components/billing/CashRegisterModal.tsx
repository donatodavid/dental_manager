import React, { useState } from 'react';
import { CashRegisterSession, PaymentTransaction, Branch } from '../../types/clinical';
import { X, Landmark, DollarSign, ArrowDownRight, ArrowUpRight, CheckCircle2, Lock, AlertCircle } from 'lucide-react';

interface CashRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: CashRegisterSession;
  payments: PaymentTransaction[];
  branch: Branch;
  onUpdateSession: (updatedSession: CashRegisterSession) => void;
}

export const CashRegisterModal: React.FC<CashRegisterModalProps> = ({
  isOpen,
  onClose,
  session,
  payments,
  branch,
  onUpdateSession
}) => {
  const [cashCounted, setCashCounted] = useState<number>(session.expectedCashTotal);
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseReason, setExpenseReason] = useState<string>('');
  const [closeNotes, setCloseNotes] = useState<string>('');
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen) return null;

  // Filter payments for this session
  const sessionPayments = payments.filter(p => p.branchId === branch.id);
  const cashPaymentsTotal = sessionPayments.filter(p => p.paymentMethod === 'CASH').reduce((sum, p) => sum + p.amount, 0);
  const cardPaymentsTotal = sessionPayments.filter(p => p.paymentMethod.includes('CARD') || p.paymentMethod === 'MERCADOPAGO').reduce((sum, p) => sum + p.amount, 0);
  const transferPaymentsTotal = sessionPayments.filter(p => p.paymentMethod === 'BANK_TRANSFER').reduce((sum, p) => sum + p.amount, 0);
  const insurancePaymentsTotal = sessionPayments.filter(p => p.paymentMethod === 'INSURANCE_CLAIM').reduce((sum, p) => sum + p.amount, 0);

  const totalIncome = cashPaymentsTotal + cardPaymentsTotal + transferPaymentsTotal + insurancePaymentsTotal;
  const expectedCashInDrawer = session.openingCash + cashPaymentsTotal - session.totalExpenses;
  const cashDifference = cashCounted - expectedCashInDrawer;

  const handleRegisterExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseAmount <= 0) return;

    const updated: CashRegisterSession = {
      ...session,
      totalExpenses: session.totalExpenses + expenseAmount,
      expectedCashTotal: session.expectedCashTotal - expenseAmount,
      notes: `${session.notes || ''}\n[Egreso $${expenseAmount.toLocaleString('es-CL')}]: ${expenseReason}`
    };

    onUpdateSession(updated);
    setExpenseAmount(0);
    setExpenseReason('');
  };

  const handleCloseRegister = () => {
    const updated: CashRegisterSession = {
      ...session,
      status: 'CLOSED',
      closedAt: new Date().toISOString(),
      closedBy: 'Recepcionista Turno Tarde',
      closingCash: cashCounted,
      cashDifference: cashDifference,
      totalCashIncome: cashPaymentsTotal,
      totalCardIncome: cardPaymentsTotal,
      totalTransferIncome: transferPaymentsTotal,
      totalInsuranceIncome: insurancePaymentsTotal,
      notes: `${session.notes || ''}\n[Cierre Diario]: Conteo físico $${cashCounted.toLocaleString('es-CL')}. ${closeNotes}`
    };

    onUpdateSession(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                Arqueo y Control de Caja Diaria
              </h3>
              <p className="text-xs text-slate-400">{branch.name} • Apertura: {session.openedAt}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Breakdown Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Sencillo Apertura</span>
            <span className="text-sm font-bold font-mono text-slate-200">
              ${session.openingCash.toLocaleString('es-CL')}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-teal-400 block">Ingresos Efectivo</span>
            <span className="text-sm font-bold font-mono text-teal-300">
              +${cashPaymentsTotal.toLocaleString('es-CL')}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-blue-400 block">Tarjetas & POS</span>
            <span className="text-sm font-bold font-mono text-blue-300">
              ${cardPaymentsTotal.toLocaleString('es-CL')}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-red-400 block">Egresos / Gastos</span>
            <span className="text-sm font-bold font-mono text-red-300">
              -${session.totalExpenses.toLocaleString('es-CL')}
            </span>
          </div>
        </div>

        {/* Expected Cash in Drawer */}
        <div className="bg-teal-950/40 p-4 rounded-xl border border-teal-500/40 flex justify-between items-center">
          <div>
            <span className="text-xs font-semibold text-teal-300 block">Efectivo Teórico Esperado en Gaveta:</span>
            <span className="text-xl font-bold font-mono text-teal-200">
              ${expectedCashInDrawer.toLocaleString('es-CL')}
            </span>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold">
            {session.status === 'OPEN' ? 'Caja Abierta' : 'Caja Cerrada'}
          </span>
        </div>

        {/* Register Expense Section */}
        {session.status === 'OPEN' && (
          <form onSubmit={handleRegisterExpense} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Registrar Egreso Menor / Retiro de Caja
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="number"
                placeholder="Monto ($)"
                value={expenseAmount || ''}
                onChange={(e) => setExpenseAmount(Number(e.target.value))}
                className="sm:col-span-4 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-red-500"
              />
              <input
                type="text"
                placeholder="Motivo (Ej. Insumos limpieza, cafetería, flete)"
                value={expenseReason}
                onChange={(e) => setExpenseReason(e.target.value)}
                className="sm:col-span-6 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
              />
              <button
                type="submit"
                className="sm:col-span-2 py-2 px-3 bg-red-600/80 hover:bg-red-500 text-white rounded-lg text-xs font-semibold"
              >
                Registrar
              </button>
            </div>
          </form>
        )}

        {/* Daily Close Count */}
        {session.status === 'OPEN' && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Cuadre y Conteo Físico de Cierre
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Efectivo Físico Contado ($)
                </label>
                <input
                  type="number"
                  value={cashCounted}
                  onChange={(e) => setCashCounted(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm font-mono font-bold text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Diferencia de Cuadre
                </label>
                <div className={`p-2.5 rounded-lg border font-mono font-bold text-sm ${
                  cashDifference === 0 
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                    : cashDifference > 0 
                      ? 'bg-blue-950/40 border-blue-500/40 text-blue-300' 
                      : 'bg-red-950/40 border-red-500/40 text-red-300'
                }`}>
                  {cashDifference === 0 ? '✓ Cuadre Perfecto ($0)' : `${cashDifference > 0 ? '+$' : '-$'}${Math.abs(cashDifference).toLocaleString('es-CL')} (${cashDifference > 0 ? 'Sobrante' : 'Faltante'})`}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Observaciones del Cierre
              </label>
              <input
                type="text"
                placeholder="Observaciones o firmas de entrega de turno..."
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
          >
            Cerrar Ventana
          </button>
          
          {session.status === 'OPEN' && (
            <button
              type="button"
              onClick={handleCloseRegister}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
            >
              <Lock className="w-4 h-4" />
              Realizar Cierre de Caja Diaria
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
