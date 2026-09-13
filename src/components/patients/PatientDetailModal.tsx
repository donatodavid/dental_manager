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
  FolderPlus,
  Trash2,
  Download,
  Loader2,
  Pencil
} from 'lucide-react';
import { BudgetPrintModal } from '../billing/BudgetPrintModal';
import { PatientPrescriptionGenerator } from './PatientPrescriptionGenerator';
import { BudgetBuilderModal } from '../billing/BudgetBuilderModal';
import { downloadBudgetPdf, shareBudgetViaWhatsAppPdf } from '../../utils/budgetExporter';
import { ClinicalDatabase } from '../../services/db';

interface PatientDetailModalProps {
  patient: Patient;
  isOpen?: boolean;
  onClose: () => void;
  onUpdatePatient: (updatedPatient: Patient) => void;
  onDeletePatient?: (patientId: string) => void;
  doctors: ProfessionalDoctor[];
  activeRole: UserRole;
  currentDoctorId?: string;
  budgets?: TreatmentBudget[];
  branches?: Branch[];
  tariffs?: TreatmentTariffItem[];
  patients?: Patient[];
  onSaveBudget?: (budget: TreatmentBudget) => void;
  onDeleteBudget?: (budgetId: string) => void;
  onCreateBudgetForPatient?: (patient: Patient, initialItem?: { name: string; price: number }) => void;
}

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({
  patient,
  isOpen = true,
  onClose,
  onUpdatePatient,
  onDeletePatient,
  doctors,
  activeRole,
  currentDoctorId = 'doc-1',
  budgets = [],
  branches = [],
  tariffs = [],
  patients = [],
  onSaveBudget,
  onDeleteBudget,
  onCreateBudgetForPatient
}) => {
  const [activeTab, setActiveTab] = useState<'BUDGETS' | 'PRESCRIPTION' | 'DOCUMENTS'>('BUDGETS');
  const [showPatientBudgetModal, setShowPatientBudgetModal] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<TreatmentBudget | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<TreatmentBudget | null>(null);
  const [selectedBudgetForPrint, setSelectedBudgetForPrint] = useState<TreatmentBudget | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  // WhatsApp PDF sharing state
  const [sharingWaBudgetId, setSharingWaBudgetId] = useState<string | null>(null);
  const [waToast, setWaToast] = useState<string | null>(null);

  const handleShareBudgetPdfWhatsApp = async (budget: TreatmentBudget) => {
    try {
      setSharingWaBudgetId(budget.id);
      const doctorObj = doctors.find(d => d.id === budget.doctorId);
      const settings = ClinicalDatabase.getClinicSettings();
      const res = await shareBudgetViaWhatsAppPdf(budget, patient, doctorObj, settings);
      if (res.message) {
        setWaToast(res.message);
        setTimeout(() => setWaToast(null), 6500);
      }
    } catch (err) {
      console.error('Error sharing budget PDF:', err);
    } finally {
      setSharingWaBudgetId(null);
    }
  };

  // New Document Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<'xray' | 'panoramic' | 'tomography' | 'consent' | 'lab_report'>('xray');
  const [docNotes, setDocNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFilePreview, setUploadedFilePreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!docTitle) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        setDocTitle(nameWithoutExt);
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedFilePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isOpen === false) return null;

  const currentDoctor = doctors.find(d => d.id === currentDoctorId) || doctors[0];

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

  // Add Document / Radiography
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

    const fileSizeStr = selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '2.5 MB';

    const newDoc: ClinicalDocument = {
      id: `doc-${Date.now()}`,
      patientId: patient.id,
      title: docTitle,
      category: docCategory,
      url: uploadedFilePreview || sampleUrls[docCategory] || sampleUrls.xray,
      uploadDate: new Date().toISOString().split('T')[0],
      doctorName: currentDoctor.name,
      size: fileSizeStr,
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
    setSelectedFile(null);
    setUploadedFilePreview(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-7xl max-h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Clinical Header Bar */}
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img 
              src="/pagnina.png" 
              alt="Daaron Consulta Dental" 
              className="h-11 w-auto object-contain hidden sm:block print:block"
            />
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-extrabold text-lg shadow-xs">
              {patient.firstName[0]}{patient.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900">
                  {patient.firstName} {patient.lastName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  RUT: {patient.documentId}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {patient.status === 'ACTIVE' ? 'Paciente Activo' : 'Archivado'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Previsión: <strong className="text-slate-800">{patient.insuranceProvider}</strong> • Teléfono: <strong className="text-slate-800">{patient.phone}</strong> • <span className="text-teal-700 font-semibold">Daaron Consulta Dental (Linares)</span>
              </p>
            </div>
          </div>

          {/* Quick Critical Allergy Alert Banner */}
          {patient.allergies.length > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-2xl text-red-700">
              <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold block text-red-800">ALERTA MÉDICA CRÍTICA:</span>
                <span>{patient.allergies.map(a => a.allergen).join(', ')}</span>
              </div>
            </div>
          )}

          {/* Actions & Close */}
          <div className="flex items-center gap-2">
            {activeRole !== 'PATIENT' && onDeletePatient && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 px-3 rounded-full bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 text-xs font-semibold border border-slate-200 hover:border-red-200 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                title="Eliminar Ficha de Paciente"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Eliminar Paciente</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 px-3 rounded-full bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition-all shadow-2xs"
              title="Imprimir Ficha Clínica"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Imprimir Ficha</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Patient Budget Overview Banner */}
        {(() => {
          const patientBudgets = budgets.filter(b => b.patientId === patient.id);
          const totalBudgeted = patientBudgets.reduce((acc, b) => acc + (b?.totalPatient || 0), 0);
          const totalPaid = patientBudgets.reduce((acc, b) => acc + (b?.totalPaid || 0), 0);
          const balanceDue = patientBudgets.reduce((acc, b) => acc + (b?.balanceDue || 0), 0);
          const totalItems = patientBudgets.reduce((acc, b) => acc + (b?.items?.length || 0), 0);

          if (patientBudgets.length > 0) {
            return (
              <div className="bg-blue-50/50 border-b border-blue-100 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <span>Presupuesto Activo:</span>
                    <span className="font-mono text-sm text-slate-900 font-bold">${(totalBudgeted ?? 0).toLocaleString('es-CL')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="text-slate-500">Abonado:</span>
                    <span className="font-mono text-emerald-600 font-semibold">${(totalPaid ?? 0).toLocaleString('es-CL')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="text-slate-500">Saldo Pendiente:</span>
                    <span className="font-mono text-orange-600 font-bold">${(balanceDue ?? 0).toLocaleString('es-CL')}</span>
                  </div>
                  <span className="text-[11px] bg-white text-slate-700 px-2.5 py-0.5 rounded-full font-mono border border-slate-200 font-medium">
                    {totalItems} tratamientos presupuestados
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('BUDGETS')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${
                      activeTab === 'BUDGETS'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Ver Presupuesto del Paciente
                  </button>
                  {patientBudgets[0] && (
                    <button
                      type="button"
                      onClick={() => setSelectedBudgetForPrint(patientBudgets[0])}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-full text-xs font-semibold flex items-center gap-1 border border-slate-200 transition-all shadow-2xs"
                      title="Descargar / Imprimir PDF"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-600" />
                      <span>PDF</span>
                    </button>
                  )}
                </div>
              </div>
            );
          } else {
            return (
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  El paciente aún no cuenta con un presupuesto emitido.
                </span>
                <button
                  type="button"
                  onClick={() => setShowPatientBudgetModal(true)}
                  className="px-3.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold flex items-center gap-1 transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Crear Presupuesto Odontológico
                </button>
              </div>
            );
          }
        })()}

        {/* Tab Navigation */}
        <div className="bg-white border-b border-slate-200 px-6 flex overflow-x-auto gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('BUDGETS')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'BUDGETS'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Presupuestos & Tratamientos</span>
            <span className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-700 border border-slate-200 rounded-full font-mono font-bold">
              {budgets.filter(b => b.patientId === patient.id).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PRESCRIPTION')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'PRESCRIPTION'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Crear Ficha / Receta Médica (PDF)</span>
            <span className="px-2 py-0.5 text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-mono font-bold">
              PDF Oficial
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DOCUMENTS')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'DOCUMENTS'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Radiografías & Visor</span>
            <span className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-700 rounded-full font-mono">
              {patient.documents.length}
            </span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/60">
          
          {/* TAB: GENERADOR DE RECETAS & FICHAS MÉDICAS (PDF) */}
          {activeTab === 'PRESCRIPTION' && (
            <PatientPrescriptionGenerator
              patient={patient}
              doctors={doctors}
              onSaveToHistory={(record) => {
                const newDoc = {
                  id: `doc-${Date.now()}`,
                  name: `Receta Médica - ${record.doctorName} (${record.date})`,
                  type: 'OTHER' as const,
                  url: '#',
                  uploadedAt: record.date,
                  size: 'PDF Oficial'
                };
                onUpdatePatient({
                  ...patient,
                  documents: [newDoc, ...(patient.documents || [])]
                });
              }}
            />
          )}

          {/* TAB 3: PRESUPUESTOS Y PLANES DE TRATAMIENTO */}
          {activeTab === 'BUDGETS' && (
            <div className="flex flex-col gap-6">
              
              {/* Header with New Budget CTA */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    Presupuestos y Tratamientos del Paciente
                  </h3>
                  <p className="text-xs text-slate-500">
                    Historial de cotizaciones, planes odontológicos y desglose por pieza dental.
                  </p>
                </div>

                {activeRole !== 'PATIENT' && (
                  <button
                    type="button"
                    onClick={() => {
                      setBudgetToEdit(null);
                      setShowPatientBudgetModal(true);
                    }}
                    className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    + Crear Nuevo Presupuesto
                  </button>
                )}
              </div>

              {/* Budgets List for this patient */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {budgets.filter(b => b.patientId === patient.id).map(budget => (
                  <div key={budget.id} className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between gap-4">
                    
                    {/* Header */}
                    <div>
                      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                              {budget.budgetNumber}
                            </span>
                            <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {budget.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-800 font-semibold mt-1">Doctor: {budget.doctorName}</p>
                          <p className="text-[11px] text-slate-500">Emisión: {budget.createdAt}</p>
                        </div>

                        <span className="text-xs text-slate-400 font-mono">Validez: 30d</span>
                      </div>

                      {/* Treatments Breakdown with Tooth numbers */}
                      <div className="my-3 flex flex-col gap-1.5">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Tratamientos Presupuestados ({budget.items.length}):
                        </span>
                        <div className="flex flex-col gap-1.5 text-xs max-h-40 overflow-y-auto pr-1">
                          {budget.items.map((item, idx) => (
                            <div key={item.id || idx} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                {item.toothNumber && item.toothNumber > 0 ? (
                                  <span className="shrink-0 bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded">
                                    Pz. {item.toothNumber}
                                  </span>
                                ) : (
                                  <span className="shrink-0 bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.5 rounded">
                                    General
                                  </span>
                                )}
                                <span className="text-slate-800 truncate font-medium">
                                  {item.description}
                                </span>
                              </div>
                              <span className="font-mono font-bold text-slate-900 shrink-0">
                                ${(item?.patientCopay ?? 0).toLocaleString('es-CL')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary & Actions (Download PDF, WhatsApp) */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-semibold">Total Presupuesto:</span>
                        <span className="text-base font-black font-mono text-slate-900">
                          ${(budget?.totalPatient ?? 0).toLocaleString('es-CL')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* WhatsApp CTA (PDF Document) */}
                        <button
                          type="button"
                          onClick={() => handleShareBudgetPdfWhatsApp(budget)}
                          disabled={sharingWaBudgetId === budget.id}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          title="Enviar documento PDF del presupuesto por WhatsApp"
                        >
                          {sharingWaBudgetId === budget.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <MessageSquare className="w-3.5 h-3.5" />
                          )}
                          <span>WhatsApp (PDF)</span>
                        </button>

                        {/* Direct Download PDF */}
                        <button
                          type="button"
                          onClick={() => {
                            const doctorObj = doctors.find(d => d.id === budget.doctorId);
                            downloadBudgetPdf(budget, patient, doctorObj);
                          }}
                          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                          title="Descargar Presupuesto Oficial (PDF)"
                        >
                          <Download className="w-3.5 h-3.5 text-teal-600" />
                          <span>Descargar PDF</span>
                        </button>

                        {/* Print / View Modal */}
                        <button
                          type="button"
                          onClick={() => setSelectedBudgetForPrint(budget)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                          title="Ver / Imprimir Presupuesto"
                        >
                          <Printer className="w-3.5 h-3.5 text-blue-600" />
                          <span>Ver / Imprimir</span>
                        </button>

                        {/* Edit Budget CTA */}
                        {activeRole !== 'PATIENT' && (
                          <button
                            type="button"
                            onClick={() => {
                              setBudgetToEdit(budget);
                              setShowPatientBudgetModal(true);
                            }}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                            title="Editar Presupuesto"
                          >
                            <Pencil className="w-3.5 h-3.5 text-amber-700" />
                            <span>Editar</span>
                          </button>
                        )}

                        {/* Delete Budget CTA */}
                        {activeRole !== 'PATIENT' && onDeleteBudget && (
                          <button
                            type="button"
                            onClick={() => setBudgetToDelete(budget)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                            title="Eliminar Presupuesto"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Eliminar</span>
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                ))}
              </div>

              {waToast && (
                <div className="p-3.5 bg-emerald-900 text-emerald-100 rounded-2xl text-xs flex items-center justify-between gap-3 shadow-lg border border-emerald-700 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-medium">{waToast}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWaToast(null)}
                    className="text-emerald-300 hover:text-white font-bold p-1 rounded cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              )}

              {budgets.filter(b => b.patientId === patient.id).length === 0 && (
                <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-500 text-xs flex flex-col items-center gap-2">
                  <DollarSign className="w-8 h-8 text-slate-400" />
                  <p>Este paciente aún no tiene presupuestos registrados.</p>
                  <button
                    type="button"
                    onClick={() => setShowPatientBudgetModal(true)}
                    className="mt-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold transition-all shadow-xs"
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
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Archivos & Radiografías
                  </h4>
                  {activeRole !== 'PATIENT' && (
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(true)}
                      className="py-1 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-semibold flex items-center gap-1 transition-all shadow-xs"
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
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                        selectedDoc?.id === doc.id
                          ? 'bg-blue-50/80 border-blue-300 text-slate-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="p-2 bg-slate-100 rounded-xl text-blue-600 flex-shrink-0">
                        {doc.category === 'panoramic' || doc.category === 'xray' || doc.category === 'tomography' ? (
                          <ImageIcon className="w-5 h-5" />
                        ) : (
                          <FileCheck className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-bold truncate text-slate-900">{doc.title}</h5>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {doc.uploadDate} • {doc.doctorName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 text-[10px] uppercase font-mono bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                            {doc.category}
                          </span>
                          <span className="text-[10px] text-slate-500">{doc.size}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {patient.documents.length === 0 && (
                    <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-200 rounded-2xl bg-white">
                      No hay archivos ni radiografías cargadas.
                    </div>
                  )}
                </div>
              </div>

              {/* X-Ray / Image Studio Viewer on Right */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                {selectedDoc ? (
                  <div className="bg-slate-900 rounded-3xl border border-slate-800 p-4 flex flex-col gap-3">
                    
                    {/* Viewer Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800 p-2.5 rounded-2xl border border-slate-700 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100">{selectedDoc.title}</span>
                      </div>

                      {/* Filter Adjustments */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Sun className="w-4 h-4 text-amber-400" />
                          <input
                            type="range"
                            min="50"
                            max="200"
                            value={xrayBrightness}
                            onChange={(e) => setXrayBrightness(parseInt(e.target.value))}
                            className="w-20 accent-blue-500"
                            title="Brillo"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Contrast className="w-4 h-4 text-blue-400" />
                          <input
                            type="range"
                            min="50"
                            max="200"
                            value={xrayContrast}
                            onChange={(e) => setXrayContrast(parseInt(e.target.value))}
                            className="w-20 accent-blue-500"
                            title="Contraste"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => setXrayInvert(!xrayInvert)}
                          className={`px-2.5 py-1 rounded font-semibold text-xs transition-all ${
                            xrayInvert ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
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
                          className="p-1.5 rounded bg-slate-700 text-slate-300 hover:text-white"
                          title="Restablecer controles"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Image Canvas Viewport */}
                    <div className="relative w-full h-[400px] sm:h-[480px] bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800">
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
                          <FileCheck className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                          <p className="font-semibold text-sm text-slate-200">{selectedDoc.title}</p>
                          <p className="mt-1">Documento administrativo o consentimiento firmado digitalmente.</p>
                          <p className="text-[11px] text-emerald-400 mt-2">✓ Firma Biométrica Registrada</p>
                        </div>
                      )}

                      {/* Zoom Floating Buttons */}
                      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-700 backdrop-blur-md">
                        <button
                          type="button"
                          onClick={() => setXrayZoom(prev => Math.max(0.5, prev - 0.25))}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-mono text-slate-300 px-1">{Math.round(xrayZoom * 100)}%</span>
                        <button
                          type="button"
                          onClick={() => setXrayZoom(prev => Math.min(3, prev + 0.25))}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Image notes */}
                    {selectedDoc.notes && (
                      <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 text-xs text-slate-200">
                        <strong className="text-blue-400 block mb-0.5">Informe Radiológico / Observaciones:</strong>
                        {selectedDoc.notes}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-96 flex items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-500 text-xs">
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

              {/* Custom File Upload Component */}
              <div className="flex flex-col items-center justify-center my-2">
                <label className="custum-file-upload" htmlFor="radiography-file-upload">
                  <div className="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <g strokeWidth="0" id="SVGRepo_bgCarrier"></g>
                      <g strokeLinejoin="round" strokeLinecap="round" id="SVGRepo_tracerCarrier"></g>
                      <g id="SVGRepo_iconCarrier">
                        <path d="M10 1C9.73478 1 9.48043 1.10536 9.29289 1.29289L3.29289 7.29289C3.10536 7.48043 3 7.73478 3 8V20C3 21.6569 4.34315 23 6 23H7C7.55228 23 8 22.5523 8 22C8 21.4477 7.55228 21 7 21H6C5.44772 21 5 20.5523 5 20V9H10C10.5523 9 11 8.55228 11 8V3H18C18.5523 3 19 3.44772 19 4V9C19 9.55228 19.4477 10 20 10C20.5523 10 21 9.55228 21 9V4C21 2.34315 19.6569 1 18 1H10ZM9 7H6.41421L9 4.41421V7ZM14 15.5C14 14.1193 15.1193 13 16.5 13C17.8807 13 19 14.1193 19 15.5V16V17H20C21.1046 17 22 17.8954 22 19C22 20.1046 21.1046 21 20 21H13C11.8954 21 11 20.1046 11 19C11 17.8954 11.8954 17 13 17H14V16V15.5ZM16.5 11C14.142 11 12.208 12.8136 12.0156 15.122C10.2825 15.5606 9 17.1305 9 19C9 21.2091 10.7909 23 13 23H20C22.2091 23 24 21.2091 24 19C24 17.1305 22.7175 15.5606 20.9844 15.122C20.792 12.8136 18.858 11 16.5 11Z" clipRule="evenodd" fillRule="evenodd"></path>
                      </g>
                    </svg>
                  </div>
                  <div className="text">
                    <span className="text-xs truncate max-w-[240px]">
                      {selectedFile ? selectedFile.name : 'Click to upload image'}
                    </span>
                  </div>
                  <input
                    type="file"
                    id="radiography-file-upload"
                    accept="image/*,.dcm,.pdf"
                    onChange={handleFileChange}
                  />
                </label>
                {uploadedFilePreview && (
                  <p className="text-[11px] text-teal-400 mt-2 font-medium">
                    ✓ Imagen cargada lista para adjuntar
                  </p>
                )}
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

      {/* MODAL: Creador / Editor de Presupuesto para este Paciente */}
      {showPatientBudgetModal && (
        <BudgetBuilderModal
          isOpen={showPatientBudgetModal}
          onClose={() => {
            setShowPatientBudgetModal(false);
            setBudgetToEdit(null);
          }}
          onSaveBudget={(budget) => {
            if (onSaveBudget) onSaveBudget(budget);
            setShowPatientBudgetModal(false);
            setBudgetToEdit(null);
          }}
          patients={[patient]}
          defaultPatient={patient}
          doctors={doctors}
          branches={branches}
          tariffs={tariffs}
          budgetToEdit={budgetToEdit}
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
          onDeleteBudget={onDeleteBudget}
          onEditBudget={(b) => {
            setSelectedBudgetForPrint(null);
            setBudgetToEdit(b);
            setShowPatientBudgetModal(true);
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
                  ¿Estás seguro de que deseas eliminar el presupuesto <strong className="text-slate-900 font-mono">{budgetToDelete.budgetNumber}</strong>?
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
              ⚠️ <strong>Advertencia:</strong> Esta acción no se puede deshacer y removerá este presupuesto del historial del paciente.
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

      {/* MODAL: Confirmación de Eliminación de Paciente desde Ficha Clínica */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0 shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base text-slate-900">
                  ¿Eliminar ficha clínica?
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  ¿Estás seguro de que deseas eliminar permanentemente la ficha de <strong className="text-slate-900">{patient.firstName} {patient.lastName}</strong>?
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    RUT: {patient.documentId}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200/80 p-3.5 rounded-2xl text-xs text-red-700 leading-relaxed">
              ⚠️ <strong>Advertencia:</strong> Esta acción no se puede deshacer. Se borrarán permanentemente sus citas, evoluciones, imágenes radiográficas y presupuestos guardados.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeletePatient) {
                    onDeletePatient(patient.id);
                  }
                  setShowDeleteConfirm(false);
                  onClose();
                }}
                className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, Eliminar Paciente</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
