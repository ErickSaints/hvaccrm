import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

const equipmentSchema = z.object({
  type: z.string().min(1),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  capacity: z.string().optional(),
  location: z.string().optional(),
  installDate: z.string().optional(),
  lastService: z.string().optional(),
  notes: z.string().optional(),
  customerId: z.number(),
});

router.use(authenticate);
router.use(requireRole(['ADMIN', 'SALES']));

router.get('/', async (req: Request, res: Response) => {
  try {
    const equipment = await prisma.equipment.findMany({
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(equipment);
  } catch {
    res.status(500).json({ error: 'Error al obtener equipos' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: { customer: true, tickets: true, serviceOrders: true },
    });
    if (!equipment) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    res.json(equipment);
  } catch {
    res.status(500).json({ error: 'Error al obtener equipo' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = equipmentSchema.parse(req.body);
    const equipment = await prisma.equipment.create({
      data: {
        type: data.type,
        brand: data.brand,
        model: data.model,
        serialNumber: data.serialNumber,
        capacity: data.capacity,
        location: data.location,
        installDate: data.installDate ? new Date(data.installDate) : undefined,
        lastService: data.lastService ? new Date(data.lastService) : undefined,
        notes: data.notes,
        customerId: data.customerId,
      },
    });
    res.status(201).json(equipment);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al crear equipo' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const data = equipmentSchema.partial().parse(req.body);
    const updateData: any = { ...data };
    if (data.installDate) updateData.installDate = new Date(data.installDate);
    if (data.lastService) updateData.lastService = new Date(data.lastService);
    const equipment = await prisma.equipment.update({ where: { id }, data: updateData });
    res.json(equipment);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al actualizar equipo' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    await prisma.equipment.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error al eliminar equipo' });
  }
});

export default router;
