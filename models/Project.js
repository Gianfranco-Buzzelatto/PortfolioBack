import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  longDescription: { type: String },
  technologies: [{ type: String }],
  category: { type: String, enum: ['web', 'mobile', 'design', 'backend', 'fullstack', 'otro'], default: 'web' },
  imageUrl: { type: String },
  demoUrl:  { type: String },
  liveUrl: { type: String },
  githubUrl: { type: String },
  featured: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);
