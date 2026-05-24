import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q || q.length < 2) {
      return res.json({ customers: [], tickets: [], orders: [], quotations: [], equipment: [], policies: [] });
    }

    const searchFields = { contains: q, mode: 'insensitive' as const };

    const [customers, tickets, orders, quotations, equipment, policies] = await Promise.all([
      prisma.customer.findMany({
        where: {
          OR: [
            { contactName: searchFields },
            { companyName: searchFields },
            { email: searchFields },
            { phone: searchFields },
          ],
        },
        select: { id: true, contactName: true, companyName: true, email: true, phone: true, city: true },
        take: 5,
      }),
      prisma.ticket.findMany({
        where: {
          OR: [
            { title: searchFields },
            { description: searchFields },
          ],
        },
        include: { customer: { select: { contactName: true, companyName: true } } },
        take: 5,
      }),
      prisma.serviceOrder.findMany({
        where: {
          OR: [
            { number: searchFields },
            { description: searchFields },
          ],
        },
        include: { customer: { select: { contactName: true, companyName: true } } },
        take: 5,
      }),
      prisma.quotation.findMany({
        where: {
          OR: [
            { number: searchFields },
            { title: searchFields },
          ],
        },
        include: { customer: { select: { contactName: true, companyName: true } } },
        take: 5,
      }),
      prisma.equipment.findMany({
        where: {
          OR: [
            { type: searchFields },
            { brand: searchFields },
            { model: searchFields },
            { serialNumber: searchFields },
          ],
        },
        include: { customer: { select: { contactName: true, companyName: true } } },
        take: 5,
      }),
      prisma.maintenancePolicy.findMany({
        where: {
          OR: [
            { name: searchFields },
            { number: searchFields },
          ],
        },
        include: { customer: { select: { contactName: true, companyName: true } } },
        take: 5,
      }),
    ]);

    res.json({ customers, tickets, orders, quotations, equipment, policies });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Error al buscar' });
  }
});

export default router;
