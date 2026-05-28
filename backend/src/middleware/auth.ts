import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'hvaccrm-secret-key';

export interface JwtPayload {
  userId: number;
  role: string;
  isSuperAdmin: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name: string;
        role: string;
        phone: string | null;
        avatar: string | null;
        active: boolean;
        isSuperAdmin: boolean;
        trialEndsAt: Date | null;
        customerId: number | null;
      };
      scopeFilter?: any;
      isSpectating?: boolean;
      spectatedUserId?: number;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { customer: { select: { id: true } } },
    });
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
    }
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      active: user.active,
      isSuperAdmin: user.isSuperAdmin,
      trialEndsAt: user.trialEndsAt,
      customerId: user.customer?.id ?? null,
    };
    if (req.query.__user && user.isSuperAdmin) {
      const targetId = parseInt(req.query.__user as string, 10);
      if (!isNaN(targetId) && targetId !== user.id) {
        const targetUser = await prisma.user.findUnique({
          where: { id: targetId },
          include: { customer: { select: { id: true } } },
        });
        if (targetUser) {
          (req as any).isSpectating = true;
          (req as any).spectatedUserId = targetUser.id;
          req.user = {
            id: targetUser.id,
            email: targetUser.email,
            name: targetUser.name,
            role: targetUser.role,
            phone: targetUser.phone,
            avatar: targetUser.avatar,
            active: targetUser.active,
            isSuperAdmin: targetUser.isSuperAdmin,
            trialEndsAt: targetUser.trialEndsAt,
            customerId: targetUser.customer?.id ?? null,
          };
        }
      }
    }
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  if (req.user.role !== 'ADMIN' || !req.user.isSuperAdmin) {
    return res.status(403).json({ error: 'Solo el Super Administrador puede realizar esta acción' });
  }
  next();
}

export const requireBackoffice = requireRole(['ADMIN', 'TECHNICIAN', 'SALES', 'PROYECTOS', 'COMPRAS']);

export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }
    next();
  };
}

export function requireSubscription(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  // Admin always has access
  if (req.user.role === 'ADMIN') {
    return next();
  }
  // Check trial period
  if (req.user.trialEndsAt && new Date(req.user.trialEndsAt) > new Date()) {
    return next();
  }
  // Check active subscription
  prisma.userSubscription.findUnique({ where: { userId: req.user.id } }).then((sub) => {
    if (sub && sub.status === 'ACTIVA') {
      return next();
    }
    return res.status(403).json({
      error: 'Tu período de prueba ha expirado. Realiza el pago para seguir usando la aplicación.',
      code: 'SUBSCRIPTION_REQUIRED',
    });
  });
}
