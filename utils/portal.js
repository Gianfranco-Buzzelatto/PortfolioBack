import crypto from 'crypto'
import { describeWarranty } from './warranty.js'
import { buildKickoff } from './kickoff.js'

export function ensurePortalToken(client) {
  if (!client.portalToken) {
    client.portalToken = crypto.randomBytes(24).toString('hex')
    client.portalTokenCreatedAt = new Date()
  }
  return client.portalToken
}

const STAGE_LABEL = {
  activo: 'Proyecto activo',
  revision: 'Revisión',
  entregado: 'Entregado',
  mantenimiento: 'Mantenimiento',
}

const STAGE_HINTS = {
  activo: [
    'Estamos desarrollando según lo acordado.',
    'El arranque queda confirmado con la seña del 40%.',
    'Te avisamos cuando haya una versión para revisar.',
  ],
  revision: [
    'Hay una versión para que mires en staging.',
    'Pedí cambios con el formulario. Las rondas incluidas son las del contrato.',
    'Lo que esté fuera de alcance se cotiza aparte.',
  ],
  entregado: [
    'El proyecto está en producción.',
    'Tenés 15 días de garantía para bugs de lo entregado.',
    'El plan de cuidado cubre el después: backups, hosting y cambios chicos.',
  ],
  mantenimiento: [
    'El sitio quedó en cuidado mensual.',
    'Los cambios extra se piden y se cotizan si no están en el plan.',
  ],
}

export function toPublicPortal(client) {
  const warranty = describeWarranty(client)
  const careStatus = client.care?.status || 'none'
  return {
    clientName: client.clientName,
    projectName: client.projectName || client.projectType,
    projectType: client.projectType,
    stage: client.stage,
    stageLabel: STAGE_LABEL[client.stage] || client.stage,
    hints: STAGE_HINTS[client.stage] || [],
    deadline: client.deadline || null,
    revisions: client.revisions || 3,
    revisionsUsed: client.revisionsUsed || 0,
    currency: client.currency || 'USD',
    finalPrice: client.finalPrice || null,
    payments: {
      startPaid: Boolean(client.payments?.startPaid),
      midPaid: Boolean(client.payments?.midPaid),
      endPaid: Boolean(client.payments?.endPaid),
    },
    revisionsList: (client.revisionsList || []).map((item) => ({
      description: item.description,
      status: item.status,
      date: item.date,
      fromClient: Boolean(item.fromClient),
    })),
    stagingUrl: client.stagingUrl || '',
    productionUrl: client.productionUrl || '',
    maintenancePlan: client.maintenancePlan?.price
      ? {
          price: client.maintenancePlan.price,
          currency: client.maintenancePlan.currency || client.currency || 'USD',
          includes: client.maintenancePlan.includes || [],
        }
      : null,
    updates: (client.updates || [])
      .slice(-12)
      .reverse()
      .map((item) => ({ message: item.message, date: item.date })),
    canRequestRevision: client.stage === 'revision' || client.stage === 'activo',
    warranty: {
      ...warranty,
      endsAt: warranty.endsAt ? warranty.endsAt.toISOString() : null,
      deliveredAt: warranty.deliveredAt || null,
    },
    warrantyTickets: (client.warrantyTickets || []).map((item) => ({
      description: item.description,
      status: item.status,
      date: item.date,
    })),
    canReportWarranty: warranty.active,
    care: {
      status: careStatus,
      checkInAt: client.care?.checkInAt || '',
    },
    kickoff: buildKickoff(client),
  }
}
