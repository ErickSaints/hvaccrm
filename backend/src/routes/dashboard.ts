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
      totalUsers,
      technicians,
      completedOrdersThisMonth,
      totalEquipment,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.ticket.count({ where: { status: { notIn: ['CERRADO', 'RESUELTO'] } } }),
      prisma.serviceOrder.count({ where: { status: 'PENDIENTE' } }),
      prisma.maintenancePolicy.count({ where: { status: 'ACTIVA' } }),
      prisma.quotation.count({
        where: { createdAt: { gte: firstDayOfMonth, lte: lastDayOfMonth } },
      }),
      prisma.user.count({ where: { active: true, role: { not: 'CLIENT' } } }),
      prisma.user.count({ where: { role: 'TECHNICIAN', active: true } }),
      prisma.serviceOrder.count({
        where: { status: 'COMPLETADO', completedDate: { gte: firstDayOfMonth, lte: lastDayOfMonth } },
      }),
      prisma.equipment.count(),
    ]);

    res.json({
      totalCustomers,
      activeTickets,
      pendingOrders,
      activePolicies,
      monthlyQuotations,
      totalUsers,
      technicians,
      completedOrdersThisMonth,
      totalEquipment,
    });
  } catch (err) {
    console.error('Stats error:', err);
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

router.get('/chart-data', async (_req: Request, res: Response) => {
  try {
    const now = new Date();

    // Monthly revenue: sum of approved quotations + completed service orders for last 6 months
    const monthlyRevenue: { month: string; revenue: number; orders: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const monthLabel = d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });

      const [quotations, orders] = await Promise.all([
        prisma.quotation.aggregate({
          where: { status: 'APROBADA', createdAt: { gte: monthStart, lte: monthEnd } },
          _sum: { total: true },
        }),
        prisma.serviceOrder.aggregate({
          where: { status: 'COMPLETADO', completedDate: { gte: monthStart, lte: monthEnd } },
          _sum: { totalCost: true },
        }),
      ]);

      monthlyRevenue.push({
        month: monthLabel,
        revenue: (quotations._sum.total || 0) + (orders._sum.totalCost || 0),
        orders: 0,
      });
    }

    // Ticket trends: tickets created per month for last 6 months
    const ticketTrends: { month: string; creados: number; resueltos: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const monthLabel = d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });

      const [creados, resueltos] = await Promise.all([
        prisma.ticket.count({ where: { createdAt: { gte: monthStart, lte: monthEnd } } }),
        prisma.ticket.count({ where: { status: { in: ['RESUELTO', 'CERRADO'] }, updatedAt: { gte: monthStart, lte: monthEnd } } }),
      ]);

      ticketTrends.push({ month: monthLabel, creados, resueltos });
    }

    // Ticket distribution by level
    const ticketsByLevel = await Promise.all(
      ['EMERGENCIA', 'ATENCION', 'PROGRAMAR'].map(async (level) => {
        const count = await prisma.ticket.count({ where: { level: level as any } });
        return { name: level === 'EMERGENCIA' ? 'Emergencia' : level === 'ATENCION' ? 'Atención' : 'Programar', value: count };
      })
    );

    // Ticket distribution by status
    const ticketsByStatus = await Promise.all(
      ['ABIERTO', 'EN_PROCESO', 'RESUELTO', 'CERRADO'].map(async (status) => {
        const count = await prisma.ticket.count({ where: { status: status as any } });
        return { name: status, value: count };
      })
    );

    // Technician performance
    const techUsers = await prisma.user.findMany({
      where: { role: 'TECHNICIAN', active: true },
      select: { id: true, name: true },
    });
    const technicianPerformance = await Promise.all(
      techUsers.map(async (tech) => {
        const [completedOrders, openTickets] = await Promise.all([
          prisma.serviceOrder.count({ where: { assignedTo: tech.id, status: 'COMPLETADO' } }),
          prisma.ticket.count({ where: { assignedTo: tech.id, status: { notIn: ['CERRADO', 'RESUELTO'] } } }),
        ]);
        return { name: tech.name, completadas: completedOrders, pendientes: openTickets };
      })
    );

    res.json({
      monthlyRevenue,
      ticketTrends,
      ticketsByLevel,
      ticketsByStatus,
      technicianPerformance,
    });
  } catch (err) {
    console.error('Chart data error:', err);
    res.status(500).json({ error: 'Error al obtener datos de gráficos' });
  }
});

export default router;
