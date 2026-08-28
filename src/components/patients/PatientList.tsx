import React, { useState } from 'react';
import { Patient, UserRole, ProfessionalDoctor, TreatmentBudget } from '../../types/clinical';
import { 
  Search, 
  UserPlus, 
  Filter, 
  ShieldAlert, 
  Activity, 
  FileText, 
  Phone, 
  Calendar, 
  ChevronRight, 
  Plus, 
  Heart,
  Tag,
  CheckCircle2,
  X,
  DollarSign
} from 'lucide-react';

interface PatientListProps {
  patients: Patient[];
  budgets?: TreatmentBudget[];
  onSelectPatient: (patient: Patient) => void;
  onAddNewPatient: (newPatient: Patient) => void;
  activeRole: UserRole;
  doctors: ProfessionalDoctor[];
}

export const PatientList: React.FC<PatientListProps> = ({
  patients,
  budgets = [],
  onSelectPatient,
  onAddNewPatient,
  activeRole,
  doctors
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState<string>('ALL');
  const [showNewModal, setShowNewModal] = useState(false);

  // New patient form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [birthDate, setBirthDate] = useState('1990-01-01');
  const [gender, setGender] = useState<'M' | 'F' | 'OTHER'>('F');
  const [phone, setPhone] = useState('+56 9 ');
  const [email, setEmail] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('Particular / Sin Seguro');
  const [allergyInput, setAllergyInput] = useState('');
  const [hypertension, setHypertension] = useState(false);
  const [diabetes, setDiabetes] = useState(false);
  const [bruxism, setBruxism] = useState(false);

  // Filter patients
  const filteredPatients = patients.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      p.firstName.toLowerCase().includes(searchLower) ||
      p.lastName.toLowerCase().includes(searchLower) ||
      p.documentId.toLowerCase().includes(searchLower) ||
      p.phone.includes(searchLower) ||
      p.email.toLowerCase().includes(searchLower) ||
      p.allergies.some(a => a.allergen.toLowerCase().includes(searchLower));

    if (!matchesSearch) return false;

    if (filterTag === 'ALLERGIES') return p.allergies.length > 0;
    if (filterTag === 'HYPERTENSION') return p.medicalBackground.hypertension;
    if (filterTag === 'DIABETES') return p.medicalBackground.diabetes;
    if (filterTag === 'PEDIATRIC') {
      const birthYear = new Date(p.birthDate).getFullYear();
      const currentYear = new Date().getFullYear();
      return (currentYear - birthYear) < 16;
    }

    return true;
  });

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !documentId) return;

    const allergiesList = allergyInput.trim() ? [{
      id: `alg-${Date.now()}`,
      allergen: allergyInput.trim(),
      severity: 'severe' as const,
      reaction: 'Registrado en anamnesis inicial',
      isDrugAllergy: true
    }] : [];

    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      documentId,
      firstName,
      lastName,
      birthDate,
      gender,
      phone,
      whatsapp: phone,
      email: email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
      address: 'Dirección registrada en ficha',
      city: 'Santiago',
      insuranceProvider,
      emergencyContact: {
        name: 'Contacto Primario',
        phone: phone,
        relationship: 'Familiar'
      },
      allergies: allergiesList,
      medicalBackground: {
        hypertension,
        diabetes,
        heartDisease: false,
        coagulationDisorder: false,
        pregnancy: false,
        infectiousDiseases: [],
        currentMedications: [],
        smoker: false,
        bruxism,
        otherConditions: '',
        surgicalHistory: ''
      },
      odontogram: {
        id: `odo-${Date.now()}`,
        patientId: `pat-${Date.now()}`,
        type: 'ADULT',
        updatedAt: new Date().toISOString().split('T')[0],
        updatedByDoctorId: 'doc-1',
        teeth: {}
      },
      evolutions: [],
      documents: [],
      status: 'ACTIVE',
      registeredAt: new Date().toISOString().split('T')[0],
      tags: allergiesList.length > 0 ? ['Alergias Conocidas'] : ['Nuevo Paciente']
    };

    onAddNewPatient(newPatient);
    setShowNewModal(false);
    onSelectPatient(newPatient);

    // Reset form
    setFirstName('');
    setLastName('');
    setDocumentId('');
    setAllergyInput('');
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top Banner / Search / CTA */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
        <div className="flex-1 max-w-xl relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por Nombre, RUT/DNI, Teléfono, Alergias o Diagnóstico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick filter pills & New Patient Button */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setFilterTag('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterTag === 'ALL' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({patients.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTag('ALLERGIES')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterTag === 'ALLERGIES' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Con Alergias
            </button>
            <button
              type="button"
              onClick={() => setFilterTag('HYPERTENSION')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterTag === 'HYPERTENSION' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Hipertensos
            </button>
            <button
              type="button"
              onClick={() => setFilterTag('PEDIATRIC')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterTag === 'PEDIATRIC' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pediátricos
            </button>
          </div>

          {activeRole !== 'PATIENT' && (
            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-teal-600/30 whitespace-nowrap transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nuevo Paciente</span>
            </button>
          )}
        </div>
      </div>

      {/* Patient Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredPatients.map(p => {
          const hasCriticalAllergies = p.allergies.length > 0;
          return (
            <div
              key={p.id}
              onClick={() => onSelectPatient(p)}
              className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-teal-500/50 rounded-2xl p-5 shadow-lg transition-all duration-150 cursor-pointer group flex flex-col justify-between"
            >
              <div>
                {/* Header with Avatar and Basic Info */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-700/60">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold text-base group-hover:scale-105 transition-transform">
                      {p.firstName[0]}{p.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-100 group-hover:text-teal-400 transition-colors">
                        {p.firstName} {p.lastName}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-mono text-slate-400">RUT: {p.documentId}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700/80 text-slate-300 font-medium">
                          {p.insuranceProvider}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="p-1 rounded-lg bg-slate-700/50 text-slate-400 group-hover:text-teal-400 group-hover:bg-teal-500/20 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>

                {/* Critical Allergy or Medical Badge */}
                <div className="my-3 flex flex-col gap-1.5">
                  {hasCriticalAllergies && (
                    <div className="bg-red-950/60 border border-red-500/40 px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 text-red-300">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                      <span className="truncate font-semibold">
                        Alergia: {p.allergies.map(a => a.allergen).join(', ')}
                      </span>
                    </div>
                  )}

                  {p.medicalBackground.hypertension && (
                    <div className="bg-rose-950/40 border border-rose-500/30 px-2.5 py-0.5 rounded-lg text-[11px] text-rose-300 flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-400" />
                      <span>Hipertensión arterial controlada</span>
                    </div>
                  )}

                  {p.medicalBackground.diabetes && (
                    <div className="bg-amber-950/40 border border-amber-500/30 px-2.5 py-0.5 rounded-lg text-[11px] text-amber-300 flex items-center gap-1">
                      <Heart className="w-3 h-3 text-amber-400" />
                      <span>Diabetes Mellitus Tipo 2</span>
                    </div>
                  )}
                </div>

                {/* Contact and Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 my-3 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-teal-400" />
                    <span className="truncate">{p.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    <span>Última: {p.lastVisit || 'Sin atenciones'}</span>
                  </div>
                </div>

                {/* Patient Budget Badge */}
                {(() => {
                  const patientBudgets = budgets.filter(b => b.patientId === p.id);
                  if (patientBudgets.length > 0) {
                    const latestBudget = patientBudgets[0];
                    const totalPlan = patientBudgets.reduce((acc, b) => acc + b.totalPatient, 0);
                    return (
                      <div className="my-2 p-2 rounded-xl bg-teal-950/40 border border-teal-500/30 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-teal-300">
                          <DollarSign className="w-3.5 h-3.5 text-teal-400" />
                          <span className="font-semibold">Presupuesto:</span>
                          <span className="font-mono font-bold">${totalPlan.toLocaleString('es-CL')}</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-900/80 text-teal-200 font-mono">
                          {latestBudget.items.length} trat.
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div className="my-2 p-1.5 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-slate-500" />
                        Sin presupuesto activo
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">+ Cotizar</span>
                    </div>
                  );
                })()}

                {/* Tags */}
                {p.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Card Footer Actions */}
              <div className="pt-3 mt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-teal-400" />
                  {p.evolutions.length} Evoluciones
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPatient(p);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 font-semibold flex items-center gap-1.5 transition-all border border-teal-500/30 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-teal-400" />
                  <span>Ver Ficha & Presupuesto</span>
                  <ChevronRight className="w-3.5 h-3.5 text-teal-400" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPatients.length === 0 && (
        <div className="bg-slate-800/40 p-12 rounded-2xl border border-dashed border-slate-700 text-center text-slate-400 flex flex-col items-center">
          <Search className="w-12 h-12 text-slate-600 mb-3" />
          <p className="text-base font-semibold text-slate-300">No se encontraron pacientes con ese criterio.</p>
          <p className="text-xs text-slate-500 mt-1">Prueba con otro nombre, RUT o haz clic en "Nuevo Paciente" para registrarlo.</p>
        </div>
      )}

      {/* MODAL: Nuevo Paciente */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-400" />
                Registrar Nueva Ficha de Paciente
              </h3>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Carlos"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Pérez Muñoz"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">RUT / DNI / Pasaporte *</label>
                  <input
                    type="text"
                    required
                    placeholder="12.345.678-9"
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Fecha Nacimiento</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Género</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  >
                    <option value="F">Femenino</option>
                    <option value="M">Masculino</option>
                    <option value="OTHER">Otro / No especifica</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Teléfono / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="+56 9 1234 5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Previsión / Seguro Médico</label>
                  <select
                    value={insuranceProvider}
                    onChange={(e) => setInsuranceProvider(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  >
                    <option value="Particular / Sin Seguro">Particular / Sin Seguro</option>
                    <option value="Colmena Golden Cross">Colmena Golden Cross</option>
                    <option value="Banmédica">Banmédica</option>
                    <option value="Cruz Blanca">Cruz Blanca</option>
                    <option value="Consalud">Consalud</option>
                    <option value="Fonasa">Fonasa</option>
                    <option value="Metlife Dental">Metlife Dental Reembolso</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-red-300 block mb-1">
                  Alergias Críticas (Penicilina, Látex, Anestésicos, AINEs...)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Alergia severa a Penicilina y Amoxicilina"
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  className="w-full bg-slate-950 border border-red-500/50 rounded-lg p-2.5 text-xs text-red-200 focus:outline-none focus:border-red-400"
                />
              </div>

              {/* Quick checkboxes for systemic background */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-wrap gap-4 text-xs text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hypertension}
                    onChange={(e) => setHypertension(e.target.checked)}
                    className="rounded accent-teal-500"
                  />
                  <span>Hipertensión Arterial</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={diabetes}
                    onChange={(e) => setDiabetes(e.target.checked)}
                    className="rounded accent-teal-500"
                  />
                  <span>Diabetes Mellitus</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bruxism}
                    onChange={(e) => setBruxism(e.target.checked)}
                    className="rounded accent-teal-500"
                  />
                  <span>Bruxismo / Desgaste ATM</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-600/30"
                >
                  Crear Ficha y Abrir Odontograma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
