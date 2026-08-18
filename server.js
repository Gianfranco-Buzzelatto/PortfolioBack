import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB, ensureDb } from './db/connect.js';
import { seedProjectsIfEmpty } from './scripts/seed-projects.js';
import { requireJwtSecret } from './middleware/auth.js';
import projectRoutes from './routes/projects.js';
import authRoutes from './routes/auth.js';
import quoteRoutes from './routes/quotes.js';
import settingsRoutes from './routes/settings.js';
import uploadRoutes from './routes/upload.js';
import clientsRouter from './routes/clients.js';

dotenv.config();

requireJwtSecret();

const app = express();
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use(ensureDb);

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/clients', clientsRouter);

const PORT = process.env.PORT || 5000;

try {
  await connectDB();
  await seedProjectsIfEmpty();
} catch (err) {
  console.error('Arranque sin Mongo (se conecta en el primer request):', err.message);
}

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
