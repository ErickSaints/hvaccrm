import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, requireBackoffice } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import { paginate, paginatedResponse } from '../middleware/pagination';

const router = Router();

const createCampaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['EMAIL', 'SMS', 'BOTH']).default('EMAIL'),
  subject: z.string().optional(),
  content: z.string().optional(),
  audienceFilter: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
});

const updateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(['EMAIL', 'SMS', 'BOTH']).optional(),
  subject: z.string().optional(),
  content: z.string().optional(),
  audienceFilter: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
});

router.use(authenticate);
router.use(requireBackoffice);

router.get('/', requirePermission('campaigns:view'), paginate, async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const where: any = {};
    if (search) {
      where.name = { contains: search as string };
    }
    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip: req.pagination!.skip,
        take: req.pagination!.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { name: true } },
        },
      }),
      prisma.campaign.count({ where }),
    ]);
    res.json(paginatedResponse(campaigns, total, req.pagination!.page, req.pagination!.limit));
  } catch {
    res.status(500).json({ error: 'Error al obtener campañas' });
  }
});

router.get('/:id', requirePermission('campaigns:view'), paginate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const { page = '1', limit = '50' } = req.query;
    const recipientPage = Math.max(1, parseInt(String(page), 10) || 1);
    const recipientLimit = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 50));
    const recipientSkip = (recipientPage - 1) * recipientLimit;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true, email: true } },
        _count: { select: { recipients: true } },
      },
    });
    if (!campaign) return res.status(404).json({ error: 'Campaña no encontrada' });

    const [recipients, recipientsTotal] = await Promise.all([
      prisma.campaignRecipient.findMany({
        where: { campaignId: id },
        skip: recipientSkip,
        take: recipientLimit,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { id: true, contactName: true, companyName: true, email: true, phone: true } } },
      }),
      prisma.campaignRecipient.count({ where: { campaignId: id } }),
    ]);

    res.json({
      ...campaign,
      recipients: paginatedResponse(recipients, recipientsTotal, recipientPage, recipientLimit),
    });
  } catch {
    res.status(500).json({ error: 'Error al obtener campaña' });
  }
});

router.post('/', requirePermission('campaigns:create'), async (req: Request, res: Response) => {
  try {
    const data = createCampaignSchema.parse(req.body);
    const campaign = await prisma.campaign.create({
      data: {
        name: data.name,
        description: data.description || null,
        type: data.type,
        subject: data.subject || null,
        content: data.content || null,
        audienceFilter: data.audienceFilter || null,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        createdById: req.user!.id,
      },
      include: { createdBy: { select: { name: true } } },
    });
    res.status(201).json(campaign);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Error al crear campaña' });
  }
});

router.put('/:id', requirePermission('campaigns:edit'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const data = updateCampaignSchema.parse(req.body);

    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Campaña no encontrada' });

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.audienceFilter !== undefined) updateData.audienceFilter = data.audienceFilter;
    if (data.scheduledAt !== undefined) updateData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;

    const campaign = await prisma.campaign.update({
      where: { id },
      data: updateData,
      include: { createdBy: { select: { name: true } } },
    });
    res.json(campaign);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Error al actualizar campaña' });
  }
});

router.delete('/:id', requirePermission('campaigns:delete'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Campaña no encontrada' });

    await prisma.campaignRecipient.deleteMany({ where: { campaignId: id } });
    await prisma.campaign.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error al eliminar campaña' });
  }
});

router.post('/:id/send', requirePermission('campaigns:send'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) return res.status(404).json({ error: 'Campaña no encontrada' });
    if (campaign.status !== 'BORRADOR') {
      return res.status(400).json({ error: 'Solo se pueden enviar campañas en estado BORRADOR' });
    }

    let filter: Record<string, any> = {};
    if (campaign.audienceFilter) {
      try { filter = JSON.parse(campaign.audienceFilter); } catch { /* empty */ }
    }

    const customers = await prisma.customer.findMany({
      where: filter.allCustomers ? {} : {},
      select: { id: true, contactName: true, email: true, phone: true },
    });

    const now = new Date();
    const recipientData = customers.map((c) => ({
      campaignId: id,
      customerId: c.id,
      name: c.contactName,
      email: c.email || null,
      phone: c.phone || null,
      sent: true,
      sentAt: now,
    }));

    if (recipientData.length > 0) {
      await prisma.campaignRecipient.createMany({ data: recipientData });
    }

    const campaignRecipientsCount = await prisma.campaignRecipient.count({ where: { campaignId: id } });

    await prisma.campaign.update({
      where: { id },
      data: {
        status: 'ACTIVA',
        sentAt: now,
        sentCount: campaignRecipientsCount,
      },
    });

    res.json({ message: 'Campaña enviada correctamente', recipientsCreated: recipientData.length });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Error al enviar campaña' });
  }
});

router.get('/:id/stats', requirePermission('campaigns:view'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) return res.status(404).json({ error: 'Campaña no encontrada' });

    const total = await prisma.campaignRecipient.count({ where: { campaignId: id } });
    const sent = await prisma.campaignRecipient.count({ where: { campaignId: id, sent: true } });
    const opened = await prisma.campaignRecipient.count({ where: { campaignId: id, opened: true } });
    const clicked = await prisma.campaignRecipient.count({ where: { campaignId: id, clicked: true } });
    const converted = await prisma.campaignRecipient.count({ where: { campaignId: id, converted: true } });

    res.json({
      total,
      sent,
      opened,
      clicked,
      converted,
      rates: {
        sentRate: total > 0 ? Math.round((sent / total) * 10000) / 100 : 0,
        openRate: sent > 0 ? Math.round((opened / sent) * 10000) / 100 : 0,
        clickRate: sent > 0 ? Math.round((clicked / sent) * 10000) / 100 : 0,
        conversionRate: sent > 0 ? Math.round((converted / sent) * 10000) / 100 : 0,
      },
    });
  } catch {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

export default router;
