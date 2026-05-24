import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch {
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

router.get('/unread-count', async (req: Request, res: Response) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user!.id, read: false },
    });
    res.json({ count });
  } catch {
    res.status(500).json({ error: 'Error al contar notificaciones' });
  }
});

router.put('/:id/read', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    await prisma.notification.updateMany({
      where: { id, userId: req.user!.id },
      data: { read: true },
    });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Error al marcar notificación' });
  }
});

router.put('/read-all', async (req: Request, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, read: false },
      data: { read: true },
    });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Error al marcar notificaciones' });
  }
});

export default router;
