import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';

const router = Router();

const surveySchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional(),
  location: z.string().optional(),
  customerId: z.number(),
  photos: z.array(z.object({ url: z.string(), caption: z.string().optional() })).optional(),
  materials: z.array(z.object({ description: z.string(), quantity: z.number(), unit: z.string().optional(), category: z.string().optional(), notes: z.string().optional() })).optional(),
  drawings: z.array(z.object({ name: z.string().optional(), canvasData: z.string() })).optional(),
});

router.use(authenticate);

router.get('/', requirePermission('surveys:view'), async (req: Request, res: Response) => {
  try {
    const { customerId } = req.query;
    const where: any = {};
    if (customerId) where.customerId = parseInt(String(customerId));
    if (req.user?.role === 'CLIENT') {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (user) {
        const customers = await prisma.customer.findMany({ where: { email: user.email }, select: { id: true } });
        where.customerId = { in: customers.map(c => c.id) };
      }
    }
    const surveys = await prisma.survey.findMany({
      where,
      include: { customer: true, createdBy: { select: { name: true } }, photos: true, materials: true, drawings: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(surveys);
  } catch {
    res.status(500).json({ error: 'Error al obtener levantamientos' });
  }
});

router.get('/:id', requirePermission('surveys:view'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const survey = await prisma.survey.findUnique({
      where: { id },
      include: { customer: true, createdBy: { select: { name: true, email: true } }, photos: true, materials: true, drawings: true },
    });
    if (!survey) return res.status(404).json({ error: 'Levantamiento no encontrado' });
    res.json(survey);
  } catch {
    res.status(500).json({ error: 'Error al obtener levantamiento' });
  }
});

router.post('/', requirePermission('surveys:create'), async (req: Request, res: Response) => {
  try {
    const data = surveySchema.parse(req.body);
    const survey = await prisma.survey.create({
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        customerId: data.customerId,
        createdById: req.user!.id,
        photos: data.photos ? { create: data.photos } : undefined,
        materials: data.materials ? { create: data.materials } : undefined,
        drawings: data.drawings ? { create: data.drawings } : undefined,
      },
      include: { customer: true, createdBy: { select: { name: true } }, photos: true, materials: true, drawings: true },
    });
    res.status(201).json(survey);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Error al crear levantamiento' });
  }
});

router.put('/:id', requirePermission('surveys:edit'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const data = surveySchema.partial().parse(req.body);

    const existing = await prisma.survey.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Levantamiento no encontrado' });

    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.customerId) updateData.customerId = data.customerId;

    if (data.photos) {
      await prisma.surveyPhoto.deleteMany({ where: { surveyId: id } });
      updateData.photos = { create: data.photos };
    }
    if (data.materials) {
      await prisma.surveyMaterial.deleteMany({ where: { surveyId: id } });
      updateData.materials = { create: data.materials };
    }
    if (data.drawings) {
      await prisma.surveyDrawing.deleteMany({ where: { surveyId: id } });
      updateData.drawings = { create: data.drawings };
    }

    const survey = await prisma.survey.update({
      where: { id },
      data: updateData,
      include: { customer: true, createdBy: { select: { name: true } }, photos: true, materials: true, drawings: true },
    });
    res.json(survey);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Error al actualizar levantamiento' });
  }
});

router.delete('/:id', requirePermission('surveys:delete'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    await Promise.all([
      prisma.surveyPhoto.deleteMany({ where: { surveyId: id } }),
      prisma.surveyMaterial.deleteMany({ where: { surveyId: id } }),
      prisma.surveyDrawing.deleteMany({ where: { surveyId: id } }),
    ]);
    await prisma.survey.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error al eliminar levantamiento' });
  }
});

export default router;
