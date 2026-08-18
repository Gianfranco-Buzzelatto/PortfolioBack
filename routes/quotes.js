import express from 'express';
import rateLimit from 'express-rate-limit';
import Quote from '../models/Quote.js';
import { protect } from '../middleware/auth.js';
import { notifyNewQuote } from '../utils/mailer.js';
import { generateQuoteProposal, publicProposal } from '../utils/quoteAgent.js';

const router = express.Router();

const publicQuoteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiadas consultas. Probá más tarde o escribinos por WhatsApp.' },
});

const publicAiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 4,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'El agente está ocupado. Probá más tarde o escribinos por WhatsApp.' },
});

const PUBLIC_FIELDS = [
  'clientName',
  'email',
  'whatsapp',
  'projectType',
  'description',
  'objective',
  'business',
  'presence',
  'source',
  'budget',
];

const ADMIN_FIELDS = [
  ...PUBLIC_FIELDS,
  'projectName',
  'features',
  'customFeatures',
  'discount',
  'margin',
  'urgency',
  'deadline',
  'revisions',
  'currency',
  'exchangeRate',
  'basePrice',
  'finalPrice',
  'plans',
  'selectedPlan',
  'premiumType',
  'projectCategory',
  'carePlan',
  'aiProposal',
  'adminNotes',
  'clientLogo',
  'stage',
  'status',
];

const pick = (body, keys) => {
  const out = {};
  keys.forEach((key) => {
    if (body[key] !== undefined) out[key] = body[key];
  });
  return out;
};

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

function applyProposal(quoteDoc, proposal) {
  const fields = proposal.quoteFields || {};
  Object.assign(quoteDoc, fields);
  quoteDoc.aiProposal = publicProposal(proposal);
  quoteDoc.projectType = `${proposal.planLabel} · ${proposal.categoryLabel}`;
  if (typeof quoteDoc.markModified === 'function') {
    quoteDoc.markModified('aiProposal');
    quoteDoc.markModified('plans');
    quoteDoc.markModified('carePlan');
  }
}

async function buildPublicQuoteData(body) {
  const data = pick(body, PUBLIC_FIELDS);
  data.clientName = String(data.clientName || '').trim().slice(0, 120);
  data.email = String(data.email || '').trim().toLowerCase().slice(0, 160);
  data.whatsapp = String(data.whatsapp || '').trim().slice(0, 40);
  data.projectType = String(data.projectType || '').trim().slice(0, 120);
  data.description = String(data.description || '').trim().slice(0, 4000);
  data.business = String(data.business || '').trim().slice(0, 200);
  data.objective = String(data.objective || '').trim().slice(0, 80);
  data.presence = String(data.presence || '').trim().slice(0, 40);
  data.budget = String(data.budget || '').trim().slice(0, 40);
  data.source = body.generateWithAi ? 'portfolio_ai' : 'portfolio_onboarding';
  data.status = 'pending';
  data.stage = 'pendiente';
  return data;
}

router.post('/', publicQuoteLimiter, async (req, res) => {
  try {
    const generateWithAi = Boolean(req.body?.generateWithAi);
    const data = await buildPublicQuoteData(req.body);

    if (!data.clientName || !isEmail(data.email) || !data.projectType) {
      return res.status(400).json({ message: 'Nombre, email y tipo de proyecto son requeridos' });
    }

    const quote = new Quote(data);
    let proposal = null;

    if (generateWithAi) {
      proposal = await generateQuoteProposal({
        clientName: data.clientName,
        business: data.business,
        objective: data.objective,
        presence: data.presence,
        budget: data.budget,
        description: data.description,
      });
      applyProposal(quote, proposal);
    }

    await quote.save();
    notifyNewQuote(quote).catch(() => {});
    res.status(201).json({
      _id: quote._id,
      status: quote.status,
      message: 'Consulta recibida',
      proposal: generateWithAi ? publicProposal(proposal) : null,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/ai', publicAiLimiter, async (req, res) => {
  try {
    const data = await buildPublicQuoteData({ ...req.body, generateWithAi: true });
    if (!data.clientName || !isEmail(data.email)) {
      return res.status(400).json({ message: 'Nombre y email son requeridos' });
    }
    if (!data.description || data.description.length < 30) {
      return res.status(400).json({ message: 'Contame un poco más la idea (al menos un párrafo corto).' });
    }
    if (!data.projectType) {
      data.projectType = 'Propuesta con agente IA';
    }

    const proposal = await generateQuoteProposal({
      clientName: data.clientName,
      business: data.business,
      objective: data.objective || 'agente_ia',
      presence: data.presence,
      budget: data.budget,
      description: data.description,
    });

    const quote = new Quote(data);
    applyProposal(quote, proposal);
    await quote.save();
    notifyNewQuote(quote).catch(() => {});

    res.status(201).json({
      _id: quote._id,
      status: quote.status,
      proposal: publicProposal(proposal),
    });
  } catch (err) {
    res.status(400).json({ message: err.message || 'No pude armar la propuesta ahora.' });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const quotes = await Quote.find(filter).sort({ createdAt: -1 });
    res.json(quotes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: 'No encontrada' });
    res.json(quote);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/generate-ai', protect, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: 'No encontrada' });

    const proposal = await generateQuoteProposal({
      clientName: quote.clientName,
      business: quote.business,
      objective: quote.objective,
      presence: quote.presence,
      budget: quote.budget,
      description: quote.description,
    });

    applyProposal(quote, proposal);
    await quote.save();
    res.json(quote);
  } catch (err) {
    res.status(400).json({ message: err.message || 'No pude generar la propuesta.' });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const quote = await Quote.findByIdAndUpdate(
      req.params.id,
      pick(req.body, ADMIN_FIELDS),
      { new: true, runValidators: true }
    );
    if (!quote) return res.status(404).json({ message: 'No encontrada' });
    res.json(quote);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await Quote.findByIdAndDelete(req.params.id);
    res.json({ message: 'Eliminada' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
