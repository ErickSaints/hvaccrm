import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
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

router.post('/', async (req: Request, res: Response) => {
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

export default router;
