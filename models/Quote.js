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
  objective:   { type: String },
  business:    { type: String },
  presence:    { type: String },
  source:      { type: String },
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

  basePrice:  { type: Number },  // suma de features sin ajustes (plan media, compat)
  finalPrice: { type: Number },  // precio final del plan destacado

  plans: [{
    key:          { type: String, enum: ['base', 'media', 'premium'] },
    label:        { type: String },
    features:     [featureSchema],
    customFeatures: [featureSchema],
    deadline:     { type: Number },
    revisions:    { type: Number },
    basePrice:    { type: Number },
    finalPrice:   { type: Number },
  }],
  selectedPlan: { type: String, enum: ['base', 'media', 'premium'] },
  premiumType:  { type: String, enum: ['tienda', 'sistema', 'pedidos'], default: 'tienda' },
  projectCategory: {
    type: String,
    enum: ['landing', 'institucional', 'ecommerce', 'pedidos', 'sistema'],
    default: 'landing',
  },
  carePlan: {
    included: { type: Boolean, default: true },
    tier:     { type: String, enum: ['basico', 'intermedio', 'premium'], default: 'intermedio' },
    price:    { type: Number, default: 55 },
    minMonths:{ type: Number, default: 3 },
  },

  aiProposal: { type: mongoose.Schema.Types.Mixed },

  adminNotes: { type: String },
  clientLogo: { type: String },

  // ── Estado ──
  stage: {
    type: String,
    enum: ['pendiente', 'activo', 'revision', 'entregado', 'mantenimiento'],
    default: 'pendiente',
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'quoted', 'sent', 'accepted', 'rejected'],
    default: 'pending',
  },
}, { timestamps: true });

export default mongoose.model('Quote', quoteSchema);