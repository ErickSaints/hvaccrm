import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, requireBackoffice } from '../middleware/auth';
import { paginate, paginatedResponse } from '../middleware/pagination';

const router = Router();

const createPlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['PERCENTAGE', 'FLAT', 'TIERED']).default('PERCENTAGE'),
  value: z.number().min(0),
  conditions: z.string().optional(),
  roleTarget: z.enum(['ADMIN', 'TECHNICIAN', 'SALES', 'CLIENT', 'PROYECTOS', 'COMPRAS']).optional(),
  rules: z.array(z.object({
    criteria: z.string().min(1),
    bonusValue: z.number().min(0),
    bonusType: z.enum(['PERCENTAGE', 'FLAT']).default('PERCENTAGE'),
  })).optional().default([]),
});

const updatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(['PERCENTAGE', 'FLAT', 'TIERED']).optional(),
  value: z.number().min(0).optional(),
  conditions: z.string().optional(),
  roleTarget: z.enum(['ADMIN', 'TECHNICIAN', 'SALES', 'CLIENT', 'PROYECTOS', 'COMPRAS']).optional().nullable(),
  active: z.boolean().optional(),
});

const updateEarningStatusSchema = z.object({
  status: z.enum(['APPROVED', 'PAID']),
});

router.use(authenticate);
router.use(requireBackoffice);

router.get('/plans', paginate, async (req: Request, res: Response) => {
  try {
    const { search, active } = req.query;
    const where: any = {};
    if (search) where.name = { contains: search as string };
    if (active !== undefined) where.active = active === 'true';

    const [plans, total] = await Promise.all([
      prisma.commissionPlan.findMany({
        where,
        skip: req.pagination!.skip,
        take: req.pagination!.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          rules: true,
          _count: { select: { earnings: true } },
        },
      }),
      prisma.commissionPlan.count({ where }),
    ]);
    res.json(paginatedResponse(plans, total, req.pagination!.page, req.pagination!.limit));
  } catch {
    res.status(500).json({ error: 'Error al obtener planes de comisión' });
  }
});

router.post('/plans', async (req: Request, res: Response) => {
  try {
    const data = createPlanSchema.parse(req.body);
    const plan = await prisma.commissionPlan.create({
      data: {
        name: data.name,
        description: data.description || null,
        type: data.type,
        value: data.value,
        conditions: data.conditions || null,
        roleTarget: data.roleTarget as any || null,
        rules: {
          create: data.rules.map(r => ({
            criteria: r.criteria,
            bonusValue: r.bonusValue,
            bonusType: r.bonusType,
          })),
        },
      },
      include: { rules: true },
    });
    res.status(201).json(plan);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Error al crear plan de comisión' });
  }
});

router.put('/plans/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const data = updatePlanSchema.parse(req.body);

    const existing = await prisma.commissionPlan.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Plan de comisión no encontrado' });

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.conditions !== undefined) updateData.conditions = data.conditions;
    if (data.roleTarget !== undefined) updateData.roleTarget = data.roleTarget;
    if (data.active !== undefined) updateData.active = data.active;

    const plan = await prisma.commissionPlan.update({
      where: { id },
      data: updateData,
      include: { rules: true },
    });
    res.json(plan);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Error al actualizar plan de comisión' });
  }
});

router.delete('/plans/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const existing = await prisma.commissionPlan.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Plan de comisión no encontrado' });

    await prisma.commissionPlan.update({
      where: { id },
      data: { active: false },
    });
    res.json({ message: 'Plan de comisión desactivado correctamente' });
  } catch {
    res.status(500).json({ error: 'Error al desactivar plan de comisión' });
  }
});

router.get('/earnings', paginate, async (req: Request, res: Response) => {
  try {
    const { userId, status, dateFrom, dateTo } = req.query;
    const where: any = {};
    if (userId) where.userId = parseInt(String(userId));
    if (status) where.status = status as string;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
      if (dateTo) where.createdAt.lte = new Date(dateTo as string);
    }

    const [earnings, total] = await Promise.all([
      prisma.commissionEarning.findMany({
        where,
        skip: req.pagination!.skip,
        take: req.pagination!.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          plan: { select: { id: true, name: true } },
          serviceOrder: { select: { id: true, number: true } },
          quotation: { select: { id: true, number: true } },
        },
      }),
      prisma.commissionEarning.count({ where }),
    ]);
    res.json(paginatedResponse(earnings, total, req.pagination!.page, req.pagination!.limit));
  } catch {
    res.status(500).json({ error: 'Error al obtener comisiones' });
  }
});

router.put('/earnings/:id/status', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const data = updateEarningStatusSchema.parse(req.body);

    const earning = await prisma.commissionEarning.findUnique({ where: { id } });
    if (!earning) return res.status(404).json({ error: 'Comisión no encontrada' });

    const updateData: any = { status: data.status };
    if (data.status === 'PAID') updateData.paidAt = new Date();

    const updated = await prisma.commissionEarning.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true } },
        plan: { select: { id: true, name: true } },
      },
    });
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Error al actualizar estado de comisión' });
  }
});

router.post('/calculate/:serviceOrderId', async (req: Request, res: Response) => {
  try {
    const serviceOrderId = parseInt(String(req.params.serviceOrderId));

    const serviceOrder = await prisma.serviceOrder.findUnique({
      where: { id: serviceOrderId },
      include: { assignedUser: true },
    });
    if (!serviceOrder) return res.status(404).json({ error: 'Orden de servicio no encontrada' });
    if (serviceOrder.status !== 'COMPLETADO') {
      return res.status(400).json({ error: 'La orden de servicio debe estar completada' });
    }
    if (!serviceOrder.assignedTo) {
      return res.status(400).json({ error: 'La orden de servicio no tiene técnico asignado' });
    }

    const plans = await prisma.commissionPlan.findMany({
      where: {
        active: true,
        OR: [
          { roleTarget: serviceOrder.assignedUser!.role as any },
          { roleTarget: null },
        ],
      },
      include: { rules: true },
    });

    const earnings: Array<{
      amount: number;
      description: string;
      planId: number;
      userId: number;
      serviceOrderId: number;
      status: string;
    }> = [];

    for (const plan of plans) {
      let amount = 0;

      if (plan.type === 'PERCENTAGE') {
        amount = (serviceOrder.totalCost * plan.value) / 100;
      } else if (plan.type === 'FLAT') {
        amount = plan.value;
      } else if (plan.type === 'TIERED') {
        for (const rule of plan.rules) {
          if (rule.criteria === 'serviceOrder:completed') {
            amount += rule.bonusType === 'PERCENTAGE'
              ? (serviceOrder.totalCost * rule.bonusValue) / 100
              : rule.bonusValue;
          }
        }
      }

      if (amount > 0) {
        earnings.push({
          amount,
          description: `Comisión: ${plan.name} - ${serviceOrder.description || serviceOrder.number}`,
          planId: plan.id,
          userId: serviceOrder.assignedTo,
          serviceOrderId: serviceOrder.id,
          status: 'PENDING',
        });
      }
    }

    if (earnings.length === 0) {
      return res.json({ message: 'No se generaron comisiones para esta orden', earnings: [] });
    }

    await prisma.commissionEarning.createMany({ data: earnings });

    const created = await prisma.commissionEarning.findMany({
      where: { serviceOrderId: serviceOrder.id },
      include: {
        plan: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ message: 'Comisiones calculadas correctamente', earnings: created });
  } catch {
    res.status(500).json({ error: 'Error al calcular comisiones' });
  }
});

export default router;
