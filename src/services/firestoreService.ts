import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot, 
  writeBatch,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Patient, 
  TreatmentBudget, 
  Appointment, 
  PaymentTransaction, 
  CashRegisterSession, 
  ClinicSettings 
} from '../types/clinical';
import { 
  INITIAL_PATIENTS, 
  INITIAL_BUDGETS, 
  INITIAL_APPOINTMENTS, 
  INITIAL_PAYMENTS, 
  INITIAL_CASH_SESSION,
  DEFAULT_CLINIC_SETTINGS 
} from '../data/initialData';

// Safe sanitizer to remove undefined values for Firestore
function cleanForFirestore<T>(obj: T): any {
  return JSON.parse(JSON.stringify(obj, (_, v) => (v === undefined ? null : v)));
}

export class FirestoreService {
  private static isSeeding = false;

  // Initialize and seed if collections are empty
  static async initAndSeed(): Promise<void> {
    if (this.isSeeding) return;
    try {
      const snap = await getDocs(collection(db, 'patients'));
      if (snap.empty) {
        this.isSeeding = true;
        console.log('⚡ Firestore vacío: inicializando datos base de Consulta Dental Daaron...');
        const batch = writeBatch(db);

        // Seed Patients
        for (const p of INITIAL_PATIENTS) {
          const ref = doc(db, 'patients', p.id);
          batch.set(ref, cleanForFirestore(p));
        }

        // Seed Budgets
        for (const b of INITIAL_BUDGETS) {
          const ref = doc(db, 'budgets', b.id);
          batch.set(ref, cleanForFirestore(b));
        }

        // Seed Appointments
        for (const a of INITIAL_APPOINTMENTS) {
          const ref = doc(db, 'appointments', a.id);
          batch.set(ref, cleanForFirestore(a));
        }

        // Seed Payments
        for (const pay of INITIAL_PAYMENTS) {
          const ref = doc(db, 'payments', pay.id);
          batch.set(ref, cleanForFirestore(pay));
        }

        // Seed Cash Session
        const csRef = doc(db, 'cash_sessions', INITIAL_CASH_SESSION.id);
        batch.set(csRef, cleanForFirestore(INITIAL_CASH_SESSION));

        // Seed Settings
        const stRef = doc(db, 'clinic_settings', 'main');
        batch.set(stRef, cleanForFirestore(DEFAULT_CLINIC_SETTINGS));

        await batch.commit();
        console.log('✅ Base de datos Firestore inicializada y poblada con éxito.');
      }
    } catch (error) {
      console.warn('Advertencia en inicialización de Firestore:', error);
    } finally {
      this.isSeeding = false;
    }
  }

  // --- Real-Time Listeners ---

  static subscribePatients(callback: (patients: Patient[]) => void): Unsubscribe {
    return onSnapshot(collection(db, 'patients'), (snapshot) => {
      if (!snapshot.empty) {
        const patients = snapshot.docs.map(doc => doc.data() as Patient);
        callback(patients);
      }
    }, (err) => {
      console.warn('Error escuchando pacientes en Firestore:', err);
    });
  }

  static subscribeBudgets(callback: (budgets: TreatmentBudget[]) => void): Unsubscribe {
    return onSnapshot(collection(db, 'budgets'), (snapshot) => {
      if (!snapshot.empty) {
        const budgets = snapshot.docs.map(doc => doc.data() as TreatmentBudget);
        callback(budgets);
      }
    }, (err) => {
      console.warn('Error escuchando presupuestos en Firestore:', err);
    });
  }

  static subscribeAppointments(callback: (appointments: Appointment[]) => void): Unsubscribe {
    return onSnapshot(collection(db, 'appointments'), (snapshot) => {
      if (!snapshot.empty) {
        const appointments = snapshot.docs.map(doc => doc.data() as Appointment);
        callback(appointments);
      }
    }, (err) => {
      console.warn('Error escuchando citas en Firestore:', err);
    });
  }

  static subscribePayments(callback: (payments: PaymentTransaction[]) => void): Unsubscribe {
    return onSnapshot(collection(db, 'payments'), (snapshot) => {
      const payments = snapshot.docs.map(doc => doc.data() as PaymentTransaction);
      callback(payments);
    }, (err) => {
      console.warn('Error escuchando pagos en Firestore:', err);
    });
  }

  static subscribeCashSessions(callback: (session: CashRegisterSession | null) => void): Unsubscribe {
    return onSnapshot(collection(db, 'cash_sessions'), (snapshot) => {
      if (!snapshot.empty) {
        const session = snapshot.docs[0]?.data() as CashRegisterSession;
        callback(session || null);
      }
    }, (err) => {
      console.warn('Error escuchando sesiones de caja en Firestore:', err);
    });
  }

  static subscribeClinicSettings(callback: (settings: ClinicSettings | null) => void): Unsubscribe {
    return onSnapshot(doc(db, 'clinic_settings', 'main'), (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as ClinicSettings);
      }
    }, (err) => {
      console.warn('Error escuchando configuración de clínica en Firestore:', err);
    });
  }

  // --- CRUD Operations ---

  // Patients
  static async savePatient(patient: Patient): Promise<void> {
    try {
      const ref = doc(db, 'patients', patient.id);
      await setDoc(ref, cleanForFirestore(patient), { merge: true });
    } catch (e) {
      console.error('Error guardando paciente en Firestore:', e);
      throw e;
    }
  }

  static async deletePatient(patientId: string): Promise<void> {
    try {
      const ref = doc(db, 'patients', patientId);
      await deleteDoc(ref);
    } catch (e) {
      console.error('Error eliminando paciente en Firestore:', e);
      throw e;
    }
  }

  // Budgets
  static async saveBudget(budget: TreatmentBudget): Promise<void> {
    try {
      const ref = doc(db, 'budgets', budget.id);
      await setDoc(ref, cleanForFirestore(budget), { merge: true });
    } catch (e) {
      console.error('Error guardando presupuesto en Firestore:', e);
      throw e;
    }
  }

  static async deleteBudget(budgetId: string): Promise<void> {
    try {
      const ref = doc(db, 'budgets', budgetId);
      await deleteDoc(ref);
    } catch (e) {
      console.error('Error eliminando presupuesto en Firestore:', e);
      throw e;
    }
  }

  // Appointments
  static async saveAppointment(appointment: Appointment): Promise<void> {
    try {
      const ref = doc(db, 'appointments', appointment.id);
      await setDoc(ref, cleanForFirestore(appointment), { merge: true });
    } catch (e) {
      console.error('Error guardando cita en Firestore:', e);
      throw e;
    }
  }

  static async deleteAppointment(appointmentId: string): Promise<void> {
    try {
      const ref = doc(db, 'appointments', appointmentId);
      await deleteDoc(ref);
    } catch (e) {
      console.error('Error eliminando cita en Firestore:', e);
      throw e;
    }
  }

  // Payments
  static async savePayment(payment: PaymentTransaction): Promise<void> {
    try {
      const ref = doc(db, 'payments', payment.id);
      await setDoc(ref, cleanForFirestore(payment), { merge: true });
    } catch (e) {
      console.error('Error guardando pago en Firestore:', e);
      throw e;
    }
  }

  static async resetPayments(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, 'payments'));
      const batch = writeBatch(db);
      snap.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (e) {
      console.error('Error reiniciando pagos en Firestore:', e);
      throw e;
    }
  }

  // Cash Session
  static async saveCashSession(session: CashRegisterSession): Promise<void> {
    try {
      const ref = doc(db, 'cash_sessions', session.id);
      await setDoc(ref, cleanForFirestore(session), { merge: true });
    } catch (e) {
      console.error('Error guardando sesión de caja en Firestore:', e);
      throw e;
    }
  }

  // Clinic Settings
  static async saveClinicSettings(settings: ClinicSettings): Promise<void> {
    try {
      const ref = doc(db, 'clinic_settings', 'main');
      await setDoc(ref, cleanForFirestore(settings), { merge: true });
    } catch (e) {
      console.error('Error guardando configuración en Firestore:', e);
      throw e;
    }
  }

  // Reset entire database to default
  static async resetDatabase(): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Delete all existing
      const [pSnap, bSnap, aSnap, paySnap] = await Promise.all([
        getDocs(collection(db, 'patients')),
        getDocs(collection(db, 'budgets')),
        getDocs(collection(db, 'appointments')),
        getDocs(collection(db, 'payments'))
      ]);

      pSnap.docs.forEach(d => batch.delete(d.ref));
      bSnap.docs.forEach(d => batch.delete(d.ref));
      aSnap.docs.forEach(d => batch.delete(d.ref));
      paySnap.docs.forEach(d => batch.delete(d.ref));

      // Re-populate with defaults
      for (const p of INITIAL_PATIENTS) {
        batch.set(doc(db, 'patients', p.id), cleanForFirestore(p));
      }
      for (const b of INITIAL_BUDGETS) {
        batch.set(doc(db, 'budgets', b.id), cleanForFirestore(b));
      }
      for (const a of INITIAL_APPOINTMENTS) {
        batch.set(doc(db, 'appointments', a.id), cleanForFirestore(a));
      }
      for (const pay of INITIAL_PAYMENTS) {
        batch.set(doc(db, 'payments', pay.id), cleanForFirestore(pay));
      }

      batch.set(doc(db, 'cash_sessions', INITIAL_CASH_SESSION.id), cleanForFirestore(INITIAL_CASH_SESSION));
      batch.set(doc(db, 'clinic_settings', 'main'), cleanForFirestore(DEFAULT_CLINIC_SETTINGS));

      await batch.commit();
      console.log('✅ Base de datos Firestore reseteada con éxito.');
    } catch (e) {
      console.error('Error restableciendo Firestore:', e);
      throw e;
    }
  }
}
