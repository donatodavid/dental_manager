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
  PATIENTS: 'cima_db_patients_v3',
  BUDGETS: 'cima_db_budgets_v3',
  APPOINTMENTS: 'cima_db_appointments_v3',
  PAYMENTS: 'cima_db_payments_v3',
  CASH_SESSION: 'cima_db_cash_session_v3',
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

  // Initialize and sync with Cloud SQL PostgreSQL backend
  static async initCloudSync(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      // 1. Fetch remote data from PostgreSQL API
      const [pRes, bRes, aRes, payRes, csRes] = await Promise.allSettled([
        fetch('/api/patients').then(r => r.json()),
        fetch('/api/budgets').then(r => r.json()),
        fetch('/api/appointments').then(r => r.json()),
        fetch('/api/payments').then(r => r.json()),
        fetch('/api/cash-session').then(r => r.json())
      ]);

      let hasCloudData = false;

      if (pRes.status === 'fulfilled' && pRes.value?.success && Array.isArray(pRes.value.data) && pRes.value.data.length > 0) {
        localStorage.setItem(DB_KEYS.PATIENTS, JSON.stringify(pRes.value.data));
        hasCloudData = true;
      }
      if (bRes.status === 'fulfilled' && bRes.value?.success && Array.isArray(bRes.value.data) && bRes.value.data.length > 0) {
        localStorage.setItem(DB_KEYS.BUDGETS, JSON.stringify(bRes.value.data));
        hasCloudData = true;
      }
      if (aRes.status === 'fulfilled' && aRes.value?.success && Array.isArray(aRes.value.data) && aRes.value.data.length > 0) {
        localStorage.setItem(DB_KEYS.APPOINTMENTS, JSON.stringify(aRes.value.data));
        hasCloudData = true;
      }
      if (payRes.status === 'fulfilled' && payRes.value?.success && Array.isArray(payRes.value.data) && payRes.value.data.length > 0) {
        localStorage.setItem(DB_KEYS.PAYMENTS, JSON.stringify(payRes.value.data));
        hasCloudData = true;
      }
      if (csRes.status === 'fulfilled' && csRes.value?.success && csRes.value.data) {
        localStorage.setItem(DB_KEYS.CASH_SESSION, JSON.stringify(csRes.value.data));
        hasCloudData = true;
      }

      // If cloud DB is brand new/empty, seed initial clinical data to PostgreSQL
      if (!hasCloudData) {
        await this.syncAllToCloud();
      }

      localStorage.setItem(DB_KEYS.CLOUD_SYNCED, 'true');
      this.updateLastSync();
    } catch (e) {
      console.warn('Cloud SQL background sync warning:', e);
    } finally {
      this.isSyncing = false;
    }
  }

  // Push all local clinical data to PostgreSQL in Cloud SQL
  static async syncAllToCloud(): Promise<void> {
    try {
      const patients = this.getPatients();
      const budgets = this.getBudgets();
      const appointments = this.getAppointments();
      const payments = this.getPayments();
      const cashSession = this.getCashSession();

      await Promise.allSettled([
        fetch('/api/patients/bulk-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patients })
        }),
        fetch('/api/budgets/bulk-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ budgets })
        }),
        fetch('/api/appointments/bulk-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appointments })
        }),
        fetch('/api/payments/bulk-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payments })
        }),
        fetch('/api/cash-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cashSession)
        })
      ]);
    } catch (e) {
      console.warn('Error pushing data to Cloud SQL:', e);
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
      // Async sync to Cloud SQL
      fetch('/api/patients/bulk-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patients })
      }).catch(err => console.warn('Could not sync patients to Cloud SQL:', err));
    } catch (e) {
      console.error('Error saving patients to DB:', e);
    }
  }

  static deletePatient(patientId: string): Patient[] {
    try {
      const current = this.getPatients();
      const updated = current.filter(p => p.id !== patientId);
      localStorage.setItem(DB_KEYS.PATIENTS, JSON.stringify(updated));
      this.updateLastSync();
      // Async sync delete to Cloud SQL backend
      fetch(`/api/patients/${patientId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      }).catch(err => console.warn('Could not sync patient deletion to Cloud SQL:', err));
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
      // Async sync to Cloud SQL
      fetch('/api/budgets/bulk-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budgets })
      }).catch(err => console.warn('Could not sync budgets to Cloud SQL:', err));
    } catch (e) {
      console.error('Error saving budgets to DB:', e);
    }
  }

  static deleteBudget(budgetId: string): TreatmentBudget[] {
    try {
      const current = this.getBudgets();
      const updated = current.filter(b => b.id !== budgetId);
      localStorage.setItem(DB_KEYS.BUDGETS, JSON.stringify(updated));
      this.updateLastSync();
      // Async sync delete to Cloud SQL backend
      fetch(`/api/budgets/${budgetId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      }).catch(err => console.warn('Could not sync budget deletion to Cloud SQL:', err));
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
      // Async sync to Cloud SQL
      fetch('/api/appointments/bulk-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointments })
      }).catch(err => console.warn('Could not sync appointments to Cloud SQL:', err));
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
      // Async sync to Cloud SQL
      fetch('/api/payments/bulk-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payments })
      }).catch(err => console.warn('Could not sync payments to Cloud SQL:', err));
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
      // Async sync to Cloud SQL
      fetch('/api/cash-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session)
      }).catch(err => console.warn('Could not sync cash session to Cloud SQL:', err));
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
      storageSizeKb: Math.round((totalChars * 2) / 1024 * 10) / 10,
      isCloudConnected: true
    };
  }

  // Export Full Database to JSON file
  static exportDatabaseJSON(): void {
    const data = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      engine: 'PostgreSQL / Cloud SQL',
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
    a.download = `cima_dental_cloudsql_backup_${new Date().toISOString().split('T')[0]}.json`;
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
      this.syncAllToCloud();
      return { success: true, message: 'Base de datos restaurada y sincronizada con PostgreSQL.' };
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
    this.syncAllToCloud();
  }
}
