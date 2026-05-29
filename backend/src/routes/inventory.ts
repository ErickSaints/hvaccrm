import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, requireSuperAdmin } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import { paginate, paginatedResponse } from '../middleware/pagination';

const router = Router();

const itemSchema = z.object({
  code: z.string().min(1, 'El código es obligatorio'),
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  category: z.string().optional().default('GENERAL'),
  unit: z.string().optional().default('pza'),
  minStock: z.number().optional().default(0),
  currentStock: z.number().optional().default(0),
  unitPrice: z.number().optional().default(0),
  location: z.string().optional(),
  branchId: z.number().optional(),
});

const movementSchema = z.object({
  type: z.enum(['ENTRADA', 'SALIDA', 'AJUSTE', 'TRANSFERENCIA']),
  quantity: z.number().positive('La cantidad debe ser positiva'),
  unitPrice: z.number().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  branchId: z.number().optional(),
  serviceOrderId: z.number().optional(),
  reportId: z.number().optional(),
});

router.use(authenticate);

router.get('/', requirePermission('catalog:view'), paginate, async (req: Request, res: Response) => {
  try {
    const { search, category, lowStock, branchId } = req.query;
    const where: any = { active: true };
    if (search) {
      where.OR = [
        { code: { contains: search as string, ...(process.env.DATABASE_URL?.includes('postgres') ? { mode: 'insensitive' as const } : {}) } },
        { name: { contains: search as string, ...(process.env.DATABASE_URL?.includes('postgres') ? { mode: 'insensitive' as const } : {}) } },
      ];
    }
    if (category) where.category = category;
    if (lowStock === 'true') {
      where.AND = [
        { currentStock: { lte: prisma.inventoryItem.fields.minStock } },
      ];
    }
    if (branchId) where.branchId = parseInt(branchId as string);

    const [allItems, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        skip: req.pagination!.skip,
        take: req.pagination!.limit,
        orderBy: { name: 'asc' },
        include: { branch: { select: { id: true, name: true } } },
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    const items = lowStock === 'true'
      ? allItems.filter((item) => item.currentStock <= item.minStock)
      : allItems;

    res.json(paginatedResponse(items, total, req.pagination!.page, req.pagination!.limit));
  } catch (err) {
    console.error('Error listing inventory:', err);
    res.status(500).json({ error: 'Error al listar inventario' });
  }
});

router.get('/categories', requirePermission('catalog:view'), async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.inventoryItem.groupBy({
      by: ['category'],
      where: { active: true },
    });
    res.json(categories.map((c) => c.category));
  } catch {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

router.get('/low-stock', requirePermission('catalog:view'), async (_req: Request, res: Response) => {
  try {
    const allItems = await prisma.inventoryItem.findMany({
      where: { active: true },
      orderBy: { currentStock: 'asc' },
      take: 50,
    });
    const items = allItems.filter((item) => item.currentStock <= item.minStock);
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Error al obtener stock bajo' });
  }
});

router.get('/:id', requirePermission('catalog:view'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        branch: { select: { id: true, name: true } },
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            performedBy: { select: { id: true, name: true } },
            branch: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Error al obtener artículo' });
  }
});

router.post('/', requirePermission('catalog:create'), async (req: Request, res: Response) => {
  try {
    const data = itemSchema.parse(req.body);
    const existing = await prisma.inventoryItem.findUnique({ where: { code: data.code } });
    if (existing) {
      return res.status(400).json({ error: 'Ya existe un artículo con ese código' });
    }
    const item = await prisma.inventoryItem.create({ data });
    res.status(201).json(item);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: err.errors });
    }
    console.error('Error creating inventory item:', err);
    res.status(500).json({ error: 'Error al crear artículo' });
  }
});

router.put('/:id', requirePermission('catalog:edit'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const data = itemSchema.partial().parse(req.body);
    if (data.code) {
      const existing = await prisma.inventoryItem.findFirst({ where: { code: data.code, id: { not: id } } });
      if (existing) return res.status(400).json({ error: 'Ya existe otro artículo con ese código' });
    }
    const item = await prisma.inventoryItem.update({ where: { id }, data });
    res.json(item);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: err.errors });
    }
    res.status(500).json({ error: 'Error al actualizar artículo' });
  }
});

router.post('/:id/movement', requirePermission('catalog:edit'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const data = movementSchema.parse(req.body);
    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });

    const stockChange = data.type === 'ENTRADA' || data.type === 'AJUSTE' ? data.quantity : -data.quantity;
    const newStock = item.currentStock + stockChange;
    if (newStock < 0) {
      return res.status(400).json({ error: 'Stock insuficiente para realizar la salida' });
    }

    const [movement] = await prisma.$transaction([
      prisma.inventoryMovement.create({
        data: {
          type: data.type,
          quantity: data.quantity,
          unitPrice: data.unitPrice || item.unitPrice,
          total: (data.unitPrice || item.unitPrice) * data.quantity,
          reference: data.reference,
          notes: data.notes,
          itemId: id,
          branchId: data.branchId,
          performedById: req.user!.id,
          serviceOrderId: data.serviceOrderId,
          reportId: data.reportId,
        },
      }),
      prisma.inventoryItem.update({
        where: { id },
        data: { currentStock: newStock },
      }),
    ]);

    res.status(201).json(movement);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: err.errors });
    }
    console.error('Error creating movement:', err);
    res.status(500).json({ error: 'Error al registrar movimiento' });
  }
});

router.get('/:id/movements', requirePermission('catalog:view'), paginate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const where = { itemId: id };
    const [movements, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        skip: req.pagination!.skip,
        take: req.pagination!.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          performedBy: { select: { id: true, name: true } },
          branch: { select: { id: true, name: true } },
        },
      }),
      prisma.inventoryMovement.count({ where }),
    ]);
    res.json(paginatedResponse(movements, total, req.pagination!.page, req.pagination!.limit));
  } catch {
    res.status(500).json({ error: 'Error al obtener movimientos' });
  }
});

router.delete('/:id', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    await prisma.inventoryItem.update({ where: { id }, data: { active: false } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error al desactivar artículo' });
  }
});

export default router;
