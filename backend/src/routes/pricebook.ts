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

// ── Price Breakdown (Análisis de Precio Unitario) ────────────────────────────

const breakdownMaterialSchema = z.object({
  description: z.string().min(1),
  unit: z.string().default('pza'),
  quantity: z.number().positive(),
  unitCost: z.number().positive(),
  wastePct: z.number().min(0).default(0),
  total: z.number(),
});

const breakdownLaborSchema = z.object({
  category: z.string().min(1),
  workers: z.number().int().positive().default(1),
  dailyWage: z.number().positive(),
  fsrFactor: z.number().default(1.0),
  realDailyWage: z.number(),
  total: z.number(),
});

const breakdownEquipmentSchema = z.object({
  description: z.string().min(1),
  unit: z.string().default('hr'),
  quantity: z.number().positive().default(1),
  hourlyCost: z.number().positive(),
  hoursPerDay: z.number().positive().default(8),
  total: z.number(),
});

const breakdownFsrConfigSchema = z.object({
  year: z.number().default(2025),
  daysOff: z.number().default(78),
  holidays: z.number().default(8),
  vacationDays: z.number().default(12),
  aguinaldoDays: z.number().default(15),
  primaVacacionalPct: z.number().default(25),
  imssPct: z.number().default(5.0),
  infonavitPct: z.number().default(0.0),
  otherPct: z.number().default(0.0),
});

const breakdownSchema = z.object({
  fsrEnabled: z.boolean().default(true),
  fsrConfig: breakdownFsrConfigSchema.default({}),
  rendimiento: z.number().positive().default(1.0),
  rendimientoUnit: z.string().default('pza/jor'),
  indirectPct: z.number().min(0).max(100).default(27.48),
  financingPct: z.number().min(0).max(100).default(2.0),
  profitPct: z.number().min(0).max(100).default(10.0),
  additionalPct: z.number().min(0).max(100).default(0.0),
  toolPct: z.number().min(0).max(100).default(3.0),
  materials: z.array(breakdownMaterialSchema).default([]),
  labor: z.array(breakdownLaborSchema).default([]),
  equipment: z.array(breakdownEquipmentSchema).default([]),
});

function calcTotals(breakdown: any, materials: any[], labor: any[], equipment: any[]) {
  const totalMaterials = materials.reduce((s: number, m: any) => s + m.total, 0);
  const totalLabor = labor.reduce((s: number, l: any) => s + l.total, 0);
  const toolCost = (totalLabor + equipment.reduce((s: number, e: any) => s + e.total, 0)) * (breakdown.toolPct / 100);
  const totalEquipment = equipment.reduce((s: number, e: any) => s + e.total, 0);
  const directCost = totalMaterials + totalLabor + toolCost + totalEquipment;
  const indirectCost = directCost * (breakdown.indirectPct / 100);
  const financingCost = (directCost + indirectCost) * (breakdown.financingPct / 100);
  const profit = (directCost + indirectCost + financingCost) * (breakdown.profitPct / 100);
  const additionalCost = directCost * (breakdown.additionalPct / 100);
  const unitPrice = directCost + indirectCost + financingCost + profit + additionalCost;
  return { totalMaterials, totalLabor, toolCost, totalEquipment, directCost, indirectCost, financingCost, profit, additionalCost, unitPrice };
}

router.get('/items/:id/breakdown', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const item = await prisma.pricebookItem.findUnique({ where: { id }, select: { id: true } });
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });

    const breakdown = await prisma.pricebookBreakdown.findUnique({
      where: { itemId: id },
    });

    if (!breakdown) {
      return res.json({
        itemId: id,
        exists: false,
        fsrEnabled: true,
        fsrConfig: { year: 2025, daysOff: 78, holidays: 8, vacationDays: 12, aguinaldoDays: 15, primaVacacionalPct: 25, imssPct: 5, infonavitPct: 0, otherPct: 0 },
        rendimiento: 1.0,
        rendimientoUnit: 'pza/jor',
        indirectPct: 27.48, financingPct: 2, profitPct: 10, additionalPct: 0, toolPct: 3,
        materials: [], labor: [], equipment: [],
        totals: { directCost: 0, totalMaterials: 0, totalLabor: 0, toolCost: 0, totalEquipment: 0, indirectCost: 0, financingCost: 0, profit: 0, additionalCost: 0, unitPrice: 0 },
      });
    }

    const materials = (breakdown.materials as any[]) || [];
    const labor = (breakdown.labor as any[]) || [];
    const equipment = (breakdown.equipment as any[]) || [];
    const fsrConfig = parseFsrConfig(breakdown.fsrConfig);

    const totals = calcTotals(breakdown, materials, labor, equipment);

    res.json({
      itemId: id,
      exists: true,
      fsrEnabled: breakdown.fsrEnabled,
      fsrConfig,
      rendimiento: breakdown.rendimiento,
      rendimientoUnit: breakdown.rendimientoUnit,
      indirectPct: breakdown.indirectPct,
      financingPct: breakdown.financingPct,
      profitPct: breakdown.profitPct,
      additionalPct: breakdown.additionalPct,
      toolPct: breakdown.toolPct,
      materials,
      labor,
      equipment,
      totals,
    });
  } catch {
    res.status(500).json({ error: 'Error al obtener desglose de precios' });
  }
});

function parseFsrConfig(val: any): any {
  if (!val) return { year: 2025, daysOff: 78, holidays: 8, vacationDays: 12, aguinaldoDays: 15, primaVacacionalPct: 25, imssPct: 5, infonavitPct: 0, otherPct: 0 };
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return {}; } }
  return val;
}

router.put('/items/:id/breakdown', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const data = breakdownSchema.parse(req.body);

    const item = await prisma.pricebookItem.findUnique({ where: { id }, select: { id: true } });
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });

    // Normalize materials with waste
    const materials = data.materials.map(m => ({
      description: m.description,
      unit: m.unit || 'pza',
      quantity: m.quantity,
      unitCost: m.unitCost,
      wastePct: m.wastePct || 0,
      total: m.total || m.quantity * m.unitCost * (1 + (m.wastePct || 0) / 100),
    }));

    // Normalize labor with FSR
    const labor = data.labor.map(l => ({
      category: l.category,
      workers: l.workers,
      dailyWage: l.dailyWage,
      fsrFactor: l.fsrFactor || 1.0,
      realDailyWage: l.realDailyWage || l.dailyWage * (l.fsrFactor || 1.0),
      total: l.total || l.workers * (l.realDailyWage || l.dailyWage * (l.fsrFactor || 1.0)),
    }));

    // Normalize equipment with hourly rate
    const equipment = data.equipment.map(e => ({
      description: e.description,
      unit: e.unit || 'hr',
      quantity: e.quantity || 1,
      hourlyCost: e.hourlyCost,
      hoursPerDay: e.hoursPerDay || 8,
      total: e.total || e.quantity * e.hourlyCost * (e.hoursPerDay || 8),
    }));

    const fsrConfigStr = typeof data.fsrConfig === 'string' ? data.fsrConfig : JSON.stringify(data.fsrConfig);

    const breakdown = await prisma.pricebookBreakdown.upsert({
      where: { itemId: id },
      update: {
        fsrEnabled: data.fsrEnabled,
        fsrConfig: fsrConfigStr,
        rendimiento: data.rendimiento,
        rendimientoUnit: data.rendimientoUnit,
        indirectPct: data.indirectPct,
        financingPct: data.financingPct,
        profitPct: data.profitPct,
        additionalPct: data.additionalPct,
        toolPct: data.toolPct,
        materials: materials as any,
        labor: labor as any,
        equipment: equipment as any,
      },
      create: {
        itemId: id,
        fsrEnabled: data.fsrEnabled,
        fsrConfig: fsrConfigStr,
        rendimiento: data.rendimiento,
        rendimientoUnit: data.rendimientoUnit,
        indirectPct: data.indirectPct,
        financingPct: data.financingPct,
        profitPct: data.profitPct,
        additionalPct: data.additionalPct,
        toolPct: data.toolPct,
        materials: materials as any,
        labor: labor as any,
        equipment: equipment as any,
      },
    });

    const totals = calcTotals(breakdown, materials, labor, equipment);

    res.json({
      itemId: id,
      exists: true,
      fsrEnabled: breakdown.fsrEnabled,
      fsrConfig: parseFsrConfig(breakdown.fsrConfig),
      rendimiento: breakdown.rendimiento,
      rendimientoUnit: breakdown.rendimientoUnit,
      indirectPct: breakdown.indirectPct,
      financingPct: breakdown.financingPct,
      profitPct: breakdown.profitPct,
      additionalPct: breakdown.additionalPct,
      toolPct: breakdown.toolPct,
      materials, labor, equipment,
      totals,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: err.errors });
    }
    res.status(500).json({ error: 'Error al guardar desglose de precios' });
  }
});

export default router;
