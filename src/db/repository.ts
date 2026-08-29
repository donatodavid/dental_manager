import { db } from './index.ts';
import { 
  users, 
  patients, 
  treatmentBudgets, 
  appointments, 
  paymentTransactions, 
  cashRegisterSessions, 
  branches, 
  doctors, 
  tariffs 
} from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import { 
  Patient, 
  TreatmentBudget, 
  Appointment, 
  PaymentTransaction, 
  CashRegisterSession,
  Branch,
  ProfessionalDoctor,
  TreatmentTariffItem
} from '../types/clinical.ts';

// User Helpers
export async function getOrCreateUser(uid: string, email: string, name?: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        name: name || '',
        role: 'DOCTOR',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(name ? { name } : {}),
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database getOrCreateUser failed:', error);
    throw new Error('Database operation failed: unable to register user', { cause: error });
  }
}

// Patients Helpers
export async function getAllPatients(): Promise<Patient[]> {
  try {
    const rows = await db.select().from(patients);
    return rows.map(r => ({
      id: r.id,
      documentId: r.documentId,
      firstName: r.firstName,
      lastName: r.lastName,
      birthDate: r.birthDate || '',
      gender: (r.gender as any) || 'OTHER',
      phone: r.phone || '',
      whatsapp: r.whatsapp || '',
      email: r.email || '',
      address: r.address || '',
      city: r.city || '',
      insuranceProvider: r.insuranceProvider || 'Particular',
      insuranceNumber: r.insuranceNumber || '',
      emergencyContact: (r.emergencyContact as any) || { name: '', phone: '', relationship: '' },
      allergies: (r.allergies as any) || [],
      medicalBackground: (r.medicalBackground as any) || {
        hypertension: false,
        diabetes: false,
        heartDisease: false,
        coagulationDisorder: false,
        pregnancy: false,
        infectiousDiseases: [],
        currentMedications: [],
        smoker: false,
        bruxism: false,
        otherConditions: '',
        surgicalHistory: ''
      },
      odontogram: (r.odontogram as any) || {
        id: `od-${r.id}`,
        patientId: r.id,
        type: 'ADULT',
        updatedAt: new Date().toISOString(),
        updatedByDoctorId: 'doc-1',
        teeth: {}
      },
      evolutions: (r.evolutions as any) || [],
      documents: (r.documents as any) || [],
      status: (r.status as any) || 'ACTIVE',
      registeredAt: r.registeredAt || new Date().toISOString(),
      lastVisit: r.lastVisit || undefined,
      tags: (r.tags as any) || []
    }));
  } catch (error) {
    console.error('Database getAllPatients failed:', error);
    throw new Error('Database operation failed: unable to fetch patients', { cause: error });
  }
}

export async function upsertPatient(p: Patient) {
  try {
    const result = await db.insert(patients)
      .values({
        id: p.id,
        documentId: p.documentId,
        firstName: p.firstName,
        lastName: p.lastName,
        birthDate: p.birthDate,
        gender: p.gender,
        phone: p.phone,
        whatsapp: p.whatsapp,
        email: p.email,
        address: p.address,
        city: p.city,
        insuranceProvider: p.insuranceProvider,
        insuranceNumber: p.insuranceNumber,
        emergencyContact: p.emergencyContact,
        allergies: p.allergies,
        medicalBackground: p.medicalBackground,
        odontogram: p.odontogram,
        evolutions: p.evolutions,
        documents: p.documents,
        status: p.status,
        registeredAt: p.registeredAt,
        lastVisit: p.lastVisit,
        tags: p.tags,
      })
      .onConflictDoUpdate({
        target: patients.id,
        set: {
          documentId: p.documentId,
          firstName: p.firstName,
          lastName: p.lastName,
          birthDate: p.birthDate,
          gender: p.gender,
          phone: p.phone,
          whatsapp: p.whatsapp,
          email: p.email,
          address: p.address,
          city: p.city,
          insuranceProvider: p.insuranceProvider,
          insuranceNumber: p.insuranceNumber,
          emergencyContact: p.emergencyContact,
          allergies: p.allergies,
          medicalBackground: p.medicalBackground,
          odontogram: p.odontogram,
          evolutions: p.evolutions,
          documents: p.documents,
          status: p.status,
          lastVisit: p.lastVisit,
          tags: p.tags,
        }
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database upsertPatient failed:', error);
    throw new Error('Database operation failed: unable to save patient', { cause: error });
  }
}

export async function upsertMultiplePatients(patientList: Patient[]) {
  try {
    for (const p of patientList) {
      await upsertPatient(p);
    }
    return true;
  } catch (error) {
    console.error('Database upsertMultiplePatients failed:', error);
    throw new Error('Database operation failed: unable to batch save patients', { cause: error });
  }
}

export async function deletePatient(patientId: string) {
  try {
    await db.delete(patients).where(eq(patients.id, patientId));
    return true;
  } catch (error) {
    console.error('Database deletePatient failed:', error);
    throw new Error('Database operation failed: unable to delete patient', { cause: error });
  }
}

// Budgets Helpers
export async function getAllBudgets(): Promise<TreatmentBudget[]> {
  try {
    const rows = await db.select().from(treatmentBudgets).orderBy(desc(treatmentBudgets.createdAt));
    return rows.map(r => ({
      id: r.id,
      budgetNumber: r.budgetNumber,
      patientId: r.patientId,
      patientName: r.patientName,
      doctorId: r.doctorId || '',
      doctorName: r.doctorName || '',
      branchId: r.branchId || '',
      createdAt: r.createdAt,
      validUntil: r.validUntil || '',
      status: (r.status as any) || 'DRAFT',
      items: (r.items as any) || [],
      subtotal: r.subtotal || 0,
      discountTotal: r.discountTotal || 0,
      insuranceTotal: r.insuranceTotal || 0,
      totalPatient: r.totalPatient || 0,
      totalPaid: r.totalPaid || 0,
      balanceDue: r.balanceDue || 0,
      notes: r.notes || ''
    }));
  } catch (error) {
    console.error('Database getAllBudgets failed:', error);
    throw new Error('Database operation failed: unable to fetch budgets', { cause: error });
  }
}

export async function upsertBudget(b: TreatmentBudget) {
  try {
    const result = await db.insert(treatmentBudgets)
      .values({
        id: b.id,
        budgetNumber: b.budgetNumber,
        patientId: b.patientId,
        patientName: b.patientName,
        doctorId: b.doctorId,
        doctorName: b.doctorName,
        branchId: b.branchId,
        createdAt: b.createdAt,
        validUntil: b.validUntil,
        status: b.status,
        items: b.items,
        subtotal: b.subtotal,
        discountTotal: b.discountTotal,
        insuranceTotal: b.insuranceTotal,
        totalPatient: b.totalPatient,
        totalPaid: b.totalPaid,
        balanceDue: b.balanceDue,
        notes: b.notes,
      })
      .onConflictDoUpdate({
        target: treatmentBudgets.id,
        set: {
          budgetNumber: b.budgetNumber,
          patientName: b.patientName,
          doctorId: b.doctorId,
          doctorName: b.doctorName,
          branchId: b.branchId,
          validUntil: b.validUntil,
          status: b.status,
          items: b.items,
          subtotal: b.subtotal,
          discountTotal: b.discountTotal,
          insuranceTotal: b.insuranceTotal,
          totalPatient: b.totalPatient,
          totalPaid: b.totalPaid,
          balanceDue: b.balanceDue,
          notes: b.notes,
        }
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database upsertBudget failed:', error);
    throw new Error('Database operation failed: unable to save budget', { cause: error });
  }
}

export async function upsertMultipleBudgets(budgetsList: TreatmentBudget[]) {
  try {
    for (const b of budgetsList) {
      await upsertBudget(b);
    }
    return true;
  } catch (error) {
    console.error('Database upsertMultipleBudgets failed:', error);
    throw new Error('Database operation failed: unable to batch save budgets', { cause: error });
  }
}

export async function deleteBudget(budgetId: string) {
  try {
    await db.delete(treatmentBudgets).where(eq(treatmentBudgets.id, budgetId));
    return true;
  } catch (error) {
    console.error('Database deleteBudget failed:', error);
    throw new Error('Database operation failed: unable to delete budget', { cause: error });
  }
}

// Appointments Helpers
export async function getAllAppointments(): Promise<Appointment[]> {
  try {
    const rows = await db.select().from(appointments);
    return rows.map(r => ({
      id: r.id,
      patientId: r.patientId,
      patientName: r.patientName,
      patientPhone: r.patientPhone || '',
      doctorId: r.doctorId,
      doctorName: r.doctorName,
      doctorSpecialty: r.doctorSpecialty || '',
      branchId: r.branchId,
      branchName: r.branchName,
      boxNumber: r.boxNumber || 'Box 1',
      date: r.date,
      startTime: r.startTime,
      endTime: r.endTime,
      durationMinutes: r.durationMinutes || 30,
      reason: r.reason || '',
      treatmentName: r.treatmentName || '',
      status: (r.status as any) || 'SCHEDULED',
      notes: r.notes || '',
      reminderSent: (r.reminderSent as any) || { whatsapp: false, sms: false, email: false }
    }));
  } catch (error) {
    console.error('Database getAllAppointments failed:', error);
    throw new Error('Database operation failed: unable to fetch appointments', { cause: error });
  }
}

export async function upsertAppointment(a: Appointment) {
  try {
    const result = await db.insert(appointments)
      .values({
        id: a.id,
        patientId: a.patientId,
        patientName: a.patientName,
        patientPhone: a.patientPhone,
        doctorId: a.doctorId,
        doctorName: a.doctorName,
        doctorSpecialty: a.doctorSpecialty,
        branchId: a.branchId,
        branchName: a.branchName,
        boxNumber: a.boxNumber,
        date: a.date,
        startTime: a.startTime,
        endTime: a.endTime,
        durationMinutes: a.durationMinutes,
        reason: a.reason,
        treatmentName: a.treatmentName,
        status: a.status,
        notes: a.notes,
        reminderSent: a.reminderSent,
      })
      .onConflictDoUpdate({
        target: appointments.id,
        set: {
          patientName: a.patientName,
          patientPhone: a.patientPhone,
          doctorId: a.doctorId,
          doctorName: a.doctorName,
          doctorSpecialty: a.doctorSpecialty,
          branchId: a.branchId,
          branchName: a.branchName,
          boxNumber: a.boxNumber,
          date: a.date,
          startTime: a.startTime,
          endTime: a.endTime,
          durationMinutes: a.durationMinutes,
          reason: a.reason,
          treatmentName: a.treatmentName,
          status: a.status,
          notes: a.notes,
          reminderSent: a.reminderSent,
        }
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database upsertAppointment failed:', error);
    throw new Error('Database operation failed: unable to save appointment', { cause: error });
  }
}

export async function upsertMultipleAppointments(list: Appointment[]) {
  try {
    for (const a of list) {
      await upsertAppointment(a);
    }
    return true;
  } catch (error) {
    console.error('Database upsertMultipleAppointments failed:', error);
    throw new Error('Database operation failed: unable to batch save appointments', { cause: error });
  }
}

// Payment Transactions Helpers
export async function getAllPayments(): Promise<PaymentTransaction[]> {
  try {
    const rows = await db.select().from(paymentTransactions);
    return rows.map(r => ({
      id: r.id,
      receiptNumber: r.receiptNumber,
      patientId: r.patientId,
      patientName: r.patientName,
      budgetId: r.budgetId || undefined,
      branchId: r.branchId || '',
      doctorId: r.doctorId || '',
      doctorName: r.doctorName || '',
      amount: r.amount,
      paymentMethod: r.paymentMethod as any,
      date: r.date,
      time: r.time,
      concept: r.concept,
      receiptType: (r.receiptType as any) || 'BOLETA',
      authorizationCode: r.authorizationCode || undefined,
      cashRegisterId: r.cashRegisterId || '',
      receivedBy: r.receivedBy || ''
    }));
  } catch (error) {
    console.error('Database getAllPayments failed:', error);
    throw new Error('Database operation failed: unable to fetch payments', { cause: error });
  }
}

export async function upsertPayment(p: PaymentTransaction) {
  try {
    const result = await db.insert(paymentTransactions)
      .values({
        id: p.id,
        receiptNumber: p.receiptNumber,
        patientId: p.patientId,
        patientName: p.patientName,
        budgetId: p.budgetId,
        branchId: p.branchId,
        doctorId: p.doctorId,
        doctorName: p.doctorName,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        date: p.date,
        time: p.time,
        concept: p.concept,
        receiptType: p.receiptType,
        authorizationCode: p.authorizationCode,
        cashRegisterId: p.cashRegisterId,
        receivedBy: p.receivedBy,
      })
      .onConflictDoUpdate({
        target: paymentTransactions.id,
        set: {
          receiptNumber: p.receiptNumber,
          patientName: p.patientName,
          amount: p.amount,
          paymentMethod: p.paymentMethod,
          date: p.date,
          time: p.time,
          concept: p.concept,
          receiptType: p.receiptType,
          authorizationCode: p.authorizationCode,
        }
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database upsertPayment failed:', error);
    throw new Error('Database operation failed: unable to save payment', { cause: error });
  }
}

export async function upsertMultiplePayments(list: PaymentTransaction[]) {
  try {
    for (const p of list) {
      await upsertPayment(p);
    }
    return true;
  } catch (error) {
    console.error('Database upsertMultiplePayments failed:', error);
    throw new Error('Database operation failed: unable to batch save payments', { cause: error });
  }
}

// Cash Session Helper
export async function getLatestCashSession(): Promise<CashRegisterSession | null> {
  try {
    const rows = await db.select().from(cashRegisterSessions).limit(1);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      branchId: r.branchId,
      branchName: r.branchName,
      openedAt: r.openedAt,
      closedAt: r.closedAt || undefined,
      openedBy: r.openedBy,
      closedBy: r.closedBy || undefined,
      openingCash: r.openingCash || 0,
      closingCash: r.closingCash || undefined,
      totalCashIncome: r.totalCashIncome || 0,
      totalCardIncome: r.totalCardIncome || 0,
      totalTransferIncome: r.totalTransferIncome || 0,
      totalInsuranceIncome: r.totalInsuranceIncome || 0,
      totalExpenses: r.totalExpenses || 0,
      expectedCashTotal: r.expectedCashTotal || 0,
      cashDifference: r.cashDifference || undefined,
      status: (r.status as any) || 'OPEN',
      notes: r.notes || undefined
    };
  } catch (error) {
    console.error('Database getLatestCashSession failed:', error);
    return null;
  }
}

export async function upsertCashSession(s: CashRegisterSession) {
  try {
    const result = await db.insert(cashRegisterSessions)
      .values({
        id: s.id,
        branchId: s.branchId,
        branchName: s.branchName,
        openedAt: s.openedAt,
        closedAt: s.closedAt,
        openedBy: s.openedBy,
        closedBy: s.closedBy,
        openingCash: s.openingCash,
        closingCash: s.closingCash,
        totalCashIncome: s.totalCashIncome,
        totalCardIncome: s.totalCardIncome,
        totalTransferIncome: s.totalTransferIncome,
        totalInsuranceIncome: s.totalInsuranceIncome,
        totalExpenses: s.totalExpenses,
        expectedCashTotal: s.expectedCashTotal,
        cashDifference: s.cashDifference,
        status: s.status,
        notes: s.notes,
      })
      .onConflictDoUpdate({
        target: cashRegisterSessions.id,
        set: {
          closedAt: s.closedAt,
          closedBy: s.closedBy,
          closingCash: s.closingCash,
          totalCashIncome: s.totalCashIncome,
          totalCardIncome: s.totalCardIncome,
          totalTransferIncome: s.totalTransferIncome,
          totalInsuranceIncome: s.totalInsuranceIncome,
          totalExpenses: s.totalExpenses,
          expectedCashTotal: s.expectedCashTotal,
          cashDifference: s.cashDifference,
          status: s.status,
          notes: s.notes,
        }
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database upsertCashSession failed:', error);
    throw new Error('Database operation failed: unable to save cash session', { cause: error });
  }
}
