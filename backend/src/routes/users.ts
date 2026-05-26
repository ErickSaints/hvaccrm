import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, requireSuperAdmin } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';

const router = Router();

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'TECHNICIAN', 'SALES', 'PROYECTOS', 'COMPRAS', 'CLIENT']),
  phone: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'TECHNICIAN', 'SALES', 'PROYECTOS', 'COMPRAS', 'CLIENT']).optional(),
  phone: z.string().optional(),
  active: z.boolean().optional(),
  isSuperAdmin: z.boolean().optional(),
});

router.use(authenticate);

router.get('/', requirePermission('users:view'), async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const sanitized = users.map(({ password, ...user }) => user);
    res.json(sanitized);
  } catch {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

router.get('/:id', requirePermission('users:view'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const { password, ...userData } = user;
    res.json(userData);
  } catch {
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

router.post('/', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const data = createUserSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        phone: data.phone || null,
      },
    });
    const { password: _, ...userData } = user;
    res.status(201).json(userData);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

router.put('/:id', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const data = updateUserSchema.parse(req.body);
    if (data.email) {
      const existing = await prisma.user.findFirst({
        where: { email: data.email, id: { not: id } },
      });
      if (existing) {
        return res.status(400).json({ error: 'El email ya está en uso' });
      }
    }
    if (data.isSuperAdmin !== undefined) {
      const target = await prisma.user.findUnique({ where: { id } });
      if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });
      if (!req.user!.isSuperAdmin) {
        return res.status(403).json({ error: 'Solo el Super Admin puede asignar Super Admin' });
      }
    }
    const user = await prisma.user.update({ where: { id }, data });
    const { password: _, ...userData } = user;
    res.json(userData);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

router.delete('/:id', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    if (user.isSuperAdmin && user.id !== req.user!.id) {
      return res.status(403).json({ error: 'No puedes desactivar al Super Administrador' });
    }
    await prisma.user.update({ where: { id }, data: { active: false } });
    res.json({ message: 'Usuario desactivado correctamente' });
  } catch {
    res.status(500).json({ error: 'Error al desactivar usuario' });
  }
});

router.put('/:id/avatar', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    if (req.user!.id !== id && !req.user!.isSuperAdmin) {
      return res.status(403).json({ error: 'No puedes cambiar el avatar de otro usuario' });
    }
    const { avatar } = req.body;
    if (!avatar || typeof avatar !== 'string') {
      return res.status(400).json({ error: 'URL de avatar requerida' });
    }
    const user = await prisma.user.update({ where: { id }, data: { avatar } });
    const { password: _, ...userData } = user;
    res.json(userData);
  } catch {
    res.status(500).json({ error: 'Error al actualizar avatar' });
  }
});

export default router;
