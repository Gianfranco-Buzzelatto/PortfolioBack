import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  heroTexts: [{ type: String }],
  name: { type: String, default: 'Tu Nombre' },
  title: { type: String, default: 'Desarrollador Full Stack' },
  bio: { type: String, default: 'Apasionado por crear experiencias digitales únicas.' },
  email: { type: String },
  phone: { type: String },
  location: { type: String },
  github: { type: String },
  linkedin: { type: String },
  skills: [{ type: String }],
  // Cartel bloqueante en el sitio público. El admin y los links con token
  // (propuesta, contrato, onboarding, portal) siguen accesibles.
  maintenance: {
    enabled: { type: Boolean, default: false },
    title:   { type: String, default: 'Estamos en mantenimiento' },
    message: { type: String, default: 'Estamos haciendo mejoras en el sitio. Volvé en un rato o escribinos por WhatsApp.' },
  },
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);
