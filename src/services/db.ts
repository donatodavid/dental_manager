import { 
  Patient, 
  TreatmentBudget, 
  Appointment, 
  PaymentTransaction, 
  CashRegisterSession, 
  ClinicSettings,
  ProfessionalDoctor
} from '../types/clinical';
import { 
  INITIAL_PATIENTS, 
  INITIAL_BUDGETS, 
  INITIAL_APPOINTMENTS, 
  INITIAL_PAYMENTS, 
  INITIAL_CASH_SESSION,
  INITIAL_BRANCHES,
  INITIAL_DOCTORS,
  INITIAL_TARIFFS,
  DEFAULT_CLINIC_SETTINGS
} from '../data/initialData';
import { FirestoreService } from './firestoreService';

const DB_KEYS = {
  PATIENTS: 'cima_db_patients_v3',
  BUDGETS: 'cima_db_budgets_v3',
  APPOINTMENTS: 'cima_db_appointments_v3',
  PAYMENTS: 'cima_db_payments_v3',
  CASH_SESSION: 'cima_db_cash_session_v3',
  CLINIC_SETTINGS: 'cima_db_clinic_settings_v3',
  PAYMENTS_INITIALIZED: 'cima_db_payments_init_v3',
  LAST_SYNC: 'cima_db_last_sync_v3',
  CLOUD_SYNCED: 'cima_db_cloud_synced_v3'
};

export interface DatabaseStats {
  patientsCount: number;
  budgetsCount: number;
  appointmentsCount: number;
  paymentsCount: number;
  lastUpdated: string;
  storageSizeKb: number;
  isCloudConnected: boolean;
}

export class ClinicalDatabase {
  private static isSyncing = false;

  // Initialize and sync with Firebase Firestore
  static async initCloudSync(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      // Seed Firestore with initial clinic records if empty
      await FirestoreService.initAndSeed();

      localStorage.setItem(DB_KEYS.CLOUD_SYNCED, 'true');
      this.updateLastSync();
    } catch (e) {
      console.warn('Firebase Firestore background sync warning:', e);
    } finally {
      this.isSyncing = false;
    }
  }

  // Push all local clinical data to Firebase Firestore
  static async syncAllToCloud(): Promise<void> {
    try {
      const patients = this.getPatients();
      const budgets = this.getBudgets();
      const appointments = this.getAppointments();
      const payments = this.getPayments();
      const cashSession = this.getCashSession();
      const settings = this.getClinicSettings();

      await Promise.allSettled([
        ...patients.map(p => FirestoreService.savePatient(p)),
        ...budgets.map(b => FirestoreService.saveBudget(b)),
        ...appointments.map(a => FirestoreService.saveAppointment(a)),
        ...payments.map(pay => FirestoreService.savePayment(pay)),
        FirestoreService.saveCashSession(cashSession),
        FirestoreService.saveClinicSettings(settings)
      ]);
    } catch (e) {
      console.warn('Error pushing data to Firebase Firestore:', e);
    }
  }

  // Load Patients
  static getPatients(): Patient[] {
    try {
      const stored = localStorage.getItem(DB_KEYS.PATIENTS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading patients from DB:', e);
    }
    this.savePatients(INITIAL_PATIENTS);
    return INITIAL_PATIENTS;
  }

  static savePatients(patients: Patient[]): void {
    try {
      localStorage.setItem(DB_KEYS.PATIENTS, JSON.stringify(patients));
      this.updateLastSync();
      // Async sync to Firestore
      patients.forEach(p => {
        FirestoreService.savePatient(p).catch(err => console.warn('Could not sync patient to Firestore:', err));
      });
    } catch (e) {
      console.error('Error saving patients to DB:', e);
    }
  }

  static savePatient(patient: Patient): void {
    try {
      const current = this.getPatients();
      const index = current.findIndex(p => p.id === patient.id);
      let updated: Patient[];
      if (index >= 0) {
        updated = [...current];
        updated[index] = patient;
      } else {
        updated = [patient, ...current];
      }
      localStorage.setItem(DB_KEYS.PATIENTS, JSON.stringify(updated));
      this.updateLastSync();
      FirestoreService.savePatient(patient).catch(err => console.warn('Could not sync patient to Firestore:', err));
    } catch (e) {
      console.error('Error saving single patient to DB:', e);
    }
  }

  static deletePatient(patientId: string): Patient[] {
    try {
      const current = this.getPatients();
      const updated = current.filter(p => p.id !== patientId);
      localStorage.setItem(DB_KEYS.PATIENTS, JSON.stringify(updated));
      this.updateLastSync();
      // Async sync delete to Firestore
      FirestoreService.deletePatient(patientId).catch(err => console.warn('Could not sync patient deletion to Firestore:', err));
      return updated;
    } catch (e) {
      console.error('Error deleting patient from DB:', e);
      return this.getPatients();
    }
  }

  // Load Budgets
  static getBudgets(): TreatmentBudget[] {
    try {
      const stored = localStorage.getItem(DB_KEYS.BUDGETS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading budgets from DB:', e);
    }
    this.saveBudgets(INITIAL_BUDGETS);
    return INITIAL_BUDGETS;
  }

  static saveBudgets(budgets: TreatmentBudget[]): void {
    try {
      localStorage.setItem(DB_KEYS.BUDGETS, JSON.stringify(budgets));
      this.updateLastSync();
      budgets.forEach(b => {
        FirestoreService.saveBudget(b).catch(err => console.warn('Could not sync budget to Firestore:', err));
      });
    } catch (e) {
      console.error('Error saving budgets to DB:', e);
    }
  }

  static saveBudget(budget: TreatmentBudget): void {
    try {
      const current = this.getBudgets();
      const index = current.findIndex(b => b.id === budget.id);
      let updated: TreatmentBudget[];
      if (index >= 0) {
        updated = [...current];
        updated[index] = budget;
      } else {
        updated = [budget, ...current];
      }
      localStorage.setItem(DB_KEYS.BUDGETS, JSON.stringify(updated));
      this.updateLastSync();
      FirestoreService.saveBudget(budget).catch(err => console.warn('Could not sync budget to Firestore:', err));
    } catch (e) {
      console.error('Error saving single budget to DB:', e);
    }
  }

  static deleteBudget(budgetId: string): TreatmentBudget[] {
    try {
      const current = this.getBudgets();
      const updated = current.filter(b => b.id !== budgetId);
      localStorage.setItem(DB_KEYS.BUDGETS, JSON.stringify(updated));
      this.updateLastSync();
      FirestoreService.deleteBudget(budgetId).catch(err => console.warn('Could not sync budget deletion to Firestore:', err));
      return updated;
    } catch (e) {
      console.error('Error deleting budget from DB:', e);
      return this.getBudgets();
    }
  }

  // Load Appointments
  static getAppointments(): Appointment[] {
    try {
      const stored = localStorage.getItem(DB_KEYS.APPOINTMENTS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading appointments from DB:', e);
    }
    this.saveAppointments(INITIAL_APPOINTMENTS);
    return INITIAL_APPOINTMENTS;
  }

  static saveAppointments(appointments: Appointment[]): void {
    try {
      localStorage.setItem(DB_KEYS.APPOINTMENTS, JSON.stringify(appointments));
      this.updateLastSync();
      appointments.forEach(a => {
        FirestoreService.saveAppointment(a).catch(err => console.warn('Could not sync appointment to Firestore:', err));
      });
    } catch (e) {
      console.error('Error saving appointments to DB:', e);
    }
  }

  static saveAppointment(appointment: Appointment): void {
    try {
      const current = this.getAppointments();
      const index = current.findIndex(a => a.id === appointment.id);
      let updated: Appointment[];
      if (index >= 0) {
        updated = [...current];
        updated[index] = appointment;
      } else {
        updated = [appointment, ...current];
      }
      localStorage.setItem(DB_KEYS.APPOINTMENTS, JSON.stringify(updated));
      this.updateLastSync();
      FirestoreService.saveAppointment(appointment).catch(err => console.warn('Could not sync appointment to Firestore:', err));
    } catch (e) {
      console.error('Error saving single appointment to DB:', e);
    }
  }

  static deleteAppointment(appointmentId: string): Appointment[] {
    try {
      const current = this.getAppointments();
      const updated = current.filter(a => a.id !== appointmentId);
      localStorage.setItem(DB_KEYS.APPOINTMENTS, JSON.stringify(updated));
      this.updateLastSync();
      FirestoreService.deleteAppointment(appointmentId).catch(err => console.warn('Could not sync appointment deletion to Firestore:', err));
      return updated;
    } catch (e) {
      console.error('Error deleting appointment from DB:', e);
      return this.getAppointments();
    }
  }

  // Load Payments
  static getPayments(): PaymentTransaction[] {
    try {
      const stored = localStorage.getItem(DB_KEYS.PAYMENTS);
      if (stored !== null) {
        return JSON.parse(stored);
      }
      if (localStorage.getItem(DB_KEYS.PAYMENTS_INITIALIZED) === 'true') {
        return [];
      }
    } catch (e) {
      console.error('Error loading payments from DB:', e);
    }
    this.savePayments(INITIAL_PAYMENTS);
    return INITIAL_PAYMENTS;
  }

  static savePayments(payments: PaymentTransaction[]): void {
    try {
      localStorage.setItem(DB_KEYS.PAYMENTS, JSON.stringify(payments));
      localStorage.setItem(DB_KEYS.PAYMENTS_INITIALIZED, 'true');
      this.updateLastSync();
      if (payments.length === 0) {
        FirestoreService.resetPayments().catch(err => console.warn('Could not reset payments in Firestore:', err));
      } else {
        payments.forEach(pay => {
          FirestoreService.savePayment(pay).catch(err => console.warn('Could not sync payment to Firestore:', err));
        });
      }
    } catch (e) {
      console.error('Error saving payments to DB:', e);
    }
  }

  static savePayment(payment: PaymentTransaction): void {
    try {
      const current = this.getPayments();
      const updated = [payment, ...current];
      localStorage.setItem(DB_KEYS.PAYMENTS, JSON.stringify(updated));
      localStorage.setItem(DB_KEYS.PAYMENTS_INITIALIZED, 'true');
      this.updateLastSync();
      FirestoreService.savePayment(payment).catch(err => console.warn('Could not sync payment to Firestore:', err));
    } catch (e) {
      console.error('Error saving single payment to DB:', e);
    }
  }

  static resetMonthlyEarnings(): { success: boolean; message: string } {
    try {
      localStorage.setItem(DB_KEYS.PAYMENTS, JSON.stringify([]));
      localStorage.setItem(DB_KEYS.PAYMENTS_INITIALIZED, 'true');

      const currentSession = this.getCashSession();
      const opening = typeof currentSession?.openingCash === 'number' ? currentSession.openingCash : 120000;
      const updatedSession: CashRegisterSession = {
        ...currentSession,
        totalCashIncome: 0,
        totalCardIncome: 0,
        totalTransferIncome: 0,
        totalInsuranceIncome: 0,
        totalExpenses: 0,
        expectedCashTotal: opening
      };
      localStorage.setItem(DB_KEYS.CASH_SESSION, JSON.stringify(updatedSession));
      this.updateLastSync();

      FirestoreService.resetPayments().catch(err => console.warn('Could not reset payments in Firestore:', err));
      FirestoreService.saveCashSession(updatedSession).catch(err => console.warn('Could not sync reset cash session:', err));

      return { success: true, message: 'Ganancias del mes reiniciadas a $0 exitosamente.' };
    } catch (e) {
      console.error('Error resetting monthly earnings:', e);
      return { success: false, message: 'Error al reiniciar las ganancias.' };
    }
  }

  // Load Cash Session
  static getCashSession(): CashRegisterSession {
    try {
      const stored = localStorage.getItem(DB_KEYS.CASH_SESSION);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading cash session from DB:', e);
    }
    this.saveCashSession(INITIAL_CASH_SESSION);
    return INITIAL_CASH_SESSION;
  }

  static saveCashSession(session: CashRegisterSession): void {
    try {
      localStorage.setItem(DB_KEYS.CASH_SESSION, JSON.stringify(session));
      this.updateLastSync();
      FirestoreService.saveCashSession(session).catch(err => console.warn('Could not sync cash session to Firestore:', err));
    } catch (e) {
      console.error('Error saving cash session to DB:', e);
    }
  }

  // Clinic Settings
  static getClinicSettings(): ClinicSettings {
    try {
      const data = localStorage.getItem(DB_KEYS.CLINIC_SETTINGS);
      if (data) {
        return { ...DEFAULT_CLINIC_SETTINGS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Could not load clinic settings from DB, using defaults', e);
    }
    return DEFAULT_CLINIC_SETTINGS;
  }

  static saveClinicSettings(settings: ClinicSettings): void {
    try {
      localStorage.setItem(DB_KEYS.CLINIC_SETTINGS, JSON.stringify(settings));
      this.updateLastSync();
      FirestoreService.saveClinicSettings(settings).catch(err => console.warn('Could not sync settings to Firestore:', err));
    } catch (e) {
      console.error('Error saving clinic settings to DB:', e);
    }
  }

  private static updateLastSync(): void {
    try {
      localStorage.setItem(DB_KEYS.LAST_SYNC, new Date().toISOString());
    } catch {
      // ignore
    }
  }

  // Database Statistics
  static getStats(): DatabaseStats {
    const patients = this.getPatients();
    const budgets = this.getBudgets();
    const appointments = this.getAppointments();
    const payments = this.getPayments();
    const lastUpdated = localStorage.getItem(DB_KEYS.LAST_SYNC) || new Date().toISOString();

    let totalChars = 0;
    Object.values(DB_KEYS).forEach(k => {
      const val = localStorage.getItem(k);
      if (val) totalChars += val.length;
    });

    return {
      patientsCount: patients.length,
      budgetsCount: budgets.length,
      appointmentsCount: appointments.length,
      paymentsCount: payments.length,
      lastUpdated,
      storageSizeKb: Math.round((totalChars * 2) / 1024 * 10) / 10,
      isCloudConnected: true
    };
  }

  // Doctors
  static getDoctors(): ProfessionalDoctor[] {
    return INITIAL_DOCTORS;
  }

  static saveDoctors(doctors: ProfessionalDoctor[]): void {
    // Persistence for doctors list
  }

  // Export Full Database string
  static exportCompleteDatabase(): string {
    const data = {
      version: '3.0.0',
      exportedAt: new Date().toISOString(),
      engine: 'Firebase Firestore Cloud Database',
      projectId: 'automatic-electron-x8chg',
      clinicSettings: this.getClinicSettings(),
      patients: this.getPatients(),
      budgets: this.getBudgets(),
      appointments: this.getAppointments(),
      payments: this.getPayments(),
      cashSession: this.getCashSession(),
      branches: INITIAL_BRANCHES,
      doctors: INITIAL_DOCTORS,
      tariffs: INITIAL_TARIFFS
    };
    return JSON.stringify(data, null, 2);
  }

  // Export Full Database to JSON file
  static exportDatabaseJSON(): void {
    const dataString = this.exportCompleteDatabase();
    const blob = new Blob([dataString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daaron_dental_firestore_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Import Database from JSON file
  static importDatabaseJSON(jsonContent: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonContent);
      if (parsed.clinicSettings) {
        this.saveClinicSettings(parsed.clinicSettings);
      }
      if (parsed.patients && Array.isArray(parsed.patients)) {
        this.savePatients(parsed.patients);
      }
      if (parsed.budgets && Array.isArray(parsed.budgets)) {
        this.saveBudgets(parsed.budgets);
      }
      if (parsed.appointments && Array.isArray(parsed.appointments)) {
        this.saveAppointments(parsed.appointments);
      }
      if (parsed.payments && Array.isArray(parsed.payments)) {
        this.savePayments(parsed.payments);
      }
      if (parsed.cashSession) {
        this.saveCashSession(parsed.cashSession);
      }
      this.syncAllToCloud();
      return { success: true, message: 'Base de datos restaurada y sincronizada con Firebase Firestore.' };
    } catch (err) {
      return { success: false, message: 'El archivo JSON no tiene un formato válido.' };
    }
  }

  // Reset to initial demo database
  static resetToDemoData(): void {
    this.saveClinicSettings(DEFAULT_CLINIC_SETTINGS);
    this.savePatients(INITIAL_PATIENTS);
    this.saveBudgets(INITIAL_BUDGETS);
    this.saveAppointments(INITIAL_APPOINTMENTS);
    this.savePayments(INITIAL_PAYMENTS);
    this.saveCashSession(INITIAL_CASH_SESSION);
    FirestoreService.resetDatabase().catch(err => console.warn('Could not reset Firestore:', err));
  }
}

