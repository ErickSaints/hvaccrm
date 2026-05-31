import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, requireSuperAdmin } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import { paginate, paginatedResponse } from '../middleware/pagination';
import { scopeToCustomer } from '../middleware/scopeToCustomer';

const router = Router();

const customerSchema = z.object({
  companyName: z.string().optional(),
  contactName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(1),
  phone2: z.string().optional(),
  address: z.string().min(1),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  taxId: z.string().optional(),
  notes: z.string().optional(),
});

router.use(authenticate);

router.get('/', requirePermission('customers:view'), paginate, async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const where: any = {};
    if (req.user?.role === 'CLIENT' && req.user.customerId) {
      where.id = req.user.customerId;
    }
    if (search) {
      where.OR = [
        { companyName: { contains: search as string } },
        { contactName: { contains: search as string } },
        { email: { contains: search as string } },
        { phone: { contains: search as string } },
      ];
    }
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: req.pagination!.skip,
        take: req.pagination!.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);
    res.json(paginatedResponse(customers, total, req.pagination!.page, req.pagination!.limit));
  } catch {
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

router.get('/:id', requirePermission('customers:view'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    if (req.user?.role === 'CLIENT' && req.user.customerId !== id) {
      return res.status(403).json({ error: 'No tienes acceso a este cliente' });
    }
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { equipment: true, tickets: true, quotations: true },
    });
    if (!customer) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(customer);
  } catch {
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
});

router.get('/:id/equipment', requirePermission('equipment:view'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const equipment = await prisma.equipment.findMany({
      where: { customerId: id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(equipment);
  } catch {
    res.status(500).json({ error: 'Error al obtener equipos del cliente' });
  }
});

router.get('/:id/timeline', requirePermission('customers:view'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const [tickets, orders, quotations, reports, policies] = await Promise.all([
      prisma.ticket.findMany({ where: { customerId: id }, include: { assignedUser: { select: { name: true } } } }),
      prisma.serviceOrder.findMany({ where: { customerId: id }, include: { assignedUser: { select: { name: true } } } }),
      prisma.quotation.findMany({ where: { customerId: id }, include: { createdBy: { select: { name: true } } } }),
      prisma.serviceReport.findMany({ where: { customerId: id }, include: { technician: { select: { name: true } } } }),
      prisma.maintenancePolicy.findMany({ where: { customerId: id } }),
    ]);

    const events: any[] = [];

    tickets.forEach((t) => events.push({
      type: 'ticket', id: t.id, title: t.title, description: t.level,
      status: t.status, date: t.createdAt, user: t.assignedUser?.name,
      link: `/tickets/${t.id}`,
    }));

    orders.forEach((o) => events.push({
      type: 'service_order', id: o.id, title: o.number, description: o.description || '',
      status: o.status, date: o.createdAt, user: o.assignedUser?.name,
      link: `/service-orders/${o.id}`,
    }));

    quotations.forEach((q) => events.push({
      type: 'quotation', id: q.id, title: q.number, description: q.title || '',
      status: q.status, date: q.createdAt, user: q.createdBy?.name,
      link: `/quotations/${q.id}`,
    }));

    reports.forEach((r) => events.push({
      type: 'report', id: r.id, title: r.title, description: r.diagnosis || '',
      status: '', date: r.createdAt, user: r.technician?.name,
      link: `/service-reports/${r.id}`,
    }));

    policies.forEach((p) => events.push({
      type: 'policy', id: p.id, title: p.name, description: p.frequency,
      status: p.status, date: p.createdAt, user: '',
      link: `/policies/${p.id}`,
    }));

    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json(events);
  } catch (err) {
    console.error('Timeline error:', err);
    res.status(500).json({ error: 'Error al obtener línea de tiempo' });
  }
});

router.post('/', requirePermission('customers:create'), async (req: Request, res: Response) => {
  try {
    const data = customerSchema.parse(req.body);
    const customer = await prisma.customer.create({ data });
    res.status(201).json(customer);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al crear cliente' });
  }
});

router.put('/:id', requirePermission('customers:edit'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const data = customerSchema.partial().parse(req.body);
    const customer = await prisma.customer.update({ where: { id }, data });
    res.json(customer);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

router.delete('/:id', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    await prisma.surveyPhoto.deleteMany({ where: { survey: { customerId: id } } });
    await prisma.surveyDrawing.deleteMany({ where: { survey: { customerId: id } } });
    await prisma.surveyMaterial.deleteMany({ where: { survey: { customerId: id } } });
    await prisma.survey.deleteMany({ where: { customerId: id } });
    await prisma.asset.deleteMany({ where: { customerId: id } });
    await prisma.invoice.deleteMany({ where: { customerId: id } });
    await prisma.usedMaterial.deleteMany({ where: { report: { customerId: id } } });
    await prisma.photo.deleteMany({ where: { report: { customerId: id } } });
    await prisma.photo.deleteMany({ where: { serviceOrder: { customerId: id } } });
    await prisma.serviceReport.deleteMany({ where: { customerId: id } });
    await prisma.serviceOrder.deleteMany({ where: { customerId: id } });
    await prisma.quotationItem.deleteMany({ where: { quotation: { customerId: id } } });
    await prisma.quotation.deleteMany({ where: { customerId: id } });
    await prisma.maintenanceLog.deleteMany({ where: { policy: { customerId: id } } });
    await prisma.maintenancePolicy.deleteMany({ where: { customerId: id } });
    await prisma.ticket.deleteMany({ where: { customerId: id } });
    await prisma.equipment.deleteMany({ where: { customerId: id } });
    await prisma.customer.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
});

export default router;