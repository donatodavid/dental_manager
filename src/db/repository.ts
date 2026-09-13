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
import {
  INITIAL_PATIENTS,
  INITIAL_BUDGETS,
  INITIAL_APPOINTMENTS,
  INITIAL_PAYMENTS,
  INITIAL_CASH_SESSION
} from '../data/initialData.ts';

// In-memory store fallback when PostgreSQL is offline or unconfigured
let memoryPatients: Patient[] = [...INITIAL_PATIENTS];
let memoryBudgets: TreatmentBudget[] = [...INITIAL_BUDGETS];
let memoryAppointments: Appointment[] = [...INITIAL_APPOINTMENTS];
let memoryPayments: PaymentTransaction[] = [...INITIAL_PAYMENTS];
let memoryCashSession: CashRegisterSession = { ...INITIAL_CASH_SESSION };
const memoryUsers = new Map<string, any>();

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
    console.warn('Database not connected, using in-memory user store:', error);
    const existing = memoryUsers.get(uid) || { uid, email, name: name || '', role: 'DOCTOR' };
    memoryUsers.set(uid, { ...existing, email, name: name || existing.name });
    return memoryUsers.get(uid);
  }
}

// Patients Helpers
export async function getAllPatients(): Promise<Patient[]> {
  try {
    const rows = await db.select().from(patients);
    if (!rows || rows.length === 0) {
      return memoryPatients;
    }
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
    console.warn('Database not connected, using in-memory patients store');
    return memoryPatients;
  }
}

export async function upsertPatient(p: Patient) {
  // Update in-memory store
  const existingIdx = memoryPatients.findIndex(item => item.id === p.id);
  if (existingIdx >= 0) {
    memoryPatients[existingIdx] = p;
  } else {
    memoryPatients.unshift(p);
  }

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
    return result[0] || p;
  } catch (error) {
    console.warn('Database not connected, saved patient in-memory');
    return p;
  }
}

export async function upsertMultiplePatients(patientList: Patient[]) {
  for (const p of patientList) {
    await upsertPatient(p);
  }
  return true;
}

export async function deletePatient(patientId: string) {
  memoryPatients = memoryPatients.filter(p => p.id !== patientId);
  try {
    await db.delete(patients).where(eq(patients.id, patientId));
    return true;
  } catch (error) {
    console.warn('Database not connected, deleted patient in-memory');
    return true;
  }
}

// Budgets Helpers
export async function getAllBudgets(): Promise<TreatmentBudget[]> {
  try {
    const rows = await db.select().from(treatmentBudgets).orderBy(desc(treatmentBudgets.createdAt));
    if (!rows || rows.length === 0) {
      return memoryBudgets;
    }
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
    console.warn('Database not connected, using in-memory budgets store');
    return memoryBudgets;
  }
}

export async function upsertBudget(b: TreatmentBudget) {
  const existingIdx = memoryBudgets.findIndex(item => item.id === b.id);
  if (existingIdx >= 0) {
    memoryBudgets[existingIdx] = b;
  } else {
    memoryBudgets.unshift(b);
  }

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
    return result[0] || b;
  } catch (error) {
    console.warn('Database not connected, saved budget in-memory');
    return b;
  }
}

export async function upsertMultipleBudgets(budgetsList: TreatmentBudget[]) {
  for (const b of budgetsList) {
    await upsertBudget(b);
  }
  return true;
}

export async function deleteBudget(budgetId: string) {
  memoryBudgets = memoryBudgets.filter(b => b.id !== budgetId);
  try {
    await db.delete(treatmentBudgets).where(eq(treatmentBudgets.id, budgetId));
    return true;
  } catch (error) {
    console.warn('Database not connected, deleted budget in-memory');
    return true;
  }
}

// Appointments Helpers
export async function getAllAppointments(): Promise<Appointment[]> {
  try {
    const rows = await db.select().from(appointments);
    if (!rows || rows.length === 0) {
      return memoryAppointments;
    }
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
    console.warn('Database not connected, using in-memory appointments store');
    return memoryAppointments;
  }
}

export async function upsertAppointment(a: Appointment) {
  const existingIdx = memoryAppointments.findIndex(item => item.id === a.id);
  if (existingIdx >= 0) {
    memoryAppointments[existingIdx] = a;
  } else {
    memoryAppointments.unshift(a);
  }

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
    return result[0] || a;
  } catch (error) {
    console.warn('Database not connected, saved appointment in-memory');
    return a;
  }
}

export async function upsertMultipleAppointments(list: Appointment[]) {
  for (const a of list) {
    await upsertAppointment(a);
  }
  return true;
}

let paymentsExplicitlyReset = false;

export async function resetAllPayments() {
  memoryPayments = [];
  paymentsExplicitlyReset = true;
  try {
    await db.delete(paymentTransactions);
    return true;
  } catch (error) {
    console.warn('Database not connected, reset payments in-memory');
    return true;
  }
}

export function isPaymentsReset(): boolean {
  return paymentsExplicitlyReset;
}

// Payment Transactions Helpers
export async function getAllPayments(): Promise<PaymentTransaction[]> {
  if (paymentsExplicitlyReset) {
    return [];
  }
  try {
    const rows = await db.select().from(paymentTransactions);
    if (!rows || rows.length === 0) {
      return memoryPayments;
    }
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
    console.warn('Database not connected, using in-memory payments store');
    return memoryPayments;
  }
}

export async function upsertPayment(p: PaymentTransaction) {
  paymentsExplicitlyReset = false;
  const existingIdx = memoryPayments.findIndex(item => item.id === p.id);
  if (existingIdx >= 0) {
    memoryPayments[existingIdx] = p;
  } else {
    memoryPayments.unshift(p);
  }

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
    return result[0] || p;
  } catch (error) {
    console.warn('Database not connected, saved payment in-memory');
    return p;
  }
}

export async function upsertMultiplePayments(list: PaymentTransaction[]) {
  for (const p of list) {
    await upsertPayment(p);
  }
  return true;
}

// Cash Session Helper
export async function getLatestCashSession(): Promise<CashRegisterSession | null> {
  try {
    const rows = await db.select().from(cashRegisterSessions).limit(1);
    if (rows && rows.length > 0) {
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
    }
    return memoryCashSession;
  } catch (error) {
    console.warn('Database not connected, using in-memory cash session');
    return memoryCashSession;
  }
}

export async function upsertCashSession(s: CashRegisterSession) {
  memoryCashSession = { ...s };
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
    return result[0] || s;
  } catch (error) {
    console.warn('Database not connected, saved cash session in-memory');
    return s;
  }
}
