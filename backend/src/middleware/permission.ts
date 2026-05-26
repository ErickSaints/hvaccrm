import { Request, Response, NextFunction } from 'express';
import { hasPermission, type PermissionAction } from '../permissions';

export function requirePermission(...permissions: PermissionAction[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const role = req.user.role;

    if (role === 'ADMIN' && (req.user as any).isSuperAdmin) {
      return next();
    }

    for (const permission of permissions) {
      if (hasPermission(role, permission)) {
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

    const hasAny = permissions.some((p) => hasPermission(role, p));
    if (!hasAny) {
      return res.status(403).json({
        error: 'No tienes permiso para realizar esta acción',
      });
    }
    next();
  };
}
