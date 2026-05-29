import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, requireBackoffice, requireSuperAdmin } from '../middleware/auth';
import { paginate, paginatedResponse } from '../middleware/pagination';

const router = Router();

const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  sortOrder: z.number().optional().default(0),
});

const itemSchema = z.object({
  sku: z.string().min(1, 'El SKU es obligatorio'),
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  unit: z.string().optional().default('pza'),
  goodPrice: z.number().optional(),
  betterPrice: z.number().optional(),
  bestPrice: z.number().optional(),
  costPrice: z.number().optional(),
  supplier: z.string().optional(),
  categoryId: z.number().optional(),
  vendorId: z.number().optional(),
});

router.use(authenticate, requireBackoffice);

// ── Categories ───────────────────────────────────────────────────────────────

router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.pricebookCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { items: { where: { active: true } } } },
        items: {
          where: { active: true },
          select: { id: true, name: true, goodPrice: true, betterPrice: true, bestPrice: true },
          orderBy: { name: 'asc' },
        },
      },
    });
    res.json(categories);
  } catch {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

router.post('/categories', async (req: Request, res: Response) => {
  try {
    const data = categorySchema.parse(req.body);
    const category = await prisma.pricebookCategory.create({ data });
    res.status(201).json(category);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: err.errors });
    }
    res.status(500).json({ error: 'Error al crear categoría' });
  }
});

router.put('/categories/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const data = categorySchema.partial().parse(req.body);
    const category = await prisma.pricebookCategory.update({ where: { id }, data });
    res.json(category);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: err.errors });
    }
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
});

router.delete('/categories/:id', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    await prisma.pricebookCategory.update({ where: { id }, data: { active: false } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error al desactivar categoría' });
  }
});

// ── Items ───────────────────────────────────────────────────────────────────

router.get('/items', paginate, async (req: Request, res: Response) => {
  try {
    const { search, categoryId } = req.query;
    const where: any = { active: true };
    if (search) {
      where.OR = [
        { sku: { contains: search as string, ...(process.env.DATABASE_URL?.includes('postgres') ? { mode: 'insensitive' as const } : {}) } },
        { name: { contains: search as string, ...(process.env.DATABASE_URL?.includes('postgres') ? { mode: 'insensitive' as const } : {}) } },
      ];
    }
    if (categoryId) where.categoryId = parseInt(categoryId as string);

    const [items, total] = await Promise.all([
      prisma.pricebookItem.findMany({
        where,
        skip: req.pagination!.skip,
        take: req.pagination!.limit,
        orderBy: { name: 'asc' },
        include: { category: { select: { id: true, name: true } } },
      }),
      prisma.pricebookItem.count({ where }),
    ]);
    res.json(paginatedResponse(items, total, req.pagination!.page, req.pagination!.limit));
  } catch {
    res.status(500).json({ error: 'Error al listar artículos' });
  }
});

router.get('/items/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const item = await prisma.pricebookItem.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true } },
        materials: true,
      },
    });
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Error al obtener artículo' });
  }
});

router.post('/items', async (req: Request, res: Response) => {
  try {
    const data = itemSchema.parse(req.body);
    const existing = await prisma.pricebookItem.findUnique({ where: { sku: data.sku } });
    if (existing) {
      return res.status(400).json({ error: 'Ya existe un artículo con ese SKU' });
    }
    const item = await prisma.pricebookItem.create({ data });
    res.status(201).json(item);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: err.errors });
    }
    res.status(500).json({ error: 'Error al crear artículo' });
  }
});

router.put('/items/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const data = itemSchema.partial().parse(req.body);
    if (data.sku) {
      const existing = await prisma.pricebookItem.findFirst({ where: { sku: data.sku, id: { not: id } } });
      if (existing) return res.status(400).json({ error: 'Ya existe otro artículo con ese SKU' });
    }
    const item = await prisma.pricebookItem.update({ where: { id }, data });
    res.json(item);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: err.errors });
    }
    res.status(500).json({ error: 'Error al actualizar artículo' });
  }
});

router.delete('/items/:id', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    await prisma.pricebookItem.update({ where: { id }, data: { active: false } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error al desactivar artículo' });
  }
});

router.get('/items/:id/catalog-materials', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const item = await prisma.pricebookItem.findUnique({ where: { id }, select: { id: true } });
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });
    const materials = await prisma.catalogMaterial.findMany({
      where: { pricebookItemId: id },
      orderBy: { description: 'asc' },
    });
    res.json(materials);
  } catch {
    res.status(500).json({ error: 'Error al obtener materiales del catálogo' });
  }
});

export default router;
