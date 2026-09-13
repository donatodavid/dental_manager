import React, { useState } from 'react';
import { 
  Appointment, 
  AppointmentStatus, 
  ProfessionalDoctor, 
  Branch, 
  Patient, 
  TreatmentTariffItem,
  UserRole
} from '../../types/clinical';
import { NewAppointmentModal } from './NewAppointmentModal';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  MessageSquare, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Activity, 
  Send, 
  MapPin, 
  Stethoscope,
  X,
  ExternalLink
} from 'lucide-react';

interface AgendaViewProps {
  appointments: Appointment[];
  patients: Patient[];
  doctors: ProfessionalDoctor[];
  branches: Branch[];
  tariffs: TreatmentTariffItem[];
  onUpdateAppointmentStatus: (appointmentId: string, newStatus: AppointmentStatus) => void;
  onAddNewAppointment: (newAppointment: Appointment) => void;
  onOpenPatientFile: (patient: Patient) => void;
  activeRole: UserRole;
  currentBranchId: string;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  appointments,
  patients,
  doctors,
  branches,
  tariffs,
  onUpdateAppointmentStatus,
  onAddNewAppointment,
  onOpenPatientFile,
  activeRole,
  currentBranchId
}) => {
  // Helper to obtain current local date YYYY-MM-DD
  const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to step date safely without timezone issues
  const stepDate = (current: string, deltaDays: number) => {
    const [y, m, d] = current.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + deltaDays);
    const nextY = dateObj.getFullYear();
    const nextM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const nextD = String(dateObj.getDate()).padStart(2, '0');
    return `${nextY}-${nextM}-${nextD}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDate());
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [showNewAptModal, setShowNewAptModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState<Appointment | null>(null);
  const [customWhatsAppMsg, setCustomWhatsAppMsg] = useState('');
  const [whatsappSentSuccess, setWhatsappSentSuccess] = useState(false);

  // Filter appointments
  const filteredAppointments = appointments.filter(apt => {
    const matchesDate = apt.date === selectedDate;
    const matchesDoctor = selectedDoctorFilter === 'ALL' || apt.doctorId === selectedDoctorFilter;
    const matchesStatus = selectedStatusFilter === 'ALL' || apt.status === selectedStatusFilter;
    const matchesBranch = currentBranchId === 'ALL' || apt.branchId === currentBranchId;

    return matchesDate && matchesDoctor && matchesStatus && matchesBranch;
  });

  // Sort by start time
  filteredAppointments.sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Helper for Status badges
  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'SCHEDULED':
        return { label: 'Agendada', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'CONFIRMED':
        return { label: 'Confirmada', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'WAITING_ROOM':
        return { label: 'En Sala de Espera', bg: 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse' };
      case 'IN_TREATMENT':
        return { label: 'En Atención (Box)', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold animate-pulse' };
      case 'COMPLETED':
        return { label: 'Atendido / Listo', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'CANCELLED':
        return { label: 'Cancelada', bg: 'bg-red-50 text-red-700 border-red-200' };
      case 'NO_SHOW':
        return { label: 'No Asistió', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
    }
  };

  // Open WhatsApp template composer
  const handleOpenWhatsAppReminder = (apt: Appointment) => {
    const doctorObj = doctors.find(d => d.id === apt.doctorId);
    const patientFirstName = apt.patientName ? apt.patientName.split(' ')[0] : 'Estimado(a)';
    const message = `Hola ${patientFirstName} 👋 Te recordamos tu cita odontológica en Consulta Dental Daaron con el ${doctorObj?.name || apt.doctorName} para el día ${apt.date} a las ${apt.startTime} hrs (${apt.branchName}).\n\nProcedimiento: ${apt.reason}.\n\n¡Te esperamos!`;
    setCustomWhatsAppMsg(message);
    setShowWhatsAppModal(apt);
    setWhatsappSentSuccess(false);
  };

  // Dispatch WhatsApp link
  const handleSendWhatsApp = () => {
    if (!showWhatsAppModal) return;
    const cleanPhone = showWhatsAppModal.patientPhone.replace(/\D/g, '');
    const encoded = encodeURIComponent(customWhatsAppMsg);
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
    window.open(url, '_blank');
    setWhatsappSentSuccess(true);
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      
      {/* Top Agenda Header Controls */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm flex flex-wrap items-center justify-between gap-4">
        
        {/* Date Selector with Previous/Next buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedDate(stepDate(selectedDate, -1))}
            className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-700 border border-slate-200 transition-all cursor-pointer"
            title="Día Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 bg-slate-50/90 px-4 py-2 rounded-full border border-slate-200">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={() => setSelectedDate(stepDate(selectedDate, 1))}
            className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-700 border border-slate-200 transition-all cursor-pointer"
            title="Día Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setSelectedDate(getTodayDate())}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-full border border-blue-200 transition-all cursor-pointer"
            title="Ir al Día de Hoy"
          >
            Hoy
          </button>
        </div>

        {/* Doctor and Status Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedDoctorFilter}
            onChange={(e) => setSelectedDoctorFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs rounded-full px-3.5 py-2 text-slate-700 font-semibold focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Todos los Profesionales</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.specialty})
              </option>
            ))}
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs rounded-full px-3.5 py-2 text-slate-700 font-semibold focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="SCHEDULED">Agendada</option>
            <option value="CONFIRMED">Confirmada</option>
            <option value="WAITING_ROOM">En Sala de Espera</option>
            <option value="IN_TREATMENT">En Box / En Atención</option>
            <option value="COMPLETED">Atendido</option>
            <option value="CANCELLED">Cancelada</option>
          </select>

          {activeRole !== 'PATIENT' && (
            <button
              type="button"
              onClick={() => setShowNewAptModal(true)}
              className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Agendar Cita</span>
            </button>
          )}
        </div>
      </div>

      {/* Appointment Timeline Flow */}
      <div className="flex flex-col gap-4">
        
        {/* Timeline Header Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-2 font-medium">
          <span>{filteredAppointments.length} citas programadas para el {selectedDate}</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> En Box</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Sala de Espera</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Confirmada</span>
          </div>
        </div>

        {/* Appointment Cards */}
        <div className="flex flex-col gap-3.5">
          {filteredAppointments.map(apt => {
            const badge = getStatusBadge(apt.status);
            const patientObj = patients.find(p => p.id === apt.patientId);

            return (
              <div 
                key={apt.id}
                className="bg-white hover:border-slate-300 border border-slate-200/90 rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-all"
              >
                {/* Time, Box, & Patient Info */}
                <div className="flex items-start gap-4">
                  {/* Time Badge */}
                  <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-2xl border border-slate-200 min-w-[90px] text-center">
                    <span className="text-base font-black font-mono text-slate-900">{apt.startTime}</span>
                    <span className="text-[11px] font-mono text-slate-500">{apt.endTime}</span>
                    <span className="text-[10px] text-slate-400 font-semibold mt-1">{apt.durationMinutes} min</span>
                  </div>

                  {/* Patient & Doctor details */}
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900">{apt.patientName}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-semibold border border-slate-200">
                        {apt.boxNumber}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5 font-medium">
                      <span className="flex items-center gap-1 text-slate-700">
                        <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                        {apt.doctorName} ({apt.doctorSpecialty})
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {apt.branchName}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium mt-1">
                      <strong className="text-blue-600">Tratamiento:</strong> {apt.reason}
                    </p>

                    {apt.notes && (
                      <p className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-xl border border-amber-200 inline-block w-fit mt-0.5 font-medium">
                        ⚠️ {apt.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Transitions & Quick Actions */}
                <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  
                  {/* Status Dropdown */}
                  {activeRole !== 'PATIENT' && (
                    <select
                      value={apt.status}
                      onChange={(e) => onUpdateAppointmentStatus(apt.id, e.target.value as AppointmentStatus)}
                      className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-full px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500"
                    >
                      <option value="SCHEDULED">Agendada</option>
                      <option value="CONFIRMED">Confirmada</option>
                      <option value="WAITING_ROOM">En Sala de Espera</option>
                      <option value="IN_TREATMENT">En Box (Atendiendo)</option>
                      <option value="COMPLETED">Atendido / Finalizada</option>
                      <option value="CANCELLED">Cancelada</option>
                      <option value="NO_SHOW">No Asistió</option>
                    </select>
                  )}

                  {/* WhatsApp Reminder Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenWhatsAppReminder(apt)}
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all"
                    title="Enviar Recordatorio por WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </button>

                  {/* Open Clinical Record Button */}
                  {patientObj && (
                    <button
                      type="button"
                      onClick={() => onOpenPatientFile(patientObj)}
                      className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Activity className="w-4 h-4" />
                      <span>Ver Ficha</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredAppointments.length === 0 && (
            <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center text-slate-500 flex flex-col items-center">
              <CalendarIcon className="w-12 h-12 text-slate-400 mb-3" />
              <p className="text-base font-bold text-slate-800">No hay citas registradas para este día o filtros seleccionados.</p>
              <p className="text-xs text-slate-500 mt-1">Haz clic en "+ Agendar Cita" para programar una nueva atención médica/odontológica.</p>
            </div>
          )}
        </div>

      </div>

      {/* MODAL: Enviar Recordatorio WhatsApp */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-7 flex flex-col gap-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                Recordatorio Automático por WhatsApp
              </h3>
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-700">
                <p><strong>Paciente:</strong> {showWhatsAppModal.patientName}</p>
                <p className="text-emerald-700 font-mono mt-0.5"><strong>WhatsApp:</strong> {showWhatsAppModal.patientPhone}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Plantilla de Mensaje
                </label>
                <textarea
                  rows={5}
                  value={customWhatsAppMsg}
                  onChange={(e) => setCustomWhatsAppMsg(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-sans"
                />
              </div>

              {whatsappSentSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Enlace de WhatsApp abierto en nueva pestaña exitosamente.</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir Chat y Despachar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: Nueva Cita */}
      <NewAppointmentModal
        isOpen={showNewAptModal}
        onClose={() => setShowNewAptModal(false)}
        onSaveAppointment={(apt) => {
          onAddNewAppointment(apt);
        }}
        patients={patients}
        doctors={doctors}
        branches={branches}
        tariffs={tariffs}
        defaultDate={selectedDate}
        defaultBranchId={currentBranchId !== 'ALL' ? currentBranchId : branches[0]?.id}
      />

    </div>
  );
};
