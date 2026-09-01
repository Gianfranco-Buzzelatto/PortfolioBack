import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { connectDB } from '../db/connect.js';

dotenv.config();

const email = process.argv[2] || process.env.ADMIN_EMAIL;
const password = process.argv[3] || process.env.ADMIN_PASSWORD;
const username = process.argv[4] || process.env.ADMIN_USERNAME || 'admin';

if (!email || !password || password.length < 12) {
  console.error('Uso: npm run reset-admin -- <email> <password de 12+ caracteres> [username]');
  console.error('También podés usar ADMIN_EMAIL / ADMIN_PASSWORD en el entorno.');
  process.exit(1);
}

await connectDB();

let user = await User.findOne({ email });

if (!user) {
  const count = await User.countDocuments();
  if (count > 0) {
    user = await User.findOne();
    console.log(`No existe ${email}. Actualizando usuario: ${user.email}`);
  } else {
    user = await User.create({ username, email, password });
    console.log(`Admin creado: ${email}`);
    process.exit(0);
  }
}

user.password = password;
if (username) user.username = username;
await user.save();

console.log(`Contraseña actualizada para: ${user.email}`);
console.log(`Usuario: ${user.username}`);
process.exit(0);
