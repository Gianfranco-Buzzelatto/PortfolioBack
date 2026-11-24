import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { connectDB } from '../db/connect.js';

dotenv.config();

const email = String(process.argv[2] || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = String(process.argv[3] || process.env.ADMIN_PASSWORD || '');
const username = String(process.argv[4] || process.env.ADMIN_USERNAME || '').trim() || email.split('@')[0];

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
  console.error('Uso: npm run create-admin -- <email> <password de 8+ caracteres> [username]');
  process.exit(1);
}

await connectDB();

const exists = await User.findOne({ $or: [{ email }, { username }] });
if (exists) {
  console.error(`Ya existe un admin con ese ${exists.email === email ? 'email' : 'usuario'} (${exists.email} / ${exists.username}).`);
  console.error('Usá otro email/usuario, o npm run reset-admin para cambiarle la clave al existente.');
  await mongoose.disconnect();
  process.exit(1);
}

const user = await User.create({ username, email, password });
console.log(`Admin creado: ${user.email} (usuario: ${user.username})`);

const all = await User.find().select('email username').lean();
console.log('Admins en la base:', all.map((u) => `${u.email} [${u.username}]`).join(', '));

await mongoose.disconnect();
process.exit(0);
