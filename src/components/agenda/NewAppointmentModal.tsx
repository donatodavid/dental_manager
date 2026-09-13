import React, { useState } from 'react';
import { 
  Appointment, 
  Patient, 
  ProfessionalDoctor, 
  Branch, 
  TreatmentTariffItem,
  UserRole
} from '../../types/clinical';
import { X, Calendar, Clock, User, Stethoscope, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAppointment: (appointment: Appointment) => void;
  patients: Patient[];
  doctors: ProfessionalDoctor[];
  branches: Branch[];
  tariffs: TreatmentTariffItem[];
  defaultDate?: string;
  defaultDoctorId?: string;
  defaultBranchId?: string;
}

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSaveAppointment,
  patients,
  doctors,
  branches,
  tariffs,
  defaultDate,
  defaultDoctorId,
  defaultBranchId
}) => {
  const sortedDoctors = [...doctors].sort((a, b) => {
    if (a.name.includes('Alejandro')) return -1;
    if (b.name.includes('Alejandro')) return 1;
    return 0;
  });

  const [patientId, setPatientId] = useState(patients[0]?.id || '');
  const [doctorId, setDoctorId] = useState(defaultDoctorId || sortedDoctors[0]?.id || doctors[0]?.id || '');
  const [branchId, setBranchId] = useState(defaultBranchId || branches[0]?.id || '');
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [selectedTariffId, setSelectedTariffId] = useState(tariffs[0]?.id || '');
  const [boxNumber, setBoxNumber] = useState('Box 01');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const selectedPatient = patients.find(p => p.id === patientId);
  const selectedDoctor = doctors.find(d => d.id === doctorId);
  const selectedBranch = branches.find(b => b.id === branchId);
  const selectedTariff = tariffs.find(t => t.id === selectedTariffId);

  // Compute end time based on start time + duration
  const calculateEndTime = (start: string, durationMin: number): string => {
    const [h, m] = start.split(':').map(Number);
    const totalMinutes = h * 60 + m + durationMin;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !selectedDoctor || !selectedBranch) return;

    const endTime = calculateEndTime(startTime, durationMinutes);

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      patientId: selectedPatient.id,
      patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
      patientPhone: selectedPatient.phone,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      doctorSpecialty: selectedDoctor.specialty,
      branchId: selectedBranch.id,
      branchName: selectedBranch.name,
      boxNumber: boxNumber,
      date: date,
      startTime: startTime,
      endTime: endTime,
      durationMinutes: durationMinutes,
      reason: reason || selectedTariff?.name || 'Consulta y evaluación clínica',
      treatmentName: selectedTariff?.name,
      status: 'CONFIRMED',
      notes: notes || (selectedPatient.allergies.length > 0 ? `Alergia: ${selectedPatient.allergies.map(a => a.allergen).join(', ')}` : undefined),
      reminderSent: {
        whatsapp: true,
        sms: false,
        email: true,
        lastSentAt: new Date().toISOString()
      }
    };

    onSaveAppointment(newApt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-400" />
            Agendar Nueva Cita Odontológica / Médica
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          
          {/* Patient Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Seleccionar Paciente *
            </label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} — RUT: {p.documentId} ({p.insuranceProvider})
                </option>
              ))}
            </select>
          </div>

          {/* Doctor and Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Profesional Odontólogo / Médico *
              </label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              >
                {sortedDoctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.specialty})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Sucursal & Box *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>

                <select
                  value={boxNumber}
                  onChange={(e) => setBoxNumber(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="Box 01">Box 01</option>
                  <option value="Box 02">Box 02</option>
                  <option value="Box 03">Box 03</option>
                  <option value="Box 04">Box 04</option>
                  <option value="Pabellón Quirúrgico 01">Pabellón 01</option>
                </select>
              </div>
            </div>
          </div>

          {/* Date, Time & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Fecha</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Hora Inicio</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Duración (minutos)</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value={20}>20 minutos (Control / Retiro puntos)</option>
                <option value={30}>30 minutos (Control Ortodoncia / Urgencia)</option>
                <option value={45}>45 minutos (Evaluación / Profilaxis)</option>
                <option value={60}>60 minutos (Restauración / Endodoncia)</option>
                <option value={90}>90 minutos (Cirugía / Implante)</option>
                <option value={120}>120 minutos (Cirugía Compleja)</option>
              </select>
            </div>
          </div>

          {/* Treatment Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Tratamiento Programado / Arancel
            </label>
            <select
              value={selectedTariffId}
              onChange={(e) => {
                setSelectedTariffId(e.target.value);
                const t = tariffs.find(item => item.id === e.target.value);
                if (t) setReason(t.name);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
            >
              {tariffs.map(t => (
                <option key={t.id} value={t.id}>
                  [{t.category}] {t.name} — ${t.defaultPrice.toLocaleString('es-CL')}
                </option>
              ))}
            </select>
          </div>

          {/* Reason / Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Motivo de Atención / Instrucciones
            </label>
            <input
              type="text"
              placeholder="Ej. Restauración oclusomesial molar 1.6 + toma de impresión"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Automatic Reminder Info */}
          <div className="bg-teal-950/40 p-3 rounded-xl border border-teal-500/30 text-xs text-teal-300 flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0" />
            <div>
              <span className="font-bold block">Recordatorios Automáticos Activos:</span>
              <span className="text-[11px] text-slate-400">
                Se despachará confirmación por WhatsApp y correo electrónico al paciente 24h antes de la cita.
              </span>
            </div>
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
              className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-600/30"
            >
              Confirmar y Agendar Cita
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
