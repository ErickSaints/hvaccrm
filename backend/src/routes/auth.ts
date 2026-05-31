import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, requireSuperAdmin } from '../middleware/auth';
import { sendEmail, welcomeEmail, isEmailConfigured } from '../notifications/email';
import { sendSms, formatPhone, isSmsConfigured } from '../notifications/twilio';
import { resetPasswordEmail } from '../notifications/email';
import crypto from 'crypto';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'hvaccrm-secret-key';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['ADMIN', 'TECHNICIAN', 'SALES', 'CLIENT', 'PROYECTOS', 'COMPRAS']).optional(),
  phone: z.string().optional(),
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = jwt.sign({ userId: user.id, role: user.role, isSuperAdmin: user.isSuperAdmin }, JWT_SECRET, { expiresIn: '24h' });
    const { password: _, ...userData } = user;
    res.json({ token, user: userData });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error al iniciar sesión', detail: err instanceof Error ? err.message : String(err) });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const role = data.role || 'CLIENT';
    const trialEndsAt = role === 'ADMIN' ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role,
        phone: data.phone || null,
        trialEndsAt,
      },
    });
    if (user.role === 'CLIENT') {
      const newCustomer = await prisma.customer.create({
        data: {
          contactName: data.name,
          email: data.email,
          phone: data.phone || '',
          address: '',
        },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { customerId: newCustomer.id },
      });
      const freePlan = await prisma.subscriptionPlan.findFirst({
        where: { active: true },
        orderBy: { price: 'asc' },
      });
      if (freePlan) {
        await prisma.userSubscription.create({
          data: {
            userId: user.id,
            planId: freePlan.id,
            startDate: new Date(),
            endDate: new Date(Date.now() + freePlan.durationDays * 24 * 60 * 60 * 1000),
            status: 'ACTIVA',
          },
        });
      }
    }
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { subscription: { include: { plan: true } } },
    });
    const token = jwt.sign({ userId: user.id, role: user.role, isSuperAdmin: user.isSuperAdmin }, JWT_SECRET, { expiresIn: '24h' });
    const { password: _, ...userData } = updatedUser!;
    sendEmail({
      to: user.email,
      ...welcomeEmail({
        userName: user.name,
        planName: (updatedUser as any)?.subscription?.plan?.name,
        loginUrl: `${process.env.APP_URL || 'https://hvaccrm.production.up.railway.app'}/login`,
      }),
    });
    res.status(201).json({ token, user: userData });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Error al registrar usuario', detail: err instanceof Error ? err.message : String(err) });
  }
});

router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'El email es requerido' });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({ message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña' });
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });
    const resetLink = `${process.env.APP_URL || 'https://hvaccrm.production.up.railway.app'}/reset-password?token=${resetToken}`;
    const sent = await sendEmail({
      to: user.email,
      ...resetPasswordEmail({ userName: user.name, resetLink }),
    });
    console.log(`[forgot-password] Email ${sent ? 'sent' : 'FAILED'} to ${user.email}, configured: ${isEmailConfigured()}`);
    res.json({ message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña' });
  } catch (err) {
    console.error('[forgot-password] Error:', err);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token y contraseña son requeridos' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gte: new Date() } },
    });
    if (!user) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null },
    });
    res.json({ message: 'Contraseña restablecida correctamente' });
  } catch {
    res.status(500).json({ error: 'Error al restablecer la contraseña' });
  }
});

const SUPER_ADMIN_SECRET = process.env.SUPER_ADMIN_SECRET || 'ErickotE99';
const SUPER_ADMIN_HASH = bcrypt.hashSync(SUPER_ADMIN_SECRET, 10);

const verificationCodes = new Map<number, { code: string; expiresAt: Date }>();

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

router.post('/verify-super-admin', authenticate, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    if (!password || !bcrypt.compareSync(password, SUPER_ADMIN_HASH)) {
      return res.status(403).json({ error: 'Contraseña de Super Admin incorrecta' });
    }

    const smsConfigured = isSmsConfigured();
    let smsSent = false;

    if (smsConfigured && req.user?.phone) {
      const code = generateCode();
      verificationCodes.set(req.user.id, { code, expiresAt: new Date(Date.now() + 5 * 60 * 1000) });
      smsSent = await sendSms({
        to: formatPhone(req.user.phone),
        body: `Tu código de verificación de Super Admin es: ${code}. Válido por 5 minutos.`,
      });
    }

    res.json({ verified: true, smsRequired: smsConfigured && !!req.user?.phone, smsSent });
  } catch {
    res.status(500).json({ error: 'Error al verificar contraseña' });
  }
});

router.post('/verify-super-admin-code', authenticate, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Código requerido' });
    }

    const stored = verificationCodes.get(req.user!.id);
    if (!stored) {
      return res.status(403).json({ error: 'No hay código de verificación pendiente. Solicita uno nuevo.' });
    }

    if (new Date() > stored.expiresAt) {
      verificationCodes.delete(req.user!.id);
      return res.status(403).json({ error: 'El código ha expirado. Solicita uno nuevo.' });
    }

    if (stored.code !== code) {
      return res.status(403).json({ error: 'Código incorrecto' });
    }

    verificationCodes.delete(req.user!.id);
    res.json({ verified: true });
  } catch {
    res.status(500).json({ error: 'Error al verificar código' });
  }
});

router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const { password: _, ...userData } = user;
    res.json(userData);
  } catch {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

export default router;
