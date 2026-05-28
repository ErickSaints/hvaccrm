import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from './prisma';
import logger from './logger';

const JWT_SECRET = process.env.JWT_SECRET || 'hvaccrm-secret-key';

let io: Server | null = null;

interface AuthenticatedSocket extends Socket {
  userId?: number;
  role?: string;
}

export function initWebSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
        : ['http://localhost:5173', 'http://localhost:3001'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Token no proporcionado'));
      }
      const decoded = jwt.verify(token as string, JWT_SECRET) as { userId: number; role: string };
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user || !user.active) {
        return next(new Error('Usuario no encontrado o inactivo'));
      }
      socket.userId = user.id;
      socket.role = user.role;
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`WebSocket connected: user=${socket.userId}`);

    socket.join(`user:${socket.userId}`);

    if (socket.role && ['ADMIN', 'TECHNICIAN', 'SALES', 'PROYECTOS', 'COMPRAS'].includes(socket.role)) {
      socket.join('backoffice');
    }

    if (socket.role === 'ADMIN') {
      socket.join('admins');
    }

    socket.on('subscribe:entity', (entityId: string) => {
      socket.join(`entity:${entityId}`);
    });

    socket.on('unsubscribe:entity', (entityId: string) => {
      socket.leave(`entity:${entityId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`WebSocket disconnected: user=${socket.userId}`);
    });
  });

  logger.info('WebSocket server initialized');
  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('WebSocket server not initialized');
  }
  return io;
}

export function emitToUser(userId: number, event: string, data: unknown): void {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

export function emitToBackoffice(event: string, data: unknown): void {
  if (!io) return;
  io.to('backoffice').emit(event, data);
}

export function emitToAdmins(event: string, data: unknown): void {
  if (!io) return;
  io.to('admins').emit(event, data);
}

export function emitToEntity(entityId: string, event: string, data: unknown): void {
  if (!io) return;
  io.to(`entity:${entityId}`).emit(event, data);
}

export function emitGlobal(event: string, data: unknown): void {
  if (!io) return;
  io.emit(event, data);
}
