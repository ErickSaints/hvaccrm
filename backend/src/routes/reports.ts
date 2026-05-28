import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { authenticate, requireBackoffice } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireBackoffice);

function getDateRange(query: any) {
  const now = new Date();
  const startDate = query.startDate ? new Date(query.startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = query.endDate ? new Date(query.endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { startDate, endDate };
}

router.get('/summary', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = getDateRange(req.query);
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      totalCustomers,
      activeTickets,
      pendingOrders,
      activePolicies,
      periodQuotations,
      periodCompletedOrders,
      totalEquipment,
      invoicesPaid,
      totalUsers,
      technicians,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.ticket.count({ where: { status: { notIn: ['CERRADO', 'RESUELTO'] } } }),
      prisma.serviceOrder.count({ where: { status: 'PENDIENTE' } }),
      prisma.maintenancePolicy.count({ where: { status: 'ACTIVA' } }),
      prisma.quotation.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
      prisma.serviceOrder.count({ where: { status: 'COMPLETADO', completedDate: { gte: startDate, lte: endDate } } }),
      prisma.equipment.count(),
      prisma.invoice.aggregate({ where: { status: 'PAGADA', paidAt: { gte: startDate, lte: endDate } }, _sum: { total: true } }),
      prisma.user.count({ where: { active: true, role: { not: 'CLIENT' } } }),
      prisma.user.count({ where: { role: 'TECHNICIAN', active: true } }),
    ]);

    const quotationAgg = await prisma.quotation.aggregate({
      where: { status: 'APROBADA', createdAt: { gte: startDate, lte: endDate } },
      _sum: { total: true },
    });

    const ordersAgg = await prisma.serviceOrder.aggregate({
      where: { status: 'COMPLETADO', completedDate: { gte: startDate, lte: endDate } },
      _sum: { totalCost: true },
    });

    const periodRevenue = (quotationAgg._sum.total || 0) + (ordersAgg._sum.totalCost || 0) + (invoicesPaid._sum.total || 0);

    // Monthly revenue for last 12 months
    const monthlyRevenue: { month: string; revenue: number; orders: number; quotations: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ms = new Date(d.getFullYear(), d.getMonth(), 1);
      const me = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const label = d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });

      const [qAgg, oAgg, iAgg] = await Promise.all([
        prisma.quotation.aggregate({ where: { status: 'APROBADA', createdAt: { gte: ms, lte: me } }, _sum: { total: true } }),
        prisma.serviceOrder.aggregate({ where: { status: 'COMPLETADO', completedDate: { gte: ms, lte: me } }, _sum: { totalCost: true } }),
        prisma.invoice.aggregate({ where: { status: 'PAGADA', paidAt: { gte: ms, lte: me } }, _sum: { total: true } }),
      ]);

      monthlyRevenue.push({
        month: label,
        revenue: (qAgg._sum.total || 0) + (oAgg._sum.totalCost || 0) + (iAgg._sum.total || 0),
        orders: oAgg._sum.totalCost || 0,
        quotations: qAgg._sum.total || 0,
      });
    }

    // Ticket trends last 12 months
    const ticketTrends: { month: string; creados: number; resueltos: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ms = new Date(d.getFullYear(), d.getMonth(), 1);
      const me = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const label = d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });

      const [creados, resueltos] = await Promise.all([
        prisma.ticket.count({ where: { createdAt: { gte: ms, lte: me } } }),
        prisma.ticket.count({ where: { status: { in: ['RESUELTO', 'CERRADO'] }, updatedAt: { gte: ms, lte: me } } }),
      ]);
      ticketTrends.push({ month: label, creados, resueltos });
    }

    // Tickets by status
    const ticketsByStatus = await Promise.all(
      ['ABIERTO', 'EN_PROCESO', 'RESUELTO', 'CERRADO'].map(async (s) => {
        const count = await prisma.ticket.count({ where: { status: s as any } });
        return { name: s, value: count };
      })
    );

    // Tickets by level
    const ticketsByLevel = await Promise.all(
      ['EMERGENCIA', 'ATENCION', 'PROGRAMAR'].map(async (l) => {
        const count = await prisma.ticket.count({ where: { level: l as any } });
        return {
          name: l === 'EMERGENCIA' ? 'Emergencia' : l === 'ATENCION' ? 'Atención' : 'Programar',
          value: count,
        };
      })
    );

    // Quotations by status
    const quotationsByStatus = await Promise.all(
      ['BORRADOR', 'ENVIADA', 'APROBADA', 'RECHAZADA', 'VENCIDA'].map(async (s) => {
        const count = await prisma.quotation.count({ where: { status: s as any } });
        return { name: s, value: count };
      })
    );

    // Service orders by status
    const ordersByStatus = await Promise.all(
      ['PENDIENTE', 'EN_PROGRESO', 'COMPLETADO', 'CANCELADO'].map(async (s) => {
        const count = await prisma.serviceOrder.count({ where: { status: s as any } });
        return { name: s, value: count };
      })
    );

    // Technician performance
    const techUsers = await prisma.user.findMany({
      where: { role: 'TECHNICIAN', active: true },
      select: { id: true, name: true },
    });

    const technicianPerformance = await Promise.all(
      techUsers.map(async (tech) => {
        const [completedOrders, pendingOrders, totalRevenue, openTickets] = await Promise.all([
          prisma.serviceOrder.count({ where: { assignedTo: tech.id, status: 'COMPLETADO' } }),
          prisma.serviceOrder.count({ where: { assignedTo: tech.id, status: { in: ['PENDIENTE', 'EN_PROGRESO'] } } }),
          prisma.serviceOrder.aggregate({
            where: { assignedTo: tech.id, status: 'COMPLETADO' },
            _sum: { totalCost: true },
          }),
          prisma.ticket.count({ where: { assignedTo: tech.id, status: { notIn: ['CERRADO', 'RESUELTO'] } } }),
        ]);
        return {
          name: tech.name,
          completadas: completedOrders,
          pendientes: pendingOrders,
          abiertos: openTickets,
          ingresos: totalRevenue._sum.totalCost || 0,
        };
      })
    );

    // Top 10 customers by total spent
    const topCustomers = await prisma.$queryRaw<{ id: number; contactName: string; companyName: string | null; totalSpent: number; orderCount: bigint }[]>`
      SELECT
        c.id, c."contactName", c."companyName",
        COALESCE(SUM(so."totalCost"), 0) as "totalSpent",
        COUNT(so.id) as "orderCount"
      FROM "Customer" c
      LEFT JOIN "ServiceOrder" so ON so."customerId" = c.id AND so.status = 'COMPLETADO'
      GROUP BY c.id, c."contactName", c."companyName"
      ORDER BY "totalSpent" DESC
      LIMIT 10
    `;

    const quotasByCustomer = await prisma.$queryRaw<{ customerId: number; approvedTotal: number; quotationCount: bigint }[]>`
      SELECT
        q."customerId",
        COALESCE(SUM(q.total), 0) as "approvedTotal",
        COUNT(q.id) as "quotationCount"
      FROM "Quotation" q
      WHERE q.status = 'APROBADA'
      GROUP BY q."customerId"
    `;

    const topCustomersMap = new Map(topCustomers.map((c) => [c.id, { ...c, orderCount: Number(c.orderCount), totalSpent: Number(c.totalSpent) }]));
    for (const q of quotasByCustomer) {
      const existing = topCustomersMap.get(q.customerId);
      if (existing) {
        existing.totalSpent += Number(q.approvedTotal);
      }
    }

    const totalQuotations = quotationsByStatus.reduce((s, q) => s + q.value, 0);
    const approvedQuotations = quotationsByStatus.find((q) => q.name === 'APROBADA')?.value || 0;
    const approvalRate = totalQuotations > 0 ? Math.round((approvedQuotations / totalQuotations) * 100) : 0;

    const totalOrders = ordersByStatus.reduce((s, o) => s + o.value, 0);
    const completedOrders = ordersByStatus.find((o) => o.name === 'COMPLETADO')?.value || 0;
    const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

    res.json({
      summary: {
        totalCustomers,
        activeTickets,
        pendingOrders,
        activePolicies,
        periodQuotations,
        periodCompletedOrders,
        totalEquipment,
        periodRevenue: Math.round(periodRevenue * 100) / 100,
        invoicesPaid: invoicesPaid._sum.total || 0,
        totalUsers,
        technicians,
        approvalRate,
        completionRate,
      },
      monthlyRevenue,
      ticketTrends,
      ticketsByStatus,
      ticketsByLevel,
      quotationsByStatus,
      ordersByStatus,
      technicianPerformance,
      topCustomers: topCustomers.map((c) => ({
        id: c.id,
        name: c.companyName || c.contactName,
        totalSpent: Math.round(Number(topCustomersMap.get(c.id)?.totalSpent || 0) * 100) / 100,
        orderCount: Number(c.orderCount),
      })),
    });
  } catch (err) {
    console.error('Reports error:', err);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

export default router;
