import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';

declare global {
  namespace Express {
    interface Request {
      isSpectating?: boolean;
      spectatedUserId?: number;
    }
  }
}

function isSuperAdmin(req: Request): boolean {
  return req.user?.role === 'ADMIN' && req.user?.isSuperAdmin === true;
}

export async function spectator(req: Request, _res: Response, next: NextFunction) {
  const spectateUserId = req.query.__user as string | undefined;
  if (spectateUserId) {
    if (!isSuperAdmin(req)) {
      _res.status(403).json({ error: 'Solo el Super Administrador puede usar el modo espectador' });
      return;
    }
    const targetId = parseInt(spectateUserId, 10);
    if (!isNaN(targetId) && targetId !== req.user!.id) {
      const targetUser = await prisma.user.findUnique({
        where: { id: targetId },
        include: { customer: { select: { id: true } } },
      });
      if (targetUser) {
        req.isSpectating = true;
        req.spectatedUserId = targetUser.id;
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
}
