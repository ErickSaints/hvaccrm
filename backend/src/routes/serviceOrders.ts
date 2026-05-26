import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, requireBackoffice, requireSubscription } from '../middleware/auth';

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

router.get('/', async (req: Request, res: Response) => {
  try {
    const where: any = {};
    if (req.user!.role === 'CLIENT') {
      const userCustomers = await prisma.customer.findMany({ where: { email: req.user!.email }, select: { id: true } });
      where.customerId = { in: userCustomers.map(c => c.id) };
    }
    const orders = await prisma.serviceOrder.findMany({
      where,
      include: { customer: true, equipment: true, assignedUser: true, ticket: true, policy: true, report: true, photos: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders.map((o) => stripCosts(o, req.user!.role)));
  } catch {
    res.status(500).json({ error: 'Error al obtener órdenes de servicio' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const order = await prisma.serviceOrder.findUnique({
      where: { id },
      include: { customer: true, equipment: true, assignedUser: true, ticket: true, policy: true, report: true, photos: true },
    });
    if (!order) {
      return res.status(404).json({ error: 'Orden de servicio no encontrada' });
    }
    res.json(stripCosts(order, req.user!.role));
  } catch {
    res.status(500).json({ error: 'Error al obtener orden de servicio' });
  }
});

router.post('/', requireSubscription, async (req: Request, res: Response) => {
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

router.put('/:id', requireSubscription, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const data = serviceOrderSchema.partial().parse(req.body);
    const { photos, ...fields } = data;
    const updateData: any = { ...fields };
    if (data.scheduledDate) updateData.scheduledDate = new Date(data.scheduledDate);

    if (photos !== undefined) {
      // Only delete and replace if new photos are provided and non-empty
      if (photos.length > 0) {
        await prisma.photo.deleteMany({ where: { serviceOrderId: id } });
        updateData.photos = {
          create: photos.map(p => ({ url: p.url, caption: p.caption, type: p.type })),
        };
      } else {
        // Empty array means clear all photos
        await prisma.photo.deleteMany({ where: { serviceOrderId: id } });
      }
    }

    const order = await prisma.serviceOrder.update({
      where: { id },
      data: updateData,
      include: { customer: true, equipment: true, assignedUser: true, ticket: true, policy: true, report: true, photos: true },
    });
    res.json(order);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al actualizar orden de servicio' });
  }
});

router.patch('/:id', requireSubscription, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Estado requerido' });
    }
    const order = await prisma.serviceOrder.update({
      where: { id },
      data: { status, ...(status === 'COMPLETADO' ? { completedDate: new Date() } : {}) },
      include: { customer: true, equipment: true, assignedUser: true, ticket: true, policy: true, report: true, photos: true },
    });
    res.json(stripCosts(order, req.user!.role));
  } catch {
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

router.delete('/:id', requireBackoffice, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    await prisma.serviceOrder.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error al eliminar orden de servicio' });
  }
});

export default router;
