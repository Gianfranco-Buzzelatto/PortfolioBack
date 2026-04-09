import express from 'express';
import Quote from '../models/Quote.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ── Público: recibir solicitud del cliente ──────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const quote = await Quote.create(req.body);
    res.status(201).json(quote);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── Admin: listar todas ────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const quotes = await Quote.find(filter).sort({ createdAt: -1 });
    res.json(quotes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin: obtener una ─────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: 'No encontrada' });
    res.json(quote);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin: actualizar (wizard + status) ───────────────────────────────────
router.put('/:id', protect, async (req, res) => {
  try {
    const quote = await Quote.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!quote) return res.status(404).json({ message: 'No encontrada' });
    res.json(quote);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── Admin: eliminar ────────────────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    await Quote.findByIdAndDelete(req.params.id);
    res.json({ message: 'Eliminada' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;