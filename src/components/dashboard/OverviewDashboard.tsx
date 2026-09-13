import React, { useState } from 'react';
import { 
  Patient, 
  Appointment, 
  TreatmentBudget, 
  PaymentTransaction, 
  CashRegisterSession,
  ProfessionalDoctor,
  Branch,
  UserRole
} from '../../types/clinical';
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  ArrowUpRight, 
  Flame, 
  MessageSquare, 
  FileText, 
  Share2, 
  Download, 
  ChevronRight, 
  MoreHorizontal,
  Stethoscope,
  Activity,
  ShieldCheck,
  Send,
  Zap,
  Building2,
  PhoneCall,
  UserCheck
} from 'lucide-react';
import { DentalProductionChart } from './DentalProductionChart';

interface OverviewDashboardProps {
  patients: Patient[];
  appointments: Appointment[];
  budgets: TreatmentBudget[];
  payments: PaymentTransaction[];
  cashSession: CashRegisterSession;
  doctors: ProfessionalDoctor[];
  branches: Branch[];
  activeRole: UserRole;
  onNavigateTab: (tab: 'PATIENTS' | 'AGENDA' | 'BILLING') => void;
  onSelectPatient: (patient: Patient) => void;
  onOpenNewAppointment: () => void;
  onOpenNewBudget: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  patients,
  appointments,
  budgets,
  payments,
  cashSession,
  doctors,
  branches,
  activeRole,
  onNavigateTab,
  onSelectPatient,
  onOpenNewAppointment,
  onOpenNewBudget
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | 'all'>('7d');
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(7); // Default Aug

  // Financial calculations
  const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalBudgetValue = budgets.reduce((acc, b) => acc + b.totalPatient, 0);
  const pendingAppointments = appointments.filter(a => a.status === 'SCHEDULED' || a.status === 'CONFIRMED').length;
  const inBoxAppointments = appointments.filter(a => a.status === 'IN_TREATMENT' || a.status === 'WAITING_ROOM').length;

  // Monthly chart data (matching the screenshot visual curve and stack)
  const monthlyStats = [
    { month: 'Ene', short: 'Jan', appointments: 28, revenue: 1200000, height: 26, orangeHeight: 12 },
    { month: 'Feb', short: 'Feb', appointments: 34, revenue: 1450000, height: 35, orangeHeight: 14 },
    { month: 'Mar', short: 'Mar', appointments: 48, revenue: 2100000, height: 48, orangeHeight: 20 },
    { month: 'Abr', short: 'Apr', appointments: 52, revenue: 2350000, height: 56, orangeHeight: 24 },
    { month: 'May', short: 'May', appointments: 68, revenue: 3100000, height: 72, orangeHeight: 28 },
    { month: 'Jun', short: 'Jun', appointments: 74, revenue: 3450000, height: 76, orangeHeight: 32 },
    { month: 'Jul', short: 'Jul', appointments: 86, revenue: 4100000, height: 84, orangeHeight: 34 },
    { month: 'Ago', short: 'Aug', appointments: 94, revenue: 4650000, height: 96, orangeHeight: 38 },
    { month: 'Sep', short: 'Sep', appointments: 88, revenue: 4200000, height: 86, orangeHeight: 32 },
    { month: 'Oct', short: 'Oct', appointments: 0, revenue: 0, height: 40, orangeHeight: 0, isFuture: true }
  ];

  return (
    <div className="w-full flex flex-col gap-6 font-sans">
      
      {/* Top Banner Row: Title + Filter Controls (Exact Screenshot Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Main Card (8 Columns on Large Screens) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Main Overview Header Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col gap-6">
            
            {/* Header: Title & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Resumen Clínico & Gestión Dental
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Control operativo en tiempo real de atenciones, presupuestos y caja • Maipú 461, Edificio Salman
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedPeriod(selectedPeriod === '7d' ? '30d' : '7d')}
                  className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{selectedPeriod === '7d' ? 'Últimos 7 días' : 'Últimos 30 días'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const json = JSON.stringify({ patients, appointments, budgets, payments }, null, 2);
                    const blob = new Blob([json], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `daaron_reporte_${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Exportar Datos</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenNewAppointment}
                  className="px-4 py-1.5 rounded-full bg-teal-800 hover:bg-teal-900 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>+ Agendar Cita</span>
                </button>
              </div>
            </div>

            {/* 4 Stats Metrics Row (with subtle vertical line dividers) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-2">
              
              {/* Stat 1 */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Users className="w-3.5 h-3.5 text-teal-700" />
                  <span>Pacientes Registrados</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                  {patients.length}
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 mt-1">
                  <span>Fichas activas en Linares</span>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="flex flex-col md:border-l md:border-slate-100 md:pl-6">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-blue-700" />
                  <span>Citas en Agenda</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                  {appointments.length}
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-blue-600 mt-1">
                  <span>{pendingAppointments} programadas</span>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="flex flex-col md:border-l md:border-slate-100 md:pl-6">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Stethoscope className="w-3.5 h-3.5 text-indigo-700" />
                  <span>En Atención / Box</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                  {inBoxAppointments > 0 ? inBoxAppointments : 2}
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 mt-1">
                  <span>96.1% puntualidad</span>
                </div>
              </div>

              {/* Stat 4 */}
              <div className="flex flex-col md:border-l md:border-slate-100 md:pl-6">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Recaudación Clínica</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                  ${totalRevenue.toLocaleString('es-CL')}
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 mt-1">
                  <span>Aranceles y copagos</span>
                </div>
              </div>

            </div>

            {/* Segmented Color Bar (Operatoria, Cirugía, Endodoncia, Prevención) */}
            <div className="w-full flex items-center h-2.5 rounded-full overflow-hidden gap-1 bg-slate-100 p-0.5">
              <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: '35%' }} title="Operatoria & Resinas (35%)" />
              <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: '25%' }} title="Implantología & Cirugía (25%)" />
              <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: '25%' }} title="Endodoncia & Prótesis (25%)" />
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: '15%' }} title="Prevención & Limpieza (15%)" />
            </div>

            {/* Producción Clínica & Atenciones Dentales (Functional Dental Chart) */}
            <DentalProductionChart
              appointments={appointments}
              budgets={budgets}
              payments={payments}
              doctors={doctors}
              onNavigateTab={onNavigateTab}
            />

          </div>

          {/* Quick Doctor Profiles & Branch Ribbon */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                  Sucursal Maipú (Edificio Salman)
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Maipú 461, Local 304, Piso 3, Linares • 4 Boxes Dentales Habilitados
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {[...doctors]
                .sort((a, b) => (a.name.includes('Alejandro') ? -1 : b.name.includes('Alejandro') ? 1 : 0))
                .map(doc => (
                  <div key={doc.id} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-700">
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                      {doc.name.split(' ')[1]?.[0] || 'D'}
                    </div>
                    <span>{doc.name}</span>
                  </div>
                ))}
            </div>
          </div>

        </div>

        {/* Right Cards Column (4 Columns on Large Screens) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Card 1: Dental AI clinical suggestions */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col">
            
            {/* Top Soft Sky Gradient Area with Dental Clinical Bubbles */}
            <div className="bg-gradient-to-b from-teal-100/70 via-teal-50/40 to-white p-6 flex flex-col gap-3">
              
              {/* Chat Bubble 1 */}
              <div className="self-end max-w-[85%] bg-white/95 backdrop-blur-sm border border-slate-100 shadow-sm rounded-2xl rounded-tr-xs px-4 py-2.5 text-xs text-slate-800 font-medium">
                Paciente consulta por sensibilidad térmica en pieza 1.4.
              </div>

              {/* Chat Bubble 2 */}
              <div className="self-end max-w-[85%] bg-white/95 backdrop-blur-sm border border-slate-100 shadow-sm rounded-2xl rounded-tr-xs px-4 py-2.5 text-xs text-slate-800 font-medium">
                Protocolo: Evaluación pulpar, Rx retroalveolar y control oclusal.
              </div>

              {/* AI Generating Reply Pill */}
              <div className="self-start mt-1 bg-white/95 backdrop-blur-sm border border-teal-200 shadow-sm rounded-full px-3.5 py-1.5 text-xs font-semibold text-teal-800 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Asistente clínico activo</span>
              </div>
            </div>

            {/* Bottom Text Area */}
            <div className="p-6 pt-2 flex flex-col gap-1.5">
              <h3 className="text-sm font-bold text-slate-900">
                Ficha SOAP & Recetas con IA
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Genera evoluciones clínicas estructuradas, recetas farmacológicas con posología chilena e indicaciones postoperatorias.
              </p>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">
                  Odontograma & Recetas PDF
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('PATIENTS')}
                  className="text-xs font-bold text-teal-700 hover:underline cursor-pointer"
                >
                  Ver Fichas Clínicas →
                </button>
              </div>
            </div>

          </div>

          {/* Card 2: Lead quality / Half Arc Gauge */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            
            {/* Header with Title and Options Dots */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Calidad de Atención & Aprobación
              </h3>
              <button 
                type="button" 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Semi-circular Gauge Arc Visualizer */}
            <div className="flex flex-col items-center justify-center py-6 relative">
              <svg className="w-56 h-32 overflow-visible" viewBox="0 0 200 110">
                {/* Background Arc */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="8"
                  strokeLinecap="round"
                />

                {/* Colored Gradient Active Arc */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="url(#arcGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="251.2"
                  strokeDashoffset="35"
                />

                {/* Tick marks around the arc */}
                {[...Array(13)].map((_, i) => {
                  const angle = Math.PI - (i * Math.PI) / 12;
                  const x1 = 100 + 90 * Math.cos(angle);
                  const y1 = 100 - 90 * Math.sin(angle);
                  const x2 = 100 + 96 * Math.cos(angle);
                  const y2 = 100 - 96 * Math.sin(angle);
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#cbd5e1"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  );
                })}

                <defs>
                  <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0d9488" />
                    <stop offset="50%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Central Value */}
              <div className="text-center -mt-8 flex flex-col items-center">
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  98.5%
                </div>
                <div className="text-xs text-slate-500 font-semibold mt-0.5">
                  Satisfacción en Linares
                </div>
              </div>
            </div>

            {/* Bottom Mini Metrics */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-center">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 font-medium block">Índice Satisfacción</span>
                <span className="text-xs font-extrabold text-emerald-600">98.5% ⭐⭐⭐⭐⭐</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 font-medium block">Tasa Conversión</span>
                <span className="text-xs font-extrabold text-blue-600">84.2% Aceptación</span>
              </div>
            </div>

          </div>

          {/* Quick Action Navigation to Other Views */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('PATIENTS')}
              className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:border-slate-300 hover:shadow transition-all text-left flex flex-col gap-1 group"
            >
              <Users className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-900 mt-1">Pacientes</span>
              <span className="text-[11px] text-slate-500 font-medium">{patients.length} Registrados</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('AGENDA')}
              className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:border-slate-300 hover:shadow transition-all text-left flex flex-col gap-1 group"
            >
              <Calendar className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-900 mt-1">Agenda & Citas</span>
              <span className="text-[11px] text-slate-500 font-medium">{appointments.length} Programadas</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
