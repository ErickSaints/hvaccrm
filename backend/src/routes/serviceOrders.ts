import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, requireSubscription, requireSuperAdmin } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import { scopeToCustomer } from '../middleware/scopeToCustomer';
import { paginate, paginatedResponse } from '../middleware/pagination';
import { notifyServiceOrderStatusChange } from '../notifications/notifier';

const router = Router();

function stripCosts(order: any, role: string) {
  if (role === 'TECHNICIAN') {
    const { laborCost, materialsCost, totalCost, ...rest } = order;
    return { ...rest, laborCost: 0, materialsCost: 0, totalCost: 0 };
  }
  return order;
}

const serviceOrderSchema = z.object({
  description: z.string().optional(),
  customerId: z.number(),
  equipmentId: z.number().optional(),
  assignedTo: z.number().optional(),
  ticketId: z.number().optional(),
  policyId: z.number().optional(),
  scheduledDate: z.string().optional(),
  status: z.enum(['PENDIENTE', 'EN_PROGRESO', 'COMPLETADO', 'CANCELADO']).optional(),
  notes: z.string().optional(),
  photos: z.array(z.object({
    url: z.string(),
    caption: z.string().optional(),
    type: z.string().optional(),
  })).optional(),
});

async function generateOrderNumber(): Promise<string> {
  const prefix = 'ORD-';
  const last = await prisma.serviceOrder.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: 'desc' },
  });
  let next = 1;
  if (last) {
    const parts = last.number.split('-');
    next = parseInt(parts[1]) + 1;
  }
  return `${prefix}${String(next).padStart(6, '0')}`;
}

router.use(authenticate);

router.get('/', requirePermission('service-orders:view'), scopeToCustomer, paginate, async (req: Request, res: Response) => {
  try {
    const { status, search, dateFrom, dateTo } = req.query;
    const andConditions: any[] = [];

    if (req.scopeFilter) {
      andConditions.push(req.scopeFilter);
    }

    if (search) {
      andConditions.push({
        OR: [
          { number: { contains: search as string } },
          { description: { contains: search as string } },
          { customer: { contactName: { contains: search as string } } },
          { customer: { companyName: { contains: search as string } } },
        ],
      });
    }

    if (status) andConditions.push({ status });
    if (dateFrom || dateTo) {
      const dateFilter: any = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom as string);
      if (dateTo) dateFilter.lte = new Date(dateTo as string + 'T23:59:59.999Z');
      andConditions.push({ createdAt: dateFilter });
    }

    const where: any = andConditions.length > 0 ? { AND: andConditions } : {};

    const [orders, total] = await Promise.all([
      prisma.serviceOrder.findMany({
        where,
        skip: req.pagination!.skip,
        take: req.pagination!.limit,
        include: { customer: true, equipment: true, assignedUser: true, ticket: true, policy: true, report: true, photos: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.serviceOrder.count({ where }),
    ]);
    res.json(paginatedResponse(orders.map((o) => stripCosts(o, req.user!.role)), total, req.pagination!.page, req.pagination!.limit));
  } catch {
    res.status(500).json({ error: 'Error al obtener órdenes de servicio' });
  }
});

router.get('/:id', requirePermission('service-orders:view'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const order = await prisma.serviceOrder.findUnique({
      where: { id },
      include: { customer: true, equipment: true, assignedUser: true, ticket: true, policy: true, report: true, photos: true },
    });
    if (!order) {
      return res.status(404).json({ error: 'Orden de servicio no encontrada' });
    }
    if (req.user!.role === 'CLIENT' && order.customerId !== req.user!.customerId) {
      return res.status(403).json({ error: 'No tienes permiso para ver esta orden' });
    }
    res.json(stripCosts(order, req.user!.role));
  } catch {
    res.status(500).json({ error: 'Error al obtener orden de servicio' });
  }
});

router.post('/', requirePermission('service-orders:create'), requireSubscription, async (req: Request, res: Response) => {
  try {
    const data = serviceOrderSchema.parse(req.body);
    const number = await generateOrderNumber();

    const order = await prisma.serviceOrder.create({
      data: {
        number,
        description: data.description,
        customerId: data.customerId,
        equipmentId: data.equipmentId,
        assignedTo: data.assignedTo,
        ticketId: data.ticketId,
        policyId: data.policyId,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
        status: data.status,
        notes: data.notes,
        photos: data.photos && data.photos.length > 0 ? {
          create: data.photos.map(p => ({ url: p.url, caption: p.caption, type: p.type })),
        } : undefined,
      },
      include: { customer: true, equipment: true, photos: true },
    });
    res.status(201).json(order);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al crear orden de servicio' });
  }
});

router.put('/:id', requirePermission('service-orders:edit'), requireSubscription, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const data = serviceOrderSchema.partial().parse(req.body);
    const { photos, ...fields } = data;
    const updateData: any = { ...fields };
    if (data.scheduledDate) updateData.scheduledDate = new Date(data.scheduledDate);
    const old = await prisma.serviceOrder.findUnique({
      where: { id },
      include: { customer: { select: { contactName: true, email: true, phone: true } } },
    });
    if (!old) return res.status(404).json({ error: 'Orden no encontrada' });

    if (photos !== undefined) {
      if (photos.length > 0) {
        await prisma.photo.deleteMany({ where: { serviceOrderId: id } });
        updateData.photos = {
          create: photos.map(p => ({ url: p.url, caption: p.caption, type: p.type })),
        };
      } else {
        await prisma.photo.deleteMany({ where: { serviceOrderId: id } });
      }
    }

    const order = await prisma.serviceOrder.update({
      where: { id },
      data: updateData,
      include: { customer: true, equipment: true, assignedUser: true, ticket: true, policy: true, report: true, photos: true },
    });
    if (data.status && data.status !== old.status) {
      notifyServiceOrderStatusChange({
        orderId: id,
        orderNumber: old.number,
        customerId: old.customerId,
        customerEmail: old.customer.email,
        customerPhone: old.customer.phone,
        customerName: old.customer.contactName,
        assignedTo: order.assignedTo,
        oldStatus: old.status,
        newStatus: data.status,
        scheduledDate: order.scheduledDate,
      }).catch((err) => console.error('[service-orders] notify error:', err));
    }
    res.json(order);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al actualizar orden de servicio' });
  }
});

router.patch('/:id', requirePermission('service-orders:edit'), requireSubscription, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Estado requerido' });
    }
    const old = await prisma.serviceOrder.findUnique({
      where: { id },
      include: { customer: { select: { contactName: true, email: true, phone: true } } },
    });
    if (!old) return res.status(404).json({ error: 'Orden no encontrada' });
    const order = await prisma.serviceOrder.update({
      where: { id },
      data: { status, ...(status === 'COMPLETADO' ? { completedDate: new Date() } : {}) },
      include: { customer: true, equipment: true, assignedUser: true, ticket: true, policy: true, report: true, photos: true },
    });
    notifyServiceOrderStatusChange({
      orderId: id,
      orderNumber: old.number,
      customerId: old.customerId,
      customerEmail: old.customer.email,
      customerPhone: old.customer.phone,
      customerName: old.customer.contactName,
      assignedTo: order.assignedTo,
      oldStatus: old.status,
      newStatus: status,
      scheduledDate: order.scheduledDate,
    }).catch((err) => console.error('[service-orders] notify error:', err));
    res.json(stripCosts(order, req.user!.role));
  } catch {
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

router.delete('/:id', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    await prisma.photo.deleteMany({ where: { serviceOrderId: id } });
    const report = await prisma.serviceReport.findUnique({ where: { serviceOrderId: id } });
    if (report) {
      await prisma.usedMaterial.deleteMany({ where: { reportId: report.id } });
      await prisma.photo.deleteMany({ where: { reportId: report.id } });
      await prisma.serviceReport.delete({ where: { id: report.id } });
    }
    await prisma.invoice.deleteMany({ where: { serviceOrderId: id } });
    await prisma.serviceOrder.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error al eliminar orden de servicio' });
  }
});

export default router;
