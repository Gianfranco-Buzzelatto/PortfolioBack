import express from 'express';
import Settings from '../models/Settings.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const FALLBACK = {
  heroTexts: ['Landing pages que convierten', 'Tiendas online listas para vender', 'Sistemas a medida para tu equipo'],
  name: 'Gianfranco Buzzelatto',
  title: 'Desarrollador Web Full Stack',
  bio: 'Webs, tiendas online y sistemas a medida para que tu negocio venda mejor y opere con menos fricción.',
  email: 'gianbuzzelatto@gmail.com',
  phone: '+54 11 4160-9741',
  location: 'Buenos Aires, Argentina',
  github: 'https://github.com/Gianfranco-Buzzelatto',
  linkedin: 'https://www.linkedin.com/in/gianfranco-joel-buzzelatto-a0827a163/',
  skills: ['React', 'Node.js', 'Express', 'MongoDB', 'APIs REST', 'E-commerce', 'Responsive'],
};

router.get('/', async (req, res) => {
  try {
    const settings = await Settings.findOne().lean();
    res.json(settings ? { ...FALLBACK, ...settings } : FALLBACK);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/', protect, async (req, res) => {
  try {
    const allowed = ['heroTexts', 'name', 'title', 'bio', 'email', 'phone', 'location', 'github', 'linkedin', 'skills'];
    const data = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    });
    const settings = await Settings.findOneAndUpdate({}, data, { new: true, upsert: true });
    res.json(settings);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
