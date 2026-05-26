import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, requireSubscription } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';

const router = Router();

function stripMaterialCosts(material: any, role: string) {
  if (role === 'TECHNICIAN') {
    const { unitPrice, total, ...rest } = material;
    return { ...rest, unitPrice: 0, total: 0 };
  }
  return material;
}

function stripReportCosts(report: any, role: string) {
  if (role === 'TECHNICIAN' && report.usedMaterials) {
    return {
      ...report,
      usedMaterials: report.usedMaterials.map((m: any) => stripMaterialCosts(m, role)),
    };
  }
  return report;
}

const materialSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  total: z.number().min(0),
});

const photoSchema = z.object({
  url: z.string().min(1),
  caption: z.string().optional(),
  type: z.string().optional(),
});

const reportSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  diagnosis: z.string().optional(),
  workPerformed: z.string().optional(),
  recommendations: z.string().optional(),
  arrivalTime: z.string().optional(),
  departureTime: z.string().optional(),
  signature: z.string().optional(),
  serviceOrderId: z.number(),
  technicianId: z.number(),
  customerId: z.number(),
  equipmentId: z.number().optional(),
  photos: z.array(photoSchema).optional(),
  usedMaterials: z.array(materialSchema).optional(),
});

router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  try {
    const where: any = {};
    if (req.user!.role === 'CLIENT') {
      const userCustomers = await prisma.customer.findMany({ where: { email: req.user!.email }, select: { id: true } });
      where.customerId = { in: userCustomers.map(c => c.id) };
    }
    const reports = await prisma.serviceReport.findMany({
      where,
      include: { serviceOrder: true, technician: true, customer: true, equipment: true, photos: true, usedMaterials: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reports.map((r) => stripReportCosts(r, req.user!.role)));
  } catch {
    res.status(500).json({ error: 'Error al obtener reportes' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const report = await prisma.serviceReport.findUnique({
      where: { id },
      include: { serviceOrder: true, technician: true, customer: true, equipment: true, photos: true, usedMaterials: true },
    });
    if (!report) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }
    res.json(stripReportCosts(report, req.user!.role));
  } catch {
    res.status(500).json({ error: 'Error al obtener reporte' });
  }
});

router.post('/', requireSubscription, async (req: Request, res: Response) => {
  try {
    const data = reportSchema.parse(req.body);
    const report = await prisma.serviceReport.create({
      data: {
        title: data.title,
        description: data.description,
        diagnosis: data.diagnosis,
        workPerformed: data.workPerformed,
        recommendations: data.recommendations,
        arrivalTime: data.arrivalTime,
        departureTime: data.departureTime,
        signature: data.signature,
        serviceOrderId: data.serviceOrderId,
        technicianId: data.technicianId,
        customerId: data.customerId,
        equipmentId: data.equipmentId,
        photos: data.photos && data.photos.length > 0 ? { create: data.photos } : undefined,
        usedMaterials: data.usedMaterials && data.usedMaterials.length > 0 ? { create: data.usedMaterials } : undefined,
      },
      include: { photos: true, usedMaterials: true },
    });

    await prisma.serviceOrder.update({
      where: { id: data.serviceOrderId },
      data: { status: 'COMPLETADO', completedDate: new Date() },
    });

    res.status(201).json(stripReportCosts(report, req.user!.role));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al crear reporte' });
  }
});

router.put('/:id', requirePermission('service-reports:edit'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const data = reportSchema.partial().parse(req.body);

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.diagnosis !== undefined) updateData.diagnosis = data.diagnosis;
    if (data.workPerformed !== undefined) updateData.workPerformed = data.workPerformed;
    if (data.recommendations !== undefined) updateData.recommendations = data.recommendations;
    if (data.arrivalTime !== undefined) updateData.arrivalTime = data.arrivalTime;
    if (data.departureTime !== undefined) updateData.departureTime = data.departureTime;
    if (data.signature !== undefined) updateData.signature = data.signature;
    if (data.equipmentId !== undefined) updateData.equipmentId = data.equipmentId;

    if (data.photos) {
      await prisma.photo.deleteMany({ where: { reportId: id } });
      updateData.photos = { create: data.photos };
    }
    if (data.usedMaterials) {
      await prisma.usedMaterial.deleteMany({ where: { reportId: id } });
      updateData.usedMaterials = { create: data.usedMaterials };
    }

    const report = await prisma.serviceReport.update({
      where: { id },
      data: updateData,
      include: { photos: true, usedMaterials: true },
    });
    res.json(stripReportCosts(report, req.user!.role));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al actualizar reporte' });
  }
});

router.delete('/:id', requirePermission('service-reports:delete'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    await prisma.serviceReport.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error al eliminar reporte' });
  }
});

export default router;