import React, { useState, useEffect, useRef } from 'react';
import { 
  ClinicSettings, 
  ProfessionalDoctor, 
  Branch 
} from '../../types/clinical';
import { ClinicalDatabase } from '../../services/db';
import { 
  Building2, 
  Image as ImageIcon, 
  Database, 
  UserCheck, 
  Upload, 
  RefreshCw, 
  Save, 
  Check, 
  Copy, 
  FileCode, 
  Server, 
  Layers, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Sparkles, 
  AlertCircle, 
  ShieldCheck, 
  Download, 
  Trash2,
  HardDrive,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { DaaronLogo } from '../common/DaaronLogo';

interface ConfigurationPanelProps {
  onSettingsUpdated?: (settings: ClinicSettings) => void;
  doctors: ProfessionalDoctor[];
  branches: Branch[];
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  onSettingsUpdated,
  doctors,
  branches
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'logo' | 'database' | 'doctors'>('general');
  const [settings, setSettings] = useState<ClinicSettings>(() => ClinicalDatabase.getClinicSettings());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>(settings.logoUrl || '/pagnina.png');
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // DB stats
  const [dbStats, setDbStats] = useState({
    patients: 0,
    appointments: 0,
    budgets: 0,
    payments: 0,
    doctorsCount: 0
  });

  useEffect(() => {
    const currentSettings = ClinicalDatabase.getClinicSettings();
    setSettings(currentSettings);
    setLogoPreview(currentSettings.logoUrl || '/pagnina.png');

    setDbStats({
      patients: ClinicalDatabase.getPatients().length,
      appointments: ClinicalDatabase.getAppointments().length,
      budgets: ClinicalDatabase.getBudgets().length,
      payments: ClinicalDatabase.getPayments().length,
      doctorsCount: ClinicalDatabase.getDoctors().length
    });
  }, []);

  const handleSaveSettings = (customSettings?: ClinicSettings) => {
    const toSave = customSettings || settings;
    ClinicalDatabase.saveClinicSettings(toSave);
    setSettings(toSave);
    if (onSettingsUpdated) {
      onSettingsUpdated(toSave);
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFileError('Por favor selecciona un archivo de imagen válido (PNG, SVG, JPG, WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFileError('La imagen no debe superar los 2 MB para un rendimiento óptimo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setLogoPreview(result);
        const updated = { ...settings, logoUrl: result };
        setSettings(updated);
        handleSaveSettings(updated);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetDefaultLogo = () => {
    const defaultUrl = '/pagnina.png';
    setLogoPreview(defaultUrl);
    const updated = { ...settings, logoUrl: defaultUrl };
    setSettings(updated);
    handleSaveSettings(updated);
  };

  const sqlSchemaDDL = `-- ====================================================================
-- ESQUEMA DDL SQL OFICIAL - CONSULTA DENTAL DAARON & CIMA SOFTWARE
-- Base de Datos Relacional: PostgreSQL / Cloud SQL con Drizzle ORM
-- ====================================================================

-- 1. Tabla de Configuración de la Clínica & Identidad
CREATE TABLE IF NOT EXISTS clinic_settings (
  id VARCHAR(64) PRIMARY KEY DEFAULT 'default',
  name VARCHAR(255) NOT NULL DEFAULT 'Consulta dental Daaron',
  legal_name VARCHAR(255) DEFAULT 'Sociedad Odontológica Daaron SpA',
  document_id VARCHAR(32) DEFAULT '76.890.123-4',
  address VARCHAR(255) NOT NULL DEFAULT 'Maipú 461 edificio Salman local 304 piso 3',
  city VARCHAR(100) NOT NULL DEFAULT 'Linares',
  region VARCHAR(100) NOT NULL DEFAULT 'Maule',
  country VARCHAR(100) NOT NULL DEFAULT 'Chile',
  phone VARCHAR(50) DEFAULT '+56 9 8408 5590',
  whatsapp VARCHAR(50) DEFAULT '+56 9 8408 5590',
  email VARCHAR(150) DEFAULT 'contacto@consultadaaron.cl',
  website VARCHAR(255) DEFAULT 'https://consultadaaron.cl',
  hours VARCHAR(255) DEFAULT 'Lunes a viernes 10:00 a 13:00 hrs. / 15:00 a 19:00 hrs. — Sábado 10:00 a 13:00 hrs.',
  logo_url TEXT DEFAULT '/pagnina.png',
  default_currency VARCHAR(10) DEFAULT 'CLP',
  tax_rate NUMERIC(5,2) DEFAULT 0.00,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Profesionales Médicos y Odontólogos
-- El Dr. Alejandro David siempre figura como registro prioritario doc-1
CREATE TABLE IF NOT EXISTS doctors (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  specialty VARCHAR(150) NOT NULL,
  rut VARCHAR(32) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(150),
  color VARCHAR(32) DEFAULT '#0d9488',
  status VARCHAR(32) DEFAULT 'ACTIVE',
  priority_order INT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Sucursales & Boxes Clínicos
CREATE TABLE IF NOT EXISTS branches (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  boxes JSONB DEFAULT '["Box 01", "Box 02", "Box Pabellón Menor"]'::jsonb,
  is_main BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Pacientes y Fichas Clínicas
CREATE TABLE IF NOT EXISTS patients (
  id VARCHAR(64) PRIMARY KEY,
  document_id VARCHAR(32) UNIQUE NOT NULL,
  first_name VARCHAR(150) NOT NULL,
  last_name VARCHAR(150) NOT NULL,
  birth_date DATE,
  gender VARCHAR(32),
  phone VARCHAR(50),
  whatsapp VARCHAR(50),
  email VARCHAR(150),
  address TEXT,
  city VARCHAR(100),
  insurance_provider VARCHAR(100) DEFAULT 'FONASA',
  allergies JSONB DEFAULT '[]'::jsonb,
  medical_alerts JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(32) DEFAULT 'ACTIVE',
  balance NUMERIC(12,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de Citas y Agenda Médica
CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR(64) PRIMARY KEY,
  patient_id VARCHAR(64) REFERENCES patients(id) ON DELETE CASCADE,
  patient_name VARCHAR(255) NOT NULL,
  doctor_id VARCHAR(64) REFERENCES doctors(id) ON DELETE SET NULL,
  doctor_name VARCHAR(255) NOT NULL,
  branch_id VARCHAR(64) REFERENCES branches(id) ON DELETE SET NULL,
  branch_name VARCHAR(255) NOT NULL,
  box_number VARCHAR(64) DEFAULT 'Box 01',
  date DATE NOT NULL,
  start_time VARCHAR(10) NOT NULL,
  end_time VARCHAR(10) NOT NULL,
  duration_minutes INT DEFAULT 45,
  treatment_name VARCHAR(255),
  status VARCHAR(32) DEFAULT 'CONFIRMED',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabla de Presupuestos Odontológicos (Budgets)
CREATE TABLE IF NOT EXISTS treatment_budgets (
  id VARCHAR(64) PRIMARY KEY,
  budget_number VARCHAR(64) UNIQUE NOT NULL,
  patient_id VARCHAR(64) REFERENCES patients(id) ON DELETE CASCADE,
  patient_name VARCHAR(255) NOT NULL,
  doctor_id VARCHAR(64) REFERENCES doctors(id) ON DELETE SET NULL,
  doctor_name VARCHAR(255) NOT NULL,
  branch_id VARCHAR(64) REFERENCES branches(id) ON DELETE SET NULL,
  branch_name VARCHAR(255),
  created_at DATE NOT NULL,
  valid_until DATE NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  discount_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  total_patient NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  total_paid NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(32) DEFAULT 'PENDING',
  notes TEXT
);

-- 7. Items / Procedimientos del Presupuesto
CREATE TABLE IF NOT EXISTS treatment_budget_items (
  id VARCHAR(64) PRIMARY KEY,
  budget_id VARCHAR(64) REFERENCES treatment_budgets(id) ON DELETE CASCADE,
  tariff_id VARCHAR(64),
  description VARCHAR(255) NOT NULL,
  tooth_number INT,
  surface VARCHAR(64),
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  discount_percent NUMERIC(5,2) DEFAULT 0.00,
  patient_copay NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(32) DEFAULT 'PENDING'
);

-- 8. Tabla de Pagos & Recaudación Clínica
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(64) PRIMARY KEY,
  receipt_number VARCHAR(64) UNIQUE NOT NULL,
  patient_id VARCHAR(64) REFERENCES patients(id) ON DELETE CASCADE,
  patient_name VARCHAR(255) NOT NULL,
  budget_id VARCHAR(64) REFERENCES treatment_budgets(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_method VARCHAR(64) NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(32) DEFAULT 'COMPLETED',
  notes TEXT
);

-- Inserción Inicial de la Configuración y Profesionales Prioritarios
INSERT INTO clinic_settings (id, name, address, city, region, phone, hours, logo_url)
VALUES (
  'default', 
  'Consulta dental Daaron', 
  'Maipú 461 edificio Salman local 304 piso 3', 
  'Linares', 
  'Maule', 
  '+56 9 8408 5590', 
  'Lunes a viernes 10:00 a 13:00 hrs. / 15:00 a 19:00 hrs. — Sábado 10:00 a 13:00 hrs.', 
  '/pagnina.png'
) ON CONFLICT (id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

INSERT INTO doctors (id, name, specialty, rut, color, priority_order)
VALUES 
  ('doc-1', 'Dr. Alejandro David', 'Implantología & Cirugía Oral', '16.789.012-3', '#0d9488', 1),
  ('doc-2', 'Dr. Jorge de Luque', 'Rehabilitación Oral & Estética', '17.456.789-0', '#3b82f6', 2)
ON CONFLICT (id) DO UPDATE SET priority_order = EXCLUDED.priority_order;
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchemaDDL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleDownloadBackup = () => {
    const data = ClinicalDatabase.exportCompleteDatabase();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_daaron_clinica_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto p-2 sm:p-4 animate-in fade-in duration-300">
      
      {/* Top Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                Panel de Configuración General & Base de Datos
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Oficial
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Personaliza el nombre de la consulta, dirección, logotipo en tiempo real, esquema SQL y prioridades médicas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSaveSettings()}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-teal-600/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-xs sm:text-sm text-emerald-300 flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span><strong>¡Configuración actualizada con éxito!</strong> Los cambios de nombre, logo y dirección ya se aplican en el inicio, presupuestos y recetas descargables.</span>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'general'
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Identidad & Consulta</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logo')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'logo'
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Logotipo & Marca</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('database')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'database'
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Base de Datos & Esquema SQL</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('doctors')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'doctors'
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Profesionales (Dr. Alejandro David)</span>
        </button>
      </div>

      {/* TAB 1: IDENTIDAD & CONSULTA */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col gap-5 shadow-xl">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-400" />
                <span>Datos Generales de la Clínica / Consulta Dental</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Esta información se reflejará automáticamente en la barra superior, presupuestos impresos, recetas y comprobantes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Nombre de la Consulta Dental *
                </label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  placeholder="Ej: Consulta dental Daaron"
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-sm text-slate-100 focus:outline-none focus:border-teal-500 font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  <span>Dirección Completa *</span>
                </label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  placeholder="Ej: Maipú 461 edificio Salman local 304 piso 3"
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Ciudad *
                </label>
                <input
                  type="text"
                  value={settings.city}
                  onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                  placeholder="Linares"
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Región
                </label>
                <input
                  type="text"
                  value={settings.region || ''}
                  onChange={(e) => setSettings({ ...settings, region: e.target.value })}
                  placeholder="Maule"
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-teal-400" />
                  <span>Teléfono / WhatsApp</span>
                </label>
                <input
                  type="text"
                  value={settings.phone || ''}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  placeholder="+56 9 8408 5590"
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-sm text-slate-100 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-teal-400" />
                  <span>Correo Electrónico</span>
                </label>
                <input
                  type="email"
                  value={settings.email || ''}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  placeholder="contacto@consultadaaron.cl"
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  <span>Horario de Atención (Pie de página en Presupuestos y Recetas)</span>
                </label>
                <textarea
                  rows={2}
                  value={settings.hours || ''}
                  onChange={(e) => setSettings({ ...settings, hours: e.target.value })}
                  placeholder="Lunes a viernes 10:00 a 13:00 hrs. / 15:00 a 19:00 hrs. — Sábado 10:00 a 13:00 hrs."
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveSettings()}
                className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-teal-600/20 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Datos de la Clínica</span>
              </button>
            </div>
          </div>

          {/* Quick Preview Card */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span>Previsualización en Vivo</span>
              </h3>
              
              <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-inner text-slate-900">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-3 mb-3">
                  <img 
                    src={logoPreview} 
                    alt="Logo" 
                    className="h-10 w-auto object-contain max-w-[140px]" 
                  />
                  <div>
                    <h4 className="font-black text-sm text-teal-900 leading-tight">
                      {settings.name || 'Consulta dental Daaron'}
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      {settings.city || 'Linares'}, {settings.region || 'Chile'}
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-700 space-y-1">
                  <p><strong>Dirección:</strong> {settings.address}</p>
                  <p><strong>Teléfono:</strong> {settings.phone}</p>
                  <p><strong>Horario:</strong> {settings.hours}</p>
                </div>
              </div>

              <div className="p-3 bg-teal-950/40 border border-teal-500/30 rounded-2xl text-xs text-teal-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  Sincronización Automática
                </p>
                <p className="text-[11px] text-slate-400">
                  Cualquier ajuste que realices aquí se actualiza inmediatamente en el Canvas oficial de Presupuestos PDF y Recetas médicas.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LOGOTIPO & MARCA */}
      {activeTab === 'logo' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col gap-5 shadow-xl">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-teal-400" />
                <span>Gestión de Logotipo de la Clínica</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cambia el logo de la consulta. Se verá reflejado en la cabecera del inicio, presupuestos y recetas descargables.
              </p>
            </div>

            {/* File Upload Zone */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-slate-300">
                Subir nuevo logotipo desde tu equipo (PNG transparente recomendado)
              </label>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/svg+xml, image/webp"
                onChange={handleLogoFileUpload}
                className="hidden"
              />

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-teal-500 bg-slate-950/60 hover:bg-slate-950 p-8 rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer transition-all gap-3"
              >
                <div className="p-4 rounded-2xl bg-teal-500/10 text-teal-400">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200">
                    Haz clic aquí o arrastra tu archivo de logo
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Formatos soportados: PNG (con o sin transparencia), SVG, JPG o WebP (máx. 2MB)
                  </p>
                </div>
              </div>

              {fileError && (
                <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-2xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}
            </div>

            {/* URL Input Option */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300">
                O ingresa la URL directa de la imagen
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={settings.logoUrl || ''}
                  onChange={(e) => {
                    setSettings({ ...settings, logoUrl: e.target.value });
                    setLogoPreview(e.target.value || '/pagnina.png');
                  }}
                  placeholder="https://tudominio.com/logo.png o /pagnina.png"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={handleResetDefaultLogo}
                  className="px-3.5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                  title="Restaurar logo original Daaron"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restaurar Daaron</span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveSettings()}
                className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-teal-600/20 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Aplicar y Guardar Logo</span>
              </button>
            </div>
          </div>

          {/* Logo Visual Live Preview */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span>Vista Previa del Logotipo</span>
              </h3>

              {/* Light Background Preview (Documents simulation) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-300 flex flex-col items-center justify-center gap-2 min-h-[160px]">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  En documentos oficiales (Fondo blanco)
                </span>
                <img 
                  src={logoPreview} 
                  alt="Logo Preview Blanco" 
                  className="max-h-24 w-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/pagnina.png';
                  }}
                />
              </div>

              {/* Dark Background Preview (App top bar simulation) */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center gap-2 min-h-[160px]">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  En barra de navegación (Fondo oscuro)
                </span>
                <img 
                  src={logoPreview} 
                  alt="Logo Preview Oscuro" 
                  className="max-h-20 w-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/pagnina.png';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BASE DE DATOS & ESQUEMA SQL */}
      {activeTab === 'database' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left stats & tools */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            
            {/* Database Engine Status */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-400">
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">
                    Motor de Base de Datos
                  </h3>
                  <p className="text-xs text-teal-400 font-semibold flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Firebase Firestore Cloud Database
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Pacientes registrados:</span>
                  <span className="font-mono font-bold text-slate-200">{dbStats.patients}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Citas en agenda:</span>
                  <span className="font-mono font-bold text-slate-200">{dbStats.appointments}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Presupuestos clínicos:</span>
                  <span className="font-mono font-bold text-slate-200">{dbStats.budgets}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Pagos recaudados:</span>
                  <span className="font-mono font-bold text-slate-200">{dbStats.payments}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Médicos activos:</span>
                  <span className="font-mono font-bold text-teal-400">{dbStats.doctorsCount}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-teal-400" />
                  <span>Descargar Copia de Seguridad JSON</span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl text-xs text-slate-400 space-y-2">
              <p className="font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                Arquitectura de Respaldo
              </p>
              <p className="text-[11px] leading-relaxed">
                El sistema cuenta con persistencia híbrida. Si ejecutas este script en tu servidor Cloud SQL o PostgreSQL, todas las tablas y relaciones se crearán con integridad referencial completa.
              </p>
            </div>
          </div>

          {/* Right SQL DDL Viewer */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col gap-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-teal-400" />
                  <span>Esquema SQL DDL Completo (PostgreSQL)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Estructura de tablas, claves primarias, foráneas e inserciones predeterminadas.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopySql}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-teal-200 border border-teal-500/30 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSql ? '¡Copiado al Portapapeles!' : 'Copiar Script SQL'}</span>
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-teal-300 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[500px] overflow-y-auto">
                <code>{sqlSchemaDDL}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PROFESIONALES (DR ALEJANDRO DAVID) */}
      {activeTab === 'doctors' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col gap-5 shadow-xl">
          <div className="border-b border-slate-800 pb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-400" />
                <span>Equipo Médico & Prioridad de Selección</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                El <strong>Dr. Alejandro David</strong> está configurado como la <strong>primera opción predeterminada</strong> en todos los formularios, agendas y presupuestos.
              </p>
            </div>

            <span className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-teal-400" />
              Prioridad #1: Dr. Alejandro David
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Dr. Alejandro David Card */}
            <div className="bg-gradient-to-br from-teal-950/60 to-slate-950 border-2 border-teal-500/50 rounded-3xl p-5 shadow-lg flex flex-col justify-between gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500 text-white font-black text-lg flex items-center justify-center shadow-md">
                    AD
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-100">
                        Dr. Alejandro David
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-teal-500 text-white">
                        Opción 1
                      </span>
                    </div>
                    <p className="text-xs text-teal-400 font-semibold mt-0.5">
                      Implantología & Cirugía Oral
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-400 space-y-1 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                <p><strong>RUT:</strong> 16.789.012-3</p>
                <p><strong>Atención Principal:</strong> Box 01 / Pabellón Daaron</p>
                <p><strong>Configuración:</strong> Preseleccionado automáticamente al generar presupuestos, recetas y citas.</p>
              </div>
            </div>

            {/* Dr. Jorge de Luque Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                    JD
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-100">
                        Dr. Jorge de Luque
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-900/50 text-blue-300 border border-blue-700/50">
                        Opción 2
                      </span>
                    </div>
                    <p className="text-xs text-blue-400 font-semibold mt-0.5">
                      Rehabilitación Oral & Estética
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-400 space-y-1 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                <p><strong>RUT:</strong> 17.456.789-0</p>
                <p><strong>Atención Principal:</strong> Box 02 Daaron</p>
                <p><strong>Especialidad:</strong> Rehabilitador Oral</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
