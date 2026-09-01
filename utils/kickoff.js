/** Checklist de arranque — ids alineados con frontend/src/data/kickoffChecklist.js */

export const KICKOFF_ITEMS = [
  { id: 'deposit', label: 'Anticipo / seña (40%) confirmada', owner: 'both' },
  { id: 'scope', label: 'Propuesta y alcance aceptados', owner: 'both' },
  { id: 'onboarding', label: 'Onboarding enviado', owner: 'client' },
  { id: 'approver', label: 'Quién aprueba cambios definido', owner: 'client' },
  { id: 'billing', label: 'Datos de facturación recibidos', owner: 'client' },
  { id: 'domain', label: 'Dominio resuelto (cuenta del cliente)', owner: 'client' },
  { id: 'hosting', label: 'Hosting definido (cuenta del cliente)', owner: 'client' },
  { id: 'brand', label: 'Logo / marca listos o fecha comprometida', owner: 'client' },
  { id: 'content', label: 'Textos / fotos base o fecha comprometida', owner: 'client' },
  { id: 'accesses', label: 'Accesos compartidos (sin contraseñas en claro)', owner: 'client' },
  { id: 'start_date', label: 'Fecha de inicio confirmada', owner: 'both' },
]

const hasText = (v) => Boolean(String(v || '').trim())
const yesOrPartial = (v) => v === 'si' || v === 'parcial'

function autoDone(id, client) {
  const onb = client.onboarding || {}
  const fiche = client.techFiche || {}
  switch (id) {
    case 'deposit':
      return Boolean(client.payments?.startPaid)
    case 'scope':
      // Cliente creado desde cotización aceptada → alcance ya cerrado
      return Boolean(client.quoteRef)
    case 'onboarding':
      return Boolean(onb.submittedAt)
    case 'approver':
      return hasText(onb.approver?.name)
    case 'billing':
      return hasText(onb.billing?.businessName) || hasText(onb.billing?.taxId)
    case 'domain':
      return hasText(fiche.domain) || hasText(onb.infra?.domain)
    case 'hosting':
      return hasText(fiche.hosting) || hasText(onb.infra?.hosting)
    case 'brand':
      return yesOrPartial(onb.brand?.hasLogo) || yesOrPartial(onb.brand?.hasColors)
    case 'content':
      return yesOrPartial(onb.content?.hasTexts) || yesOrPartial(onb.content?.hasPhotos)
    case 'accesses':
      return hasText(fiche.accessesNotes) || hasText(onb.accessesNotes)
    case 'start_date':
      return null // solo manual
    default:
      return null
  }
}

/**
 * @returns {{ items, doneCount, total, ready, pendingClient }}
 */
export function buildKickoff(client) {
  const checks = client.kickoff?.checks || {}
  const items = KICKOFF_ITEMS.map((def) => {
    const override = checks[def.id]
    const auto = autoDone(def.id, client)
    let done = false
    let source = 'open'

    if (override && typeof override.done === 'boolean') {
      done = override.done
      source = 'manual'
    } else if (auto === true) {
      done = true
      source = 'auto'
    } else if (auto === false) {
      done = false
      source = 'auto'
    }

    return {
      id: def.id,
      label: def.label,
      owner: def.owner,
      done,
      source,
      note: override?.note || '',
      doneAt: override?.doneAt || null,
    }
  })

  const doneCount = items.filter((i) => i.done).length
  const pendingClient = items.filter((i) => !i.done && (i.owner === 'client' || i.owner === 'both'))

  return {
    items,
    doneCount,
    total: items.length,
    ready: doneCount === items.length,
    pendingClient,
  }
}

export function sanitizeKickoffPatch(rawChecks = {}) {
  const allowed = new Set(KICKOFF_ITEMS.map((i) => i.id))
  const out = {}
  Object.entries(rawChecks || {}).forEach(([id, val]) => {
    if (!allowed.has(id) || val == null || typeof val !== 'object') return
    const done = Boolean(val.done)
    out[id] = {
      done,
      note: String(val.note || '').trim().slice(0, 300),
      doneAt: done ? (val.doneAt ? new Date(val.doneAt) : new Date()) : null,
    }
  })
  return out
}
