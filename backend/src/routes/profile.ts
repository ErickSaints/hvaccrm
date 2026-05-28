import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';

const router = Router();

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/avatars');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user!.id}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de imagen no válido'));
    }
  },
});

router.use(authenticate);

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const { password, ...userData } = user;
    res.json(userData);
  } catch {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

router.put('/', async (req: Request, res: Response) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    if (data.email) {
      const existing = await prisma.user.findFirst({
        where: { email: data.email, id: { not: req.user!.id } },
      });
      if (existing) {
        return res.status(400).json({ error: 'El email ya está en uso' });
      }
    }
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data,
    });
    const { password: _, ...userData } = user;
    res.json(userData);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

router.put('/avatar', async (req: Request, res: Response) => {
  try {
    const { avatar } = req.body;
    if (!avatar || typeof avatar !== 'string') {
      return res.status(400).json({ error: 'URL de avatar requerida' });
    }
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatar },
    });
    const { password: _, ...userData } = user;
    res.json(userData);
  } catch {
    res.status(500).json({ error: 'Error al actualizar avatar' });
  }
});

router.put('/password', async (req: Request, res: Response) => {
  try {
    const data = changePasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    const valid = await bcrypt.compare(data.currentPassword, user.password);
    if (!valid) return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    const hashed = await bcrypt.hash(data.newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    res.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
});

const customerProfileSchema = z.object({
  companyName: z.string().optional(),
  contactName: z.string().min(1).optional(),
  phone: z.string().optional(),
  phone2: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  taxId: z.string().optional(),
  notes: z.string().optional(),
});

router.get('/customer', async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { email: req.user!.email },
    });
    if (!customer) return res.json(null);
    res.json(customer);
  } catch {
    res.status(500).json({ error: 'Error al obtener datos de cliente' });
  }
});

router.put('/customer', async (req: Request, res: Response) => {
  try {
    const data = customerProfileSchema.parse(req.body);
    const existing = await prisma.customer.findFirst({
      where: { email: req.user!.email },
    });
    if (!existing) return res.status(404).json({ error: 'Cliente no encontrado' });
    const customer = await prisma.customer.update({
      where: { id: existing.id },
      data,
    });
    res.json(customer);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Error al actualizar datos de cliente' });
  }
});

router.post('/avatar/upload', (req: Request, res: Response) => {
  upload.single('avatar')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: 'Error al subir archivo' });
      }
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    try {
      const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: { avatar: avatarUrl },
      });
      const { password: _, ...userData } = user;
      res.json({ avatar: avatarUrl, user: userData });
    } catch {
      res.status(500).json({ error: 'Error al actualizar avatar' });
    }
  });
});

export default router;
