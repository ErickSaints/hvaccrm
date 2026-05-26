import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import prisma from '../prisma';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'hvaccrm-secret-key';

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const mpConfigured = Boolean(MP_ACCESS_TOKEN && !MP_ACCESS_TOKEN.startsWith('TEST-000'));
const mpClient = MP_ACCESS_TOKEN ? new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN }) : null;

const planSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  duration: z.enum(['MENSUAL', 'ANUAL']).optional(),
  durationDays: z.number().int().positive().optional(),
  features: z.string().optional(),
  targetRole: z.enum(['CLIENT', 'PROFESIONAL']).optional().default('CLIENT'),
});

const planUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  duration: z.enum(['MENSUAL', 'ANUAL']).optional(),
  durationDays: z.number().int().positive().optional(),
  features: z.string().optional(),
  targetRole: z.enum(['CLIENT', 'PROFESIONAL']).optional(),
  active: z.boolean().optional(),
});

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['CLIENT', 'TECHNICIAN', 'SALES', 'COMPRAS', 'PROYECTOS']).optional().default('CLIENT'),
  planId: z.number().int().positive(),
});

router.get('/plans', async (req: Request, res: Response) => {
  try {
    const role = req.query.role as string || undefined;
    const where: any = { active: true };
    if (role === 'CLIENT') {
      where.targetRole = 'CLIENT';
    } else if (role === 'PROFESIONAL') {
      where.targetRole = 'PROFESIONAL';
    }
    const plans = await prisma.subscriptionPlan.findMany({
      where,
      orderBy: { price: 'asc' },
    });
    res.json(plans);
  } catch {
    res.status(500).json({ error: 'Error al obtener planes' });
  }
});

router.post('/plans', authenticate, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const data = planSchema.parse(req.body);
    const durationDays = data.durationDays || (data.duration === 'ANUAL' ? 365 : 30);
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        description: data.description || null,
        price: data.price,
        duration: data.duration || 'MENSUAL',
        durationDays,
        features: data.features || null,
        targetRole: data.targetRole,
        createdById: req.user!.id,
      },
    });
    res.status(201).json(plan);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al crear plan' });
  }
});

router.put('/plans/:id', authenticate, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const data = planUpdateSchema.parse(req.body);
    const updateData: any = { ...data };
    if (data.duration) {
      updateData.durationDays = data.durationDays || (data.duration === 'ANUAL' ? 365 : 30);
    }
    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: updateData,
    });
    res.json(plan);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al actualizar plan' });
  }
});

router.delete('/plans/:id', authenticate, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }
    await prisma.subscriptionPlan.update({
      where: { id },
      data: { active: false },
    });
    res.json({ message: 'Plan desactivado correctamente' });
  } catch {
    res.status(500).json({ error: 'Error al desactivar plan' });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: data.planId } });
    if (!plan || !plan.active) {
      return res.status(400).json({ error: 'Plan no encontrado o inactivo' });
    }
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        trialEndsAt,
      },
    });
    const startDate = new Date();
    const endDate = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);
    const subscription = await prisma.userSubscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        startDate,
        endDate,
        status: 'PENDIENTE',
      },
    });
    const token = jwt.sign({ userId: user.id, role: user.role, isSuperAdmin: false }, JWT_SECRET, { expiresIn: '24h' });
    const { password: _, ...userData } = user;
    res.status(201).json({ token, user: { ...userData, trialEndsAt }, subscription });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al registrarse' });
  }
});

router.post('/create-preference', authenticate, async (req: Request, res: Response) => {
  try {
    if (!mpClient || !mpConfigured) {
      return res.status(503).json({
        error: 'Pasarela de pago no disponible',
        detail: 'Mercado Pago no está configurado. Contacta al administrador.',
        code: 'MP_NOT_CONFIGURED',
      });
    }
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: req.user!.id },
      include: { plan: true },
    });
    if (!subscription) {
      return res.status(404).json({ error: 'No tienes una suscripción pendiente' });
    }
    if (subscription.status !== 'PENDIENTE') {
      return res.status(400).json({ error: 'La suscripción ya está procesada' });
    }
    const preference = new Preference(mpClient);
    const result = await preference.create({
      body: {
        items: [
          {
            id: `plan-${subscription.plan.id}`,
            title: subscription.plan.name,
            description: subscription.plan.description || '',
            quantity: 1,
            unit_price: subscription.plan.price,
            currency_id: 'MXN',
          },
        ],
        payer: {
          email: req.user!.email,
          name: req.user!.name,
        },
        back_urls: {
          success: `${req.protocol}://${req.get('host')}/api/subscriptions/payment-success`,
          failure: `${req.protocol}://${req.get('host')}/api/subscriptions/payment-failure`,
          pending: `${req.protocol}://${req.get('host')}/api/subscriptions/payment-pending`,
        },
        auto_return: 'approved',
        external_reference: subscription.id.toString(),
        notification_url: `${req.protocol}://${req.get('host')}/api/subscriptions/webhook`,
        purpose: 'subscription',
      },
    });
    await prisma.userSubscription.update({
      where: { id: subscription.id },
      data: { paymentRef: result.id },
    });
    res.json({
      preferenceId: result.id,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point,
    });
  } catch (err: any) {
    console.error('MP error:', err);
    res.status(500).json({ error: 'Error al crear preferencia de pago', detail: err.message });
  }
});

router.get('/payment-success', async (req: Request, res: Response) => {
  try {
    const { payment_id, external_reference, status } = req.query;
    if (external_reference) {
      const subId = parseInt(external_reference as string);
      await prisma.userSubscription.update({
        where: { id: subId },
        data: {
          status: status === 'approved' ? 'ACTIVA' : 'PENDIENTE',
          paymentRef: (payment_id as string) || undefined,
          paymentMethod: 'MERCADO_PAGO',
        },
      });
    }
    res.redirect(`${req.protocol}://${req.get('host') === 'localhost:3001' ? 'localhost:5173' : req.get('host')}/profile?payment=success`);
  } catch {
    res.redirect('/profile?payment=error');
  }
});

router.get('/payment-failure', async (req: Request, res: Response) => {
  res.redirect('/profile?payment=failure');
});

router.get('/payment-pending', async (req: Request, res: Response) => {
  res.redirect('/profile?payment=pending');
});

router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;
    if (type === 'payment') {
      const payment = await new Payment(mpClient).get({ id: data.id });
      const externalRef = payment.external_reference;
      if (externalRef) {
        const subId = parseInt(externalRef);
        const status = payment.status === 'approved' ? 'ACTIVA' : payment.status === 'cancelled' ? 'CANCELADA' : 'PENDIENTE';
        await prisma.userSubscription.update({
          where: { id: subId },
          data: { status, paymentRef: data.id.toString(), paymentMethod: 'MERCADO_PAGO' },
        });
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err);
    res.sendStatus(200);
  }
});

router.get('/my', authenticate, async (req: Request, res: Response) => {
  try {
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: req.user!.id },
      include: { plan: true },
    });
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { trialEndsAt: true },
    });
    res.json({ subscription, trialEndsAt: user?.trialEndsAt || null });
  } catch {
    res.status(500).json({ error: 'Error al obtener suscripción' });
  }
});

router.post('/activate', authenticate, async (req: Request, res: Response) => {
  try {
    let subscription = await prisma.userSubscription.findUnique({
      where: { userId: req.user!.id },
    });
    if (!subscription) {
      const defaultPlan = await prisma.subscriptionPlan.findFirst({ where: { active: true }, orderBy: { price: 'asc' } });
      if (!defaultPlan) {
        return res.status(400).json({ error: 'No hay planes disponibles' });
      }
      const startDate = new Date();
      const endDate = new Date(Date.now() + defaultPlan.durationDays * 24 * 60 * 60 * 1000);
      subscription = await prisma.userSubscription.create({
        data: {
          userId: req.user!.id,
          planId: defaultPlan.id,
          startDate,
          endDate,
          status: 'ACTIVA',
        },
      });
      return res.json(subscription);
    }
    if (subscription.status === 'ACTIVA') {
      return res.json({ message: 'Ya está activa' });
    }
    const updated = await prisma.userSubscription.update({
      where: { userId: req.user!.id },
      data: { status: 'ACTIVA' },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Error al activar suscripción' });
  }
});

router.post('/cancel', authenticate, async (req: Request, res: Response) => {
  try {
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: req.user!.id },
    });
    if (!subscription) {
      return res.status(404).json({ error: 'No tienes una suscripción activa' });
    }
    const updated = await prisma.userSubscription.update({
      where: { userId: req.user!.id },
      data: { status: 'CANCELADA' },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Error al cancelar suscripción' });
  }
});

export default router;
