import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, requireSuperAdmin } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import { scopeToCustomer } from '../middleware/scopeToCustomer';

const router = Router();

const assetSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  serialNumber: z.string().optional(),
  location: z.string().optional(),
  customerId: z.number(),
});

router.use(authenticate);

router.get('/', requirePermission('assets:view'), scopeToCustomer, async (req: Request, res: Response) => {
  try {
    const where: any = {};
    if (req.scopeFilter) {
      where.customerId = req.scopeFilter.customerId;
    }
    const assets = await prisma.asset.findMany({
      where,
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(assets);
  } catch {
    res.status(500).json({ error: 'Error al obtener activos' });
  }
});

router.get('/:id', requirePermission('assets:view'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!asset) {
      return res.status(404).json({ error: 'Activo no encontrado' });
    }
    if (req.user!.role === 'CLIENT' && asset.customerId !== req.user!.customerId) {
      return res.status(403).json({ error: 'No tienes permiso para ver este activo' });
    }

    // Get latest maintenance logs for this customer's equipment
    const latestMaintenance = await prisma.maintenanceLog.findMany({
      where: {
        equipment: {
          customerId: asset.customerId,
        },
      },
      include: {
        equipment: true,
        policy: true,
        assignedUser: true,
      },
      orderBy: { scheduledDate: 'desc' },
      take: 5,
    });

    // Get latest service reports for this customer
    const latestReports = await prisma.serviceReport.findMany({
      where: {
        customerId: asset.customerId,
      },
      include: {
        serviceOrder: true,
        technician: true,
        equipment: true,
        photos: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    res.json({ ...asset, maintenanceLogs: latestMaintenance, serviceReports: latestReports });
  } catch {
    res.status(500).json({ error: 'Error al obtener activo' });
  }
});

router.post('/', requirePermission('assets:create'), async (req: Request, res: Response) => {
  try {
    const data = assetSchema.parse(req.body);
    const asset = await prisma.asset.create({ data, include: { customer: true } });
    res.status(201).json(asset);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al crear activo' });
  }
});

router.put('/:id', requirePermission('assets:edit'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const data = assetSchema.partial().parse(req.body);
    const asset = await prisma.asset.update({ where: { id }, data, include: { customer: true } });
    res.json(asset);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al actualizar activo' });
  }
});

router.delete('/:id', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    await prisma.asset.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error al eliminar activo' });
  }
});

export default router;
