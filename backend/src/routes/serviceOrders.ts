import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, requireBackoffice } from '../middleware/auth';

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
    const orders = await prisma.serviceOrder.findMany({
      include: { customer: true, equipment: true, assignedUser: true, ticket: true, policy: true, report: true },
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
      include: { customer: true, equipment: true, assignedUser: true, ticket: true, policy: true, report: true },
    });
    if (!order) {
      return res.status(404).json({ error: 'Orden de servicio no encontrada' });
    }
    res.json(stripCosts(order, req.user!.role));
  } catch {
    res.status(500).json({ error: 'Error al obtener orden de servicio' });
  }
});

router.post('/', requireBackoffice, async (req: Request, res: Response) => {
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
      },
      include: { customer: true, equipment: true },
    });
    res.status(201).json(order);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al crear orden de servicio' });
  }
});

router.put('/:id', requireBackoffice, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const data = serviceOrderSchema.partial().parse(req.body);
    const updateData: any = { ...data };
    if (data.scheduledDate) updateData.scheduledDate = new Date(data.scheduledDate);
    const order = await prisma.serviceOrder.update({ where: { id }, data: updateData });
    res.json(order);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al actualizar orden de servicio' });
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