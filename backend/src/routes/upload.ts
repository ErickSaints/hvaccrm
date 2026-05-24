import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../prisma';
import { authenticate, requireBackoffice } from '../middleware/auth';

const router = Router();

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const photoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/photos');
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/avatars');
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user!.id}-${Date.now()}${ext}`);
  },
});

function imageFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de imagen no válido. Usa: jpg, jpeg, png, gif, webp'));
  }
}

const photoUpload = multer({
  storage: photoStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageFilter,
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
});

router.use(authenticate);
router.use(requireBackoffice);

router.post('/photo', (req: Request, res: Response) => {
  photoUpload.single('photo')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: 'Error al subir archivo (máx 10MB)' });
      }
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }
    const url = `/uploads/photos/${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
  });
});

router.post('/avatar', (req: Request, res: Response) => {
  avatarUpload.single('avatar')(req, res, async (err) => {
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
