import dotenv from 'dotenv';
import { connectDB } from '../db/connect.js';
import { replaceShowcaseProjects } from './seed-projects.js';

dotenv.config();

await connectDB();
await replaceShowcaseProjects();
process.exit(0);
