import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('catalog:view'), async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const where: any = {};
    if (search) {
      where.description = { contains: search as string, mode: 'insensitive' };
    }
    const materials = await prisma.catalogMaterial.findMany({
      where,
      orderBy: { description: 'asc' },
      take: 50,
    });
    res.json(materials);
  } catch {
    res.status(500).json({ error: 'Error al obtener catálogo de materiales' });
  }
});

router.post('/', requirePermission('catalog:create'), async (req: Request, res: Response) => {
  try {
    const { description, category, unit } = req.body;
    if (!description) return res.status(400).json({ error: 'Descripción requerida' });
    const material = await prisma.catalogMaterial.create({
      data: { description, category: category || 'Otros', unit: unit || 'pza' },
    });
    res.status(201).json(material);
  } catch {
    res.status(500).json({ error: 'Error al crear material' });
  }
});

router.put('/:id', requirePermission('catalog:edit'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const { description, category, unit } = req.body;
    const data: any = {};
    if (description !== undefined) data.description = description;
    if (category !== undefined) data.category = category;
    if (unit !== undefined) data.unit = unit;
    const material = await prisma.catalogMaterial.update({ where: { id }, data });
    res.json(material);
  } catch {
    res.status(500).json({ error: 'Error al actualizar material' });
  }
});

router.delete('/:id', requirePermission('catalog:delete'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    await prisma.catalogMaterial.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error al eliminar material' });
  }
});

export default router;
