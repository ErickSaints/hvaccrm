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

router.get('/items/all', async (_req: Request, res: Response) => {
  try {
    const items = await prisma.pricebookItem.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: { id: true, sku: true, name: true, description: true, unit: true, goodPrice: true, betterPrice: true, bestPrice: true, costPrice: true, category: { select: { id: true, name: true } } },
    });
    res.json(items);
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

// ── Import catalog from JSON on server ───────────────────────────────────────

router.post('/run-import', async (_req: Request, res: Response) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const jsonPath = path.join(__dirname, '..', '..', 'public', 'catalog_import.json');

    if (!fs.existsSync(jsonPath)) {
      return res.status(404).json({ error: 'Archivo catalog_import.json no encontrado en backend/public/' });
    }

    const raw = fs.readFileSync(jsonPath, 'utf-8');
    const items: any[] = JSON.parse(raw);
    let created = 0;
    let skipped = 0;

    for (const item of items) {
      let category = await prisma.pricebookCategory.findFirst({
        where: { name: item.category, active: true },
      });
      if (!category) {
        category = await prisma.pricebookCategory.create({
          data: { name: item.category, sortOrder: 0 },
        });
      }

      const existing = await prisma.pricebookItem.findFirst({
        where: { name: item.name, categoryId: category.id, active: true },
      });
      if (existing) {
        skipped++;
        continue;
      }

      const sku = `${item.category.substring(0, 3).toUpperCase()}-${Date.now()}-${created}`;

      await prisma.pricebookItem.create({
        data: {
          sku,
          name: item.name,
          description: item.description || '',
          unit: item.unit || 'pza',
          goodPrice: item.goodPrice,
          betterPrice: item.betterPrice,
          bestPrice: item.bestPrice,
          costPrice: item.costPrice,
          categoryId: category.id,
        },
      });
      created++;
    }

    res.json({ created, skipped, total: items.length });
  } catch (err) {
    console.error('Error al importar catálogo:', err);
    res.status(500).json({ error: 'Error al importar catálogo' });
  }
});

// ── Regions & States ─────────────────────────────────────────────────────────

router.get('/regions', async (_req: Request, res: Response) => {
  try {
    const regions = await prisma.region.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { states: true } } },
    });
    res.json(regions);
  } catch {
    res.status(500).json({ error: 'Error al obtener regiones' });
  }
});

router.get('/states', async (req: Request, res: Response) => {
  try {
    const { regionId } = req.query;
    const where: any = {};
    if (regionId) where.regionId = parseInt(regionId as string);
    const states = await prisma.state.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { region: { select: { id: true, code: true, name: true, adjustmentFactor: true } } },
    });
    res.json(states);
  } catch {
    res.status(500).json({ error: 'Error al obtener estados' });
  }
});

// ── Regional Pricing ─────────────────────────────────────────────────────────

function applyFactor(price: number | null | undefined, factor: number): number | null {
  if (price == null) return null;
  return Math.round(price * (1 + factor) * 100) / 100;
}

router.get('/items/:id/regional-price', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const stateCode = (req.query.stateCode as string) || 'CDMX';

    const [item, state] = await Promise.all([
      prisma.pricebookItem.findUnique({ where: { id }, select: { id: true, goodPrice: true, betterPrice: true, bestPrice: true, costPrice: true } }),
      prisma.state.findUnique({ where: { code: stateCode }, include: { region: true } }),
    ]);

    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });
    if (!state) return res.status(404).json({ error: 'Estado no encontrado' });

    const override = await prisma.pricebookRegionPrice.findUnique({
      where: { itemId_stateId: { itemId: id, stateId: state.id } },
    });

    if (override) {
      return res.json({
        itemId: id,
        stateCode: state.code,
        stateName: state.name,
        regionCode: state.region.code,
        regionName: state.region.name,
        adjustmentFactor: override.adjustmentFactor ?? state.region.adjustmentFactor,
        goodPrice: override.goodPrice ?? applyFactor(item.goodPrice, override.adjustmentFactor ?? state.region.adjustmentFactor),
        betterPrice: override.betterPrice ?? applyFactor(item.betterPrice, override.adjustmentFactor ?? state.region.adjustmentFactor),
        bestPrice: override.bestPrice ?? applyFactor(item.bestPrice, override.adjustmentFactor ?? state.region.adjustmentFactor),
        costPrice: override.costPrice ?? applyFactor(item.costPrice, override.adjustmentFactor ?? state.region.adjustmentFactor),
        isOverridden: true,
        updatedAt: override.updatedAt,
      });
    }

    const factor = state.region.adjustmentFactor;
    res.json({
      itemId: id,
      stateCode: state.code,
      stateName: state.name,
      regionCode: state.region.code,
      regionName: state.region.name,
      adjustmentFactor: factor,
      goodPrice: applyFactor(item.goodPrice, factor),
      betterPrice: applyFactor(item.betterPrice, factor),
      bestPrice: applyFactor(item.bestPrice, factor),
      costPrice: applyFactor(item.costPrice, factor),
      isOverridden: false,
    });
  } catch {
    res.status(500).json({ error: 'Error al calcular precio regional' });
  }
});

router.get('/items/:id/regional-prices', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const item = await prisma.pricebookItem.findUnique({
      where: { id },
      select: { id: true, goodPrice: true, betterPrice: true, bestPrice: true, costPrice: true },
    });
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });

    const states = await prisma.state.findMany({
      orderBy: { name: 'asc' },
      include: { region: { select: { code: true, name: true, adjustmentFactor: true } } },
    });

    const overrides = await prisma.pricebookRegionPrice.findMany({
      where: { itemId: id },
    });
    const overrideMap = new Map(overrides.map(o => [o.stateId, o]));

    const prices = states.map(state => {
      const override = overrideMap.get(state.id);
      const factor = override?.adjustmentFactor ?? state.region.adjustmentFactor;
      return {
        stateCode: state.code,
        stateName: state.name,
        regionCode: state.region.code,
        regionName: state.region.name,
        adjustmentFactor: factor,
        goodPrice: override?.goodPrice ?? applyFactor(item.goodPrice, factor),
        betterPrice: override?.betterPrice ?? applyFactor(item.betterPrice, factor),
        bestPrice: override?.bestPrice ?? applyFactor(item.bestPrice, factor),
        costPrice: override?.costPrice ?? applyFactor(item.costPrice, factor),
        isOverridden: !!override,
      };
    });

    res.json(prices);
  } catch {
    res.status(500).json({ error: 'Error al obtener precios regionales' });
  }
});

const regionalPriceSchema = z.object({
  stateCode: z.string().min(1),
  goodPrice: z.number().nullable().optional(),
  betterPrice: z.number().nullable().optional(),
  bestPrice: z.number().nullable().optional(),
  costPrice: z.number().nullable().optional(),
  adjustmentFactor: z.number().nullable().optional(),
});

router.put('/items/:id/regional-price', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const data = regionalPriceSchema.parse(req.body);
    const userId = (req as any).user?.id;

    const item = await prisma.pricebookItem.findUnique({ where: { id }, select: { id: true } });
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });

    const state = await prisma.state.findUnique({ where: { code: data.stateCode } });
    if (!state) return res.status(404).json({ error: 'Estado no encontrado' });

    const updatable: any = { updatedById: userId };
    if (data.goodPrice !== undefined) updatable.goodPrice = data.goodPrice;
    if (data.betterPrice !== undefined) updatable.betterPrice = data.betterPrice;
    if (data.bestPrice !== undefined) updatable.bestPrice = data.bestPrice;
    if (data.costPrice !== undefined) updatable.costPrice = data.costPrice;
    if (data.adjustmentFactor !== undefined) updatable.adjustmentFactor = data.adjustmentFactor;

    const creatable: any = {
      itemId: id,
      stateId: state.id,
      ...updatable,
    };

    const override = await prisma.pricebookRegionPrice.upsert({
      where: { itemId_stateId: { itemId: id, stateId: state.id } },
      update: updatable,
      create: creatable,
    });

    res.json(override);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: err.errors });
    }
    res.status(500).json({ error: 'Error al guardar precio regional' });
  }
});

router.delete('/items/:id/regional-price/:stateCode', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const stateCode = req.params.stateCode as string;

    const state = await prisma.state.findUnique({ where: { code: stateCode } });
    if (!state) return res.status(404).json({ error: 'Estado no encontrado' });

    await prisma.pricebookRegionPrice.deleteMany({
      where: { itemId: id, stateId: state.id },
    });

    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error al eliminar precio regional' });
  }
});

export default router;
