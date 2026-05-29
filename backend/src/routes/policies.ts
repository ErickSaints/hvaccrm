import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, requireSuperAdmin } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';

const router = Router();

const policySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  frequency: z.enum(['MENSUAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL']),
  visitCount: z.number().positive(),
  pricePerVisit: z.number().min(0),
  totalPrice: z.number().min(0),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(['ACTIVA', 'EXPIRADA', 'CANCELADA']).optional(),
  notes: z.string().optional(),
  customerId: z.number(),
});

async function generatePolicyNumber(): Promise<string> {
  const now = new Date();
  const prefix = `POL-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-`;
  const last = await prisma.maintenancePolicy.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: 'desc' },
  });
  let next = 1;
  if (last) {
    const parts = last.number.split('-');
    next = parseInt(parts[2]) + 1;
  }
  return `${prefix}${String(next).padStart(4, '0')}`;
}

router.use(authenticate);

router.get('/', requirePermission('policies:view'), async (req: Request, res: Response) => {
  try {
    const policies = await prisma.maintenancePolicy.findMany({
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(policies);
  } catch {
    res.status(500).json({ error: 'Error al obtener políticas' });
  }
});

router.get('/:id', requirePermission('policies:view'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const policy = await prisma.maintenancePolicy.findUnique({
      where: { id },
      include: { customer: true, serviceOrders: true, maintenanceLogs: true },
    });
    if (!policy) {
      return res.status(404).json({ error: 'Política no encontrada' });
    }
    res.json(policy);
  } catch {
    res.status(500).json({ error: 'Error al obtener política' });
  }
});

router.post('/', requirePermission('policies:create'), async (req: Request, res: Response) => {
  try {
    const data = policySchema.parse(req.body);
    const number = await generatePolicyNumber();
    const policy = await prisma.maintenancePolicy.create({
      data: {
        number,
        name: data.name,
        description: data.description,
        frequency: data.frequency,
        visitCount: data.visitCount,
        pricePerVisit: data.pricePerVisit,
        totalPrice: data.totalPrice,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: data.status || 'ACTIVA',
        notes: data.notes,
        customerId: data.customerId,
      },
      include: { customer: true },
    });
    res.status(201).json(policy);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al crear política' });
  }
});

router.put('/:id', requirePermission('policies:edit'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const data = policySchema.partial().parse(req.body);
    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    const policy = await prisma.maintenancePolicy.update({ where: { id }, data: updateData });
    res.json(policy);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al actualizar política' });
  }
});

router.delete('/:id', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    await prisma.maintenancePolicy.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error al eliminar póliza' });
  }
});

export default router;
