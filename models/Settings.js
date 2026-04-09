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
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);
