import prisma from './prisma';
import logger from './logger';
import { Request } from 'express';

function getClientIp(req?: Request): string | null {
  if (!req) return null;
  const forwarded: unknown = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return String(ip).split(',')[0].trim();
  }
  const ip: unknown = req.ip || req.socket?.remoteAddress;
  return typeof ip === 'string' ? ip : null;
}

interface AuditEntry {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'VIEW' | 'CANCEL' | 'APPROVE' | 'REJECT' | 'ASSIGN' | 'COMPLETE';
  entity: string;
  entityId?: number;
  description: string;
  metadata?: Record<string, unknown>;
  userId?: number;
  req?: Request;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId || null,
        description: entry.description,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        userId: entry.userId || null,
        ipAddress: getClientIp(entry.req),
        userAgent: (() => {
          const ua = entry.req?.headers?.['user-agent'];
          if (!ua) return null;
          return Array.isArray(ua) ? ua[0] : ua;
        })(),
      },
    });
  } catch (err) {
    logger.error('Failed to create audit log:', err);
  }
}

export function auditMiddleware(entity: string) {
  return (action: AuditEntry['action']) =>
    async (req: Request, _res: unknown, next: (...args: unknown[]) => void) => {
      const originalJson = (_res as any).json.bind(_res);
      (_res as any).json = function (body: unknown) {
        const entityId = req.params['id'] ? parseInt(req.params['id'] as string, 10) : undefined;
        logAudit({
          action,
          entity,
          entityId,
          description: `${action} ${entity}${entityId ? ` #${entityId}` : ''}`,
          userId: req.user?.id,
          req,
        }).catch(() => {});
        return originalJson(body);
      };
      next();
    };
}
