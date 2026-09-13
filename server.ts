import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { optionalAuth, requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { 
  getOrCreateUser,
  getAllPatients,
  upsertPatient,
  upsertMultiplePatients,
  deletePatient,
  getAllBudgets,
  upsertBudget,
  upsertMultipleBudgets,
  deleteBudget,
  getAllAppointments,
  upsertAppointment,
  upsertMultipleAppointments,
  getAllPayments,
  upsertPayment,
  upsertMultiplePayments,
  resetAllPayments,
  isPaymentsReset,
  getLatestCashSession,
  upsertCashSession
} from './src/db/repository.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: 'cloudsql-postgresql', timestamp: new Date().toISOString() });
  });

  // User Sync
  app.post('/api/auth/sync-user', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid || req.body.uid;
      const email = req.user?.email || req.body.email;
      const name = req.body.name || req.user?.name || '';
      
      if (!uid || !email) {
        return res.status(400).json({ error: 'UID and Email are required' });
      }

      const user = await getOrCreateUser(uid, email, name);
      res.json({ success: true, user });
    } catch (error: any) {
      console.error('Error syncing user:', error);
      res.status(500).json({ error: error.message || 'Failed to sync user' });
    }
  });

  // Patients API
  app.get('/api/patients', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const patientsList = await getAllPatients();
      res.json({ success: true, data: patientsList });
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch patients' });
    }
  });

  app.post('/api/patients', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const patient = req.body;
      if (!patient || !patient.id) {
        return res.status(400).json({ error: 'Valid patient object with id is required' });
      }
      const saved = await upsertPatient(patient);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      console.error('Error saving patient:', error);
      res.status(500).json({ error: error.message || 'Failed to save patient' });
    }
  });

  app.post('/api/patients/bulk-sync', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { patients: patientList } = req.body;
      if (Array.isArray(patientList)) {
        await upsertMultiplePatients(patientList);
      }
      res.json({ success: true, count: patientList?.length || 0 });
    } catch (error: any) {
      console.error('Error bulk syncing patients:', error);
      res.status(500).json({ error: error.message || 'Failed to sync patients' });
    }
  });

  app.delete('/api/patients/:id', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Patient ID is required' });
      }
      await deletePatient(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting patient:', error);
      res.status(500).json({ error: error.message || 'Failed to delete patient' });
    }
  });

  // Budgets API
  app.get('/api/budgets', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const budgetsList = await getAllBudgets();
      res.json({ success: true, data: budgetsList });
    } catch (error: any) {
      console.error('Error fetching budgets:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch budgets' });
    }
  });

  app.post('/api/budgets', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const budget = req.body;
      if (!budget || !budget.id) {
        return res.status(400).json({ error: 'Valid budget object with id is required' });
      }
      const saved = await upsertBudget(budget);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      console.error('Error saving budget:', error);
      res.status(500).json({ error: error.message || 'Failed to save budget' });
    }
  });

  app.post('/api/budgets/bulk-sync', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { budgets: list } = req.body;
      if (Array.isArray(list)) {
        await upsertMultipleBudgets(list);
      }
      res.json({ success: true, count: list?.length || 0 });
    } catch (error: any) {
      console.error('Error bulk syncing budgets:', error);
      res.status(500).json({ error: error.message || 'Failed to sync budgets' });
    }
  });

  app.delete('/api/budgets/:id', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const budgetId = req.params.id;
      if (!budgetId) {
        return res.status(400).json({ error: 'Budget ID is required' });
      }
      await deleteBudget(budgetId);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting budget:', error);
      res.status(500).json({ error: error.message || 'Failed to delete budget' });
    }
  });

  // Appointments API
  app.get('/api/appointments', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const list = await getAllAppointments();
      res.json({ success: true, data: list });
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch appointments' });
    }
  });

  app.post('/api/appointments', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const appointment = req.body;
      if (!appointment || !appointment.id) {
        return res.status(400).json({ error: 'Valid appointment with id is required' });
      }
      const saved = await upsertAppointment(appointment);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      console.error('Error saving appointment:', error);
      res.status(500).json({ error: error.message || 'Failed to save appointment' });
    }
  });

  app.post('/api/appointments/bulk-sync', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { appointments: list } = req.body;
      if (Array.isArray(list)) {
        await upsertMultipleAppointments(list);
      }
      res.json({ success: true, count: list?.length || 0 });
    } catch (error: any) {
      console.error('Error bulk syncing appointments:', error);
      res.status(500).json({ error: error.message || 'Failed to sync appointments' });
    }
  });

  // Payments API
  app.get('/api/payments', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const list = await getAllPayments();
      res.json({ success: true, data: list, isReset: isPaymentsReset() });
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch payments' });
    }
  });

  app.post('/api/payments/reset', optionalAuth, async (req: AuthRequest, res) => {
    try {
      await resetAllPayments();
      res.json({ success: true, message: 'Earnings and payments reset to 0' });
    } catch (error: any) {
      console.error('Error resetting payments:', error);
      res.status(500).json({ error: error.message || 'Failed to reset payments' });
    }
  });

  app.post('/api/payments', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const payment = req.body;
      if (!payment || !payment.id) {
        return res.status(400).json({ error: 'Valid payment with id is required' });
      }
      const saved = await upsertPayment(payment);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      console.error('Error saving payment:', error);
      res.status(500).json({ error: error.message || 'Failed to save payment' });
    }
  });

  app.post('/api/payments/bulk-sync', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { payments: list } = req.body;
      if (Array.isArray(list)) {
        await upsertMultiplePayments(list);
      }
      res.json({ success: true, count: list?.length || 0 });
    } catch (error: any) {
      console.error('Error bulk syncing payments:', error);
      res.status(500).json({ error: error.message || 'Failed to sync payments' });
    }
  });

  // Cash Session API
  app.get('/api/cash-session', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const session = await getLatestCashSession();
      res.json({ success: true, data: session });
    } catch (error: any) {
      console.error('Error fetching cash session:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch cash session' });
    }
  });

  app.post('/api/cash-session', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const session = req.body;
      if (!session || !session.id) {
        return res.status(400).json({ error: 'Valid cash session with id is required' });
      }
      const saved = await upsertCashSession(session);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      console.error('Error saving cash session:', error);
      res.status(500).json({ error: error.message || 'Failed to save cash session' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
