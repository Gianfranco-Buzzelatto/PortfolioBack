import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './db/connect.js';
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

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/clients', clientsRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;

await connectDB();
await seedProjectsIfEmpty();

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
