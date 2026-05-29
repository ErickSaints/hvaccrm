import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, requireBackoffice } from '../middleware/auth';
import { paginate, paginatedResponse } from '../middleware/pagination';

const router = Router();

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  source: z.enum(['EMAIL', 'SMS', 'WEB', 'MANUAL']),
  customerId: z.number(),
  serviceOrderId: z.number().optional(),
});

router.use(authenticate);

router.get('/stats', requireBackoffice, async (_req: Request, res: Response) => {
  try {
    const [total, aggregations, distribution] = await Promise.all([
      prisma.review.count(),
      prisma.review.aggregate({ _avg: { rating: true } }),
      prisma.review.groupBy({
        by: ['rating'],
        _count: { rating: true },
      }),
    ]);

    const distributionMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const entry of distribution) {
      distributionMap[entry.rating] = entry._count.rating;
    }

    res.json({
      total,
      averageRating: aggregations._avg.rating ? Math.round(aggregations._avg.rating * 100) / 100 : 0,
      distribution: distributionMap,
    });
  } catch {
    res.status(500).json({ error: 'Error al obtener estadísticas de satisfacción' });
  }
});

router.get('/', requireBackoffice, paginate, async (req: Request, res: Response) => {
  try {
    const { rating, source, dateFrom, dateTo } = req.query;
    const andConditions: any[] = [];

    if (rating) andConditions.push({ rating: parseInt(String(rating)) });
    if (source) andConditions.push({ source });

    if (dateFrom || dateTo) {
      const dateFilter: any = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom as string);
      if (dateTo) dateFilter.lte = new Date(dateTo as string + 'T23:59:59.999Z');
      andConditions.push({ createdAt: dateFilter });
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip: req.pagination!.skip,
        take: req.pagination!.limit,
        include: {
          customer: { select: { contactName: true, companyName: true } },
          serviceOrder: { select: { number: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({ where }),
    ]);

    res.json(paginatedResponse(reviews, total, req.pagination!.page, req.pagination!.limit));
  } catch {
    res.status(500).json({ error: 'Error al obtener reseñas' });
  }
});

router.get('/:id', requireBackoffice, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, contactName: true, companyName: true, email: true, phone: true } },
        serviceOrder: { select: { id: true, number: true, status: true } },
      },
    });

    if (!review) {
      return res.status(404).json({ error: 'Reseña no encontrada' });
    }

    res.json(review);
  } catch {
    res.status(500).json({ error: 'Error al obtener reseña' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createReviewSchema.parse(req.body);

    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) {
      return res.status(400).json({ error: 'Cliente no encontrado' });
    }

    if (data.serviceOrderId) {
      const order = await prisma.serviceOrder.findUnique({ where: { id: data.serviceOrderId } });
      if (!order) {
        return res.status(400).json({ error: 'Orden de servicio no encontrada' });
      }
    }

    const review = await prisma.review.create({
      data: {
        rating: data.rating,
        comment: data.comment,
        source: data.source,
        customerId: data.customerId,
        serviceOrderId: data.serviceOrderId,
      },
      include: {
        customer: { select: { contactName: true, companyName: true } },
        serviceOrder: { select: { number: true } },
      },
    });

    res.status(201).json(review);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al crear reseña' });
  }
});

export default router;
