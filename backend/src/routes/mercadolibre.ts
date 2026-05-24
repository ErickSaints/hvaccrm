import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireSubscription } from '../middleware/auth';
import prisma from '../prisma';
import { searchProducts } from '../scraper';

const router = Router();

const searchSchema = z.object({
  q: z.string().min(1, 'El término de búsqueda es obligatorio'),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
});

router.get('/search', authenticate, requireSubscription, async (req: Request, res: Response) => {
  try {
    const { q, limit } = searchSchema.parse(req.query);

    const { results, provider } = await searchProducts(q, limit);

    if (results.length === 0) {
      return res.json({ query: q, total: 0, results: [], provider });
    }

    res.json({ query: q, total: results.length, results, provider });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    console.error('Search error:', err);
    res.status(500).json({ error: 'Error al buscar productos' });
  }
});

const quotationSchema = z.object({
  itemId: z.string().min(1),
  title: z.string().min(1),
  price: z.number().positive(),
  quantity: z.number().int().positive().default(1),
  customerId: z.number().optional(),
  thumbnail: z.string().optional(),
});

router.post('/create-quotation', authenticate, requireSubscription, async (req: Request, res: Response) => {
  try {
    const data = quotationSchema.parse(req.body);

    let customer;
    if (data.customerId) {
      customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
      if (!customer) {
        return res.status(400).json({ error: 'Cliente no encontrado' });
      }
    } else {
      customer = await prisma.customer.findFirst({ where: { email: req.user!.email } });
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            contactName: req.user!.name,
            email: req.user!.email,
            phone: req.user!.phone || 'Sin teléfono',
            address: 'Pendiente',
          },
        });
      }
    }

    const count = await prisma.quotation.count();
    const number = `COT-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;

    const quotation = await prisma.quotation.create({
      data: {
        number,
        title: `Cotización: ${data.title.substring(0, 100)}`,
        subtotal: data.price * data.quantity,
        tax: 0,
        discount: 0,
        total: data.price * data.quantity,
        status: 'BORRADOR',
        customerId: customer.id,
        createdById: req.user!.id,
        items: {
          create: [
            {
              description: data.title,
              quantity: data.quantity,
              unitPrice: data.price,
              total: data.price * data.quantity,
            },
          ],
        },
      },
      include: { items: true, customer: true },
    });

    res.status(201).json(quotation);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    console.error('Error creating quotation:', err);
    res.status(500).json({ error: 'Error al crear cotización' });
  }
});

export default router;