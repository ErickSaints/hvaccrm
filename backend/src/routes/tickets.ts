import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, requireSubscription } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import { notifyTicketStatusChange } from '../notifications/notifier';

const router = Router();

const ticketSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  level: z.enum(['EMERGENCIA', 'ATENCION', 'PROGRAMAR']),
  status: z.enum(['ABIERTO', 'EN_PROCESO', 'RESUELTO', 'CERRADO']).optional(),
  customerId: z.number().optional(),
  equipmentId: z.number().optional(),
  assignedTo: z.number().optional().nullable(),
  resolution: z.string().optional(),
});

router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  try {
    const { level, status } = req.query;
    const where: any = {};

    if (req.user!.role === 'CLIENT') {
      const userCustomers = await prisma.customer.findMany({ where: { email: req.user!.email }, select: { id: true } });
      where.OR = [
        { assignedTo: req.user!.id },
        { customerId: { in: userCustomers.map(c => c.id) } },
      ];
    }

    if (level) where.level = level;
    if (status) where.status = status;

    const tickets = await prisma.ticket.findMany({
      where,
      include: { customer: true, equipment: true, assignedUser: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tickets);
  } catch {
    res.status(500).json({ error: 'Error al obtener tickets' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { customer: true, equipment: true, assignedUser: true, serviceOrders: { include: { photos: true, report: { select: { id: true, title: true } } } } },
    });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }
    if (req.user!.role === 'CLIENT' && ticket.assignedTo !== req.user!.id) {
      return res.status(403).json({ error: 'No tienes permiso para ver este ticket' });
    }
    res.json(ticket);
  } catch {
    res.status(500).json({ error: 'Error al obtener ticket' });
  }
});

router.post('/', requireSubscription, async (req: Request, res: Response) => {
  try {
    const data = ticketSchema.parse(req.body);

    let customer;
    if (data.customerId) {
      customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
      if (!customer) {
        return res.status(400).json({ error: 'Cliente no encontrado' });
      }
    } else {
      customer = await prisma.customer.findFirst({ where: { email: req.user!.email } });
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            contactName: req.user!.name,
            email: req.user!.email,
            phone: req.user!.phone || 'Sin teléfono',
            address: 'Pendiente',
          },
        });
      }
    }

    const ticket = await prisma.ticket.create({
      data: {
        title: data.title,
        description: data.description,
        level: data.level,
        status: data.status || 'ABIERTO',
        customerId: customer.id,
        equipmentId: data.equipmentId,
        assignedTo: data.assignedTo ?? req.user!.id,
        resolution: data.resolution,
      },
    });
    res.status(201).json(ticket);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al crear ticket' });
  }
});

router.put('/:id', requirePermission('tickets:edit'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const data = ticketSchema.partial().parse(req.body);
    const old = await prisma.ticket.findUnique({
      where: { id },
      include: { customer: { select: { contactName: true, email: true } } },
    });
    if (!old) return res.status(404).json({ error: 'Ticket no encontrado' });
    const ticket = await prisma.ticket.update({ where: { id }, data });
    if (data.status && data.status !== old.status) {
      notifyTicketStatusChange({
        ticketId: id,
        ticketTitle: ticket.title,
        customerId: old.customerId,
        customerEmail: old.customer.email,
        customerName: old.customer.contactName,
        assignedTo: ticket.assignedTo,
        oldStatus: old.status,
        newStatus: data.status,
      }).catch((err) => console.error('[tickets] notify error:', err));
    }
    res.json(ticket);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al actualizar ticket' });
  }
});

router.delete('/:id', requirePermission('tickets:delete'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    await prisma.ticket.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error al eliminar ticket' });
  }
});

export default router;
