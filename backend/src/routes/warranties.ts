import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, requireBackoffice, requireSuperAdmin } from '../middleware/auth';

const router = Router();

const warrantySchema = z.object({
  type: z.enum(['MANUFACTURER', 'LABOR', 'EXTENDED']),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  equipmentId: z.number(),
  serviceOrderId: z.number().optional(),
});

const warrantyUpdateSchema = warrantySchema.partial();

const certificationSchema = z.object({
  name: z.string().min(1),
  issuingBody: z.string().min(1),
  number: z.string().optional(),
  expiresAt: z.string().optional(),
  documentUrl: z.string().optional(),
  userId: z.number(),
});

const certificationUpdateSchema = certificationSchema.partial();

router.use(authenticate, requireBackoffice);

router.get('/', async (req: Request, res: Response) => {
  try {
    const { filter } = req.query;
    const now = new Date();
    const where: any = {};

    if (filter === 'active') {
      where.endDate = { gte: now };
    } else if (filter === 'expiring') {
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      where.endDate = { gte: now, lte: thirtyDays };
    } else if (filter === 'expired') {
      where.endDate = { lt: now };
    }

    const warranties = await prisma.warranty.findMany({
      where,
      include: {
        equipment: {
          include: { customer: true },
        },
        serviceOrder: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(warranties);
  } catch {
    res.status(500).json({ error: 'Error al obtener garantías' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const warranty = await prisma.warranty.findUnique({
      where: { id },
      include: {
        equipment: {
          include: { customer: true },
        },
        serviceOrder: true,
      },
    });

    if (!warranty) {
      return res.status(404).json({ error: 'Garantía no encontrada' });
    }

    res.json(warranty);
  } catch {
    res.status(500).json({ error: 'Error al obtener garantía' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = warrantySchema.parse(req.body);

    const warranty = await prisma.warranty.create({
      data: {
        type: data.type,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        terms: data.terms,
        notes: data.notes,
        equipmentId: data.equipmentId,
        serviceOrderId: data.serviceOrderId,
      },
      include: {
        equipment: {
          include: { customer: true },
        },
        serviceOrder: true,
      },
    });

    res.status(201).json(warranty);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al crear garantía' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const data = warrantyUpdateSchema.parse(req.body);

    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    const warranty = await prisma.warranty.update({
      where: { id },
      data: updateData,
      include: {
        equipment: {
          include: { customer: true },
        },
        serviceOrder: true,
      },
    });

    res.json(warranty);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al actualizar garantía' });
  }
});

router.delete('/:id', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    await prisma.warranty.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error al eliminar garantía' });
  }
});

router.get('/certifications', async (req: Request, res: Response) => {
  try {
    const { issuingBody, verified } = req.query;
    const now = new Date();
    const where: any = {};

    if (issuingBody) where.issuingBody = issuingBody as string;
    if (verified !== undefined) where.verified = verified === 'true';
    if (req.query.expiring === 'true') {
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      where.expiresAt = { gte: now, lte: thirtyDays };
    }

    const certifications = await prisma.certification.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(certifications);
  } catch {
    res.status(500).json({ error: 'Error al obtener certificaciones' });
  }
});

router.post('/certifications', async (req: Request, res: Response) => {
  try {
    const data = certificationSchema.parse(req.body);

    const certification = await prisma.certification.create({
      data: {
        name: data.name,
        issuingBody: data.issuingBody,
        number: data.number,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        documentUrl: data.documentUrl,
        userId: data.userId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    res.status(201).json(certification);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al crear certificación' });
  }
});

router.put('/certifications/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const data = certificationUpdateSchema.parse(req.body);

    const updateData: any = { ...data };
    if (data.expiresAt) updateData.expiresAt = new Date(data.expiresAt);

    const certification = await prisma.certification.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    res.json(certification);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al actualizar certificación' });
  }
});

router.delete('/certifications/:id', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    await prisma.certification.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error al eliminar certificación' });
  }
});

export default router;
