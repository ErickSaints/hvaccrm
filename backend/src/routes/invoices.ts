import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import { paginate, paginatedResponse } from '../middleware/pagination';
import { generateInvoicePdf } from '../services/pdfGenerator';

const router = Router();

const invoiceSchema = z.object({
  title: z.string().min(1),
  subtotal: z.number().optional(),
  tax: z.number().optional(),
  discount: z.number().optional(),
  total: z.number().optional(),
  notes: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  status: z.enum(['BORRADOR', 'EMITIDA', 'PAGADA', 'CANCELADA', 'VENCIDA']).optional(),
  customerId: z.number(),
  quotationId: z.number().optional().nullable(),
  serviceOrderId: z.number().optional().nullable(),
});

function generateInvoiceNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
  return `INV-${y}${m}-${rand}`;
}

router.use(authenticate);

router.get('/', requirePermission('invoices:view'), paginate, async (req: Request, res: Response) => {
  try {
    const where: any = {};
    if (req.user!.role === 'CLIENT') {
      const userCustomers = await prisma.customer.findMany({ where: { email: req.user!.email }, select: { id: true } });
      where.customerId = { in: userCustomers.map(c => c.id) };
    }
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip: req.pagination!.skip,
        take: req.pagination!.limit,
        include: { customer: true, createdBy: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);
    res.json(paginatedResponse(invoices, total, req.pagination!.page, req.pagination!.limit));
  } catch {
    res.status(500).json({ error: 'Error al obtener facturas' });
  }
});

router.get('/:id', requirePermission('invoices:view'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { customer: true, quotation: true, serviceOrder: true, createdBy: { select: { name: true } } },
    });
    if (!invoice) return res.status(404).json({ error: 'Factura no encontrada' });
    res.json(invoice);
  } catch {
    res.status(500).json({ error: 'Error al obtener factura' });
  }
});

router.post('/', requirePermission('invoices:create'), async (req: Request, res: Response) => {
  try {
    const data = invoiceSchema.parse(req.body);
    const invoice = await prisma.invoice.create({
      data: {
        number: generateInvoiceNumber(),
        title: data.title,
        subtotal: data.subtotal || 0,
        tax: data.tax || 0,
        discount: data.discount || 0,
        total: data.total || 0,
        notes: data.notes,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        customerId: data.customerId,
        quotationId: data.quotationId,
        serviceOrderId: data.serviceOrderId,
        createdById: req.user!.id,
      },
      include: { customer: true },
    });
    res.status(201).json(invoice);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Error al crear factura' });
  }
});

router.put('/:id/status', requirePermission('invoices:edit'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const { status } = z.object({ status: z.enum(['BORRADOR', 'EMITIDA', 'PAGADA', 'CANCELADA', 'VENCIDA']) }).parse(req.body);
    const data: any = { status };
    if (status === 'PAGADA') data.paidAt = new Date();
    const invoice = await prisma.invoice.update({ where: { id }, data });
    res.json(invoice);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Error al actualizar factura' });
  }
});

router.post('/generate-from-quotation/:quotationId', requirePermission('invoices:create'), async (req: Request, res: Response) => {
  try {
    const quotationId = parseInt(String(req.params.quotationId));
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { customer: true },
    });
    if (!quotation) return res.status(404).json({ error: 'Cotización no encontrada' });

    const invoice = await prisma.invoice.create({
      data: {
        number: generateInvoiceNumber(),
        title: `Factura - ${quotation.title || quotation.number}`,
        subtotal: quotation.subtotal,
        tax: quotation.tax,
        discount: quotation.discount,
        total: quotation.total,
        customerId: quotation.customerId,
        quotationId: quotation.id,
        createdById: req.user!.id,
      },
      include: { customer: true },
    });
    res.status(201).json(invoice);
  } catch {
    res.status(500).json({ error: 'Error al generar factura' });
  }
});

router.post('/generate-from-order/:orderId', requirePermission('invoices:create'), async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(String(req.params.orderId));
    const order = await prisma.serviceOrder.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    const invoice = await prisma.invoice.create({
      data: {
        number: generateInvoiceNumber(),
        title: `Factura - ${order.number}`,
        subtotal: order.totalCost,
        tax: 0,
        discount: 0,
        total: order.totalCost,
        customerId: order.customerId,
        serviceOrderId: order.id,
        createdById: req.user!.id,
      },
      include: { customer: true },
    });
    res.status(201).json(invoice);
  } catch {
    res.status(500).json({ error: 'Error al generar factura' });
  }
});

router.get('/:id/pdf', requirePermission('invoices:view'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { customer: true, createdBy: { select: { name: true } } },
    });
    if (!invoice) return res.status(404).json({ error: 'Factura no encontrada' });
    generateInvoicePdf(res, {
      number: invoice.number,
      title: invoice.title,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      discount: invoice.discount,
      total: invoice.total,
      status: invoice.status,
      dueDate: invoice.dueDate,
      paidAt: invoice.paidAt,
      notes: invoice.notes,
      customer: {
        companyName: invoice.customer.companyName,
        contactName: invoice.customer.contactName,
        email: invoice.customer.email,
        phone: invoice.customer.phone,
        address: invoice.customer.address,
        taxId: invoice.customer.taxId,
      },
      createdBy: invoice.createdBy,
    });
  } catch {
    res.status(500).json({ error: 'Error al generar PDF' });
  }
});

export default router;
