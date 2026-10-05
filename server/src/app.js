import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ZodError } from 'zod';
import authRoutes from './routes/auth.routes.js';
import boardRoutes from './routes/board.routes.js';
import cardRoutes from './routes/card.routes.js';

const app = express();

const configuredClientUrl = process.env.CLIENT_URL ?? 'http://localhost:5173';
const allowedOrigins = new Set([configuredClientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173']);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by the API.'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/cards', cardRoutes);

app.use((err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ message: 'Please check the highlighted fields.', issues: err.issues });
  }
  const status = err.status ?? 500;
  if (status === 500) console.error(err);
  return res.status(status).json({ message: err.message ?? 'Something went wrong.' });
});

export default app;
