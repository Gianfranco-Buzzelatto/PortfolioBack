import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { connectDB } from '../db/connect.js';

dotenv.config();

const email = process.argv[2] || 'gianbuzzelatto@gmail.com';
const password = process.argv[3] || 'AdminPortfolio2026!';
const username = process.argv[4] || 'admin';

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
