import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import apiApp from './api/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Mount all API routes (/api/status, /api/chat/stream, /api/image/generate, /api/image/edit)
app.use(apiApp);

// Vite middleware integration (Dev vs Production)
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted in development mode');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log(`Static files served from ${distPath}`);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LEOVANDYZ AI server running at http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  setupViteOrStatic().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export default app;
