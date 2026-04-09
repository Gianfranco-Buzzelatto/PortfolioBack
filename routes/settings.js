import express from 'express';
import Settings from '../models/Settings.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        heroTexts: ['Desarrollador Full Stack', 'Creador de Experiencias Web', 'Apasionado por el Código Limpio'],
        name: 'Tu Nombre',
        title: 'Desarrollador Full Stack',
        bio: 'Apasionado por crear soluciones digitales únicas y de alto impacto.',
        skills: ['React', 'Node.js', 'MongoDB', 'Express', 'JavaScript', 'TypeScript'],
      });
    }
    res.json(settings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/', protect, async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json(settings);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

export default router;
