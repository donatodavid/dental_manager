import React, { useState } from 'react';
import { 
  TreatmentBudget, 
  PaymentTransaction, 
  PaymentMethod, 
  Patient, 
  ProfessionalDoctor, 
  Branch 
} from '../../types/clinical';
import confetti from 'canvas-confetti';
import { X, CreditCard, DollarSign, CheckCircle2, Receipt, Building2, Printer } from 'lucide-react';

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget?: TreatmentBudget;
  patient: Patient;
  doctors: ProfessionalDoctor[];
  branches: Branch[];
  onProcessPayment: (payment: PaymentTransaction) => void;
}

export const PaymentCheckoutModal: React.FC<PaymentCheckoutModalProps> = ({
  isOpen,
  onClose,
  budget,
  patient,
  doctors,
  branches,
  onProcessPayment
}) => {
  const [amount, setAmount] = useState<number>(budget ? budget.balanceDue : 50000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('DEBIT_CARD');
  const [receiptType, setReceiptType] = useState<'BOLETA' | 'FACTURA' | 'RECIBO_INTERNO'>('BOLETA');
  const [concept, setConcept] = useState(budget ? `Abono a presupuesto ${budget.budgetNumber}` : 'Consulta y tratamiento odontológico');
  const [doctorId, setDoctorId] = useState(budget?.doctorId || doctors[0]?.id || '');
  const [branchId, setBranchId] = useState(budget?.branchId || branches[0]?.id || '');
  const [authCode, setAuthCode] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState<PaymentTransaction | null>(null);

  if (!isOpen) return null;

  const currentDoctor = doctors.find(d => d.id === doctorId) || doctors[0];
  const currentBranch = branches.find(b => b.id === branchId) || branches[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    const newPayment: PaymentTransaction = {
      id: `pay-${Date.now()}`,
      receiptNumber: `BOL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      budgetId: budget?.id,
      branchId: currentBranch.id,
      doctorId: currentDoctor.id,
      doctorName: currentDoctor.name,
      amount: Number(amount),
      paymentMethod,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      concept,
      receiptType,
      authorizationCode: authCode || (paymentMethod.includes('CARD') ? `TBK-${Math.floor(100000 + Math.random() * 900000)}` : undefined),
      cashRegisterId: 'cr-session-today',
      receivedBy: 'Recepcionista Turno'
    };

    onProcessPayment(newPayment);
    setGeneratedReceipt(newPayment);
    setIsCompleted(true);

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-teal-400" />
            {isCompleted ? 'Comprobante de Pago Emitido' : 'Registro de Cobro & Emisión de Comprobante'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isCompleted ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {/* Patient & Budget info banner */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-200">{patient.firstName} {patient.lastName}</span>
                <span className="font-mono text-slate-400">RUT: {patient.documentId}</span>
              </div>
              {budget && (
                <div className="flex justify-between items-center mt-1 text-slate-400">
                  <span>Presupuesto: {budget.budgetNumber}</span>
                  <span>Saldo Pendiente: <strong className="text-amber-400 font-mono">${(budget?.balanceDue ?? 0).toLocaleString('es-CL')}</strong></span>
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Monto a Cobrar (CLP) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">$</span>
                <input
                  type="number"
                  required
                  min="1000"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-4 py-2.5 text-base font-mono font-bold text-teal-300 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Medio de Pago *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {[
                  { id: 'DEBIT_CARD', label: '💳 Tarjeta Débito' },
                  { id: 'CREDIT_CARD', label: '💳 Tarjeta Crédito' },
                  { id: 'CASH', label: '💵 Efectivo' },
                  { id: 'BANK_TRANSFER', label: '🏦 Transferencia' },
                  { id: 'INSURANCE_CLAIM', label: '🛡️ Seguro / Isapre' },
                  { id: 'MERCADOPAGO', label: '📱 MercadoPago' }
                ].map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                    className={`p-2 rounded-lg font-medium border text-left transition-all ${
                      paymentMethod === method.id
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300 ring-1 ring-teal-400'
                        : 'bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Document Receipt Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Tipo de Comprobante
                </label>
                <select
                  value={receiptType}
                  onChange={(e) => setReceiptType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="BOLETA">Boleta Electrónica SII</option>
                  <option value="FACTURA">Factura Exenta / Afecta</option>
                  <option value="RECIBO_INTERNO">Recibo Interno / Voucher</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Código de Autorización / Operación
                </label>
                <input
                  type="text"
                  placeholder="Ej: TBK-994812"
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>
            </div>

            {/* Concept */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Glosa / Concepto de Pago
              </label>
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-600/30 flex items-center gap-1.5"
              >
                <Receipt className="w-4 h-4" />
                Registrar Cobro (${(amount ?? 0).toLocaleString('es-CL')})
              </button>
            </div>
          </form>
        ) : (
          /* Receipt Success State */
          <div className="flex flex-col gap-4 py-2">
            <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-center flex flex-col items-center gap-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
              <h4 className="text-base font-bold text-emerald-300">¡Pago Procesado Exitosamente!</h4>
              <p className="text-xs text-slate-300">El pago ha sido registrado en la caja diaria y acreditado a la ficha del paciente.</p>
            </div>

            {generatedReceipt && (
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-xs flex flex-col gap-3 font-mono">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src="/pagnina.png" 
                      alt="Daaron Consulta Dental" 
                      className="h-9 w-auto object-contain"
                    />
                    <div>
                      <span className="font-bold text-slate-100 block font-sans text-xs">DAARON CONSULTA DENTAL</span>
                      <span className="text-[10px] text-slate-400 font-sans block">Linares — Maipú 461 Loc. 304</span>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-1 rounded-md text-[10px] border border-emerald-500/30">
                    PAGADO
                  </span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>N° Comprobante:</span>
                  <span className="font-bold text-slate-200">{generatedReceipt.receiptNumber}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Paciente:</span>
                  <span className="text-slate-200">{generatedReceipt.patientName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Monto Pagado:</span>
                  <span className="text-teal-400 font-bold text-sm">${(generatedReceipt?.amount ?? 0).toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Medio de Pago:</span>
                  <span className="text-slate-200">{generatedReceipt.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Fecha y Hora:</span>
                  <span className="text-slate-200">{generatedReceipt.date} {generatedReceipt.time}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Imprimir Voucher
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold"
              >
                Finalizar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
