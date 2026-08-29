import { pgTable, text, integer, timestamp, jsonb, serial, boolean, numeric } from 'drizzle-orm/pg-core';

// Users table (links with Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('DOCTOR'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Patients table
export const patients = pgTable('patients', {
  id: text('id').primaryKey(),
  documentId: text('document_id').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  birthDate: text('birth_date'),
  gender: text('gender'),
  phone: text('phone'),
  whatsapp: text('whatsapp'),
  email: text('email'),
  address: text('address'),
  city: text('city'),
  insuranceProvider: text('insurance_provider'),
  insuranceNumber: text('insurance_number'),
  emergencyContact: jsonb('emergency_contact'),
  allergies: jsonb('allergies'),
  medicalBackground: jsonb('medical_background'),
  odontogram: jsonb('odontogram'),
  evolutions: jsonb('evolutions'),
  documents: jsonb('documents'),
  status: text('status').default('ACTIVE'),
  registeredAt: text('registered_at'),
  lastVisit: text('last_visit'),
  tags: jsonb('tags'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Budgets table
export const treatmentBudgets = pgTable('treatment_budgets', {
  id: text('id').primaryKey(),
  budgetNumber: text('budget_number').notNull(),
  patientId: text('patient_id').notNull(),
  patientName: text('patient_name').notNull(),
  doctorId: text('doctor_id'),
  doctorName: text('doctor_name'),
  branchId: text('branch_id'),
  createdAt: text('created_at').notNull(),
  validUntil: text('valid_until'),
  status: text('status').default('DRAFT'),
  items: jsonb('items').notNull(),
  subtotal: integer('subtotal').default(0),
  discountTotal: integer('discount_total').default(0),
  insuranceTotal: integer('insurance_total').default(0),
  totalPatient: integer('total_patient').default(0),
  totalPaid: integer('total_paid').default(0),
  balanceDue: integer('balance_due').default(0),
  notes: text('notes'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Appointments table
export const appointments = pgTable('appointments', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull(),
  patientName: text('patient_name').notNull(),
  patientPhone: text('patient_phone'),
  doctorId: text('doctor_id').notNull(),
  doctorName: text('doctor_name').notNull(),
  doctorSpecialty: text('doctor_specialty'),
  branchId: text('branch_id').notNull(),
  branchName: text('branch_name').notNull(),
  boxNumber: text('box_number'),
  date: text('date').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  durationMinutes: integer('duration_minutes').default(30),
  reason: text('reason'),
  treatmentName: text('treatment_name'),
  status: text('status').default('SCHEDULED'),
  notes: text('notes'),
  reminderSent: jsonb('reminder_sent'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Payment Transactions table
export const paymentTransactions = pgTable('payment_transactions', {
  id: text('id').primaryKey(),
  receiptNumber: text('receipt_number').notNull(),
  patientId: text('patient_id').notNull(),
  patientName: text('patient_name').notNull(),
  budgetId: text('budget_id'),
  branchId: text('branch_id'),
  doctorId: text('doctor_id'),
  doctorName: text('doctor_name'),
  amount: integer('amount').notNull(),
  paymentMethod: text('payment_method').notNull(),
  date: text('date').notNull(),
  time: text('time').notNull(),
  concept: text('concept').notNull(),
  receiptType: text('receipt_type').notNull(),
  authorizationCode: text('authorization_code'),
  cashRegisterId: text('cash_register_id'),
  receivedBy: text('received_by'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Cash Register Sessions table
export const cashRegisterSessions = pgTable('cash_register_sessions', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').notNull(),
  branchName: text('branch_name').notNull(),
  openedAt: text('opened_at').notNull(),
  closedAt: text('closed_at'),
  openedBy: text('opened_by').notNull(),
  closedBy: text('closed_by'),
  openingCash: integer('opening_cash').default(0),
  closingCash: integer('closing_cash'),
  totalCashIncome: integer('total_cash_income').default(0),
  totalCardIncome: integer('total_card_income').default(0),
  totalTransferIncome: integer('total_transfer_income').default(0),
  totalInsuranceIncome: integer('total_insurance_income').default(0),
  totalExpenses: integer('total_expenses').default(0),
  expectedCashTotal: integer('expected_cash_total').default(0),
  cashDifference: integer('cash_difference'),
  status: text('status').default('OPEN'),
  notes: text('notes'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Branches table
export const branches = pgTable('branches', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address'),
  city: text('city'),
  phone: text('phone'),
  boxesCount: integer('boxes_count').default(1),
  color: text('color').default('#0d9488'),
});

// Doctors table
export const doctors = pgTable('doctors', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  documentId: text('document_id'),
  specialty: text('specialty'),
  licenseNumber: text('license_number'),
  email: text('email'),
  phone: text('phone'),
  branchIds: jsonb('branch_ids'),
  commissionRatePercent: integer('commission_rate_percent').default(40),
  color: text('color').default('#0d9488'),
  avatarUrl: text('avatar_url'),
});

// Tariffs table
export const tariffs = pgTable('tariffs', {
  id: text('id').primaryKey(),
  category: text('category').notNull(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  defaultPrice: integer('default_price').default(0),
  requiresTooth: boolean('requires_tooth').default(false),
  requiresSurface: boolean('requires_surface').default(false),
  estimatedMinutes: integer('estimated_minutes').default(30),
});
