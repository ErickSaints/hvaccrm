import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { authenticate, requireBackoffice } from '../middleware/auth';
import { getIO } from '../websocket';

const router = Router();

router.get('/', authenticate, requireBackoffice, async (_req: Request, res: Response) => {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const locations = await prisma.technicianLocation.findMany({
      where: {
        isTracking: true,
        recordedAt: { gte: fifteenMinutesAgo },
      },
      include: {
        user: {
          select: { id: true, name: true, role: true, avatarEmoji: true },
        },
        serviceOrder: {
          select: { id: true, number: true, status: true },
          include: {
            customer: {
              select: { id: true, companyName: true, address: true, city: true, state: true },
            },
          },
        },
      },
      orderBy: { recordedAt: 'desc' },
    });

    const mapped = locations.map(loc => ({
      id: loc.id,
      technicianId: loc.userId,
      name: loc.user.name,
      role: loc.user.role,
      avatarEmoji: loc.user.avatarEmoji,
      latitude: loc.latitude,
      longitude: loc.longitude,
      lastUpdate: loc.recordedAt,
      status: loc.isTracking ? 'ACTIVE' as const : 'INACTIVE' as const,
      serviceOrderNumber: loc.serviceOrder?.number,
      siteName: loc.serviceOrder?.customer?.companyName ?? null,
      siteAddress: loc.serviceOrder?.customer
        ? [loc.serviceOrder.customer.address, loc.serviceOrder.customer.city, loc.serviceOrder.customer.state]
            .filter(Boolean)
            .join(', ')
        : null,
    }));

    res.json(mapped);
  } catch (err) {
    console.error('Fleet list error:', err);
    res.status(500).json({ error: 'Error al obtener ubicaciones de técnicos' });
  }
});

router.post('/location', authenticate, async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, accuracy, heading, speed, serviceOrderId } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    if (latitude == null || longitude == null) {
      res.status(400).json({ error: 'Latitud y longitud son requeridas' });
      return;
    }

    const location = await prisma.technicianLocation.create({
      data: {
        latitude,
        longitude,
        accuracy: accuracy ?? null,
        heading: heading ?? null,
        speed: speed ?? null,
        serviceOrderId: serviceOrderId ?? null,
        userId,
      },
      include: {
        user: {
          select: { id: true, name: true, role: true, avatarEmoji: true },
        },
      },
    });

    const io = getIO();
    if (io) {
      io.emit('technician-location', {
        id: location.id,
        technicianId: location.userId,
        name: location.user.name,
        role: location.user.role,
        avatarEmoji: location.user.avatarEmoji,
        latitude: location.latitude,
        longitude: location.longitude,
        lastUpdate: location.recordedAt,
        status: 'ACTIVE' as const,
        serviceOrderNumber: null,
        siteName: null,
        siteAddress: null,
      });
    }

    res.status(201).json(location);
  } catch (err) {
    console.error('Location update error:', err);
    res.status(500).json({ error: 'Error al actualizar ubicación' });
  }
});

router.get('/history/:userId', authenticate, requireBackoffice, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { from, to } = req.query;

    const where: any = { userId: Number(userId) };

    if (from || to) {
      where.recordedAt = {};
      if (from) where.recordedAt.gte = new Date(from as string);
      if (to) where.recordedAt.lte = new Date(to as string);
    }

    const locations = await prisma.technicianLocation.findMany({
      where,
      orderBy: { recordedAt: 'asc' },
    });

    res.json(locations);
  } catch (err) {
    console.error('Location history error:', err);
    res.status(500).json({ error: 'Error al obtener historial de ubicaciones' });
  }
});

router.get('/trips/:serviceOrderId', authenticate, requireBackoffice, async (req: Request, res: Response) => {
  try {
    const { serviceOrderId } = req.params;

    const locations = await prisma.technicianLocation.findMany({
      where: { serviceOrderId: Number(serviceOrderId) },
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { recordedAt: 'asc' },
    });

    res.json(locations);
  } catch (err) {
    console.error('Trip route error:', err);
    res.status(500).json({ error: 'Error al obtener ruta de orden de servicio' });
  }
});

export default router;
