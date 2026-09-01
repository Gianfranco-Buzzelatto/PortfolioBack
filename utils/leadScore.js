/** Calificación automática de leads del brief público */

const ACTION = {
  green: 'contactar',
  yellow: 'pedir_info',
  red: 'archivar',
}

const COMPLEX = new Set([
  'vender_online',
  'pedidos_delivery',
  'procesos_internos',
  'agendar_turnos',
])

export function scoreLead(quote = {}) {
  const reasons = []
  let points = 0

  const budget = String(quote.budget || '')
  const need = String(quote.need || quote.description || '').trim()
  const business = String(quote.business || '').trim()
  const features = Array.isArray(quote.requestedFeatures) ? quote.requestedFeatures : []
  const infra = quote.infra && typeof quote.infra === 'object' ? quote.infra : {}
  const infraAnswers = Object.values(infra).filter(Boolean).length
  const objective = String(quote.objective || '')

  if (business.length >= 3) {
    points += 1
  } else {
    reasons.push('Falta negocio / rubro claro')
  }

  if (need.length >= 20) {
    points += 2
  } else if (need.length > 0) {
    points += 1
    reasons.push('La necesidad está poco detallada')
  } else {
    reasons.push('No indicó el problema a resolver')
  }

  if (quote.whatsapp) points += 1
  else reasons.push('Sin WhatsApp')

  if (budget && budget !== 'no_se') {
    points += 2
    if (budget === 'hasta_500' && COMPLEX.has(objective)) {
      points -= 2
      reasons.push('Presupuesto bajo para el tipo de proyecto')
    }
    if (budget === '1000_2500' || budget === '2500_plus') {
      points += 1
    }
  } else {
    reasons.push('Sin presupuesto definido')
  }

  if (features.length >= 2) points += 1
  if (infraAnswers >= 3) points += 1
  if (quote.launchDate) points += 1
  if (quote.audience) points += 1

  let leadScore = 'yellow'
  if (points >= 7) leadScore = 'green'
  else if (points <= 3) leadScore = 'red'

  if (leadScore === 'green' && !reasons.length) {
    reasons.push('Brief completo y con presupuesto alineado')
  }
  if (leadScore === 'yellow' && !reasons.length) {
    reasons.push('Hay datos, pero falta cerrar alcance o presupuesto')
  }

  let suggestedAction = ACTION[leadScore]
  if (leadScore === 'green' && (COMPLEX.has(objective) || features.length >= 4)) {
    suggestedAction = 'agendar'
    reasons.push('Proyecto con alcance: conviene discovery')
  }
  if (leadScore === 'red' && need.length < 10) {
    suggestedAction = 'pedir_info'
  }

  return {
    leadScore,
    leadScoreReasons: reasons.slice(0, 5),
    suggestedAction,
    leadScorePoints: points,
  }
}
