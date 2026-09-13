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
  DollarSign,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface PatientListProps {
  patients: Patient[];
  budgets?: TreatmentBudget[];
  onSelectPatient: (patient: Patient) => void;
  onAddNewPatient: (newPatient: Patient) => void;
  onDeletePatient?: (patientId: string) => void;
  activeRole: UserRole;
  doctors: ProfessionalDoctor[];
}

export const PatientList: React.FC<PatientListProps> = ({
  patients,
  budgets = [],
  onSelectPatient,
  onAddNewPatient,
  onDeletePatient,
  activeRole,
  doctors
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState<string>('ALL');
  const [showNewModal, setShowNewModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  // New patient form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [documentId, setDocumentId] = useState('');
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
    <div className="flex flex-col gap-6 font-sans">
      
      {/* Top Banner / Search / CTA */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm">
        <div className="flex-1 max-w-xl relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por Nombre, RUT/DNI, Teléfono, Alergias o Diagnóstico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50/80 border border-slate-200 rounded-full pl-11 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick filter pills & New Patient Button */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="flex bg-slate-100/80 p-1 rounded-full border border-slate-200/70 text-xs">
            <button
              type="button"
              onClick={() => setFilterTag('ALL')}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition-all ${
                filterTag === 'ALL' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({patients.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTag('ALLERGIES')}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition-all ${
                filterTag === 'ALLERGIES' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Con Alergias
            </button>
            <button
              type="button"
              onClick={() => setFilterTag('HYPERTENSION')}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition-all ${
                filterTag === 'HYPERTENSION' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hipertensos
            </button>
            <button
              type="button"
              onClick={() => setFilterTag('DIABETES')}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition-all ${
                filterTag === 'DIABETES' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Diabéticos
            </button>
          </div>

          {activeRole !== 'PATIENT' && (
            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm whitespace-nowrap transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Nuevo Paciente</span>
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
              className="bg-white hover:border-slate-300 border border-slate-200/90 rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-150 cursor-pointer group flex flex-col justify-between"
            >
              <div>
                {/* Header with Avatar and Basic Info */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-base group-hover:scale-105 transition-transform">
                      {p.firstName[0]}{p.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                        {p.firstName} {p.lastName}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-mono text-slate-500">RUT: {p.documentId}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                          {p.insuranceProvider}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="p-1.5 rounded-full bg-slate-100 text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>

                {/* Critical Allergy or Medical Badge */}
                <div className="my-3 flex flex-col gap-1.5">
                  {hasCriticalAllergies && (
                    <div className="bg-red-50 border border-red-200 px-3 py-1 rounded-xl text-xs flex items-center gap-1.5 text-red-700">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                      <span className="truncate font-semibold">
                        Alergia: {p.allergies.map(a => a.allergen).join(', ')}
                      </span>
                    </div>
                  )}

                  {p.medicalBackground.hypertension && (
                    <div className="bg-rose-50 border border-rose-200 px-3 py-0.5 rounded-xl text-[11px] text-rose-700 flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-600" />
                      <span>Hipertensión arterial controlada</span>
                    </div>
                  )}

                  {p.medicalBackground.diabetes && (
                    <div className="bg-amber-50 border border-amber-200 px-3 py-0.5 rounded-xl text-[11px] text-amber-700 flex items-center gap-1">
                      <Heart className="w-3 h-3 text-amber-600" />
                      <span>Diabetes Mellitus Tipo 2</span>
                    </div>
                  )}
                </div>

                {/* Contact and Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 my-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span className="truncate font-medium">{p.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-orange-500" />
                    <span className="font-medium">Última: {p.lastVisit || 'Sin atenciones'}</span>
                  </div>
                </div>

                {/* Patient Budget Badge */}
                {(() => {
                  const patientBudgets = budgets.filter(b => b.patientId === p.id);
                  if (patientBudgets.length > 0) {
                    const latestBudget = patientBudgets[0];
                    const totalPlan = patientBudgets.reduce((acc, b) => acc + b.totalPatient, 0);
                    return (
                      <div className="my-2 p-2.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-blue-900">
                          <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                          <span className="font-medium">Presupuesto:</span>
                          <span className="font-mono font-bold">${totalPlan.toLocaleString('es-CL')}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                          {latestBudget.items.length} trat.
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div className="my-2 p-2 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-slate-400" />
                        Sin presupuesto activo
                      </span>
                      <span className="text-[10px] text-blue-600 font-semibold">+ Cotizar</span>
                    </div>
                  );
                })()}

                {/* Tags */}
                {p.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="text-[10px] px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200 font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Card Footer Actions */}
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  {p.evolutions.length} Evoluciones
                </span>

                <div className="flex items-center gap-1.5">
                  {activeRole !== 'PATIENT' && onDeletePatient && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPatientToDelete(p);
                      }}
                      className="p-1.5 px-2.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all flex items-center gap-1 cursor-pointer"
                      title={`Eliminar paciente ${p.firstName} ${p.lastName}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-semibold hidden sm:inline">Eliminar</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPatient(p);
                    }}
                    className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-700" />
                    <span>Ver Ficha</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPatients.length === 0 && (
        <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center text-slate-500 flex flex-col items-center">
          <Search className="w-12 h-12 text-slate-400 mb-3" />
          <p className="text-base font-bold text-slate-800">No se encontraron pacientes con ese criterio.</p>
          <p className="text-xs text-slate-500 mt-1">Prueba con otro nombre, RUT o haz clic en "+ Nuevo Paciente" para registrarlo.</p>
        </div>
      )}

      {/* MODAL: Nuevo Paciente */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl shadow-2xl p-6 sm:p-7 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Registrar Nueva Ficha de Paciente
              </h3>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Carlos"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Pérez Muñoz"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">RUT / DNI / Pasaporte *</label>
                  <input
                    type="text"
                    required
                    placeholder="12.345.678-9"
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Teléfono / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="+56 9 1234 5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Correo Electrónico (Opcional)</label>
                <input
                  type="email"
                  placeholder="paciente@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-red-700 block mb-1">
                  Alergias Críticas (Penicilina, Látex, Anestésicos, AINEs...)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Alergia severa a Penicilina y Amoxicilina"
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  className="w-full bg-red-50/50 border border-red-200 rounded-xl p-2.5 text-xs text-red-900 focus:outline-none focus:border-red-500 focus:bg-white"
                />
              </div>

              {/* Quick checkboxes for systemic background */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex flex-wrap gap-4 text-xs text-slate-700 font-medium">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hypertension}
                    onChange={(e) => setHypertension(e.target.checked)}
                    className="rounded accent-blue-600"
                  />
                  <span>Hipertensión Arterial</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={diabetes}
                    onChange={(e) => setDiabetes(e.target.checked)}
                    className="rounded accent-blue-600"
                  />
                  <span>Diabetes Mellitus</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bruxism}
                    onChange={(e) => setBruxism(e.target.checked)}
                    className="rounded accent-blue-600"
                  />
                  <span>Bruxismo / Desgaste ATM</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold shadow-sm"
                >
                  Crear Ficha y Abrir Odontograma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Confirmación de Eliminación de Paciente */}
      {patientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0 shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base text-slate-900">
                  ¿Eliminar ficha del paciente?
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  ¿Estás seguro de que deseas eliminar permanentemente a <strong className="text-slate-900">{patientToDelete.firstName} {patientToDelete.lastName}</strong>?
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    RUT: {patientToDelete.documentId}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {patientToDelete.evolutions.length} evoluciones
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200/80 p-3.5 rounded-2xl text-xs text-red-700 leading-relaxed">
              ⚠️ <strong>Advertencia:</strong> Esta acción eliminará permanentemente la ficha clínica, registros SOAP, presupuestos y radiografías de este paciente en la base de datos de Daaron Consulta Dental.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPatientToDelete(null)}
                className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeletePatient) {
                    onDeletePatient(patientToDelete.id);
                  }
                  setPatientToDelete(null);
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
