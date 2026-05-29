import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, requireBackoffice } from '../middleware/auth';
import { paginate, paginatedResponse } from '../middleware/pagination';

const router = Router();

function generatePONumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PO-${y}${m}-${rand}`;
}

const vendorSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

const purchaseOrderItemSchema = z.object({
  description: z.string().min(1, 'La descripción es obligatoria'),
  quantity: z.number().positive('La cantidad debe ser positiva'),
  unitPrice: z.number().min(0, 'El precio unitario no puede ser negativo'),
  inventoryItemId: z.number().optional(),
});

const purchaseOrderSchema = z.object({
  vendorId: z.number(),
  notes: z.string().optional(),
  branchId: z.number().optional(),
  items: z.array(purchaseOrderItemSchema).min(1, 'Debe incluir al menos un artículo'),
});

const statusSchema = z.object({
  status: z.enum(['BORRADOR', 'ENVIADA', 'RECIBIDA', 'CANCELADA']),
});

router.use(authenticate);

// ─── VENDORS ───

router.get('/vendors', requireBackoffice, paginate, async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { contactName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip: req.pagination!.skip,
        take: req.pagination!.limit,
        orderBy: { name: 'asc' },
      }),
      prisma.vendor.count({ where }),
    ]);
    res.json(paginatedResponse(vendors, total, req.pagination!.page, req.pagination!.limit));
  } catch {
    res.status(500).json({ error: 'Error al listar proveedores' });
  }
});

router.post('/vendors', requireBackoffice, async (req: Request, res: Response) => {
  try {
    const data = vendorSchema.parse(req.body);
    const vendor = await prisma.vendor.create({ data });
    res.status(201).json(vendor);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: err.errors });
    }
    res.status(500).json({ error: 'Error al crear proveedor' });
  }
});

router.put('/vendors/:id', requireBackoffice, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const data = vendorSchema.partial().parse(req.body);
    const vendor = await prisma.vendor.update({ where: { id }, data });
    res.json(vendor);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: err.errors });
    }
    res.status(500).json({ error: 'Error al actualizar proveedor' });
  }
});

router.delete('/vendors/:id', requireBackoffice, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    await prisma.vendor.update({ where: { id }, data: { active: false } });
    res.json({ message: 'Proveedor desactivado correctamente' });
  } catch {
    res.status(500).json({ error: 'Error al desactivar proveedor' });
  }
});

// ─── PURCHASE ORDERS ───

router.get('/purchase-orders', requireBackoffice, paginate, async (req: Request, res: Response) => {
  try {
    const { status, dateFrom, dateTo, vendorId } = req.query;
    const andConditions: any[] = [];
    if (status) andConditions.push({ status });
    if (vendorId) andConditions.push({ vendorId: parseInt(vendorId as string) });
    if (dateFrom || dateTo) {
      const dateFilter: any = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom as string);
      if (dateTo) dateFilter.lte = new Date(dateTo as string + 'T23:59:59.999Z');
      andConditions.push({ createdAt: dateFilter });
    }
    const where: any = andConditions.length > 0 ? { AND: andConditions } : {};
    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        skip: req.pagination!.skip,
        take: req.pagination!.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          vendor: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);
    res.json(paginatedResponse(orders, total, req.pagination!.page, req.pagination!.limit));
  } catch {
    res.status(500).json({ error: 'Error al listar órdenes de compra' });
  }
});

router.get('/purchase-orders/:id', requireBackoffice, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: true,
        createdBy: { select: { id: true, name: true, email: true } },
        branch: { select: { id: true, name: true } },
        items: true,
      },
    });
    if (!order) {
      return res.status(404).json({ error: 'Orden de compra no encontrada' });
    }
    res.json(order);
  } catch {
    res.status(500).json({ error: 'Error al obtener orden de compra' });
  }
});

router.post('/purchase-orders', requireBackoffice, async (req: Request, res: Response) => {
  try {
    const data = purchaseOrderSchema.parse(req.body);
    const vendor = await prisma.vendor.findUnique({ where: { id: data.vendorId } });
    if (!vendor || !vendor.active) {
      return res.status(400).json({ error: 'Proveedor no encontrado o inactivo' });
    }
    const number = generatePONumber();
    const items = data.items.map((item) => ({
      ...item,
      total: item.quantity * item.unitPrice,
    }));
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = 0;
    const total = subtotal + tax;
    const order = await prisma.purchaseOrder.create({
      data: {
        number,
        vendorId: data.vendorId,
        createdById: req.user!.id,
        branchId: data.branchId || null,
        notes: data.notes,
        subtotal,
        tax,
        total,
        items: { create: items },
      },
      include: { items: true, vendor: true },
    });
    res.status(201).json(order);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: err.errors });
    }
    res.status(500).json({ error: 'Error al crear orden de compra' });
  }
});

router.put('/purchase-orders/:id', requireBackoffice, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Orden de compra no encontrada' });
    }
    if (existing.status !== 'BORRADOR') {
      return res.status(400).json({ error: 'Solo se pueden modificar órdenes en borrador' });
    }
    const data = purchaseOrderSchema.partial().parse(req.body);
    const updateData: any = {};
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.branchId !== undefined) updateData.branchId = data.branchId;
    if (data.vendorId !== undefined) updateData.vendorId = data.vendorId;
    if (data.items) {
      const items = data.items.map((item) => ({
        ...item,
        total: item.quantity * item.unitPrice,
      }));
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const tax = 0;
      updateData.subtotal = subtotal;
      updateData.total = subtotal + tax;
      await prisma.purchaseOrderItem.deleteMany({ where: { orderId: id } });
      await prisma.purchaseOrder.update({
        where: { id },
        data: { ...updateData, items: { create: items } },
      });
    } else {
      await prisma.purchaseOrder.update({ where: { id }, data: updateData });
    }
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true, vendor: true },
    });
    res.json(order);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: err.errors });
    }
    res.status(500).json({ error: 'Error al actualizar orden de compra' });
  }
});

router.put('/purchase-orders/:id/status', requireBackoffice, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const { status } = statusSchema.parse(req.body);
    const existing = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Orden de compra no encontrada' });
    }
    const updateData: any = { status };
    if (status === 'ENVIADA') {
      updateData.orderedAt = new Date();
    }
    if (status === 'RECIBIDA') {
      updateData.receivedAt = new Date();
      const movements = existing.items
        .filter((item) => item.inventoryItemId)
        .map((item) => ({
          type: 'ENTRADA',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          reference: existing.number,
          notes: `Entrada por OC ${existing.number}`,
          itemId: item.inventoryItemId!,
          branchId: existing.branchId,
          performedById: req.user!.id,
          purchaseOrderId: id,
        }));
      if (movements.length > 0) {
        await prisma.$transaction([
          prisma.purchaseOrder.update({ where: { id }, data: updateData }),
          ...movements.map((m) =>
            prisma.inventoryMovement.create({ data: m })
          ),
          ...movements.map((m) =>
            prisma.inventoryItem.update({
              where: { id: m.itemId },
              data: { currentStock: { increment: m.quantity } },
            })
          ),
        ]);
        const order = await prisma.purchaseOrder.findUnique({
          where: { id },
          include: { items: true, vendor: true },
        });
        return res.json(order);
      }
    }
    const order = await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
    });
    res.json(order);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: err.errors });
    }
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

router.delete('/purchase-orders/:id', requireBackoffice, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Orden de compra no encontrada' });
    }
    if (existing.status !== 'BORRADOR') {
      return res.status(400).json({ error: 'Solo se pueden eliminar órdenes en borrador' });
    }
    await prisma.purchaseOrderItem.deleteMany({ where: { orderId: id } });
    await prisma.purchaseOrder.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error al eliminar orden de compra' });
  }
});

export default router;
