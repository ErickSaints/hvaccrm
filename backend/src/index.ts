import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth';
import customerRoutes from './routes/customers';
import equipmentRoutes from './routes/equipment';
import ticketRoutes from './routes/tickets';
import quotationRoutes from './routes/quotations';
import serviceOrderRoutes from './routes/serviceOrders';
import serviceReportRoutes from './routes/serviceReports';
import policyRoutes from './routes/policies';
import maintenanceRoutes from './routes/maintenance';
import dashboardRoutes from './routes/dashboard';
import userRoutes from './routes/users';
import profileRoutes from './routes/profile';
import subscriptionRoutes from './routes/subscriptions';
import uploadRoutes from './routes/upload';
import mercadolibreRoutes from './routes/mercadolibre';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/service-orders', serviceOrderRoutes);
app.use('/api/service-reports', serviceReportRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/mercadolibre', mercadolibreRoutes);

app.listen(PORT, () => {
  console.log(`HVAC-R CRM API running on port ${PORT}`);
});

export default app;
