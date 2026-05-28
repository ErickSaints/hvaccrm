import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import { requireSubscription } from '../middleware/auth';
import { paginate, paginatedResponse } from '../middleware/pagination';
import { notifyQuotationStatusChange } from '../notifications/notifier';
import { emitToBackoffice } from '../websocket';
import { generateQuotationPdf } from '../services/pdfGenerator';

const router = Router();

const quotationItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  total: z.number().min(0),
});

const quotationSchema = z.object({
  title: z.string().optional(),
  customerId: z.number(),
  items: z.array(quotationItemSchema).min(1),
  tax: z.number().optional(),
  discount: z.number().optional(),
  validUntil: z.string().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

const statusSchema = z.object({
  status: z.enum(['BORRADOR', 'ENVIADA', 'APROBADA', 'RECHAZADA', 'VENCIDA']),
});

async function generateQuotationNumber(): Promise<string> {
  const now = new Date();
  const prefix = `COT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-`;
  const last = await prisma.quotation.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: 'desc' },
  });
  let next = 1;
  if (last) {
    const parts = last.number.split('-');
    next = parseInt(parts[2]) + 1;
  }
  return `${prefix}${String(next).padStart(4, '0')}`;
}

router.use(authenticate);

router.get('/', requirePermission('quotations:view'), paginate, async (req: Request, res: Response) => {
  try {
    const { status, search, dateFrom, dateTo } = req.query;
    const andConditions: any[] = [];

    if (req.user!.role === 'CLIENT') {
      const userCustomers = await prisma.customer.findMany({ where: { email: req.user!.email }, select: { id: true } });
      andConditions.push({ customerId: { in: userCustomers.map(c => c.id) } });
    }

    if (search) {
      andConditions.push({
        OR: [
          { number: { contains: search as string } },
          { title: { contains: search as string } },
          { customer: { contactName: { contains: search as string } } },
          { customer: { companyName: { contains: search as string } } },
        ],
      });
    }

    if (status) andConditions.push({ status });
    if (dateFrom || dateTo) {
      const dateFilter: any = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom as string);
      if (dateTo) dateFilter.lte = new Date(dateTo as string + 'T23:59:59.999Z');
      andConditions.push({ createdAt: dateFilter });
    }

    const where: any = andConditions.length > 0 ? { AND: andConditions } : {};

    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        skip: req.pagination!.skip,
        take: req.pagination!.limit,
        include: { customer: true, createdBy: true, items: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.quotation.count({ where }),
    ]);
    if (req.user!.role === 'TECHNICIAN') {
      const sanitized = quotations.map(({ subtotal, tax, discount, total, items, ...rest }) => ({
        ...rest,
        subtotal: 0, tax: 0, discount: 0, total: 0,
        items: items.map(({ unitPrice, total: it, ...ir }: any) => ({ ...ir, unitPrice: 0, total: 0 })),
      }));
      return res.json(paginatedResponse(sanitized, total, req.pagination!.page, req.pagination!.limit));
    }
    res.json(paginatedResponse(quotations, total, req.pagination!.page, req.pagination!.limit));
  } catch {
    res.status(500).json({ error: 'Error al obtener cotizaciones' });
  }
});

router.get('/:id', requirePermission('quotations:view'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { customer: true, createdBy: true, items: true },
    });
    if (!quotation) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }
    if (req.user!.role === 'CLIENT' && quotation.createdById !== req.user!.id) {
      return res.status(403).json({ error: 'No tienes permiso para ver esta cotización' });
    }
    if (req.user!.role === 'TECHNICIAN') {
      const { subtotal, tax, discount, total, items, ...rest } = quotation;
      return res.json({
        ...rest,
        subtotal: 0, tax: 0, discount: 0, total: 0,
        items: items.map(({ unitPrice, total: itemTotal, ...itemRest }: any) => ({
          ...itemRest, unitPrice: 0, total: 0,
        })),
      });
    }
    res.json(quotation);
  } catch {
    res.status(500).json({ error: 'Error al obtener cotización' });
  }
});

router.post('/', requirePermission('quotations:create'), requireSubscription, async (req: Request, res: Response) => {
  try {
    const data = quotationSchema.parse(req.body);
    const number = await generateQuotationNumber();

    const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
    const tax = data.tax ?? 0;
    const discount = data.discount ?? 0;
    const total = subtotal + tax - discount;

    const quotation = await prisma.quotation.create({
      data: {
        number,
        title: data.title,
        customerId: data.customerId,
        createdById: req.user!.id,
        subtotal,
        tax,
        discount,
        total,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
        notes: data.notes,
        terms: data.terms,
        items: {
          create: data.items,
        },
      },
      include: { items: true, customer: true },
    });
    res.status(201).json(quotation);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al crear cotización' });
  }
});

router.put('/:id', requirePermission('quotations:edit'), requireSubscription, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const data = quotationSchema.partial().parse(req.body);

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.terms !== undefined) updateData.terms = data.terms;
    if (data.validUntil !== undefined) updateData.validUntil = new Date(data.validUntil);
    if (data.tax !== undefined) updateData.tax = data.tax;
    if (data.discount !== undefined) updateData.discount = data.discount;

    if (data.items) {
      const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
      const tax = data.tax ?? 0;
      const discount = data.discount ?? 0;
      updateData.subtotal = subtotal;
      updateData.total = subtotal + tax - discount;

      await prisma.quotationItem.deleteMany({ where: { quotationId: id } });
      await prisma.quotation.update({
        where: { id },
        data: {
          ...updateData,
          items: { create: data.items },
        },
      });
    } else {
      await prisma.quotation.update({ where: { id }, data: updateData });
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { items: true, customer: true },
    });
    res.json(quotation);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al actualizar cotización' });
  }
});

router.put('/:id/status', requirePermission('quotations:edit'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const { status } = statusSchema.parse(req.body);
    const old = await prisma.quotation.findUnique({
      where: { id },
      include: { customer: { select: { contactName: true, email: true, phone: true } } },
    });
    if (!old) return res.status(404).json({ error: 'Cotización no encontrada' });
    const quotation = await prisma.quotation.update({
      where: { id },
      data: { status },
    });
    notifyQuotationStatusChange({
      quotationId: id,
      quotationNumber: old.number,
      quotationTitle: quotation.title || 'Cotización',
      customerId: old.customerId,
      customerEmail: old.customer.email,
      customerPhone: old.customer.phone,
      customerName: old.customer.contactName,
      newStatus: status,
    }).catch((err) => console.error('[quotations] notify error:', err));
    emitToBackoffice('quotation:status_change', { quotationId: id, newStatus: status });
    res.json(quotation);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

router.delete('/:id', requirePermission('quotations:delete'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    await prisma.quotationItem.deleteMany({ where: { quotationId: id } });
    await prisma.quotation.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error al eliminar cotización' });
  }
});

router.get('/:id/pdf', requirePermission('quotations:view'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { customer: true, items: true },
    });
    if (!quotation) return res.status(404).json({ error: 'Cotización no encontrada' });
    generateQuotationPdf(res, {
      number: quotation.number,
      title: quotation.title,
      subtotal: quotation.subtotal,
      tax: quotation.tax,
      discount: quotation.discount,
      total: quotation.total,
      validUntil: quotation.validUntil,
      notes: quotation.notes,
      terms: quotation.terms,
      customer: {
        companyName: quotation.customer.companyName,
        contactName: quotation.customer.contactName,
        email: quotation.customer.email,
        phone: quotation.customer.phone,
        address: quotation.customer.address,
      },
      items: quotation.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
    });
  } catch {
    res.status(500).json({ error: 'Error al generar PDF' });
  }
});

export default router;
