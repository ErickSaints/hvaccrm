import { Request, Response, NextFunction } from 'express';
import { hasPermission, type PermissionAction } from '../permissions';
import prisma from '../prisma';

export function requirePermission(...permissions: PermissionAction[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const role = req.user.role;

    if (role === 'ADMIN' && (req.user as any).isSuperAdmin) {
      return next();
    }

    const overrides = await prisma.rolePermission.findMany({
      where: { role: role as any },
      select: { permission: true, allowed: true }
    });
    const customPermissions: Record<string, boolean> = {};
    for (const o of overrides) {
      customPermissions[o.permission] = o.allowed;
    }

    for (const permission of permissions) {
      if (hasPermission(role, permission, customPermissions)) {
        return next();
      }
    }

    return res.status(403).json({
      error: 'No tienes permiso para realizar esta acción',
      required: permissions,
    });
  };
}

export function requireAnyPermission(...permissions: PermissionAction[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const role = req.user.role;

    if (role === 'ADMIN' && (req.user as any).isSuperAdmin) {
      return next();
    }

    const overrides = await prisma.rolePermission.findMany({
      where: { role: role as any },
      select: { permission: true, allowed: true }
    });
    const customPermissions: Record<string, boolean> = {};
    for (const o of overrides) {
      customPermissions[o.permission] = o.allowed;
    }

    const hasAny = permissions.some((p) => hasPermission(role, p, customPermissions));
    if (!hasAny) {
      return res.status(403).json({
        error: 'No tienes permiso para realizar esta acción',
      });
    }
    next();
  };
}
