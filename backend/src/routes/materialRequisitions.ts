import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, requireBackoffice } from '../middleware/auth';
import { paginate, paginatedResponse } from '../middleware/pagination';

const router = Router();

function generateReqNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `MR-${y}${m}-${rand}`;
}

const itemSchema = z.object({
  description: z.string().min(1, 'La descripción es obligatoria'),
  quantity: z.number().positive('La cantidad debe ser positiva'),
  unit: z.string().default('pza'),
  notes: z.string().optional(),
});

const createSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  notes: z.string().optional(),
  branchId: z.number().optional(),
  items: z.array(itemSchema).min(1, 'Debe incluir al menos un artículo'),
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  notes: z.string().optional(),
  branchId: z.number().optional(),
  items: z.array(itemSchema).optional(),
});

const statusSchema = z.object({
  status: z.enum(['PENDIENTE', 'EN_ESPERA', 'ENVIADO']),
});

router.use(authenticate);

router.get('/', requireBackoffice, async (req: Request, res: Response) => {
  try {
    const { search, status } = req.query;
    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { number: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status as string;
    const [requisitions, total] = await Promise.all([
      prisma.materialRequisition.findMany({
        where,
        include: {
          requestedBy: { select: { id: true, name: true } },
          approvedBy: { select: { id: true, name: true } },
          branch: { select: { id: true, name: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.materialRequisition.count({ where }),
    ]);
    res.json({ data: requisitions, total });
  } catch (err) {
    res.status(500).json({ error: 'Error al listar requisiciones' });
  }
});

router.get('/:id', requireBackoffice, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const requisition = await prisma.materialRequisition.findUnique({
      where: { id },
      include: {
        requestedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        items: true,
      },
    });
    if (!requisition) return res.status(404).json({ error: 'Requisición no encontrada' });
    res.json(requisition);
  } catch {
    res.status(500).json({ error: 'Error al obtener requisición' });
  }
});

router.post('/', requireBackoffice, async (req: Request, res: Response) => {
  try {
    const data = createSchema.parse(req.body);
    const number = generateReqNumber();
    const requisition = await prisma.materialRequisition.create({
      data: {
        number,
        title: data.title,
        notes: data.notes,
        branchId: data.branchId,
        requestedById: req.user!.id,
        items: {
          create: data.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit || 'pza',
            notes: item.notes,
          })),
        },
      },
      include: {
        items: true,
        requestedBy: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(requisition);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: err.errors });
    }
    res.status(500).json({ error: 'Error al crear requisición' });
  }
});

router.put('/:id', requireBackoffice, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.materialRequisition.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Requisición no encontrada' });
    if (existing.status !== 'PENDIENTE') {
      return res.status(400).json({ error: 'Solo se pueden editar requisiciones pendientes' });
    }
    const data = updateSchema.parse(req.body);
    const requisition = await prisma.materialRequisition.update({
      where: { id },
      data: {
        title: data.title,
        notes: data.notes,
        branchId: data.branchId,
        items: data.items ? {
          deleteMany: {},
          create: data.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit || 'pza',
            notes: item.notes,
          })),
        } : undefined,
      },
      include: {
        items: true,
        requestedBy: { select: { id: true, name: true } },
      },
    });
    res.json(requisition);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: err.errors });
    }
    res.status(500).json({ error: 'Error al actualizar requisición' });
  }
});

router.put('/:id/status', requireBackoffice, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = statusSchema.parse(req.body);
    const existing = await prisma.materialRequisition.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Requisición no encontrada' });
    const validTransitions: Record<string, string[]> = {
      PENDIENTE: ['EN_ESPERA', 'ENVIADO'],
      EN_ESPERA: ['ENVIADO', 'PENDIENTE'],
      ENVIADO: [],
    };
    if (!validTransitions[existing.status]?.includes(status)) {
      return res.status(400).json({
        error: `No se puede cambiar de ${existing.status} a ${status}`,
      });
    }
    const requisition = await prisma.materialRequisition.update({
      where: { id },
      data: {
        status,
        approvedById: status === 'ENVIADO' ? req.user!.id : undefined,
      },
      include: {
        items: true,
        requestedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });
    res.json(requisition);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: err.errors });
    }
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
});

router.delete('/:id', requireBackoffice, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.materialRequisition.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Requisición no encontrada' });
    if (existing.status !== 'PENDIENTE') {
      return res.status(400).json({ error: 'Solo se pueden eliminar requisiciones pendientes' });
    }
    await prisma.materialRequisition.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error al eliminar requisición' });
  }
});

export default router;
