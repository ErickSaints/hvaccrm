import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

const customerSchema = z.object({
  companyName: z.string().optional(),
  contactName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(1),
  phone2: z.string().optional(),
  address: z.string().min(1),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  taxId: z.string().optional(),
  notes: z.string().optional(),
});

router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const where: any = {};
    if (search) {
      where.OR = [
        { companyName: { contains: search as string } },
        { contactName: { contains: search as string } },
        { email: { contains: search as string } },
        { phone: { contains: search as string } },
      ];
    }
    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(customers);
  } catch {
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { equipment: true, tickets: true, quotations: true },
    });
    if (!customer) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(customer);
  } catch {
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
});

router.post('/', requireRole(['ADMIN', 'SALES']), async (req: Request, res: Response) => {
  try {
    const data = customerSchema.parse(req.body);
    const customer = await prisma.customer.create({ data });
    res.status(201).json(customer);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al crear cliente' });
  }
});

router.put('/:id', requireRole(['ADMIN', 'SALES']), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const data = customerSchema.partial().parse(req.body);
    const customer = await prisma.customer.update({ where: { id }, data });
    res.json(customer);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

router.delete('/:id', requireRole(['ADMIN', 'SALES']), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    await prisma.customer.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
});

export default router;