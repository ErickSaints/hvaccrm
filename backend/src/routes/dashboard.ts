import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { authenticate, requireBackoffice } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireBackoffice);

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [
      totalCustomers,
      activeTickets,
      pendingOrders,
      activePolicies,
      monthlyQuotations,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.ticket.count({ where: { status: { notIn: ['CERRADO', 'RESUELTO'] } } }),
      prisma.serviceOrder.count({ where: { status: 'PENDIENTE' } }),
      prisma.maintenancePolicy.count({ where: { status: 'ACTIVA' } }),
      prisma.quotation.count({
        where: { createdAt: { gte: firstDayOfMonth, lte: lastDayOfMonth } },
      }),
    ]);

    res.json({
      totalCustomers,
      activeTickets,
      pendingOrders,
      activePolicies,
      monthlyQuotations,
    });
  } catch {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

router.get('/recent-tickets', async (_req: Request, res: Response) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: { customer: true, assignedUser: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    res.json(tickets);
  } catch {
    res.status(500).json({ error: 'Error al obtener tickets recientes' });
  }
});

router.get('/recent-orders', async (_req: Request, res: Response) => {
  try {
    const orders = await prisma.serviceOrder.findMany({
      include: { customer: true, assignedUser: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    res.json(orders);
  } catch {
    res.status(500).json({ error: 'Error al obtener órdenes recientes' });
  }
});

router.get('/upcoming-maintenance', async (_req: Request, res: Response) => {
  try {
    const logs = await prisma.maintenanceLog.findMany({
      where: { status: 'PENDIENTE', scheduledDate: { gte: new Date() } },
      include: { policy: true, equipment: true, assignedUser: true },
      orderBy: { scheduledDate: 'asc' },
      take: 10,
    });
    res.json(logs);
  } catch {
    res.status(500).json({ error: 'Error al obtener mantenimientos próximos' });
  }
});

export default router;
