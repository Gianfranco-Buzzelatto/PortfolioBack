import mongoose from 'mongoose';

const RevisionSchema = new mongoose.Schema({
  description: { type: String, required: true },
  status:      { type: String, enum: ['pendiente', 'aprobado', 'fuera-de-alcance'], default: 'pendiente' },
  date:        { type: Date,   default: Date.now },
  fromClient:  { type: Boolean, default: false },
}, { _id: false });

const StageHistorySchema = new mongoose.Schema({
  stage: { type: String },
  date:  { type: Date, default: Date.now },
  note:  { type: String },
}, { _id: false });

const MaintenancePlanSchema = new mongoose.Schema({
  price:     Number,
  currency:  { type: String, default: 'USD' },
  includes:  [String],
  startDate: Date,
}, { _id: false });

const FeatureSchema = new mongoose.Schema({
  name:     String,
  price:    Number,
  category: String,
}, { _id: false });

const ClientSchema = new mongoose.Schema({
  quoteRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' },

  clientName:  { type: String, required: true },
  email:       { type: String, required: true },
  projectType: { type: String, required: true },
  tech:        { type: String },

  projectName: { type: String },
  features:    [FeatureSchema],
  finalPrice:  { type: Number },
  currency:    { type: String, default: 'USD' },
  deadline:    { type: Number },
  revisions:   { type: Number, default: 3 },

  stage: {
    type:    String,
    enum:    ['activo', 'revision', 'entregado', 'mantenimiento'],
    default: 'activo',
  },
  stageHistory: [StageHistorySchema],

  payments: {
    startPaid: { type: Boolean, default: false },
    midPaid:   { type: Boolean, default: false },
    endPaid:   { type: Boolean, default: false },
    startDate: Date,
    midDate:   Date,
    endDate:   Date,
  },

  revisionsList: [RevisionSchema],
  revisionsUsed: { type: Number, default: 0 },

  stagingUrl:    { type: String },
  productionUrl: { type: String },
  adminUrl:      { type: String },

  maintenancePlan: MaintenancePlanSchema,

  warranty: {
    days:        { type: Number, default: 15 },
    deliveredAt: { type: Date },
    endsAt:      { type: Date },
  },
  warrantyTickets: [{
    description: { type: String, required: true },
    status:      { type: String, enum: ['pendiente', 'cubierto', 'fuera-de-alcance'], default: 'pendiente' },
    date:        { type: Date, default: Date.now },
    fromClient:  { type: Boolean, default: false },
  }],
  care: {
    status:    { type: String, enum: ['none', 'offered', 'active', 'declined', 'paused'], default: 'none' },
    offeredAt: { type: Date },
    checkInAt: { type: String, default: '' },
  },

  techFiche: {
    domain:        { type: String, default: '' },
    hosting:       { type: String, default: '' },
    frontend:      { type: String, default: '' },
    backend:       { type: String, default: '' },
    database:      { type: String, default: '' },
    storage:       { type: String, default: '' },
    emails:        { type: String, default: '' },
    payments:      { type: String, default: '' },
    whatsapp:      { type: String, default: '' },
    analytics:     { type: String, default: '' },
    apis:          { type: String, default: '' },
    accessesNotes: { type: String, default: '' },
  },

  onboarding: { type: mongoose.Schema.Types.Mixed },

  kickoff: {
    checks: { type: mongoose.Schema.Types.Mixed, default: {} },
  },

  notes: { type: String },

  portalToken: { type: String },
  portalTokenCreatedAt: { type: Date },
  updates: [{
    message: { type: String },
    date:    { type: Date, default: Date.now },
  }],

}, { timestamps: true });

export default mongoose.model('Client', ClientSchema);
