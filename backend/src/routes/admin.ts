import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, requireSuperAdmin } from '../middleware/auth';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate, requireSuperAdmin);

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'TECHNICIAN', 'SALES', 'CLIENT', 'PROYECTOS', 'COMPRAS']).optional(),
  active: z.boolean().optional(),
  phone: z.string().optional(),
  isSuperAdmin: z.boolean().optional(),
});

const permissionUpdateSchema = z.object({
  role: z.string(),
  permissions: z.array(z.string()),
});

router.get('/users', async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        active: true,
        trialEndsAt: true,
        createdAt: true,
        subscription: {
          select: {
            status: true,
            plan: { select: { name: true } },
          },
        },
      },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
        active: true,
        trialEndsAt: true,
        createdAt: true,
        subscription: {
          include: { plan: true },
        },
        _count: {
          select: {
            tickets: true,
            serviceOrders: true,
            quotations: true,
            serviceReports: true,
          },
        },
      },
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const data = updateUserSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Usuario no encontrado' });

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.role) updateData.role = data.role;
    if (data.active !== undefined) updateData.active = data.active;
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        active: true,
        trialEndsAt: true,
      },
    });
    res.json(user);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (existing.isSuperAdmin && existing.id !== req.user!.id) {
      return res.status(403).json({ error: 'No puedes desactivar al Super Administrador' });
    }
    await prisma.user.update({ where: { id }, data: { active: false } });
    res.json({ message: 'Usuario desactivado correctamente' });
  } catch {
    res.status(500).json({ error: 'Error al desactivar usuario' });
  }
});

router.post('/shutdown', async (_req: Request, res: Response) => {
  res.json({ message: 'Apagando sistema...' });
  setTimeout(() => {
    console.log('[ADMIN] Apagando servidor por solicitud de administrador');
    process.exit(0);
  }, 1000);
});

// ─── Permission Management ───────────────────────────────────────────

router.get('/permissions', async (_req: Request, res: Response) => {
  try {
    const rolePermissions = await prisma.rolePermission.findMany();
    const grouped: Record<string, string[]> = {};
    for (const rp of rolePermissions) {
      if (!grouped[rp.role]) grouped[rp.role] = [];
      grouped[rp.role].push(rp.permission);
    }
    res.json({
      defaults: (await import('../permissions')).DEFAULT_ROLE_PERMISSIONS,
      overrides: grouped,
      allPermissions: (await import('../permissions')).ALL_PERMISSIONS,
      categories: (await import('../permissions')).PERMISSION_CATEGORIES,
      labels: (await import('../permissions')).LABELS,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener permisos' });
  }
});

router.put('/permissions/:role', async (req: Request, res: Response) => {
  try {
    const role = String(req.params.role);
    const { permissions } = permissionUpdateSchema.parse({ role, ...req.body });

    const validRoles = ['ADMIN', 'TECHNICIAN', 'SALES', 'CLIENT', 'PROYECTOS', 'COMPRAS'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Rol no válido' });
    }

    await prisma.rolePermission.deleteMany({ where: { role: role as any } });

    if (permissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissions.map((p) => ({
          role: role as any,
          permission: p,
          allowed: true,
          updatedById: req.user!.id,
        })),
      });
    }

    res.json({ message: `Permisos actualizados para el rol ${role}`, role, permissions });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al actualizar permisos' });
  }
});

router.post('/reset-permissions', async (_req: Request, res: Response) => {
  try {
    await prisma.rolePermission.deleteMany();
    res.json({ message: 'Permisos restablecidos a valores por defecto' });
  } catch {
    res.status(500).json({ error: 'Error al restablecer permisos' });
  }
});

export default router;
