import mongoose from 'mongoose';

const featureSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  price:    { type: Number, required: true },
  category: { type: String, default: 'General' },
}, { _id: false });

const quoteSchema = new mongoose.Schema({
  // ── Datos del cliente (form público) ──
  clientName:  { type: String, required: true },
  email:       { type: String, required: true },
  projectType: { type: String, required: true },
  description: { type: String },
  budget:      { type: String },   // rango que indica el cliente
  whatsapp:    { type: String },

  // ── Datos del wizard (admin) ──
  projectName:    { type: String },
  features:       [featureSchema],
  customFeatures: [featureSchema],

  discount:     { type: Number, default: 0 },   // %
  margin:       { type: Number, default: 0 },   // %
  urgency:      { type: String, enum: ['normal', 'urgente', 'muy-urgente'], default: 'normal' },
  deadline:     { type: Number, default: 30 },  // días
  revisions:    { type: Number, default: 3 },
  currency:     { type: String, default: 'USD' },
  exchangeRate: { type: Number, default: 1 },

  basePrice:  { type: Number },  // suma de features sin ajustes
  finalPrice: { type: Number },  // precio final con todos los ajustes

  adminNotes: { type: String },

  // ── Estado ──
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'quoted', 'sent', 'accepted', 'rejected'],
    default: 'pending',
  },
}, { timestamps: true });

export default mongoose.model('Quote', quoteSchema);