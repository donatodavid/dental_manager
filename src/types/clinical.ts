export type UserRole = 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT';

export type ToothNumber = number; // FDI notation e.g. 11..18, 21..28, 31..38, 41..48, 51..55, 61..65, 71..75, 81..85

export type ToothSurface = 'occlusal' | 'vestibular' | 'lingual' | 'mesial' | 'distal';

export type SurfaceCondition = 
  | 'healthy'
  | 'caries'
  | 'composite'
  | 'amalgam'
  | 'sealant'
  | 'fracture'
  | 'erosion';

export type WholeToothCondition =
  | 'normal'
  | 'crown'
  | 'implant'
  | 'endodontics'
  | 'missing'
  | 'extraction_indicated'
  | 'prosthesis'
  | 'bridge_abutment'
  | 'bridge_pontic'
  | 'impacted'
  | 'orthodontic_bracket';

export interface ToothState {
  toothNumber: ToothNumber;
  wholeCondition: WholeToothCondition;
  surfaces: Record<ToothSurface, SurfaceCondition>;
  notes?: string;
  history?: Array<{
    date: string;
    doctorName: string;
    description: string;
    type: 'diagnostic' | 'treatment_performed';
  }>;
}

export type OdontogramType = 'ADULT' | 'PEDIATRIC' | 'MIXED';

export interface OdontogramData {
  id: string;
  patientId: string;
  type: OdontogramType;
  updatedAt: string;
  updatedByDoctorId: string;
  teeth: Record<ToothNumber, ToothState>;
  generalNotes?: string;
}

export interface PatientAllergy {
  id: string;
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe' | 'anaphylactic';
  reaction: string;
  isDrugAllergy: boolean;
}

export interface MedicalBackground {
  hypertension: boolean;
  diabetes: boolean;
  diabetesType?: string;
  heartDisease: boolean;
  coagulationDisorder: boolean;
  pregnancy: boolean;
  pregnancyWeeks?: number;
  infectiousDiseases: string[];
  currentMedications: string[];
  smoker: boolean;
  smokerCigarettesPerDay?: number;
  bruxism: boolean;
  otherConditions: string;
  surgicalHistory: string;
  lastMedicalCheckup?: string;
}

export interface ClinicalEvolution {
  id: string;
  patientId: string;
  date: string;
  time: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  branchId: string;
  subjective: string; // S: Síntomas y motivo según paciente
  objective: string;   // O: Hallazgos clínicos, sondaje, etc.
  assessment: string;  // A: Diagnóstico
  plan: string;        // P: Tratamiento realizado y próximo paso
  signed: boolean;
  signatureStamp: string;
  teethInvolved?: ToothNumber[];
  prescriptions?: string[];
}

export interface ClinicalDocument {
  id: string;
  patientId: string;
  title: string;
  category: 'xray' | 'panoramic' | 'tomography' | 'consent' | 'budget_pdf' | 'lab_report';
  url: string;
  uploadDate: string;
  doctorName: string;
  size: string;
  notes?: string;
  signedConsent?: boolean;
}

export interface Patient {
  id: string;
  documentId: string; // DNI / RUT / ID
  firstName: string;
  lastName: string;
  birthDate?: string;
  gender?: 'M' | 'F' | 'OTHER';
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  insuranceProvider: string; // Isapre / Seguro / Fonasa / Particular
  insuranceNumber?: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  allergies: PatientAllergy[];
  medicalBackground: MedicalBackground;
  odontogram: OdontogramData;
  evolutions: ClinicalEvolution[];
  documents: ClinicalDocument[];
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  registeredAt: string;
  lastVisit?: string;
  tags: string[];
}

export type AppointmentStatus = 
  | 'SCHEDULED' 
  | 'CONFIRMED' 
  | 'WAITING_ROOM' 
  | 'IN_TREATMENT' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'NO_SHOW';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  branchId: string;
  branchName: string;
  boxNumber: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  reason: string;
  treatmentName?: string;
  status: AppointmentStatus;
  notes?: string;
  reminderSent: {
    whatsapp: boolean;
    sms: boolean;
    email: boolean;
    lastSentAt?: string;
  };
}

export interface TreatmentTariffItem {
  id: string;
  category: 'PREVENCION' | 'OPERATORIA' | 'ENDODONCIA' | 'PERIODONCIA' | 'REHABILITACION' | 'CIRUGIA' | 'ORTODONCIA' | 'IMPLANTOLOGIA' | 'ESTETICA';
  code: string;
  name: string;
  description: string;
  defaultPrice: number;
  requiresTooth: boolean;
  requiresSurface: boolean;
  estimatedMinutes: number;
}

export interface BudgetItem {
  id: string;
  tariffItemId: string;
  code: string;
  description: string;
  toothNumber?: ToothNumber;
  surface?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  insuranceCoverageAmount: number;
  patientCopay: number;
  total: number;
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
}

export interface TreatmentBudget {
  id: string;
  budgetNumber: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  patientRut?: string;
  doctorId: string;
  doctorName: string;
  branchId: string;
  createdAt: string;
  validUntil: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'IN_TREATMENT' | 'PAID' | 'EXPIRED' | 'REJECTED';
  items: BudgetItem[];
  subtotal: number;
  discountTotal: number;
  insuranceTotal: number;
  totalPatient: number;
  totalPaid: number;
  balanceDue: number;
  notes?: string;
}

export type PaymentMethod = 'CASH' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'BANK_TRANSFER' | 'INSURANCE_CLAIM' | 'MERCADOPAGO';

export interface PaymentTransaction {
  id: string;
  receiptNumber: string;
  patientId: string;
  patientName: string;
  budgetId?: string;
  branchId: string;
  doctorId: string;
  doctorName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  time: string;
  concept: string;
  receiptType: 'BOLETA' | 'FACTURA' | 'RECIBO_INTERNO';
  authorizationCode?: string;
  cashRegisterId: string;
  receivedBy: string;
}

export interface CashRegisterSession {
  id: string;
  branchId: string;
  branchName: string;
  openedAt: string;
  closedAt?: string;
  openedBy: string;
  closedBy?: string;
  openingCash: number;
  closingCash?: number;
  totalCashIncome: number;
  totalCardIncome: number;
  totalTransferIncome: number;
  totalInsuranceIncome: number;
  totalExpenses: number;
  expectedCashTotal: number;
  cashDifference?: number;
  status: 'OPEN' | 'CLOSED';
  notes?: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  boxesCount: number;
  color: string;
}

export interface ProfessionalDoctor {
  id: string;
  name: string;
  documentId: string;
  specialty: string;
  licenseNumber: string;
  email: string;
  phone: string;
  branchIds: string[];
  commissionRatePercent: number;
  color: string;
  avatarUrl: string;
}

export interface ClinicSettings {
  name: string;
  tagline: string;
  address: string;
  city: string;
  region: string;
  phone: string;
  email: string;
  rut: string;
  logoUrl: string;
  hours: string;
  defaultDoctorId: string;
}
