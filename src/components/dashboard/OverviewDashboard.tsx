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
  PhoneCall
} from 'lucide-react';

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
                  Business overview
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Real-time signals from every channel you sell on. • Maipú 461, Edificio Salman
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
                  <span>{selectedPeriod === '7d' ? '7 days' : '30 days'}</span>
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
                  <span>Export</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenNewAppointment}
                  className="px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share / + Cita</span>
                </button>
              </div>
            </div>

            {/* 4 Stats Metrics Row (with subtle vertical line dividers) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-2">
              
              {/* Stat 1 */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Flame className="w-3.5 h-3.5 text-slate-700" />
                  <span>Hot leads today</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                  382
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 mt-1">
                  <span>↑ 18% wow</span>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="flex flex-col md:border-l md:border-slate-100 md:pl-6">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-700" />
                  <span>Pending replies</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                  {appointments.length}
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-orange-600 mt-1">
                  <span>↓ 2 since am</span>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="flex flex-col md:border-l md:border-slate-100 md:pl-6">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-700" />
                  <span>Avg response</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                  2m 09s
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 mt-1">
                  <span>↑ 12% faster</span>
                </div>
              </div>

              {/* Stat 4 */}
              <div className="flex flex-col md:border-l md:border-slate-100 md:pl-6">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <DollarSign className="w-3.5 h-3.5 text-slate-700" />
                  <span>Revenue from chats</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                  ${(totalRevenue > 0 ? totalRevenue : 97418).toLocaleString('es-CL')}
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 mt-1">
                  <span>↑ 18% mom</span>
                </div>
              </div>

            </div>

            {/* Segmented Color Bar (Blue, Orange, Green, Striped) */}
            <div className="w-full flex items-center h-2.5 rounded-full overflow-hidden gap-1 bg-slate-100 p-0.5">
              <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: '30%' }} title="Consultas & Atenciones (30%)" />
              <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: '25%' }} title="Presupuestos Aprobados (25%)" />
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: '25%' }} title="Altas Clínicas & Controles (25%)" />
              <div 
                className="h-full rounded-full bg-slate-300 transition-all" 
                style={{ 
                  width: '20%',
                  backgroundImage: 'repeating-linear-gradient(45deg, #cbd5e1, #cbd5e1 4px, #e2e8f0 4px, #e2e8f0 8px)' 
                }} 
                title="Cupos Disponibles (20%)" 
              />
            </div>

            {/* Messages vs. sales Graph Card */}
            <div className="flex flex-col gap-4 pt-4 border-t border-slate-100">
              
              {/* Chart Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Messages vs. sales
                  </h3>
                  <p className="text-xs font-semibold text-emerald-600">
                    ↑ 18% more than last month
                  </p>
                </div>

                {/* Legend & View Button */}
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span className="text-slate-600">Messenger</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span className="text-slate-600">Sales</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-600">Renewals</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateTab('BILLING')}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-all"
                  >
                    <span>View</span>
                    <ArrowUpRight className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Visual Stacked Bar Chart with Interactive Tooltip */}
              <div className="relative pt-6 pb-2">
                
                {/* Background Grid Lines & Y-Axis */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-slate-400 font-mono pr-4 pb-7">
                  <div className="border-b border-slate-100 pb-1 flex justify-between">
                    <span>10,500</span>
                  </div>
                  <div className="border-b border-slate-100 pb-1 flex justify-between">
                    <span>7,100</span>
                  </div>
                  <div className="border-b border-slate-100 pb-1 flex justify-between">
                    <span>4,800</span>
                  </div>
                  <div className="border-b border-slate-100 pb-1 flex justify-between">
                    <span>2,400</span>
                  </div>
                  <div className="border-b border-slate-200 pb-1 flex justify-between">
                    <span>0</span>
                  </div>
                </div>

                {/* Bars Container */}
                <div className="relative z-10 h-52 flex items-end justify-between gap-2 sm:gap-3 pl-8 pr-2">
                  {monthlyStats.map((item, index) => {
                    const isHovered = hoveredMonth === index;
                    return (
                      <div 
                        key={item.month} 
                        className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                        onMouseEnter={() => setHoveredMonth(index)}
                      >
                        {/* Hover Tooltip Popup (Like the June 2026 badge in the image) */}
                        {isHovered && !item.isFuture && (
                          <div className="absolute -top-12 z-30 bg-white border border-slate-200 shadow-xl rounded-xl p-2.5 text-xs text-slate-800 flex flex-col gap-1 min-w-[130px] animate-in fade-in zoom-in-95 pointer-events-none">
                            <div className="font-bold text-slate-900 border-b border-slate-100 pb-1">
                              {item.month} 2026
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="flex items-center gap-1 text-slate-600">
                                <span className="w-2 h-2 rounded-full bg-blue-600" /> Messenger
                              </span>
                              <span className="font-bold font-mono">{item.appointments}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="flex items-center gap-1 text-slate-600">
                                <span className="w-2 h-2 rounded-full bg-orange-500" /> Sales
                              </span>
                              <span className="font-bold font-mono">${(item.revenue / 1000).toFixed(0)}k</span>
                            </div>
                          </div>
                        )}

                        {/* Stacked Bar */}
                        <div className="w-full max-w-[42px] flex flex-col justify-end items-center gap-1 transition-all duration-300">
                          
                          {/* Top Orange Bar (Sales) */}
                          {!item.isFuture && item.orangeHeight > 0 && (
                            <div 
                              className={`w-full rounded-t-xl sm:rounded-t-2xl bg-orange-500 transition-all ${
                                isHovered ? 'brightness-105 scale-x-105' : 'opacity-95'
                              }`} 
                              style={{ height: `${item.orangeHeight}px` }} 
                            />
                          )}

                          {/* Main Blue Bar (Messenger) */}
                          {!item.isFuture ? (
                            <div 
                              className={`w-full ${item.orangeHeight > 0 ? 'rounded-b-xl sm:rounded-b-2xl' : 'rounded-xl sm:rounded-2xl'} bg-blue-600 transition-all ${
                                isHovered ? 'brightness-110 scale-x-105' : ''
                              }`} 
                              style={{ height: `${item.height * 1.5}px` }} 
                            />
                          ) : (
                            /* Striped Future Month Column */
                            <div 
                              className="w-full rounded-2xl border border-dashed border-slate-300 transition-all"
                              style={{ 
                                height: '80px',
                                backgroundImage: 'repeating-linear-gradient(45deg, #f1f5f9, #f1f5f9 6px, #ffffff 6px, #ffffff 12px)' 
                              }}
                            />
                          )}
                        </div>

                        {/* Month Label */}
                        <span className="text-[11px] font-semibold text-slate-500 mt-2">
                          {item.short}
                        </span>
                      </div>
                    );
                  })}
                </div>

              </div>

            </div>

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
              {doctors.map(doc => (
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
          
          {/* Card 1: AI reply suggestions (Matching exact screenshot styling) */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col">
            
            {/* Top Soft Sky Gradient Area with Chat Bubbles */}
            <div className="bg-gradient-to-b from-blue-100/70 via-blue-50/40 to-white p-6 flex flex-col gap-3">
              
              {/* Chat Bubble 1 */}
              <div className="self-end max-w-[85%] bg-white/95 backdrop-blur-sm border border-slate-100 shadow-sm rounded-2xl rounded-tr-xs px-4 py-2.5 text-xs text-slate-800 font-medium">
                You have to be replying to chats faster.
              </div>

              {/* Chat Bubble 2 */}
              <div className="self-end max-w-[85%] bg-white/95 backdrop-blur-sm border border-slate-100 shadow-sm rounded-2xl rounded-tr-xs px-4 py-2.5 text-xs text-slate-800 font-medium">
                This is the perfect comment.
              </div>

              {/* AI Generating Reply Pill */}
              <div className="self-start mt-1 bg-white/95 backdrop-blur-sm border border-blue-200 shadow-sm rounded-full px-3.5 py-1.5 text-xs font-semibold text-blue-700 flex items-center gap-2 animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Generating reply...</span>
              </div>
            </div>

            {/* Bottom Text Area */}
            <div className="p-6 pt-2 flex flex-col gap-1.5">
              <h3 className="text-sm font-bold text-slate-900">
                AI reply suggestions
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Drafts a tone-matched response in two seconds whenever the inbox queue tips over five threads.
              </p>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">
                  Ficha SOAP & Recetas automáticas
                </span>
                <span className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">
                  Configurar →
                </span>
              </div>
            </div>

          </div>

          {/* Card 2: Lead quality / Half Arc Gauge (Matching exact screenshot styling) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            
            {/* Header with Title and Options Dots */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Lead quality
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
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="50%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Central Value */}
              <div className="text-center -mt-8 flex flex-col items-center">
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  1,000
                </div>
                <div className="text-xs text-slate-500 font-semibold mt-0.5">
                  total leads
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
