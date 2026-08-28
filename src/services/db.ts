import { 
  Patient, 
  TreatmentBudget, 
  Appointment, 
  PaymentTransaction, 
  CashRegisterSession,
  Branch,
  ProfessionalDoctor,
  TreatmentTariffItem
} from '../types/clinical';
import { 
  INITIAL_PATIENTS, 
  INITIAL_BUDGETS, 
  INITIAL_APPOINTMENTS, 
  INITIAL_PAYMENTS, 
  INITIAL_CASH_SESSION,
  INITIAL_BRANCHES,
  INITIAL_DOCTORS,
  INITIAL_TARIFFS
} from '../data/initialData';

const DB_KEYS = {
  PATIENTS: 'cima_db_patients_v2',
  BUDGETS: 'cima_db_budgets_v2',
  APPOINTMENTS: 'cima_db_appointments_v2',
  PAYMENTS: 'cima_db_payments_v2',
  CASH_SESSION: 'cima_db_cash_session_v2',
  LAST_SYNC: 'cima_db_last_sync_v2'
};

export interface DatabaseStats {
  patientsCount: number;
  budgetsCount: number;
  appointmentsCount: number;
  paymentsCount: number;
  lastUpdated: string;
  storageSizeKb: number;
}

export class ClinicalDatabase {
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
    // Initialize default if empty
    this.savePatients(INITIAL_PATIENTS);
    return INITIAL_PATIENTS;
  }

  static savePatients(patients: Patient[]): void {
    try {
      localStorage.setItem(DB_KEYS.PATIENTS, JSON.stringify(patients));
      this.updateLastSync();
    } catch (e) {
      console.error('Error saving patients to DB:', e);
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
    } catch (e) {
      console.error('Error saving budgets to DB:', e);
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
    } catch (e) {
      console.error('Error saving appointments to DB:', e);
    }
  }

  // Load Payments
  static getPayments(): PaymentTransaction[] {
    try {
      const stored = localStorage.getItem(DB_KEYS.PAYMENTS);
      if (stored) {
        return JSON.parse(stored);
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
      this.updateLastSync();
    } catch (e) {
      console.error('Error saving payments to DB:', e);
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
    } catch (e) {
      console.error('Error saving cash session to DB:', e);
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
      storageSizeKb: Math.round((totalChars * 2) / 1024 * 10) / 10
    };
  }

  // Export Full Database to JSON file
  static exportDatabaseJSON(): void {
    const data = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      patients: this.getPatients(),
      budgets: this.getBudgets(),
      appointments: this.getAppointments(),
      payments: this.getPayments(),
      cashSession: this.getCashSession(),
      branches: INITIAL_BRANCHES,
      doctors: INITIAL_DOCTORS,
      tariffs: INITIAL_TARIFFS
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cima_dental_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Import Database from JSON file
  static importDatabaseJSON(jsonContent: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonContent);
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
      return { success: true, message: 'Base de datos restaurada correctamente.' };
    } catch (err) {
      return { success: false, message: 'El archivo JSON no tiene un formato válido.' };
    }
  }

  // Reset to initial demo database
  static resetToDemoData(): void {
    this.savePatients(INITIAL_PATIENTS);
    this.saveBudgets(INITIAL_BUDGETS);
    this.saveAppointments(INITIAL_APPOINTMENTS);
    this.savePayments(INITIAL_PAYMENTS);
    this.saveCashSession(INITIAL_CASH_SESSION);
  }
}
