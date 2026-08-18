import express from 'express';
import Client from '../models/Client.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

const STAGES = ['activo', 'revision', 'entregado', 'mantenimiento'];
const CREATE_FIELDS = [
  'quoteRef', 'clientName', 'email', 'projectType', 'tech', 'projectName',
  'features', 'finalPrice', 'currency', 'deadline', 'revisions',
  'maintenancePlan',
];
const UPDATE_FIELDS = [
  'notes', 'stagingUrl', 'productionUrl', 'adminUrl', 'maintenancePlan',
  'tech', 'projectName',
];

const pick = (body, keys) => {
  const out = {};
  keys.forEach((key) => {
    if (body[key] !== undefined) out[key] = body[key];
  });
  return out;
};

router.get('/', async (req, res) => {
  try {
    const { stage } = req.query;
    const filter = stage ? { stage } : {};
    const clients = await Client.find(filter).sort({ createdAt: -1 });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = pick(req.body, CREATE_FIELDS);
    const client = new Client({
      ...data,
      stage: 'activo',
      stageHistory: [{ stage: 'activo', date: new Date() }],
    });
    await client.save();
    res.status(201).json(client);
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
        },
      };
      updateOp.$inc = { revisionsUsed: 1 };
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

    if (Object.keys($set).length > 0) updateOp.$set = $set;

    if (Object.keys(updateOp).length === 0) {
      return res.json(client);
    }

    const updated = await Client.findByIdAndUpdate(req.params.id, updateOp, {
      new: true,
      runValidators: true,
    });
    res.json(updated);
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
