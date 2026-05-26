import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';

const router = Router();

const scheduleSchema = z.object({
  description: z.string().min(1),
  scheduledDate: z.string(),
  policyId: z.number(),
  equipmentId: z.number().optional(),
  assignedTo: z.number().optional(),
  notes: z.string().optional(),
});

router.use(authenticate);

router.get('/', requirePermission('maintenance:view'), async (req: Request, res: Response) => {
  try {
    const logs = await prisma.maintenanceLog.findMany({
      include: { policy: true, equipment: true, assignedUser: true },
      orderBy: { scheduledDate: 'asc' },
    });
    res.json(logs);
  } catch {
    res.status(500).json({ error: 'Error al obtener mantenimientos' });
  }
});

router.post('/', requirePermission('maintenance:create'), async (req: Request, res: Response) => {
  try {
    const data = scheduleSchema.parse(req.body);
    const log = await prisma.maintenanceLog.create({
      data: {
        description: data.description,
        scheduledDate: new Date(data.scheduledDate),
        policyId: data.policyId,
        equipmentId: data.equipmentId,
        assignedTo: data.assignedTo,
        notes: data.notes,
      },
      include: { policy: true, equipment: true },
    });
    res.status(201).json(log);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al programar mantenimiento' });
  }
});

router.put('/:id/complete', requirePermission('maintenance:edit'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const log = await prisma.maintenanceLog.update({
      where: { id },
      data: {
        status: 'COMPLETADO',
        completedDate: new Date(),
      },
    });
    res.json(log);
  } catch {
    res.status(500).json({ error: 'Error al completar mantenimiento' });
  }
});

router.delete('/:id', requirePermission('maintenance:delete'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    await prisma.maintenanceLog.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error al eliminar mantenimiento' });
  }
});

export default router;
