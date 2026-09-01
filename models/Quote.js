import mongoose from 'mongoose';

const featureSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  price:    { type: Number, required: true },
  category: { type: String, default: 'General' },
}, { _id: false });

const quoteSchema = new mongoose.Schema({
  // ── Datos del cliente (form público / brief) ──
  clientName:  { type: String, required: true },
  // El formulario público sigue exigiendo email; las cargadas a mano desde el
  // admin pueden arrancar solo con WhatsApp y completarlo después.
  email:       { type: String },
  projectType: { type: String, required: true },
  description: { type: String },
  objective:   { type: String },
  business:    { type: String },
  presence:    { type: String },
  source:      { type: String },
  budget:      { type: String },
  whatsapp:    { type: String },
  need:        { type: String },
  audience:    { type: String },
  servicesProducts: { type: String },
  requestedFeatures: [{ type: String }],
  infra: {
    domain:  { type: String, default: '' },
    hosting: { type: String, default: '' },
    brand:   { type: String, default: '' },
    content: { type: String, default: '' },
    photos:  { type: String, default: '' },
    social:  { type: String, default: '' },
  },
  needs: {
    seo:          { type: String, default: '' },
    pwa:          { type: String, default: '' },
    multilang:    { type: String, default: '' },
    integrations: { type: String, default: '' },
  },
  successMetric: { type: String },
  outOfScope:    { type: String },
  launchDate:  { type: String },
  references:  { type: String },

  // ── Calificación / discovery ──
  leadScore: {
    type: String,
    enum: ['green', 'yellow', 'red'],
    default: 'yellow',
  },
  leadScoreReasons: [{ type: String }],
  suggestedAction: {
    type: String,
    enum: ['contactar', 'agendar', 'pedir_info', 'archivar'],
    default: 'pedir_info',
  },
  discovery: {
    scheduledAt: { type: String, default: '' },
    notes:       { type: String, default: '' },
    done:        { type: Boolean, default: false },
  },

  // ── Aceptación pública ──
  acceptToken: { type: String },
  acceptTokenCreatedAt: { type: Date },
  acceptance: {
    acceptedAt:   { type: Date },
    clientName:   { type: String },
    email:        { type: String },
    selectedPlan: { type: String },
    ip:           { type: String },
    userAgent:    { type: String },
  },

  contract: {
    version:    { type: String },
    acceptedAt: { type: Date },
    clientName: { type: String },
    email:      { type: String },
    ip:         { type: String },
    userAgent:  { type: String },
  },

  onboarding: {
    submittedAt: { type: Date },
    brand: {
      hasLogo:   { type: String, default: '' },
      hasColors: { type: String, default: '' },
      hasFonts:  { type: String, default: '' },
      assetLinks:{ type: String, default: '' },
      notes:     { type: String, default: '' },
    },
    content: {
      hasTexts:  { type: String, default: '' },
      hasPhotos: { type: String, default: '' },
      hasVideos: { type: String, default: '' },
      notes:     { type: String, default: '' },
    },
    infra: {
      domain:         { type: String, default: '' },
      hosting:        { type: String, default: '' },
      emailProvider:  { type: String, default: '' },
      paymentAccount: { type: String, default: '' },
      notes:          { type: String, default: '' },
    },
    accessesNotes: { type: String, default: '' },
    references:    { type: String, default: '' },
    extra:         { type: String, default: '' },
    approver: {
      name: { type: String, default: '' },
      role: { type: String, default: '' },
    },
    billing: {
      businessName: { type: String, default: '' },
      taxId:        { type: String, default: '' },
      email:        { type: String, default: '' },
    },
  },

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
    enum: ['landing', 'institucional', 'ecommerce', 'pedidos', 'turnero', 'sistema'],
    default: 'landing',
  },
  carePlan: {
    included: { type: Boolean, default: true },
    tier:     { type: String, enum: ['basico', 'intermedio', 'premium'], default: 'intermedio' },
    price:    { type: Number, default: 55 },
    minMonths:{ type: Number, default: 3 },
  },

  aiProposal: { type: mongoose.Schema.Types.Mixed },

  /** Texto editable de la propuesta (recomendación + FAQs) para PDF / WhatsApp */
  proposalCopy: { type: mongoose.Schema.Types.Mixed },

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