import express from 'express';
import { createServer } from 'http';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import path from 'path';
import prisma from './prisma';
import logger from './logger';
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
import searchRoutes from './routes/search';
import notificationRoutes from './routes/notifications';
import assetRoutes from './routes/assets';
import surveyRoutes from './routes/surveys';
import catalogMaterialRoutes from './routes/catalogMaterials';
import invoiceRoutes from './routes/invoices';
import adminRoutes from './routes/admin';
import inventoryRoutes from './routes/inventory';
import mlRoutes from './routes/ml';
import reportRoutes from './routes/reports';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { startReminderScheduler } from './notifications/scheduler';
import { startMaintenanceScheduler } from './notifications/maintenanceScheduler';
import { initWebSocket } from './websocket';

const app = express();
const httpServer = createServer(app);
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors());
app.use(rateLimit({ windowMs: 60 * 1000, max: 200 }));
app.use(express.json({ limit: '50mb' }));

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
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/catalog-materials', catalogMaterialRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/reports', reportRoutes);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(express.static(path.join(__dirname, '../public')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use(notFoundHandler);
app.use(errorHandler);

initWebSocket(httpServer);

httpServer.listen(PORT, () => {
  logger.info(`HVAC-R CRM API running on port ${PORT}`);
  startReminderScheduler();
  startMaintenanceScheduler();
});

export default app;
