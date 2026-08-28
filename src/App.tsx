import React, { useState } from 'react';
import { 
  Patient, 
  Appointment, 
  AppointmentStatus, 
  TreatmentBudget, 
  PaymentTransaction, 
  CashRegisterSession, 
  UserRole,
  Branch,
  ProfessionalDoctor,
  ClinicalEvolution
} from './types/clinical';
import { 
  INITIAL_PATIENTS, 
  INITIAL_DOCTORS, 
  INITIAL_BRANCHES, 
  INITIAL_TARIFFS, 
  INITIAL_BUDGETS, 
  INITIAL_PAYMENTS, 
  INITIAL_CASH_SESSION, 
  INITIAL_APPOINTMENTS 
} from './data/initialData';
import { ClinicalDatabase } from './services/db';
import { PatientList } from './components/patients/PatientList';
import { PatientDetailModal } from './components/patients/PatientDetailModal';
import { AgendaView } from './components/agenda/AgendaView';
import { BillingDashboard } from './components/billing/BillingDashboard';
import { ArchitectureGuideModal } from './components/architecture/ArchitectureGuideModal';
import { DatabaseManagerModal } from './components/database/DatabaseManagerModal';
import { 
  Activity, 
  Calendar, 
  DollarSign, 
  Users, 
  ShieldCheck, 
  Building2, 
  Layers, 
  Code, 
  CheckCircle2, 
  Stethoscope, 
  UserCheck, 
  Heart,
  FileSpreadsheet,
  Zap,
  Sparkles,
  HelpCircle,
  Menu,
  X,
  Database
} from 'lucide-react';

export default function App() {
  // Master Domain State backed by ClinicalDatabase (Local Persistence)
  const [patients, setPatients] = useState<Patient[]>(() => ClinicalDatabase.getPatients());
  const [doctors, setDoctors] = useState<ProfessionalDoctor[]>(INITIAL_DOCTORS);
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [tariffs] = useState(INITIAL_TARIFFS);
  const [budgets, setBudgets] = useState<TreatmentBudget[]>(() => ClinicalDatabase.getBudgets());
  const [payments, setPayments] = useState<PaymentTransaction[]>(() => ClinicalDatabase.getPayments());
  const [cashSession, setCashSession] = useState<CashRegisterSession>(() => ClinicalDatabase.getCashSession());
  const [appointments, setAppointments] = useState<Appointment[]>(() => ClinicalDatabase.getAppointments());

  // App Navigation & Context State
  const [activeTab, setActiveTab] = useState<'PATIENTS' | 'AGENDA' | 'BILLING'>('PATIENTS');
  const [selectedPatientForDetail, setSelectedPatientForDetail] = useState<Patient | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('ADMIN');
  const [currentBranchId, setCurrentBranchId] = useState<string>('branch-1');
  const [showArchGuide, setShowArchGuide] = useState(false);
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Current active doctor (defaults to Dr. Felipe Morales or first doctor)
  const currentDoctor = doctors[0];
  const activeBranch = branches.find(b => b.id === currentBranchId) || branches[0];

  // Reload database state after import or reset
  const handleReloadDatabase = () => {
    setPatients(ClinicalDatabase.getPatients());
    setBudgets(ClinicalDatabase.getBudgets());
    setAppointments(ClinicalDatabase.getAppointments());
    setPayments(ClinicalDatabase.getPayments());
    setCashSession(ClinicalDatabase.getCashSession());
  };

  // Update a single patient in the list
  const handleUpdatePatient = (updatedPatient: Patient) => {
    setPatients(prev => {
      const next = prev.map(p => p.id === updatedPatient.id ? updatedPatient : p);
      ClinicalDatabase.savePatients(next);
      return next;
    });
    if (selectedPatientForDetail && selectedPatientForDetail.id === updatedPatient.id) {
      setSelectedPatientForDetail(updatedPatient);
    }
  };

  // Add new patient
  const handleAddNewPatient = (newPatient: Patient) => {
    setPatients(prev => {
      const next = [newPatient, ...prev];
      ClinicalDatabase.savePatients(next);
      return next;
    });
  };

  // Update appointment status
  const handleUpdateAppointmentStatus = (aptId: string, newStatus: AppointmentStatus) => {
    setAppointments(prev => {
      const next = prev.map(apt => apt.id === aptId ? { ...apt, status: newStatus } : apt);
      ClinicalDatabase.saveAppointments(next);
      return next;
    });
  };

  // Add new appointment
  const handleAddNewAppointment = (newApt: Appointment) => {
    setAppointments(prev => {
      const next = [newApt, ...prev];
      ClinicalDatabase.saveAppointments(next);
      return next;
    });
  };

  // Save new treatment budget AND automatically sync to patient's clinical file
  const handleSaveBudget = (newBudget: TreatmentBudget) => {
    // 1. Add budget to state & persist to Database
    setBudgets(prev => {
      const next = [newBudget, ...prev];
      ClinicalDatabase.saveBudgets(next);
      return next;
    });

    // 2. Automatically register this budget into the patient's clinical evolution record (SOAP)
    const targetPatient = patients.find(p => p.id === newBudget.patientId);
    if (targetPatient) {
      const teethTreatedList = newBudget.items
        .map(i => i.toothNumber)
        .filter((n): n is number => typeof n === 'number' && n > 0);

      const itemsSummary = newBudget.items
        .map(i => `${i.toothNumber && i.toothNumber > 0 ? `[Pz. ${i.toothNumber}] ` : ''}${i.description} ($${i.patientCopay.toLocaleString('es-CL')})`)
        .join(', ');

      const newEvolution: ClinicalEvolution = {
        id: `evo-budget-${Date.now()}`,
        patientId: newBudget.patientId,
        branchId: newBudget.branchId || currentBranchId,
        date: newBudget.createdAt,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        doctorId: newBudget.doctorId,
        doctorName: newBudget.doctorName,
        specialty: 'Odontología General & Planificación',
        subjective: 'Presentación y emisión de presupuesto dental con selección de piezas clínicas.',
        objective: `Plan de tratamiento presupuestado (${newBudget.items.length} ítems): ${itemsSummary}`,
        assessment: `Presupuesto Folio ${newBudget.budgetNumber} registrado en ficha clínica.`,
        plan: `Total Paciente: $${newBudget.totalPatient.toLocaleString('es-CL')} (Descuento aplicado: $${newBudget.discountTotal.toLocaleString('es-CL')}). Se programa agendamiento de sesiones.`,
        signed: true,
        teethInvolved: teethTreatedList,
        prescriptions: [],
        signatureStamp: `Dr(a). ${newBudget.doctorName} • Cód. Reg. ${newBudget.doctorId.toUpperCase()} • Ficha Digital Cima`
      };

      const updatedPatient: Patient = {
        ...targetPatient,
        evolutions: [newEvolution, ...targetPatient.evolutions]
      };

      setPatients(prev => {
        const next = prev.map(p => p.id === updatedPatient.id ? updatedPatient : p);
        ClinicalDatabase.savePatients(next);
        return next;
      });

      if (selectedPatientForDetail && selectedPatientForDetail.id === updatedPatient.id) {
        setSelectedPatientForDetail(updatedPatient);
      }
    }
  };

  // Process payment
  const handleProcessPayment = (newPayment: PaymentTransaction) => {
    setPayments(prev => {
      const next = [newPayment, ...prev];
      ClinicalDatabase.savePayments(next);
      return next;
    });
    
    // If associated with a budget, update budget balance
    if (newPayment.budgetId) {
      setBudgets(prev => {
        const next = prev.map(b => {
          if (b.id === newPayment.budgetId) {
            const newPaid = b.totalPaid + newPayment.amount;
            const newBalance = Math.max(0, b.totalPatient - newPaid);
            const newStatus = newBalance === 0 ? 'PAID' : 'IN_TREATMENT';
            return {
              ...b,
              totalPaid: newPaid,
              balanceDue: newBalance,
              status: newStatus
            };
          }
          return b;
        });
        ClinicalDatabase.saveBudgets(next);
        return next;
      });
    }

    // Update cash session if paid in cash
    if (newPayment.paymentMethod === 'CASH') {
      setCashSession(prev => {
        const next = {
          ...prev,
          totalCashIncome: prev.totalCashIncome + newPayment.amount,
          expectedCashTotal: prev.expectedCashTotal + newPayment.amount
        };
        ClinicalDatabase.saveCashSession(next);
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      
      {/* ================= TOP NAVIGATION BAR ================= */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <img 
              src="/L.png" 
              alt="Daaron Consulta Dental" 
              className="h-10 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                  Daaron Consulta Dental
                </span>
                <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold">
                  Linares
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden md:block">
                Maipú 461, Local 304, Piso 3 • Edificio Salman
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('PATIENTS')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === 'PATIENTS' ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Pacientes & Fichas ({patients.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('AGENDA')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === 'AGENDA' ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Agenda & Citas ({appointments.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('BILLING')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === 'BILLING' ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Presupuestos & Caja</span>
            </button>
          </nav>

          {/* Right Controls: Branch, Role & Senior Architecture Guide */}
          <div className="flex items-center gap-2.5">
            
            {/* Branch Selector */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
              <Building2 className="w-3.5 h-3.5 text-teal-400" />
              <select
                value={currentBranchId}
                onChange={(e) => setCurrentBranchId(e.target.value)}
                className="bg-transparent text-slate-300 font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900">Todas las Sucursales</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id} className="bg-slate-900">{b.name}</option>
                ))}
              </select>
            </div>

            {/* Role Switcher */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <select
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value as UserRole)}
                className="bg-transparent text-slate-300 font-medium focus:outline-none cursor-pointer"
              >
                <option value="ADMIN" className="bg-slate-900">Rol: Administrador</option>
                <option value="DOCTOR" className="bg-slate-900">Rol: Odontólogo</option>
                <option value="RECEPTIONIST" className="bg-slate-900">Rol: Recepcionista</option>
                <option value="PATIENT" className="bg-slate-900">Rol: Paciente</option>
              </select>
            </div>

            {/* Technical Architecture & SQL Schema Guide Button */}
            <button
              type="button"
              onClick={() => setShowArchGuide(true)}
              className="py-1.5 px-3 bg-gradient-to-r from-teal-600/30 to-blue-600/30 hover:from-teal-600/50 hover:to-blue-600/50 text-teal-300 border border-teal-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              title="Ver Esquemas SQL PostgreSQL, Arquitectura HIPAA y API REST"
            >
              <Code className="w-4 h-4" />
              <span className="hidden sm:inline">Esquema SQL & API</span>
            </button>

            {/* Database Storage Manager Button */}
            <button
              type="button"
              onClick={() => setShowDatabaseModal(true)}
              className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-teal-400 hover:text-teal-300 border border-teal-500/30 hover:border-teal-500/60 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              title="Administrar Base de Datos: Exportar JSON, Importar y Estado de Almacenamiento"
            >
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Base de Datos</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 text-slate-400 border border-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-col gap-2 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setActiveTab('PATIENTS'); setMobileMenuOpen(false); }}
                className={`p-2.5 rounded-xl flex items-center justify-center gap-1.5 ${
                  activeTab === 'PATIENTS' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Pacientes</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('AGENDA'); setMobileMenuOpen(false); }}
                className={`p-2.5 rounded-xl flex items-center justify-center gap-1.5 ${
                  activeTab === 'AGENDA' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Agenda</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('BILLING'); setMobileMenuOpen(false); }}
                className={`p-2.5 rounded-xl flex items-center justify-center gap-1.5 ${
                  activeTab === 'BILLING' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Caja & Cobros</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
              <select
                value={currentBranchId}
                onChange={(e) => setCurrentBranchId(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg p-2 flex-1"
              >
                <option value="ALL">Todas las Sucursales</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>

              <select
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value as UserRole)}
                className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg p-2 flex-1"
              >
                <option value="ADMIN">Rol: Admin</option>
                <option value="DOCTOR">Rol: Doctor</option>
                <option value="RECEPTIONIST">Rol: Recepción</option>
                <option value="PATIENT">Rol: Paciente</option>
              </select>
            </div>
          </div>
        )}
      </header>

      {/* ================= MAIN CONTENT CONTAINER ================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        
        {/* VIEW 1: PACIENTES & FICHAS */}
        {activeTab === 'PATIENTS' && (
          <PatientList
            patients={patients}
            budgets={budgets}
            onSelectPatient={(patient) => setSelectedPatientForDetail(patient)}
            onAddNewPatient={handleAddNewPatient}
            activeRole={activeRole}
            doctors={doctors}
          />
        )}

        {/* VIEW 2: AGENDA & CITAS */}
        {activeTab === 'AGENDA' && (
          <AgendaView
            appointments={appointments}
            patients={patients}
            doctors={doctors}
            branches={branches}
            tariffs={tariffs}
            onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
            onAddNewAppointment={handleAddNewAppointment}
            onOpenPatientFile={(patient) => setSelectedPatientForDetail(patient)}
            activeRole={activeRole}
            currentBranchId={currentBranchId}
          />
        )}

        {/* VIEW 3: PRESUPUESTOS & CAJA */}
        {activeTab === 'BILLING' && (
          <BillingDashboard
            budgets={budgets}
            payments={payments}
            cashSession={cashSession}
            patients={patients}
            doctors={doctors}
            branches={branches}
            tariffs={tariffs}
            onSaveBudget={handleSaveBudget}
            onProcessPayment={handleProcessPayment}
            onUpdateCashSession={(updated) => setCashSession(updated)}
            activeRole={activeRole}
            currentBranchId={currentBranchId}
          />
        )}

      </main>

      {/* ================= FOOTER ================= */}
      <footer className="bg-slate-900/80 border-t border-slate-800 text-xs text-slate-400 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-slate-300 font-semibold">Cima Dental SaaS Platform</span>
            <span>• Conectado a Sucursal {activeBranch.name}</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              HIPAA & Law 20.584 Compliant
            </span>
            <button
              type="button"
              onClick={() => setShowArchGuide(true)}
              className="text-teal-400 hover:underline font-semibold"
            >
              Guía de Arquitectura SQL
            </button>
          </div>
        </div>
      </footer>

      {/* ================= MODAL: FICHA CLÍNICA COMPLETA DEL PACIENTE ================= */}
      {selectedPatientForDetail && (
        <PatientDetailModal
          patient={selectedPatientForDetail}
          isOpen={Boolean(selectedPatientForDetail)}
          onClose={() => setSelectedPatientForDetail(null)}
          onUpdatePatient={handleUpdatePatient}
          activeRole={activeRole}
          doctors={doctors}
          branches={branches}
          tariffs={tariffs}
          budgets={budgets}
          patients={patients}
          onSaveBudget={handleSaveBudget}
        />
      )}

      {/* ================= MODAL: GUÍA TÉCNICA Y ESQUEMA SQL POSTGRESQL ================= */}
      <ArchitectureGuideModal
        isOpen={showArchGuide}
        onClose={() => setShowArchGuide(false)}
      />

      {/* ================= MODAL: ADMINISTRADOR DE BASE DE DATOS Y RESPALDOS ================= */}
      <DatabaseManagerModal
        isOpen={showDatabaseModal}
        onClose={() => setShowDatabaseModal(false)}
        onDataRestored={handleReloadDatabase}
      />

    </div>
  );
}
