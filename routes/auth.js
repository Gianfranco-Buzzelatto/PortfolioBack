import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { protect, requireJwtSecret } from '../middleware/auth.js';
import { sendPasswordResetEmail } from '../utils/mailer.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos. Probá en 15 minutos.' },
});

const setupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos de setup.' },
});

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados pedidos de recuperación. Probá más tarde.' },
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos. Probá en 15 minutos.' },
});

const RESET_TTL_MIN = 30;
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    const token = jwt.sign(
      { id: user._id, email: user.email },
      requireJwtSecret(),
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Siempre responde lo mismo exista o no el email, para no revelar quién es admin.
router.post('/forgot-password', forgotLimiter, async (req, res) => {
  const generic = {
    message: 'Si el email corresponde a un administrador, te enviamos un link para restablecer la contraseña.',
  };
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'Ingresá tu email' });

    const user = await User.findOne({ email });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      await User.updateOne({ _id: user._id }, {
        $set: {
          resetPasswordToken: hashToken(token),
          resetPasswordExpires: new Date(Date.now() + RESET_TTL_MIN * 60 * 1000),
        },
      });
      const base = (process.env.FRONTEND_URL || 'http://localhost:5174').replace(/\/$/, '');
      await sendPasswordResetEmail(user.email, `${base}/reset-password/${token}`, RESET_TTL_MIN);
    }
    res.json(generic);
  } catch (err) {
    console.error('forgot-password:', err.message);
    res.status(500).json({ message: 'No pudimos procesar el pedido. Probá de nuevo.' });
  }
});

router.post('/reset-password', resetLimiter, async (req, res) => {
  try {
    const token = String(req.body.token || '');
    const password = String(req.body.password || '');
    if (!token) return res.status(400).json({ message: 'Link inválido' });
    if (password.length < 8) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const user = await User.findOne({
      resetPasswordToken: hashToken(token),
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({ message: 'El link es inválido o venció. Pedí uno nuevo.' });
    }

    user.password = password; // el hook pre('save') la hashea
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Contraseña actualizada. Ya podés iniciar sesión.' });
  } catch (err) {
    console.error('reset-password:', err.message);
    res.status(500).json({ message: 'No pudimos actualizar la contraseña. Probá de nuevo.' });
  }
});

router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('username email');
    if (!user) return res.status(401).json({ message: 'No autorizado' });
    res.json({ user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/setup', setupLimiter, async (req, res) => {
  try {
    const count = await User.countDocuments();
    if (count > 0) return res.status(400).json({ message: 'Ya existe un admin' });
    const username = String(req.body.username || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!username || !email || password.length < 8) {
      return res.status(400).json({ message: 'Usuario, email y contraseña (8+) son requeridos' });
    }
    const user = await User.create({ username, email, password });
    res.status(201).json({ message: 'Admin creado', user: { id: user._id, username, email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/admins', protect, async (req, res) => {
  try {
    const admins = await User.find()
      .select('username email createdAt')
      .sort({ createdAt: 1 })
      .lean();
    res.json(admins.map((u) => ({
      id: u._id,
      username: u.username,
      email: u.email,
      createdAt: u.createdAt,
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/admins', protect, async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!username || !email || password.length < 8) {
      return res.status(400).json({ message: 'Usuario, email y contraseña (mín. 8 caracteres) son requeridos' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Email inválido' });
    }
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      return res.status(400).json({
        message: exists.email === email ? 'Ya existe un admin con ese email' : 'Ya existe un admin con ese usuario',
      });
    }
    const user = await User.create({ username, email, password });
    res.status(201).json({
      message: 'Administrador creado',
      user: { id: user._id, username: user.username, email: user.email, createdAt: user.createdAt },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Usuario o email ya registrado' });
    }
    res.status(500).json({ message: err.message });
  }
});

export default router;
