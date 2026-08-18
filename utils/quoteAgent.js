import {
  PROJECT_CATEGORIES,
  CARE_PLANS,
  ADDON_CATALOG,
  getCategory,
} from '../data/quoteCatalog.js'

const CATEGORY_KEYS = Object.keys(PROJECT_CATEGORIES)
const PLAN_KEYS = ['base', 'media', 'premium']
const CARE_KEYS = Object.keys(CARE_PLANS)
const PLAN_LABEL = { base: 'Básico', media: 'Intermedio', premium: 'Premium' }
const PREMIUM_TYPE = {
  landing: 'tienda',
  institucional: 'tienda',
  ecommerce: 'tienda',
  pedidos: 'pedidos',
  sistema: 'sistema',
}

const ADDON_INDEX = Object.entries(ADDON_CATALOG).flatMap(([category, items]) =>
  items.map((item) => ({ ...item, category }))
)

function clip(value, max) {
  return String(value || '').trim().slice(0, max)
}

function flattenAddons() {
  return ADDON_INDEX.map((a) => `${a.name} (USD ${a.price})`).join('; ')
}

function catalogForPrompt() {
  return CATEGORY_KEYS.map((key) => {
    const cat = PROJECT_CATEGORIES[key]
    const tiers = PLAN_KEYS.map((plan) => {
      const t = cat.tiers[plan]
      return `  ${PLAN_LABEL[plan]}: USD ${t.priceRange[0]}–${t.priceRange[1]} · ${t.deadline} días · ${t.includes.join(', ')}`
    }).join('\n')
    return `${cat.label} [${key}]\n  Sirve: ${cat.fitFor}\n  No sirve: ${cat.notFor}\n${tiers}`
  }).join('\n\n')
}

function findAddon(name) {
  const needle = String(name || '').trim().toLowerCase()
  return ADDON_INDEX.find((a) => a.name.toLowerCase() === needle) || null
}

function detectCategory(brief = {}) {
  const text = `${brief.description || ''} ${brief.business || ''} ${brief.objective || ''}`.toLowerCase()
  const objective = brief.objective
  const foodOp = /restaurant|restaurante|delivery|men[uú]|comida|take ?away|cocina|kiosco|panader/.test(text)

  if (objective === 'pedidos_delivery') return 'pedidos'
  if (objective === 'vender_online') return foodOp ? 'pedidos' : 'ecommerce'
  if (objective === 'procesos_internos' || /sistema|erp|inventario|turnos|excel|interno/.test(text)) {
    return 'sistema'
  }
  if (objective === 'mostrar_contacto' || /landing|una p[aá]gina|solo whatsapp/.test(text)) {
    return 'landing'
  }
  if (foodOp) return 'pedidos'
  if (/tienda|e-?commerce|mercadopago|carrito|cat[aá]logo de productos|vender online/.test(text)) {
    return 'ecommerce'
  }
  if (objective === 'asesoramiento') return 'institucional'
  return 'institucional'
}

function detectPlan(brief = {}, category) {
  const budget = brief.budget || ''
  if (budget === 'hasta_500') return category === 'landing' ? 'base' : 'base'
  if (budget === '2500_plus') return 'premium'
  if (budget === '500_1000' && category === 'landing') return 'premium'
  if (['ecommerce', 'pedidos', 'sistema'].includes(category) && budget === 'hasta_500') return 'base'
  if (category === 'sistema' || category === 'pedidos') return 'media'
  return 'media'
}

function heuristicDraft(brief = {}) {
  const projectCategory = detectCategory(brief)
  const recommendedPlan = detectPlan(brief, projectCategory)
  const cat = getCategory(projectCategory)
  const biz = clip(brief.business, 80) || 'tu negocio'
  const carePlan = ['ecommerce', 'pedidos', 'sistema'].includes(projectCategory) ? 'intermedio' : 'basico'

  const considerations = {
    landing: [
      'Textos claros de qué hacés, para quién y cómo contactarte.',
      'Fotos reales del local, el equipo o el producto (no stock genérico).',
      'Número de WhatsApp y, si ya lo tenés, dominio.',
      'Definir una sola acción principal: escribir, llamar o pedir turno.',
    ],
    institucional: [
      'Listado de servicios con una frase de para quién es cada uno.',
      'Fotos y una bio corta. Si hay equipo, nombres y roles.',
      'Dominio y correos @tudominio (se puede coordinar después).',
      'Quién va a actualizar contenido después de publicar.',
    ],
    ecommerce: [
      'Fotos y precios de los productos que querés cargar al arranque.',
      'Cuenta de Mercado Pago a tu nombre: el dinero entra a vos.',
      'Zonas y costos de envío, o si es solo retiro.',
      'Quién carga stock y responde consultas de pedidos.',
    ],
    pedidos: [
      'Menú o catálogo con precios actualizados.',
      'Horarios, zonas de entrega y tiempo estimado de preparación.',
      'Cuenta de Mercado Pago si cobrás online.',
      'Quién mira el panel en el turno (cocina / mostrador).',
    ],
    sistema: [
      'Mapear el proceso actual (aunque sea en Excel o WhatsApp).',
      'Quién usa el sistema y con qué permisos.',
      'Qué datos hay que migrar o cargar al inicio.',
      'Empezar por 1–2 módulos que duelen todos los días, no por “todo el ERP”.',
    ],
  }

  const nextSteps = [
    'Confirmamos alcance, plazos y el plan elegido.',
    'Seña del 40% para reservar fecha de arranque.',
    'Me pasás textos, fotos y accesos (dominio / Mercado Pago si aplica).',
    'Primera entrega para revisar juntos y ajustar.',
  ]

  return {
    projectCategory,
    recommendedPlan,
    carePlan,
    addons: [],
    headline: `${PLAN_LABEL[recommendedPlan]} · ${cat.label} para ${biz}`,
    whyItFits: `${cat.fitFor} Para ${biz}, este tipo de proyecto ordena la conversación con el cliente y deja de depender solo de redes o del boca a boca. ${cat.notFor}`,
    howItWorks: `Trabajamos por etapas: primero lo que hace falta para operar o vender, después pulimos. El plan ${PLAN_LABEL[recommendedPlan]} incluye lo listado en el catálogo, con ${cat.tiers[recommendedPlan].deadline} días hábiles de referencia y ${cat.tiers[recommendedPlan].revisions} rondas de revisión.`,
    considerations: considerations[projectCategory],
    nextSteps,
    outOfScope: [
      'Publicidad paga (Google / Meta) y community management.',
      'Redacción larga o sesión de fotos profesionales, salvo que se cotice aparte.',
      'Funciones que no están en el plan elegido: se presupuestan después.',
    ],
    risks: [
      'Si faltan textos o fotos, la fecha de publicación se corre.',
      'Cambiar de tipo de proyecto a mitad de camino (por ejemplo de landing a tienda) implica re-cotizar.',
    ],
  }
}

function sanitizeDraft(raw = {}, brief = {}) {
  const fallback = heuristicDraft(brief)
  const projectCategory = CATEGORY_KEYS.includes(raw.projectCategory)
    ? raw.projectCategory
    : fallback.projectCategory
  const recommendedPlan = PLAN_KEYS.includes(raw.recommendedPlan)
    ? raw.recommendedPlan
    : fallback.recommendedPlan
  const carePlan = CARE_KEYS.includes(raw.carePlan) ? raw.carePlan : fallback.carePlan

  const addons = (Array.isArray(raw.addons) ? raw.addons : [])
    .map((item) => {
      const found = findAddon(item?.name)
      if (!found) return null
      return {
        name: found.name,
        price: found.price,
        category: found.category,
        reason: clip(item.reason, 240),
      }
    })
    .filter(Boolean)
    .slice(0, 4)

  const list = (value, fallbackList) => {
    const arr = Array.isArray(value) ? value.map((v) => clip(v, 280)).filter(Boolean) : []
    return (arr.length ? arr : fallbackList).slice(0, 6)
  }

  return {
    projectCategory,
    recommendedPlan,
    carePlan,
    addons,
    headline: clip(raw.headline, 140) || fallback.headline,
    whyItFits: clip(raw.whyItFits, 900) || fallback.whyItFits,
    howItWorks: clip(raw.howItWorks, 900) || fallback.howItWorks,
    considerations: list(raw.considerations, fallback.considerations),
    nextSteps: list(raw.nextSteps, fallback.nextSteps),
    outOfScope: list(raw.outOfScope, fallback.outOfScope),
    risks: list(raw.risks, fallback.risks),
  }
}

function hydrateProposal(draft, source) {
  const cat = getCategory(draft.projectCategory)
  const tier = cat.tiers[draft.recommendedPlan]
  const care = CARE_PLANS[draft.carePlan] || CARE_PLANS.intermedio
  const addonTotal = draft.addons.reduce((sum, a) => sum + (a.price || 0), 0)
  const development = tier.price + addonTotal
  const plans = PLAN_KEYS.map((key) => {
    const t = cat.tiers[key]
    const extra = key === draft.recommendedPlan ? draft.addons : []
    return {
      key,
      label: PLAN_LABEL[key],
      features: t.includes.map((name) => ({ name, price: 0, category: cat.label })),
      customFeatures: extra.map((a) => ({ name: a.name, price: a.price, category: a.category })),
      deadline: t.deadline,
      revisions: t.revisions,
      basePrice: t.price,
      finalPrice: t.price + (key === draft.recommendedPlan ? addonTotal : 0),
    }
  })
  const recommended = plans.find((p) => p.key === draft.recommendedPlan)

  return {
    source,
    generatedAt: new Date().toISOString(),
    projectCategory: draft.projectCategory,
    recommendedPlan: draft.recommendedPlan,
    carePlan: draft.carePlan,
    premiumType: PREMIUM_TYPE[draft.projectCategory],
    headline: draft.headline,
    whyItFits: draft.whyItFits,
    howItWorks: draft.howItWorks,
    considerations: draft.considerations,
    nextSteps: draft.nextSteps,
    outOfScope: draft.outOfScope,
    risks: draft.risks,
    addons: draft.addons,
    categoryLabel: cat.label,
    planLabel: PLAN_LABEL[draft.recommendedPlan],
    includes: tier.includes,
    deadline: tier.deadline,
    revisions: tier.revisions,
    price: {
      currency: 'USD',
      development,
      range: [tier.priceRange[0], tier.priceRange[1] + addonTotal],
      careMonthly: care.price,
      careLabel: care.label,
      careIncludes: care.includes,
    },
    quoteFields: {
      projectCategory: draft.projectCategory,
      premiumType: PREMIUM_TYPE[draft.projectCategory],
      selectedPlan: draft.recommendedPlan,
      plans,
      features: recommended.features,
      customFeatures: recommended.customFeatures,
      deadline: tier.deadline,
      revisions: tier.revisions,
      basePrice: tier.price,
      finalPrice: development,
      carePlan: {
        included: true,
        tier: draft.carePlan,
        price: care.price,
        minMonths: 3,
      },
    },
  }
}

function buildUserPrompt(brief = {}) {
  return `Brief del cliente:
- Nombre: ${clip(brief.clientName, 80) || 'no indicado'}
- Negocio / rubro: ${clip(brief.business, 200) || 'no indicado'}
- Objetivo: ${clip(brief.objective, 120) || 'no indicado'}
- Presencia online: ${clip(brief.presence, 80) || 'no indicado'}
- Presupuesto declarado: ${clip(brief.budget, 40) || 'no definido'}
- Idea / necesidad:
${clip(brief.description, 4000) || '(sin detalle)'}

Devolvé JSON con exactamente estas claves:
{
  "projectCategory": "landing|institucional|ecommerce|pedidos|sistema",
  "recommendedPlan": "base|media|premium",
  "carePlan": "basico|intermedio|premium",
  "addons": [{"name": "nombre exacto del catálogo", "reason": "por qué"}],
  "headline": "frase corta de la propuesta",
  "whyItFits": "por qué le conviene ESTE tipo de proyecto y este plan, en idioma de dueño de pyme",
  "howItWorks": "cómo se lleva a cabo: etapas, qué hace él y qué hago yo",
  "considerations": ["cosas concretas que hay que tener listas para ejecutar"],
  "nextSteps": ["próximos pasos"],
  "outOfScope": ["qué NO está incluido"],
  "risks": ["riesgos o demoras típicas"]
}

Reglas:
- Elegí UNA sola categoría y UN plan del catálogo. No inventes precios ni productos.
- Addons solo con nombres exactos de esta lista (máximo 3, solo si aportan): ${flattenAddons()}
- Tono: claro, argentino neutro, sin humo técnico, sin prometer resultados de marketing.
- Si el presupuesto es bajo para lo que pide, recomendá el plan más chico que igual resuelva y explicá el recorte.`
}

const SYSTEM_PROMPT = `Sos el agente de cotización de GB.Dev (Gianfranco Buzzelatto, Buenos Aires).
Armás propuestas para pymes a partir del catálogo 2026. Los precios los aplica el sistema: vos solo elegís categoría, plan, addons y escribís la explicación.

Catálogo:
${catalogForPrompt()}

Cuidado del sitio (mensual, mínimo 3 meses): Básico USD 30, Intermedio USD 55 (recomendado), Premium USD 130.
Pago del desarrollo: 40% al arrancar, 30% a mitad, 30% contra entrega.`

async function callOpenAI(brief) {
  const key = process.env.OPENAI_API_KEY
  if (!key) return null

  const base = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 28000)

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.35,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(brief) },
        ],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Agente IA: OpenAI respondió', res.status, errText.slice(0, 300))
      return null
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return null
    return JSON.parse(content)
  } catch (err) {
    console.error('Agente IA: no se pudo llamar al modelo:', err.message)
    return null
  } finally {
    clearTimeout(timer)
  }
}

export async function generateQuoteProposal(brief = {}) {
  const raw = await callOpenAI(brief)
  const source = raw ? 'openai' : 'catalog'
  const draft = sanitizeDraft(raw || {}, brief)
  return hydrateProposal(draft, source)
}

export function publicProposal(proposal) {
  if (!proposal) return null
  const { quoteFields, ...rest } = proposal
  return rest
}
