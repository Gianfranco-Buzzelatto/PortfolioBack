import express from 'express';
import Client from '../models/Client.js';
import Quote from '../models/Quote.js';
import { protect } from '../middleware/auth.js';
import { ensurePortalToken } from '../utils/portal.js';
import { startWarranty } from '../utils/warranty.js';
import { buildKickoff, sanitizeKickoffPatch } from '../utils/kickoff.js';

const router = express.Router();
router.use(protect);

const STAGES = ['activo', 'revision', 'entregado', 'mantenimiento'];
const CREATE_FIELDS = [
  'quoteRef', 'clientName', 'email', 'projectType', 'tech', 'projectName',
  'features', 'finalPrice', 'currency', 'deadline', 'revisions',
  'maintenancePlan', 'onboarding',
];
const UPDATE_FIELDS = [
  'notes', 'stagingUrl', 'productionUrl', 'adminUrl', 'maintenancePlan',
  'tech', 'projectName',
];

const FICHE_KEYS = [
  'domain', 'hosting', 'frontend', 'backend', 'database', 'storage',
  'emails', 'payments', 'whatsapp', 'analytics', 'apis', 'accessesNotes',
];

function sanitizeTechFiche(raw = {}) {
  const out = {};
  FICHE_KEYS.forEach((key) => {
    const max = key === 'accessesNotes' || key === 'apis' ? 2000 : 400;
    out[key] = String(raw[key] || '').trim().slice(0, max);
  });
  return out;
}

function techFicheFromOnboarding(onboarding = {}) {
  return sanitizeTechFiche({
    domain: onboarding.infra?.domain || '',
    hosting: onboarding.infra?.hosting || '',
    emails: onboarding.infra?.emailProvider || '',
    payments: onboarding.infra?.paymentAccount || '',
    accessesNotes: onboarding.accessesNotes || '',
  });
}

const pick = (body, keys) => {
  const out = {};
  keys.forEach((key) => {
    if (body[key] !== undefined) out[key] = body[key];
  });
  return out;
};

function withKickoff(client) {
  const obj = client.toObject ? client.toObject() : client;
  return { ...obj, kickoffStatus: buildKickoff(client) };
}

router.get('/', async (req, res) => {
  try {
    const { stage } = req.query;
    const filter = stage ? { stage } : {};
    const clients = await Client.find(filter).sort({ createdAt: -1 });
    res.json(clients.map(withKickoff));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(withKickoff(client));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/portal-link', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' });
    ensurePortalToken(client);
    await client.save();
    res.json({
      token: client.portalToken,
      path: `/portal/${client.portalToken}`,
      client: withKickoff(client),
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = pick(req.body, CREATE_FIELDS);
    if (req.body.techFiche && typeof req.body.techFiche === 'object') {
      data.techFiche = sanitizeTechFiche(req.body.techFiche);
    }
    if (data.quoteRef) {
      const quote = await Quote.findById(data.quoteRef);
      if (quote?.onboarding?.submittedAt) {
        data.onboarding = quote.onboarding;
        data.techFiche = {
          ...techFicheFromOnboarding(quote.onboarding),
          ...(data.techFiche || {}),
        };
      }
    }
    const client = new Client({
      ...data,
      stage: 'activo',
      stageHistory: [{ stage: 'activo', date: new Date() }],
    });
    ensurePortalToken(client);
    await client.save();
    res.status(201).json({
      ...client.toObject(),
      portalPath: `/portal/${client.portalToken}`,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });

    const $set = pick(req.body, UPDATE_FIELDS);
    const updateOp = {};

    if (req.body.stage && STAGES.includes(req.body.stage) && req.body.stage !== client.stage) {
      $set.stage = req.body.stage;
      updateOp.$push = {
        ...(updateOp.$push || {}),
        stageHistory: { stage: req.body.stage, date: new Date() },
      };
      if (req.body.stage === 'entregado') {
        $set.warranty = startWarranty(client.warranty?.toObject?.() || client.warranty || {});
      }
      if (req.body.stage === 'mantenimiento') {
        const care = { ...(client.care?.toObject?.() || client.care || {}) };
        care.status = 'active';
        $set.care = care;
        if (client.maintenancePlan) {
          $set.maintenancePlan = {
            ...(client.maintenancePlan.toObject?.() || client.maintenancePlan),
            startDate: client.maintenancePlan.startDate || new Date(),
          };
        }
      }
    }

    if (req.body.revision?.description) {
      const status = ['pendiente', 'aprobado', 'fuera-de-alcance'].includes(req.body.revision.status)
        ? req.body.revision.status
        : 'pendiente';
      updateOp.$push = {
        ...(updateOp.$push || {}),
        revisionsList: {
          description: String(req.body.revision.description).trim().slice(0, 500),
          status,
          date: new Date(),
          fromClient: false,
        },
      };
      updateOp.$inc = { revisionsUsed: 1 };
    }

    const clientUpdate = String(req.body.clientUpdate || '').trim().slice(0, 600);
    if (clientUpdate) {
      updateOp.$push = {
        ...(updateOp.$push || {}),
        updates: { message: clientUpdate, date: new Date() },
      };
    }

    if (req.body.care && typeof req.body.care === 'object') {
      const care = { ...(client.care?.toObject?.() || client.care || {}) };
      if (['none', 'offered', 'active', 'declined', 'paused'].includes(req.body.care.status)) {
        care.status = req.body.care.status;
        if (req.body.care.status === 'offered') care.offeredAt = new Date();
      }
      if (req.body.care.checkInAt !== undefined) {
        care.checkInAt = String(req.body.care.checkInAt || '').trim().slice(0, 40);
      }
      $set.care = care;
    }

    if (req.body.techFiche && typeof req.body.techFiche === 'object') {
      $set.techFiche = {
        ...(client.techFiche?.toObject?.() || client.techFiche || {}),
        ...sanitizeTechFiche(req.body.techFiche),
      };
    }

    if (req.body.payments && typeof req.body.payments === 'object') {
      const payments = { ...(client.payments?.toObject?.() || client.payments || {}) };
      ['startPaid', 'midPaid', 'endPaid'].forEach((key) => {
        if (typeof req.body.payments[key] === 'boolean') payments[key] = req.body.payments[key];
      });
      const now = new Date();
      if (req.body.payments.startPaid === true) payments.startDate = now;
      if (req.body.payments.midPaid === true) payments.midDate = now;
      if (req.body.payments.endPaid === true) payments.endDate = now;
      $set.payments = payments;
    }

    if (req.body.kickoff?.checks && typeof req.body.kickoff.checks === 'object') {
      const prev = client.kickoff?.checks || {};
      const patch = sanitizeKickoffPatch(req.body.kickoff.checks);
      $set.kickoff = {
        checks: { ...prev, ...patch },
      };
    }

    const ticketStatus = req.body.warrantyTicketStatus;
    const ticketId = req.body.warrantyTicketId;
    const arrayFilters = [];
    if (ticketId && ['pendiente', 'cubierto', 'fuera-de-alcance'].includes(ticketStatus)) {
      $set['warrantyTickets.$[ticket].status'] = ticketStatus;
      arrayFilters.push({ 'ticket._id': ticketId });
    }

    if (Object.keys($set).length > 0) updateOp.$set = $set;

    if (Object.keys(updateOp).length === 0) {
      return res.json(client);
    }

    const updated = await Client.findByIdAndUpdate(req.params.id, updateOp, {
      new: true,
      runValidators: true,
      ...(arrayFilters.length ? { arrayFilters } : {}),
    });
    res.json(withKickoff(updated));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Client.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
