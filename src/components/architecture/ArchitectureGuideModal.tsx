import React, { useState } from 'react';
import { X, Copy, Check, Database, Shield, Code, Server, Layers, Lock, Cpu } from 'lucide-react';

interface ArchitectureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureGuideModal: React.FC<ArchitectureGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'SQL_SCHEMA' | 'API_DESIGN' | 'HIPAA_SECURITY' | 'FULLSTACK_ARCH'>('SQL_SCHEMA');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const sqlSchemaCode = `-- ============================================================================
-- ESQUEMA RELACIONAL POSTGRESQL / SUPABASE: CIMA DENTAL & MEDICAL CLOUD SAAS
-- Diseñado para alta concurrencia, Multi-Tenancy (Sucursales) y Cumplimiento HIPAA
-- ============================================================================

-- 1. Extensiones críticas de seguridad y UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Enumeraciones de Estado y Dominio Clínico
CREATE TYPE user_role_enum AS ENUM ('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT');
CREATE TYPE appointment_status_enum AS ENUM ('SCHEDULED', 'CONFIRMED', 'WAITING_ROOM', 'IN_TREATMENT', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE budget_status_enum AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'IN_TREATMENT', 'PAID', 'EXPIRED', 'REJECTED');
CREATE TYPE payment_method_enum AS ENUM ('CASH', 'DEBIT_CARD', 'CREDIT_CARD', 'BANK_TRANSFER', 'INSURANCE_CLAIM', 'MERCADOPAGO');
CREATE TYPE tooth_surface_condition_enum AS ENUM ('healthy', 'caries', 'composite', 'amalgam', 'sealant', 'fracture', 'erosion');
CREATE TYPE whole_tooth_condition_enum AS ENUM ('normal', 'crown', 'implant', 'endodontics', 'missing', 'extraction_indicated', 'prosthesis', 'orthodontic_bracket');

-- 3. Tabla de Clínicas / Tenants (Multi-Tenant)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50) NOT NULL UNIQUE, -- RUT / NIF / EIN
    subscription_tier VARCHAR(50) DEFAULT 'PROFESSIONAL',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Sucursales de Atención
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    boxes_count INT DEFAULT 4,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Usuarios y Profesionales
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'DOCTOR',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    document_id VARCHAR(50) NOT NULL,
    phone VARCHAR(50),
    license_number VARCHAR(100), -- Registro de prestador de salud
    specialty VARCHAR(150),
    commission_rate NUMERIC(5,2) DEFAULT 40.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Pacientes (Datos Sensibles Encriptados / PHI)
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_id VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    gender VARCHAR(10),
    phone VARCHAR(50) NOT NULL,
    whatsapp VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    insurance_provider VARCHAR(100) DEFAULT 'Particular',
    insurance_number VARCHAR(100),
    emergency_contact JSONB, -- {name, phone, relationship}
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, document_id)
);

-- 7. Antecedentes Médicos y Alergias (Anamnesis)
CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    hypertension BOOLEAN DEFAULT FALSE,
    diabetes BOOLEAN DEFAULT FALSE,
    diabetes_type VARCHAR(100),
    heart_disease BOOLEAN DEFAULT FALSE,
    coagulation_disorder BOOLEAN DEFAULT FALSE,
    pregnancy BOOLEAN DEFAULT FALSE,
    pregnancy_weeks INT,
    bruxism BOOLEAN DEFAULT FALSE,
    current_medications TEXT[],
    allergies JSONB DEFAULT '[]'::JSONB, -- [{allergen, severity, reaction, is_drug}]
    surgical_history TEXT,
    other_conditions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Odontograma Digital (Historial por Estado de Pieza)
CREATE TABLE odontograms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    dentition_type VARCHAR(20) DEFAULT 'ADULT', -- ADULT, PEDIATRIC, MIXED
    general_notes TEXT,
    updated_by_doctor_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Detalle Anatómico por Diente y Cara
CREATE TABLE odontogram_teeth (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    odontogram_id UUID NOT NULL REFERENCES odontograms(id) ON DELETE CASCADE,
    tooth_number INT NOT NULL, -- Notación FDI (11..48, 51..85)
    whole_condition whole_tooth_condition_enum DEFAULT 'normal',
    surface_occlusal tooth_surface_condition_enum DEFAULT 'healthy',
    surface_vestibular tooth_surface_condition_enum DEFAULT 'healthy',
    surface_lingual tooth_surface_condition_enum DEFAULT 'healthy',
    surface_mesial tooth_surface_condition_enum DEFAULT 'healthy',
    surface_distal tooth_surface_condition_enum DEFAULT 'healthy',
    notes TEXT,
    UNIQUE(odontogram_id, tooth_number)
);

-- 10. Evoluciones Clínicas (Formato SOAP con Firma Criptográfica)
CREATE TABLE clinical_evolutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    appointment_id UUID,
    subjective TEXT NOT NULL,
    objective TEXT NOT NULL,
    assessment TEXT NOT NULL,
    plan TEXT NOT NULL,
    teeth_involved INT[],
    prescriptions TEXT[],
    digital_signature_stamp TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Citas y Agenda Médica
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    box_number VARCHAR(50) NOT NULL,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 45,
    reason TEXT NOT NULL,
    status appointment_status_enum DEFAULT 'CONFIRMED',
    notes TEXT,
    reminder_sent_whatsapp BOOLEAN DEFAULT FALSE,
    reminder_sent_email BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Presupuestos y Planes de Tratamiento
CREATE TABLE treatment_budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    budget_number VARCHAR(50) NOT NULL UNIQUE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    status budget_status_enum DEFAULT 'ACCEPTED',
    subtotal NUMERIC(12,2) NOT NULL,
    discount_total NUMERIC(12,2) DEFAULT 0,
    insurance_total NUMERIC(12,2) DEFAULT 0,
    total_patient NUMERIC(12,2) NOT NULL,
    total_paid NUMERIC(12,2) DEFAULT 0,
    balance_due NUMERIC(12,2) NOT NULL,
    valid_until DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE budget_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES treatment_budgets(id) ON DELETE CASCADE,
    tariff_code VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    tooth_number INT,
    quantity INT DEFAULT 1,
    unit_price NUMERIC(12,2) NOT NULL,
    discount_percent NUMERIC(5,2) DEFAULT 0,
    insurance_coverage NUMERIC(12,2) DEFAULT 0,
    patient_copay NUMERIC(12,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING'
);

-- 13. Pagos y Caja Diaria
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    patient_id UUID NOT NULL REFERENCES patients(id),
    budget_id UUID REFERENCES treatment_budgets(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    amount NUMERIC(12,2) NOT NULL,
    payment_method payment_method_enum NOT NULL,
    concept TEXT NOT NULL,
    receipt_type VARCHAR(50) DEFAULT 'BOLETA',
    authorization_code VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Logs de Auditoría Inmutables (Requerimiento HIPAA §164.312(b))
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    organization_id UUID NOT NULL,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL, -- READ_PHI, CREATE_PATIENT, MODIFY_ODONTOGRAM, EMIT_RECEIPT
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID NOT NULL,
    ip_address INET,
    user_agent TEXT,
    previous_state JSONB,
    new_state JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);`;

  const apiDesignCode = `{
  "info": {
    "title": "Cima Dental & Medical Cloud REST API Spec",
    "version": "1.0.0",
    "security": "OAuth2 Bearer JWT + HIPAA Audit Context"
  },
  "endpoints": {
    "PATIENTS": [
      {
        "method": "GET",
        "path": "/api/v1/patients",
        "params": { "page": 1, "limit": 20, "search": "Herrera", "tag": "allergies" },
        "response": { "status": 200, "data": "[PatientList]", "total": 1420 }
      },
      {
        "method": "POST",
        "path": "/api/v1/patients",
        "body": {
          "documentId": "18.942.311-4",
          "firstName": "Constanza",
          "lastName": "Herrera",
          "birthDate": "1995-04-12",
          "phone": "+56991234567",
          "insuranceProvider": "Colmena",
          "allergies": [{ "allergen": "Penicilina", "severity": "severe" }]
        },
        "response": { "status": 201, "patientId": "uuid-123", "message": "Paciente registrado" }
      }
    ],
    "ODONTOGRAM": [
      {
        "method": "GET",
        "path": "/api/v1/patients/:id/odontogram",
        "response": {
          "status": 200,
          "odontogramId": "odo-01",
          "type": "ADULT",
          "teeth": { "16": { "whole": "normal", "surfaces": { "occlusal": "caries", "mesial": "caries" } } }
        }
      },
      {
        "method": "PATCH",
        "path": "/api/v1/patients/:id/odontogram/teeth/:toothNumber",
        "body": {
          "wholeCondition": "crown",
          "surfaces": { "occlusal": "composite" },
          "notes": "Corona zirconio instalada"
        },
        "response": { "status": 200, "updatedAt": "2026-08-28T11:00:00Z" }
      }
    ],
    "EVOLUTIONS": [
      {
        "method": "POST",
        "path": "/api/v1/patients/:id/evolutions",
        "body": {
          "doctorId": "doc-01",
          "subjective": "Sensibilidad al frío en molar 1.6",
          "objective": "Caries oclusomesial activa",
          "assessment": "Pulpitis reversible",
          "plan": "Aislamiento y resina compuesta estratificada",
          "teethInvolved": [16]
        },
        "response": { "status": 201, "signatureStamp": "HMAC-SHA256-DIGITAL-SIGNATURE" }
      }
    ],
    "APPOINTMENTS": [
      {
        "method": "POST",
        "path": "/api/v1/appointments",
        "body": {
          "patientId": "uuid-1",
          "doctorId": "doc-1",
          "branchId": "branch-1",
          "date": "2026-08-28",
          "startTime": "10:00",
          "durationMinutes": 60,
          "boxNumber": "Box 02",
          "reason": "Restauración Composite 1.6"
        },
        "response": { "status": 201, "appointmentId": "apt-994" }
      },
      {
        "method": "POST",
        "path": "/api/v1/appointments/:id/send-reminder",
        "body": { "channel": "WHATSAPP" },
        "response": { "status": 200, "messageDispatched": true, "timestamp": "2026-08-28T11:05:00Z" }
      }
    ],
    "BILLING_AND_CASH": [
      {
        "method": "POST",
        "path": "/api/v1/budgets",
        "body": { "patientId": "uuid-1", "items": "[BudgetItemList]", "validUntil": "2026-09-28" },
        "response": { "status": 201, "budgetNumber": "PRE-2026-0099", "totalPatient": 127750 }
      },
      {
        "method": "POST",
        "path": "/api/v1/payments",
        "body": {
          "budgetId": "bud-01",
          "amount": 50000,
          "paymentMethod": "DEBIT_CARD",
          "receiptType": "BOLETA"
        },
        "response": { "status": 201, "receiptNumber": "BOL-2026-0414", "newBalance": 77750 }
      }
    ]
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl p-6 flex flex-col gap-4 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/40">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-100 flex items-center gap-2">
                Arquitectura Full-Stack SaaS & Guía Técnica Senior
              </h3>
              <p className="text-xs text-slate-400">
                Esquemas SQL PostgreSQL DDL, Especificación RESTful API y Protocolo de Seguridad HIPAA
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('SQL_SCHEMA')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'SQL_SCHEMA' ? 'bg-teal-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Esquema SQL DDL (PostgreSQL)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('API_DESIGN')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'API_DESIGN' ? 'bg-teal-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Diseño de API REST (Endpoints)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('HIPAA_SECURITY')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'HIPAA_SECURITY' ? 'bg-teal-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Seguridad & Normativa HIPAA</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FULLSTACK_ARCH')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'FULLSTACK_ARCH' ? 'bg-teal-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Arquitectura Multi-Sucursal</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          
          {/* TAB 1: SQL SCHEMA */}
          {activeTab === 'SQL_SCHEMA' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Esquema completo en PostgreSQL listo para migración (Drizzle / Prisma / Supabase)
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(sqlSchemaCode, 'sql')}
                  className="py-1.5 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition-all"
                >
                  {copiedKey === 'sql' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'sql' ? '¡Copiado!' : 'Copiar DDL SQL'}</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-teal-300 leading-relaxed overflow-x-auto selection:bg-teal-600 selection:text-white">
                {sqlSchemaCode}
              </pre>
            </div>
          )}

          {/* TAB 2: API DESIGN */}
          {activeTab === 'API_DESIGN' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Especificación de Contratos RESTful JSON para backend Node.js / Express / NestJS
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(apiDesignCode, 'api')}
                  className="py-1.5 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition-all"
                >
                  {copiedKey === 'api' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'api' ? '¡Copiado!' : 'Copiar JSON API'}</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-sky-300 leading-relaxed overflow-x-auto">
                {apiDesignCode}
              </pre>
            </div>
          )}

          {/* TAB 3: HIPAA & SEGURIDAD */}
          {activeTab === 'HIPAA_SECURITY' && (
            <div className="flex flex-col gap-4 text-xs text-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                  <div className="p-2 bg-teal-500/20 text-teal-300 rounded-lg w-fit">
                    <Lock className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm">Encriptación en Reposo y Tránsito</h4>
                  <p className="text-slate-400">
                    Todos los identificadores de salud personales (PHI) se protegen mediante cifrado AES-256 a nivel de columna (vía pgcrypto) y conexiones TLS 1.3 forzadas con HSTS.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                  <div className="p-2 bg-blue-500/20 text-blue-300 rounded-lg w-fit">
                    <Shield className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm">Control de Acceso Granular (RBAC + RLS)</h4>
                  <p className="text-slate-400">
                    Políticas de Row-Level Security (RLS) en PostgreSQL aseguran que cada sucursal y doctor solo acceda a los expedientes clínicos autorizados.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                  <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg w-fit">
                    <Database className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm">Trazabilidad Inmutable (Audit Trail)</h4>
                  <p className="text-slate-400">
                    Registro de auditoría append-only para cada lectura, edición de odontograma, emisión de recetas o exportación de radiografías con IP y Timestamp UTC.
                  </p>
                </div>

              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                <h4 className="font-bold text-slate-200 text-sm">Firma Digital Criptográfica de Evoluciones (SOAP)</h4>
                <p className="text-slate-400 leading-relaxed">
                  Cada evolución clínica se sella digitalmente con un hash HMAC-SHA256 combinando el ID del profesional, timestamp de guardado y los datos clínicos SOAP, garantizando que el expediente no pueda ser alterado retroactivamente sin invalidar la firma.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: ARQUITECTURA FULLSTACK */}
          {activeTab === 'FULLSTACK_ARCH' && (
            <div className="flex flex-col gap-4 text-xs text-slate-300">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h4 className="font-bold text-slate-100 text-sm mb-2">Stack Tecnológico Recomendado</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-teal-400 font-bold block">Frontend</span>
                    <span className="text-slate-300">React 19 / Next.js 15 App Router + Tailwind CSS</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-blue-400 font-bold block">Backend API</span>
                    <span className="text-slate-300">Node.js + Express / NestJS con TypeScript</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-amber-400 font-bold block">Base de Datos</span>
                    <span className="text-slate-300">PostgreSQL 16 + Drizzle ORM / Supabase</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-purple-400 font-bold block">Almacenamiento</span>
                    <span className="text-slate-300">Cloud Storage S3/GCS para DICOM y Rayos X</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        <div className="flex items-center justify-end pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold"
          >
            Cerrar Guía
          </button>
        </div>

      </div>
    </div>
  );
};
