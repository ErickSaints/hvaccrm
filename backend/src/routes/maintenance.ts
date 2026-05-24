import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, requireBackoffice } from '../middleware/auth';

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
router.use(requireBackoffice);

router.get('/', async (req: Request, res: Response) => {
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

router.post('/', async (req: Request, res: Response) => {
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

router.put('/:id/complete', async (req: Request, res: Response) => {
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

export default router;
