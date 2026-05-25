import express from 'express';
import cors from 'cors';
import path from 'path';
import prisma from './prisma';
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

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/debug', async (_req, res) => {
  let userCount = 0;
  let customerCount = 0;
  let dbStatus = 'error';
  let dbError = '';
  try {
    userCount = await prisma.user.count();
    customerCount = await prisma.customer.count();
    dbStatus = 'connected';
  } catch (err: any) {
    dbStatus = 'error';
    dbError = err.message;
  }
  res.json({
    database: dbStatus,
    dbError,
    users: userCount,
    customers: customerCount,
    env: {
      node: process.version,
      jwt: process.env.JWT_SECRET ? 'set' : 'not set',
      jwt_value: process.env.JWT_SECRET ? `...${process.env.JWT_SECRET.slice(-4)}` : 'not set',
      database_url: process.env.DATABASE_URL ? 'set' : 'not set',
      database_url_preview: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 20)}...` : 'not set',
      mp_token: process.env.MP_ACCESS_TOKEN ? 'set' : 'not set',
      port: process.env.PORT || 'not set',
      railway_env: process.env.RAILWAY_ENVIRONMENT || 'not set',
    },
  });
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
      endpoints: '/api/auth, /api/customers, /api/tickets, /api/quotations, /api/service-orders, /api/service-reports, /api/policies, /api/maintenance, /api/users, /api/profile, /api/subscriptions, /api/mercadolibre',
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

app.listen(PORT, () => {
  console.log(`HVAC-R CRM API running on port ${PORT}`);
});

export default app;
