import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import projectRoutes from './routes/projects.js';
import authRoutes from './routes/auth.js';
import quoteRoutes from './routes/quotes.js';
import settingsRoutes from './routes/settings.js';
import uploadRoutes from './routes/upload.js';

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio')
  .then(() => {
    console.log('✅ MongoDB conectado a:', mongoose.connection.db.databaseName)
  })
  .catch((err) => console.error('❌ Error MongoDB:', err.message));