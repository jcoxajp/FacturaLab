import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { facturasRouter } from './routes/facturas.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

export const app = express();

app.use(express.static(PUBLIC_DIR));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/facturas', facturasRouter);

app.use(errorHandler);
