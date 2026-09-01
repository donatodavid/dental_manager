import React, { useState, useEffect } from 'react';
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
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
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
  Database,
  LayoutDashboard
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
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PATIENTS' | 'AGENDA' | 'BILLING'>('OVERVIEW');
  const [selectedPatientForDetail, setSelectedPatientForDetail] = useState<Patient | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('ADMIN');
  const [currentBranchId, setCurrentBranchId] = useState<string>('branch-1');
  const [showArchGuide, setShowArchGuide] = useState(false);
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Current active doctor (defaults to Dr. Felipe Morales or first doctor)
  const currentDoctor = doctors[0];
  const activeBranch = branches.find(b => b.id === currentBranchId) || branches[0];

  // Reload database state after import, sync, or reset
  const handleReloadDatabase = () => {
    setPatients(ClinicalDatabase.getPatients());
    setBudgets(ClinicalDatabase.getBudgets());
    setAppointments(ClinicalDatabase.getAppointments());
    setPayments(ClinicalDatabase.getPayments());
    setCashSession(ClinicalDatabase.getCashSession());
  };

  // Initialize Cloud SQL synchronization on mount
  useEffect(() => {
    ClinicalDatabase.initCloudSync().then(() => {
      handleReloadDatabase();
    });
  }, []);

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

  // Delete a patient
  const handleDeletePatient = (patientId: string) => {
    setPatients(prev => {
      const next = prev.filter(p => p.id !== patientId);
      ClinicalDatabase.savePatients(next);
      return next;
    });
    ClinicalDatabase.deletePatient(patientId);
    if (selectedPatientForDetail && selectedPatientForDetail.id === patientId) {
      setSelectedPatientForDetail(null);
    }
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

  // Delete budget
  const handleDeleteBudget = (budgetId: string) => {
    setBudgets(prev => {
      const next = prev.filter(b => b.id !== budgetId);
      ClinicalDatabase.saveBudgets(next);
      return next;
    });
    ClinicalDatabase.deleteBudget(budgetId);
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

  // Reset monthly earnings and accounting payments for new period
  const handleResetMonthlyEarnings = () => {
    setPayments([]);
    ClinicalDatabase.savePayments([]);
    setCashSession(prev => {
      const opening = typeof prev?.openingCash === 'number' ? prev.openingCash : 120000;
      const next: CashRegisterSession = {
        ...prev,
        totalCashIncome: 0,
        totalCardIncome: 0,
        totalTransferIncome: 0,
        totalInsuranceIncome: 0,
        totalExpenses: 0,
        expectedCashTotal: opening
      };
      ClinicalDatabase.saveCashSession(next);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* ================= TOP NAVIGATION BAR ================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-[0_2px_15px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <img 
              src="/pagnina.png" 
              alt="Daaron Consulta Dental" 
              className="h-10 w-auto object-contain drop-shadow-xs hover:scale-105 transition-transform"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                  Daaron Consulta Dental
                </span>
                <span className="hidden sm:inline text-[10px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                  Linares
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden md:block">
                Maipú 461, Local 304, Piso 3 • Edificio Salman
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('OVERVIEW')}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all ${
                activeTab === 'OVERVIEW' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Resumen</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('PATIENTS')}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all ${
                activeTab === 'PATIENTS' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Pacientes ({patients.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('AGENDA')}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all ${
                activeTab === 'AGENDA' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Agenda ({appointments.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('BILLING')}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all ${
                activeTab === 'BILLING' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Caja & Cobros</span>
            </button>
          </nav>

          {/* Right Controls: Branch, Role & Architecture Guide */}
          <div className="flex items-center gap-2">
            
            {/* Branch Selector */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 text-xs">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <select
                value={currentBranchId}
                onChange={(e) => setCurrentBranchId(e.target.value)}
                className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ALL">Todas las Sucursales</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Role Switcher */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-slate-700" />
              <select
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value as UserRole)}
                className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ADMIN">Rol: Administrador</option>
                <option value="DOCTOR">Rol: Odontólogo</option>
                <option value="RECEPTIONIST">Rol: Recepcionista</option>
                <option value="PATIENT">Rol: Paciente</option>
              </select>
            </div>

            {/* Technical Architecture & SQL Schema Guide Button */}
            <button
              type="button"
              onClick={() => setShowArchGuide(true)}
              className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
              title="Ver Esquemas SQL PostgreSQL, Arquitectura HIPAA y API REST"
            >
              <Code className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Esquema SQL</span>
            </button>

            {/* Database Storage Manager Button */}
            <button
              type="button"
              onClick={() => setShowDatabaseModal(true)}
              className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
              title="Administrar Base de Datos: Exportar JSON, Importar y Estado de Almacenamiento"
            >
              <Database className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Base de Datos</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex flex-col gap-2 animate-in slide-in-from-top-2 shadow-lg">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setActiveTab('OVERVIEW'); setMobileMenuOpen(false); }}
                className={`p-2.5 rounded-xl flex items-center justify-center gap-1.5 ${
                  activeTab === 'OVERVIEW' ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-700'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Resumen</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('PATIENTS'); setMobileMenuOpen(false); }}
                className={`p-2.5 rounded-xl flex items-center justify-center gap-1.5 ${
                  activeTab === 'PATIENTS' ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-700'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Pacientes</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('AGENDA'); setMobileMenuOpen(false); }}
                className={`p-2.5 rounded-xl flex items-center justify-center gap-1.5 ${
                  activeTab === 'AGENDA' ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-700'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Agenda</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('BILLING'); setMobileMenuOpen(false); }}
                className={`p-2.5 rounded-xl flex items-center justify-center gap-1.5 ${
                  activeTab === 'BILLING' ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-700'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Caja</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <select
                value={currentBranchId}
                onChange={(e) => setCurrentBranchId(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl p-2 flex-1"
              >
                <option value="ALL">Todas las Sucursales</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>

              <select
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value as UserRole)}
                className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl p-2 flex-1"
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
        
        {/* VIEW 0: RESUMEN / DASHBOARD (MATCHING SCREENSHOT) */}
        {activeTab === 'OVERVIEW' && (
          <OverviewDashboard
            patients={patients}
            appointments={appointments}
            budgets={budgets}
            payments={payments}
            cashSession={cashSession}
            doctors={doctors}
            branches={branches}
            activeRole={activeRole}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onSelectPatient={(patient) => setSelectedPatientForDetail(patient)}
            onOpenNewAppointment={() => setActiveTab('AGENDA')}
            onOpenNewBudget={() => setActiveTab('BILLING')}
          />
        )}

        {/* VIEW 1: PACIENTES & FICHAS */}
        {activeTab === 'PATIENTS' && (
          <PatientList
            patients={patients}
            budgets={budgets}
            onSelectPatient={(patient) => setSelectedPatientForDetail(patient)}
            onAddNewPatient={handleAddNewPatient}
            onDeletePatient={handleDeletePatient}
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
            onDeleteBudget={handleDeleteBudget}
            onProcessPayment={handleProcessPayment}
            onUpdateCashSession={(updated) => setCashSession(updated)}
            onResetMonthlyEarnings={handleResetMonthlyEarnings}
            activeRole={activeRole}
            currentBranchId={currentBranchId}
          />
        )}

      </main>

      {/* ================= FOOTER ================= */}
      <footer className="bg-white border-t border-slate-200/90 text-xs text-slate-500 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-slate-800 font-bold">Daaron Consulta Dental</span>
            <span>• Sucursal {activeBranch.name} ({activeBranch.address})</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              HIPAA & Ley 20.584 Ficha Clínica Digital
            </span>
            <button
              type="button"
              onClick={() => setShowArchGuide(true)}
              className="text-blue-600 hover:underline font-semibold"
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
          onDeletePatient={handleDeletePatient}
          activeRole={activeRole}
          doctors={doctors}
          branches={branches}
          tariffs={tariffs}
          budgets={budgets}
          patients={patients}
          onSaveBudget={handleSaveBudget}
          onDeleteBudget={handleDeleteBudget}
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
