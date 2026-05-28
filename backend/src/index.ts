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
import { initWebSocket } from './websocket';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { startReminderScheduler } from './notifications/scheduler';
import { startMaintenanceScheduler } from './notifications/maintenanceScheduler';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

initWebSocket(httpServer);

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
});
app.use('/api/', limiter);

app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, { query: req.query });
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.get(/^\/(?!api\/).*/, (_req, res) => {
  const indexPath = path.join(publicPath, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({
      message: 'HVAC-R CRM API',
      version: '1.0.0',
      docs: '/health',
      endpoints: '/api/auth, /api/customers, /api/tickets, /api/quotations, /api/service-orders, /api/service-reports, /api/policies, /api/maintenance, /api/users, /api/profile, /api/subscriptions, /api/mercadolibre, /api/inventory',
      frontend: 'Ejecuta npm run dev en la carpeta frontend/',
    });
  }
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
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/catalog-materials', catalogMaterialRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/inventory', inventoryRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

httpServer.listen(PORT, () => {
  logger.info(`HVAC-R CRM API running on port ${PORT}`);
  startReminderScheduler();
  startMaintenanceScheduler();
});

export default app;
