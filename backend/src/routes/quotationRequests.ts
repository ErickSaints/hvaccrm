import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import { scopeToCustomer } from '../middleware/scopeToCustomer';

const router = Router();

const createSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().min(1, 'La descripción es obligatoria'),
});

router.use(authenticate);

router.get('/', requirePermission('quotation-requests:view'), scopeToCustomer, async (req: Request, res: Response) => {
  try {
    const where: any = {};
    if (req.scopeFilter) {
      where.customerId = req.scopeFilter.customerId;
    }
    const requests = await prisma.quotationRequest.findMany({
      where,
      include: { customer: { select: { id: true, companyName: true, contactName: true } }, quotation: { select: { id: true, number: true, total: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch {
    res.status(500).json({ error: 'Error al obtener solicitudes' });
  }
});

router.get('/:id', requirePermission('quotation-requests:view'), scopeToCustomer, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const request = await prisma.quotationRequest.findUnique({
      where: { id },
      include: { customer: true, quotation: true },
    });
    if (!request) return res.status(404).json({ error: 'Solicitud no encontrada' });
    if (req.user!.role === 'CLIENT' && request.customerId !== req.user!.customerId) {
      return res.status(403).json({ error: 'No tienes permiso para ver esta solicitud' });
    }
    res.json(request);
  } catch {
    res.status(500).json({ error: 'Error al obtener solicitud' });
  }
});

router.post('/', requirePermission('quotation-requests:create'), async (req: Request, res: Response) => {
  try {
    const data = createSchema.parse(req.body);
    let customerId = req.user!.customerId;
    if (req.user!.role !== 'CLIENT') {
      customerId = req.body.customerId || customerId;
    }
    if (!customerId) return res.status(400).json({ error: 'No tienes un cliente asociado' });
    const request = await prisma.quotationRequest.create({
      data: {
        title: data.title,
        description: data.description,
        customerId: customerId!,
      },
    });
    res.status(201).json(request);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Error al crear solicitud' });
  }
});

router.put('/:id', requirePermission('quotation-requests:manage'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const { status, notes, quotationId } = req.body;
    const data: any = {};
    if (status) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (quotationId) data.quotationId = quotationId;
    const updated = await prisma.quotationRequest.update({
      where: { id },
      data,
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Error al actualizar solicitud' });
  }
});

export default router;
