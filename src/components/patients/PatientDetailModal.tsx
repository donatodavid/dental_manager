import React, { useState } from 'react';
import { 
  Patient, 
  ClinicalEvolution, 
  ClinicalDocument, 
  TreatmentBudget, 
  ToothNumber,
  UserRole,
  ProfessionalDoctor,
  Branch,
  TreatmentTariffItem
} from '../../types/clinical';
import { 
  X, 
  User, 
  FileText, 
  DollarSign, 
  Calendar, 
  Image as ImageIcon, 
  AlertTriangle, 
  Heart, 
  Pill, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldAlert, 
  Plus, 
  Check, 
  Printer, 
  Lock, 
  Eye, 
  ZoomIn, 
  ZoomOut, 
  Sun, 
  Contrast, 
  RotateCcw,
  Sparkles,
  FileCheck,
  Tag,
  MessageSquare,
  Receipt,
  CheckCircle2,
  FolderPlus
} from 'lucide-react';
import { BudgetPrintModal } from '../billing/BudgetPrintModal';
import { PatientPrescriptionGenerator } from './PatientPrescriptionGenerator';
import { BudgetBuilderModal } from '../billing/BudgetBuilderModal';

interface PatientDetailModalProps {
  patient: Patient;
  isOpen?: boolean;
  onClose: () => void;
  onUpdatePatient: (updatedPatient: Patient) => void;
  doctors: ProfessionalDoctor[];
  activeRole: UserRole;
  currentDoctorId?: string;
  budgets?: TreatmentBudget[];
  branches?: Branch[];
  tariffs?: TreatmentTariffItem[];
  patients?: Patient[];
  onSaveBudget?: (budget: TreatmentBudget) => void;
  onCreateBudgetForPatient?: (patient: Patient, initialItem?: { name: string; price: number }) => void;
}

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({
  patient,
  isOpen = true,
  onClose,
  onUpdatePatient,
  doctors,
  activeRole,
  currentDoctorId = 'doc-1',
  budgets = [],
  branches = [],
  tariffs = [],
  patients = [],
  onSaveBudget,
  onCreateBudgetForPatient
}) => {
  const [activeTab, setActiveTab] = useState<'BUDGETS' | 'PRESCRIPTION' | 'DOCUMENTS'>('BUDGETS');
  const [showPatientBudgetModal, setShowPatientBudgetModal] = useState(false);
  const [selectedBudgetForPrint, setSelectedBudgetForPrint] = useState<TreatmentBudget | null>(null);

  // New evolution form state
  const [showNewEvolutionModal, setShowNewEvolutionModal] = useState(false);
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [selectedTeethInput, setSelectedTeethInput] = useState<string>('');
  const [prescriptionInput, setPrescriptionInput] = useState<string>('');

  // X-Ray visualizer state
  const [selectedDoc, setSelectedDoc] = useState<ClinicalDocument | null>(patient.documents[0] || null);
  const [xrayZoom, setXrayZoom] = useState(1);
  const [xrayBrightness, setXrayBrightness] = useState(100);
  const [xrayContrast, setXrayContrast] = useState(100);
  const [xrayInvert, setXrayInvert] = useState(false);

  // New Document Upload Simulation
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<'xray' | 'panoramic' | 'tomography' | 'consent' | 'lab_report'>('xray');
  const [docNotes, setDocNotes] = useState('');

  if (isOpen === false) return null;

  const currentDoctor = doctors.find(d => d.id === currentDoctorId) || doctors[0];

  // Calculate age from birthDate
  const calculateAge = (birthDateString: string): number => {
    const today = new Date();
    const birth = new Date(birthDateString);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(patient.birthDate);

  // Add new clinical evolution (SOAP)
  const handleSaveEvolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjective && !objective && !plan) return;

    const teethList: ToothNumber[] = selectedTeethInput
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n));

    const prescriptions = prescriptionInput
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const now = new Date();
    const newEvo: ClinicalEvolution = {
      id: `evo-${Date.now()}`,
      patientId: patient.id,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      doctorId: currentDoctor.id,
      doctorName: currentDoctor.name,
      specialty: currentDoctor.specialty,
      branchId: currentDoctor.branchIds[0] || 'branch-1',
      subjective,
      objective,
      assessment,
      plan,
      signed: true,
      signatureStamp: `Firma Digital Validada - ${currentDoctor.name} (${currentDoctor.licenseNumber}) - ${now.toISOString()}`,
      teethInvolved: teethList.length > 0 ? teethList : undefined,
      prescriptions: prescriptions.length > 0 ? prescriptions : undefined
    };

    const updatedPatient: Patient = {
      ...patient,
      evolutions: [newEvo, ...patient.evolutions],
      lastVisit: newEvo.date
    };

    onUpdatePatient(updatedPatient);
    setShowNewEvolutionModal(false);
    setSubjective('');
    setObjective('');
    setAssessment('');
    setPlan('');
    setSelectedTeethInput('');
    setPrescriptionInput('');
  };

  // Add Document
  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle) return;

    const sampleUrls: Record<string, string> = {
      panoramic: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80',
      xray: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80',
      tomography: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&auto=format&fit=crop&q=80',
      consent: '#',
      lab_report: '#'
    };

    const newDoc: ClinicalDocument = {
      id: `doc-${Date.now()}`,
      patientId: patient.id,
      title: docTitle,
      category: docCategory,
      url: sampleUrls[docCategory] || sampleUrls.xray,
      uploadDate: new Date().toISOString().split('T')[0],
      doctorName: currentDoctor.name,
      size: '2.5 MB',
      notes: docNotes,
      signedConsent: docCategory === 'consent'
    };

    const updatedPatient: Patient = {
      ...patient,
      documents: [newDoc, ...patient.documents]
    };

    onUpdatePatient(updatedPatient);
    setSelectedDoc(newDoc);
    setShowUploadModal(false);
    setDocTitle('');
    setDocNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-7xl max-h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Clinical Header Bar */}
        <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 font-bold text-lg">
              {patient.firstName[0]}{patient.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-100">
                  {patient.firstName} {patient.lastName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-700 text-slate-300">
                  RUT: {patient.documentId}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {patient.status === 'ACTIVE' ? 'Paciente Activo' : 'Archivado'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {age} años • {patient.gender === 'F' ? 'Femenino' : patient.gender === 'M' ? 'Masculino' : 'Otro'} • Previsión: <strong className="text-slate-300">{patient.insuranceProvider}</strong>
              </p>
            </div>
          </div>

          {/* Quick Critical Allergy Alert Banner */}
          {patient.allergies.length > 0 && (
            <div className="flex items-center gap-2 bg-red-950/80 border border-red-500/50 px-3 py-1.5 rounded-xl text-red-200 animate-pulse">
              <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold block text-red-300">ALERTA MÉDICA CRÍTICA:</span>
                <span>{patient.allergies.map(a => a.allergen).join(', ')}</span>
              </div>
            </div>
          )}

          {/* Actions & Close */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-all"
              title="Imprimir Ficha Clínica"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir Ficha</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Patient Budget Overview Banner */}
        {(() => {
          const patientBudgets = budgets.filter(b => b.patientId === patient.id);
          const totalBudgeted = patientBudgets.reduce((acc, b) => acc + b.totalPatient, 0);
          const totalPaid = patientBudgets.reduce((acc, b) => acc + b.totalPaid, 0);
          const balanceDue = patientBudgets.reduce((acc, b) => acc + b.balanceDue, 0);
          const totalItems = patientBudgets.reduce((acc, b) => acc + b.items.length, 0);

          if (patientBudgets.length > 0) {
            return (
              <div className="bg-teal-950/50 border-b border-teal-500/30 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5 text-teal-300 font-bold">
                    <DollarSign className="w-4 h-4 text-teal-400" />
                    <span>Presupuesto Activo:</span>
                    <span className="font-mono text-sm text-white font-bold">${totalBudgeted.toLocaleString('es-CL')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-slate-400">Abonado:</span>
                    <span className="font-mono text-emerald-400 font-semibold">${totalPaid.toLocaleString('es-CL')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-slate-400">Saldo Pendiente:</span>
                    <span className="font-mono text-amber-400 font-bold">${balanceDue.toLocaleString('es-CL')}</span>
                  </div>
                  <span className="text-[11px] bg-teal-900/80 text-teal-200 px-2 py-0.5 rounded-full font-mono border border-teal-500/40">
                    {totalItems} tratamientos presupuestados
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('BUDGETS')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                      activeTab === 'BUDGETS'
                        ? 'bg-teal-500 text-slate-950 shadow-md'
                        : 'bg-teal-600/80 hover:bg-teal-500 text-white'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Ver Presupuesto del Paciente
                  </button>
                  {patientBudgets[0] && (
                    <button
                      type="button"
                      onClick={() => setSelectedBudgetForPrint(patientBudgets[0])}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-all"
                      title="Descargar / Imprimir PDF"
                    >
                      <Printer className="w-3.5 h-3.5 text-teal-400" />
                      <span>PDF</span>
                    </button>
                  )}
                </div>
              </div>
            );
          } else {
            return (
              <div className="bg-slate-800/50 border-b border-slate-700 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <DollarSign className="w-4 h-4 text-teal-400" />
                  El paciente aún no cuenta con un presupuesto emitido.
                </span>
                <button
                  type="button"
                  onClick={() => setShowPatientBudgetModal(true)}
                  className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Crear Presupuesto Odontológico
                </button>
              </div>
            );
          }
        })()}

        {/* Tab Navigation */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 flex overflow-x-auto gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('BUDGETS')}
            className={`px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'BUDGETS'
                ? 'border-teal-500 text-teal-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Presupuestos & Tratamientos</span>
            <span className="px-1.5 py-0.2 text-[10px] bg-teal-950 text-teal-300 border border-teal-500/40 rounded-full font-mono font-bold">
              {budgets.filter(b => b.patientId === patient.id).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PRESCRIPTION')}
            className={`px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'PRESCRIPTION'
                ? 'border-teal-500 text-teal-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Crear Ficha / Receta Médica (PDF)</span>
            <span className="px-1.5 py-0.2 text-[10px] bg-teal-500/20 text-teal-300 rounded-full font-mono font-bold">
              PDF Oficial
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DOCUMENTS')}
            className={`px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'DOCUMENTS'
                ? 'border-teal-500 text-teal-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Radiografías & Visor</span>
            <span className="px-1.5 py-0.2 text-[10px] bg-slate-800 text-slate-300 rounded-full font-mono">
              {patient.documents.length}
            </span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-900">
          
          {/* TAB: GENERADOR DE RECETAS & FICHAS MÉDICAS (PDF) */}
          {activeTab === 'PRESCRIPTION' && (
            <PatientPrescriptionGenerator
              patient={patient}
              doctors={doctors}
            />
          )}

          {/* TAB 3: PRESUPUESTOS Y PLANES DE TRATAMIENTO */}
          {activeTab === 'BUDGETS' && (
            <div className="flex flex-col gap-6">
              
              {/* Header with New Budget CTA */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-teal-400" />
                    Presupuestos y Tratamientos del Paciente
                  </h3>
                  <p className="text-xs text-slate-400">
                    Historial de cotizaciones, planes odontológicos y desglose por pieza dental.
                  </p>
                </div>

                {activeRole !== 'PATIENT' && (
                  <button
                    type="button"
                    onClick={() => setShowPatientBudgetModal(true)}
                    className="py-2 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-teal-600/20 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    + Crear Nuevo Presupuesto
                  </button>
                )}
              </div>

              {/* Budgets List for this patient */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {budgets.filter(b => b.patientId === patient.id).map(budget => (
                  <div key={budget.id} className="bg-slate-800/80 rounded-2xl border border-slate-700 p-5 shadow-lg flex flex-col justify-between gap-4">
                    
                    {/* Header */}
                    <div>
                      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-700/80">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-teal-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                              {budget.budgetNumber}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {budget.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 font-semibold mt-1">Doctor: {budget.doctorName}</p>
                          <p className="text-[11px] text-slate-400">Emisión: {budget.createdAt}</p>
                        </div>

                        <span className="text-xs text-slate-400 font-mono">Validez: 30d</span>
                      </div>

                      {/* Treatments Breakdown with Tooth numbers */}
                      <div className="my-3 flex flex-col gap-1.5">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Tratamientos Presupuestados ({budget.items.length}):
                        </span>
                        <div className="flex flex-col gap-1.5 text-xs max-h-40 overflow-y-auto pr-1">
                          {budget.items.map((item, idx) => (
                            <div key={item.id || idx} className="flex justify-between items-center bg-slate-900/80 p-2 rounded-lg border border-slate-800">
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

                    {/* Financial Summary & Actions (Download PDF, WhatsApp) */}
                    <div className="pt-3 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">Total Presupuesto:</span>
                        <span className="text-base font-bold font-mono text-teal-300">
                          ${budget.totalPatient.toLocaleString('es-CL')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* WhatsApp CTA */}
                        <button
                          type="button"
                          onClick={() => {
                            const phone = patient.whatsapp || patient.phone || '';
                            const cleanPhone = phone.replace(/[^0-9]/g, '');
                            const itemsList = budget.items
                              .map(i => `• ${i.toothNumber ? `[Pieza ${i.toothNumber}] ` : ''}${i.description} (${i.quantity}x) - $${i.patientCopay.toLocaleString('es-CL')}`)
                              .join('\n');
                            const message = `🦷 *PRESUPUESTO ODONTOLÓGICO - CIMA DENTAL*\n\n` +
                              `Estimado(a) *${patient.firstName} ${patient.lastName}*,\n` +
                              `Le compartimos el presupuesto para su plan de tratamiento:\n\n` +
                              `📋 *N° Presupuesto:* ${budget.budgetNumber}\n` +
                              `👨‍⚕️ *Doctor(a):* ${budget.doctorName}\n` +
                              `📅 *Fecha:* ${budget.createdAt}\n\n` +
                              `📝 *Detalle Tratamientos:*\n${itemsList}\n\n` +
                              `💵 *Subtotal:* $${budget.subtotal.toLocaleString('es-CL')}\n` +
                              (budget.discountTotal > 0 ? `🏷️ *Descuento:* -$${budget.discountTotal.toLocaleString('es-CL')}\n` : '') +
                              `💰 *TOTAL A PAGAR:* $${budget.totalPatient.toLocaleString('es-CL')}\n\n` +
                              `Quedamos atentos a cualquier duda para agendar su próxima atención.`;

                            const url = cleanPhone
                              ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`
                              : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
                            window.open(url, '_blank');
                          }}
                          className="px-2.5 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                          title="Enviar por WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>

                        {/* Print / Download PDF CTA */}
                        <button
                          type="button"
                          onClick={() => setSelectedBudgetForPrint(budget)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                          title="Descargar o Imprimir Presupuesto (PDF)"
                        >
                          <Printer className="w-3.5 h-3.5 text-teal-400" />
                          <span>PDF</span>
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>

              {budgets.filter(b => b.patientId === patient.id).length === 0 && (
                <div className="p-8 text-center bg-slate-800/40 rounded-2xl border border-dashed border-slate-700 text-slate-400 text-xs flex flex-col items-center gap-2">
                  <DollarSign className="w-8 h-8 text-slate-600" />
                  <p>Este paciente aún no tiene presupuestos registrados.</p>
                  <button
                    type="button"
                    onClick={() => setShowPatientBudgetModal(true)}
                    className="mt-1 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Crear el Primer Presupuesto
                  </button>
                </div>
              )}

            </div>
          )}

          {/* TAB 4: RADIOGRAFÍAS Y VISOR DICOM/IMÁGENES */}
          {activeTab === 'DOCUMENTS' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Document List on Left */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                    Archivos & Radiografías
                  </h4>
                  {activeRole !== 'PATIENT' && (
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(true)}
                      className="py-1 px-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adjuntar
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2.5">
                  {patient.documents.map(doc => (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        selectedDoc?.id === doc.id
                          ? 'bg-teal-500/20 border-teal-500 text-slate-100 shadow-md'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="p-2 bg-slate-900 rounded-lg text-teal-400 flex-shrink-0">
                        {doc.category === 'panoramic' || doc.category === 'xray' || doc.category === 'tomography' ? (
                          <ImageIcon className="w-5 h-5" />
                        ) : (
                          <FileCheck className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-bold truncate text-slate-200">{doc.title}</h5>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {doc.uploadDate} • {doc.doctorName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-1.5 py-0.2 text-[10px] uppercase font-mono bg-slate-900 text-slate-300 rounded border border-slate-700">
                            {doc.category}
                          </span>
                          <span className="text-[10px] text-slate-400">{doc.size}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {patient.documents.length === 0 && (
                    <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-700 rounded-xl">
                      No hay archivos ni radiografías cargadas.
                    </div>
                  )}
                </div>
              </div>

              {/* X-Ray / Image Studio Viewer on Right */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                {selectedDoc ? (
                  <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col gap-3">
                    
                    {/* Viewer Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{selectedDoc.title}</span>
                      </div>

                      {/* Filter Adjustments */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Sun className="w-4 h-4 text-amber-400" />
                          <input
                            type="range"
                            min="50"
                            max="200"
                            value={xrayBrightness}
                            onChange={(e) => setXrayBrightness(parseInt(e.target.value))}
                            className="w-20 accent-teal-500"
                            title="Brillo"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Contrast className="w-4 h-4 text-blue-400" />
                          <input
                            type="range"
                            min="50"
                            max="200"
                            value={xrayContrast}
                            onChange={(e) => setXrayContrast(parseInt(e.target.value))}
                            className="w-20 accent-teal-500"
                            title="Contraste"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => setXrayInvert(!xrayInvert)}
                          className={`px-2.5 py-1 rounded font-semibold text-xs transition-all ${
                            xrayInvert ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          Invertir Negativo
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setXrayZoom(1);
                            setXrayBrightness(100);
                            setXrayContrast(100);
                            setXrayInvert(false);
                          }}
                          className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-white"
                          title="Restablecer controles"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Image Canvas Viewport */}
                    <div className="relative w-full h-[400px] sm:h-[480px] bg-black rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
                      {selectedDoc.url && selectedDoc.url !== '#' ? (
                        <img
                          src={selectedDoc.url}
                          alt={selectedDoc.title}
                          referrerPolicy="no-referrer"
                          className="max-h-full max-w-full object-contain transition-all"
                          style={{
                            transform: `scale(${xrayZoom})`,
                            filter: `brightness(${xrayBrightness}%) contrast(${xrayContrast}%) ${xrayInvert ? 'invert(100%)' : ''}`
                          }}
                        />
                      ) : (
                        <div className="p-8 text-center text-slate-400 text-xs">
                          <FileCheck className="w-12 h-12 text-teal-400 mx-auto mb-3" />
                          <p className="font-semibold text-sm text-slate-200">{selectedDoc.title}</p>
                          <p className="mt-1">Documento administrativo o consentimiento firmado digitalmente.</p>
                          <p className="text-[11px] text-teal-400 mt-2">✓ Firma Biométrica Registrada</p>
                        </div>
                      )}

                      {/* Zoom Floating Buttons */}
                      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-700 backdrop-blur-md">
                        <button
                          type="button"
                          onClick={() => setXrayZoom(prev => Math.max(0.5, prev - 0.25))}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-mono text-slate-300 px-1">{Math.round(xrayZoom * 100)}%</span>
                        <button
                          type="button"
                          onClick={() => setXrayZoom(prev => Math.min(3, prev + 0.25))}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Image notes */}
                    {selectedDoc.notes && (
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
                        <strong className="text-teal-400 block mb-0.5">Informe Radiológico / Observaciones:</strong>
                        {selectedDoc.notes}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-96 flex items-center justify-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-500 text-xs">
                    Selecciona una radiografía de la lista para visualizarla.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* MODAL: Nueva Evolución SOAP */}
      {showNewEvolutionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-400" />
                Registrar Evolución Clínica (SOAP)
              </h3>
              <button
                type="button"
                onClick={() => setShowNewEvolutionModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvolution} className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Profesional a cargo
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${currentDoctor.name} (${currentDoctor.specialty})`}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Piezas Dentales Involucradas (separadas por coma)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 16, 17, 48"
                    value={selectedTeethInput}
                    onChange={(e) => setSelectedTeethInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-teal-300 block mb-1">
                  S - Subjetivo (Lo que refiere el paciente)
                </label>
                <textarea
                  rows={2}
                  value={subjective}
                  onChange={(e) => setSubjective(e.target.value)}
                  placeholder="Ej. Paciente acude por dolor punzante en sector posterosuperior..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-blue-300 block mb-1">
                  O - Objetivo (Examen clínico, inspección, sondaje)
                </label>
                <textarea
                  rows={2}
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="Ej. Cavitación en oclusal pieza 1.6, vitalidad (+)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-amber-300 block mb-1">
                  A - Análisis / Diagnóstico
                </label>
                <input
                  type="text"
                  value={assessment}
                  onChange={(e) => setAssessment(e.target.value)}
                  placeholder="Ej. Pulpitis irreversible sintomática pieza 1.6"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-emerald-300 block mb-1">
                  P - Plan / Tratamiento Realizado y Próximo Paso
                </label>
                <textarea
                  rows={2}
                  required
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  placeholder="Ej. Aislamiento absoluto, pulpectomía de urgencia..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Receta Médica / Farmacología (opcional, 1 línea por medicamento)
                </label>
                <textarea
                  rows={2}
                  value={prescriptionInput}
                  onChange={(e) => setPrescriptionInput(e.target.value)}
                  placeholder="Ej: Amoxicilina 500mg - 1 cápsula cada 8 horas por 7 días&#10;Ibuprofeno 400mg - 1 comprimido cada 8 horas si hay dolor"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewEvolutionModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-600/30 flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Firmar Digitalmente y Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Adjuntar Documento o Radiografía */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-teal-400" />
                Adjuntar Radiografía o Documento Clínico
              </h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Título del Documento / Estudio
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Radiografía Retroalveolar 1.6 y 1.7"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Categoría
                </label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="xray">Radiografía Intraoral / Bitewing</option>
                  <option value="panoramic">Radiografía Panorámica (OPT)</option>
                  <option value="tomography">Tomografía CBCT Cone Beam</option>
                  <option value="consent">Consentimiento Informado Firmado</option>
                  <option value="lab_report">Informe de Laboratorio Dental</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Notas / Informe del Profesional
                </label>
                <textarea
                  rows={3}
                  placeholder="Observaciones de la imagen..."
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Mock upload drop area */}
              <div className="border-2 border-dashed border-teal-500/40 rounded-xl p-4 text-center bg-teal-500/5 text-xs text-slate-400">
                <ImageIcon className="w-8 h-8 text-teal-400 mx-auto mb-1.5 opacity-80" />
                <p className="font-semibold text-slate-300">Arrastra archivos DICOM, JPG o PNG aquí</p>
                <p className="text-[11px] text-slate-500 mt-1">O haz clic para simular subida instantánea segura</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-600/30"
                >
                  Subir y Adjuntar a Ficha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Creador de Presupuesto para este Paciente */}
      {showPatientBudgetModal && (
        <BudgetBuilderModal
          isOpen={showPatientBudgetModal}
          onClose={() => setShowPatientBudgetModal(false)}
          onSaveBudget={(budget) => {
            if (onSaveBudget) onSaveBudget(budget);
            setShowPatientBudgetModal(false);
          }}
          patients={[patient]}
          defaultPatient={patient}
          doctors={doctors}
          branches={branches}
          tariffs={tariffs}
        />
      )}

      {/* MODAL: Vista de Impresión / Descarga PDF de Presupuesto */}
      {selectedBudgetForPrint && (
        <BudgetPrintModal
          isOpen={Boolean(selectedBudgetForPrint)}
          onClose={() => setSelectedBudgetForPrint(null)}
          budget={selectedBudgetForPrint}
          patient={patient}
          doctor={doctors.find(d => d.id === selectedBudgetForPrint.doctorId)}
          branch={branches.find(b => b.id === selectedBudgetForPrint.branchId)}
        />
      )}

    </div>
  );
};
