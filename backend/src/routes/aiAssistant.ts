import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { processMessage, validateConfig, getConfig, updateConfig } from '../services/aiAssistant';

const router = Router();

router.use(authenticate);
router.use(requireRole(['ADMIN']));

router.get('/config', (_req: Request, res: Response) => {
  res.json(getConfig());
});

router.put('/config', (req: Request, res: Response) => {
  const { apiKey, model, baseURL } = req.body;
  if (apiKey === '' || model === '' || baseURL === '') {
    return res.status(400).json({ error: 'Los valores no pueden estar vacíos' });
  }
  const cfg = updateConfig({
    apiKey: apiKey !== undefined ? apiKey : undefined,
    model: model !== undefined ? model : undefined,
    baseURL: baseURL !== undefined ? baseURL : undefined,
  });
  res.json({ success: true, configured: validateConfig().valid, model: cfg.model });
});

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    const configCheck = validateConfig();
    if (!configCheck.valid) {
      return res.status(400).json({ error: configCheck.message });
    }

    const messages = [
      ...(history || []).map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ];

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    let fullContent = '';

    await processMessage(messages, (chunk: string) => {
      fullContent += chunk;
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    });

    res.write(`data: ${JSON.stringify({ done: true, fullContent })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error('[AI Chat Error]', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: `Error interno: ${err.message}` });
    }
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

export default router;
