import crypto from 'crypto'
import express from 'express'
import rateLimit from 'express-rate-limit'
import Quote from '../models/Quote.js'
import { protect } from '../middleware/auth.js'
import { notifyNewQuote } from '../utils/mailer.js'
import { generateQuoteProposal, publicProposal } from '../utils/quoteAgent.js'
import { scoreLead } from '../utils/leadScore.js'
import { buildContractContent } from '../utils/contractContent.js'
import { ensurePortalToken } from '../utils/portal.js'
import Client from '../models/Client.js'

const router = express.Router()

const publicQuoteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiadas consultas. Probá más tarde o escribinos por WhatsApp.' },
})

const acceptLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos. Probá más tarde.' },
})

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
  'need',
  'audience',
  'servicesProducts',
  'requestedFeatures',
  'infra',
  'needs',
  'successMetric',
  'outOfScope',
  'launchDate',
  'references',
]

const FEATURE_ALLOW = new Set([
  'landing', 'institucional', 'ecommerce', 'sistema', 'turnero',
  'login', 'admin', 'database', 'mercadopago', 'whatsapp',
  'emails', 'catalogo', 'analytics',
])

const INFRA_ALLOW = new Set(['si', 'no', 'parcial', 'ns', ''])
const INFRA_KEYS = ['domain', 'hosting', 'brand', 'content', 'photos', 'social']
const NEED_KEYS = ['seo', 'pwa', 'multilang', 'integrations']

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
  'proposalCopy',
  'adminNotes',
  'clientLogo',
  'stage',
  'status',
  'leadScore',
  'leadScoreReasons',
  'suggestedAction',
  'discovery',
]

const pick = (body, keys) => {
  const out = {}
  keys.forEach((key) => {
    if (body[key] !== undefined) out[key] = body[key]
  })
  return out
}

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())

function ensureAcceptToken(quote) {
  if (!quote.acceptToken) {
    quote.acceptToken = crypto.randomBytes(24).toString('hex')
    quote.acceptTokenCreatedAt = new Date()
  }
  return quote.acceptToken
}

function applyProposal(quoteDoc, proposal) {
  const fields = proposal.quoteFields || {}
  Object.assign(quoteDoc, fields)
  quoteDoc.aiProposal = publicProposal(proposal)
  if (!quoteDoc.projectName) quoteDoc.projectName = proposal.headline
  if (typeof quoteDoc.markModified === 'function') {
    quoteDoc.markModified('aiProposal')
    quoteDoc.markModified('proposalCopy')
    quoteDoc.markModified('plans')
    quoteDoc.markModified('carePlan')
  }
}

function toPublicProposal(quote) {
  return {
    clientName: quote.clientName,
    projectName: quote.projectName || quote.projectType,
    projectType: quote.projectType,
    business: quote.business,
    plans: quote.plans || [],
    selectedPlan: quote.selectedPlan || 'media',
    finalPrice: quote.finalPrice,
    currency: quote.currency || 'USD',
    carePlan: quote.carePlan,
    deadline: quote.deadline,
    revisions: quote.revisions,
    status: quote.status,
    accepted: quote.status === 'accepted',
    acceptance: quote.acceptance?.acceptedAt
      ? { acceptedAt: quote.acceptance.acceptedAt, selectedPlan: quote.acceptance.selectedPlan }
      : null,
    contractAccepted: Boolean(quote.contract?.acceptedAt),
    onboardingSubmitted: Boolean(quote.onboarding?.submittedAt),
    nextPath: !quote.acceptance?.acceptedAt
      ? `/propuesta/${quote.acceptToken}`
      : !quote.contract?.acceptedAt
        ? `/contrato/${quote.acceptToken}`
        : !quote.onboarding?.submittedAt
          ? `/onboarding/${quote.acceptToken}`
          : null,
  }
}

function sanitizeOnboarding(body = {}) {
  const yesNo = (v) => ['si', 'no', 'parcial', ''].includes(String(v || '')) ? String(v || '') : ''
  return {
    brand: {
      hasLogo: yesNo(body.brand?.hasLogo),
      hasColors: yesNo(body.brand?.hasColors),
      hasFonts: yesNo(body.brand?.hasFonts),
      assetLinks: String(body.brand?.assetLinks || '').trim().slice(0, 1500),
      notes: String(body.brand?.notes || '').trim().slice(0, 1500),
    },
    content: {
      hasTexts: yesNo(body.content?.hasTexts),
      hasPhotos: yesNo(body.content?.hasPhotos),
      hasVideos: yesNo(body.content?.hasVideos),
      notes: String(body.content?.notes || '').trim().slice(0, 1500),
    },
    infra: {
      domain: String(body.infra?.domain || '').trim().slice(0, 200),
      hosting: String(body.infra?.hosting || '').trim().slice(0, 200),
      emailProvider: String(body.infra?.emailProvider || '').trim().slice(0, 200),
      paymentAccount: String(body.infra?.paymentAccount || '').trim().slice(0, 200),
      notes: String(body.infra?.notes || '').trim().slice(0, 1500),
    },
    accessesNotes: String(body.accessesNotes || '').trim().slice(0, 2000),
    references: String(body.references || '').trim().slice(0, 1500),
    extra: String(body.extra || '').trim().slice(0, 2000),
    approver: {
      name: String(body.approver?.name || '').trim().slice(0, 120),
      role: String(body.approver?.role || '').trim().slice(0, 120),
    },
    billing: {
      businessName: String(body.billing?.businessName || '').trim().slice(0, 160),
      taxId: String(body.billing?.taxId || '').trim().slice(0, 40),
      email: String(body.billing?.email || '').trim().toLowerCase().slice(0, 160),
    },
  }
}

function techFicheFromOnboarding(onboarding = {}) {
  return {
    domain: onboarding.infra?.domain || '',
    hosting: onboarding.infra?.hosting || '',
    emails: onboarding.infra?.emailProvider || '',
    payments: onboarding.infra?.paymentAccount || '',
    accessesNotes: onboarding.accessesNotes || '',
    frontend: '',
    backend: '',
    database: '',
    storage: '',
    whatsapp: '',
    analytics: '',
    apis: '',
  }
}

async function buildPublicQuoteData(body) {
  const data = pick(body, PUBLIC_FIELDS)
  data.clientName = String(data.clientName || '').trim().slice(0, 120)
  data.email = String(data.email || '').trim().toLowerCase().slice(0, 160)
  data.whatsapp = String(data.whatsapp || '').trim().slice(0, 40)
  data.projectType = String(data.projectType || '').trim().slice(0, 120)
  data.description = String(data.description || '').trim().slice(0, 4000)
  data.business = String(data.business || '').trim().slice(0, 200)
  data.objective = String(data.objective || '').trim().slice(0, 80)
  data.presence = String(data.presence || '').trim().slice(0, 40)
  data.budget = String(data.budget || '').trim().slice(0, 40)
  data.need = String(data.need || '').trim().slice(0, 800)
  data.audience = String(data.audience || '').trim().slice(0, 400)
  data.servicesProducts = String(data.servicesProducts || '').trim().slice(0, 600)
  data.launchDate = String(data.launchDate || '').trim().slice(0, 120)
  data.references = String(data.references || '').trim().slice(0, 1500)
  data.requestedFeatures = Array.isArray(body.requestedFeatures)
    ? body.requestedFeatures.map((f) => String(f).trim()).filter((f) => FEATURE_ALLOW.has(f)).slice(0, 20)
    : []
  const rawInfra = body.infra && typeof body.infra === 'object' ? body.infra : {}
  data.infra = {}
  INFRA_KEYS.forEach((key) => {
    const val = String(rawInfra[key] || '').trim()
    data.infra[key] = INFRA_ALLOW.has(val) ? val : ''
  })
  const rawNeeds = body.needs && typeof body.needs === 'object' ? body.needs : {}
  data.needs = {}
  NEED_KEYS.forEach((key) => {
    const val = String(rawNeeds[key] || '').trim()
    data.needs[key] = INFRA_ALLOW.has(val) ? val : ''
  })
  data.successMetric = String(body.successMetric || '').trim().slice(0, 400)
  data.outOfScope = String(body.outOfScope || '').trim().slice(0, 800)
  data.source = 'portfolio_onboarding'
  data.status = 'pending'
  data.stage = 'pendiente'

  const scored = scoreLead(data)
  Object.assign(data, scored)

  return data
}

router.post('/', publicQuoteLimiter, async (req, res) => {
  try {
    const data = await buildPublicQuoteData(req.body)

    if (!data.clientName || !isEmail(data.email) || !data.projectType) {
      return res.status(400).json({ message: 'Nombre, email y tipo de proyecto son requeridos' })
    }

    const quote = await Quote.create(data)
    notifyNewQuote(quote).catch(() => {})
    res.status(201).json({
      _id: quote._id,
      status: quote.status,
      leadScore: quote.leadScore,
      message: 'Consulta recibida',
    })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

/** Propuesta pública (sin auth) */
router.get('/proposal/:token', async (req, res) => {
  try {
    const quote = await Quote.findOne({ acceptToken: req.params.token })
    if (!quote) return res.status(404).json({ message: 'Propuesta no encontrada o link inválido' })
    if (!['quoted', 'sent', 'accepted'].includes(quote.status)) {
      return res.status(403).json({ message: 'Esta propuesta todavía no está disponible' })
    }
    if (!quote.plans?.length && !quote.finalPrice) {
      return res.status(403).json({ message: 'La propuesta aún no tiene precio' })
    }
    res.json(toPublicProposal(quote))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/proposal/:token/accept', acceptLimiter, async (req, res) => {
  try {
    const quote = await Quote.findOne({ acceptToken: req.params.token })
    if (!quote) return res.status(404).json({ message: 'Propuesta no encontrada o link inválido' })
    if (quote.status === 'accepted') {
      return res.json({ message: 'Ya estaba aceptada', proposal: toPublicProposal(quote) })
    }
    if (!['quoted', 'sent'].includes(quote.status)) {
      return res.status(403).json({ message: 'Esta propuesta no se puede aceptar en este estado' })
    }

    const selectedPlan = ['base', 'media', 'premium'].includes(req.body.selectedPlan)
      ? req.body.selectedPlan
      : (quote.selectedPlan || 'media')

    const clientName = String(req.body.clientName || quote.clientName).trim().slice(0, 120)
    const email = String(req.body.email || quote.email).trim().toLowerCase().slice(0, 160)
    if (!clientName || !isEmail(email)) {
      return res.status(400).json({ message: 'Nombre y email son requeridos para confirmar' })
    }

    quote.status = 'accepted'
    quote.selectedPlan = selectedPlan
    if (quote.plans?.length) {
      const plan = quote.plans.find((p) => p.key === selectedPlan)
      if (plan?.finalPrice != null) quote.finalPrice = plan.finalPrice
    }
    quote.acceptance = {
      acceptedAt: new Date(),
      clientName,
      email,
      selectedPlan,
      ip: req.ip,
      userAgent: String(req.get('user-agent') || '').slice(0, 300),
    }
    await quote.save()

    res.json({
      message: 'Propuesta aceptada',
      proposal: toPublicProposal(quote),
      nextPath: `/contrato/${quote.acceptToken}`,
    })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.get('/proposal/:token/contract', async (req, res) => {
  try {
    const quote = await Quote.findOne({ acceptToken: req.params.token })
    if (!quote) return res.status(404).json({ message: 'Contrato no encontrado' })
    if (quote.status !== 'accepted' && !quote.acceptance?.acceptedAt) {
      return res.status(403).json({ message: 'Primero hay que aceptar la propuesta' })
    }
    res.json({
      contract: buildContractContent(quote),
      accepted: Boolean(quote.contract?.acceptedAt),
      acceptance: quote.contract?.acceptedAt
        ? { acceptedAt: quote.contract.acceptedAt, clientName: quote.contract.clientName }
        : null,
      nextPath: quote.contract?.acceptedAt ? `/onboarding/${quote.acceptToken}` : null,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/proposal/:token/contract', acceptLimiter, async (req, res) => {
  try {
    const quote = await Quote.findOne({ acceptToken: req.params.token })
    if (!quote) return res.status(404).json({ message: 'Contrato no encontrado' })
    if (quote.status !== 'accepted' && !quote.acceptance?.acceptedAt) {
      return res.status(403).json({ message: 'Primero hay que aceptar la propuesta' })
    }
    if (quote.contract?.acceptedAt) {
      return res.json({
        message: 'El contrato ya estaba aceptado',
        nextPath: `/onboarding/${quote.acceptToken}`,
      })
    }
    if (req.body.accept !== true) {
      return res.status(400).json({ message: 'Debés aceptar las condiciones para continuar' })
    }

    const clientName = String(req.body.clientName || quote.acceptance?.clientName || quote.clientName).trim().slice(0, 120)
    const email = String(req.body.email || quote.acceptance?.email || quote.email).trim().toLowerCase().slice(0, 160)
    if (!clientName || !isEmail(email)) {
      return res.status(400).json({ message: 'Nombre y email son requeridos' })
    }

    const content = buildContractContent(quote)
    quote.contract = {
      version: content.version,
      acceptedAt: new Date(),
      clientName,
      email,
      ip: req.ip,
      userAgent: String(req.get('user-agent') || '').slice(0, 300),
    }
    await quote.save()

    res.json({
      message: 'Contrato aceptado',
      nextPath: `/onboarding/${quote.acceptToken}`,
      acceptance: { acceptedAt: quote.contract.acceptedAt, clientName },
    })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.get('/proposal/:token/onboarding', async (req, res) => {
  try {
    const quote = await Quote.findOne({ acceptToken: req.params.token })
    if (!quote) return res.status(404).json({ message: 'Onboarding no encontrado' })
    if (!quote.contract?.acceptedAt) {
      return res.status(403).json({ message: 'Primero hay que aceptar el contrato' })
    }
    res.json({
      clientName: quote.clientName,
      business: quote.business,
      projectName: quote.projectName || quote.projectType,
      submitted: Boolean(quote.onboarding?.submittedAt),
      onboarding: quote.onboarding || null,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/proposal/:token/onboarding', acceptLimiter, async (req, res) => {
  try {
    const quote = await Quote.findOne({ acceptToken: req.params.token })
    if (!quote) return res.status(404).json({ message: 'Onboarding no encontrado' })
    if (!quote.contract?.acceptedAt) {
      return res.status(403).json({ message: 'Primero hay que aceptar el contrato' })
    }

    const data = sanitizeOnboarding(req.body)
    quote.onboarding = { ...data, submittedAt: new Date() }
    await quote.save()

    let client = await Client.findOne({ quoteRef: quote._id })
    if (client) {
      ensurePortalToken(client)
      client.onboarding = quote.onboarding
      client.techFiche = {
        ...(client.techFiche?.toObject?.() || client.techFiche || {}),
        ...techFicheFromOnboarding(data),
      }
      await client.save()
    }

    res.json({
      message: 'Onboarding recibido',
      submitted: true,
      clientLinked: Boolean(client),
      portalPath: client ? `/portal/${client.portalToken}` : null,
    })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.get('/', protect, async (req, res) => {
  try {
    const { status, leadScore } = req.query
    const filter = {}
    if (status) filter.status = status
    if (leadScore) filter.leadScore = leadScore
    const quotes = await Quote.find(filter).sort({ createdAt: -1 })
    res.json(quotes)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/:id/share-link', protect, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id)
    if (!quote) return res.status(404).json({ message: 'No encontrada' })
    if (!quote.plans?.length && !quote.finalPrice) {
      return res.status(400).json({ message: 'Primero cotizá y guardá un precio' })
    }

    ensureAcceptToken(quote)
    if (quote.status === 'pending' || quote.status === 'reviewed' || quote.status === 'quoted') {
      quote.status = 'sent'
    }
    await quote.save()

    res.json({
      token: quote.acceptToken,
      status: quote.status,
      path: `/propuesta/${quote.acceptToken}`,
      quote,
    })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.get('/:id', protect, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id)
    if (!quote) return res.status(404).json({ message: 'No encontrada' })
    res.json(quote)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/:id/generate-ai', protect, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id)
    if (!quote) return res.status(404).json({ message: 'No encontrada' })

    const proposal = await generateQuoteProposal({
      clientName: quote.clientName,
      business: quote.business,
      objective: quote.objective,
      presence: quote.presence,
      budget: quote.budget,
      description: quote.description || quote.need,
    })

    applyProposal(quote, proposal)
    await quote.save()
    res.json(quote)
  } catch (err) {
    res.status(400).json({ message: err.message || 'No pude generar la propuesta.' })
  }
})

router.put('/:id', protect, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id)
    if (!quote) return res.status(404).json({ message: 'No encontrada' })

    const updates = pick(req.body, ADMIN_FIELDS)

    if (updates.discovery && typeof updates.discovery === 'object') {
      quote.discovery = {
        scheduledAt: String(updates.discovery.scheduledAt || quote.discovery?.scheduledAt || '').slice(0, 80),
        notes: String(updates.discovery.notes || quote.discovery?.notes || '').slice(0, 4000),
        done: Boolean(updates.discovery.done),
      }
      delete updates.discovery
    }

    Object.assign(quote, updates)

    if (updates.status === 'sent') {
      ensureAcceptToken(quote)
    }

    if (req.body.rescore === true) {
      Object.assign(quote, scoreLead(quote))
    }

    if (updates.proposalCopy !== undefined) quote.markModified('proposalCopy')
    if (updates.aiProposal !== undefined) quote.markModified('aiProposal')
    if (updates.plans !== undefined) quote.markModified('plans')
    if (updates.carePlan !== undefined) quote.markModified('carePlan')

    await quote.save()
    res.json(quote)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.delete('/:id', protect, async (req, res) => {
  try {
    await Quote.findByIdAndDelete(req.params.id)
    res.json({ message: 'Eliminada' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
