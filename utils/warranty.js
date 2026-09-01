export const DEFAULT_WARRANTY_DAYS = 15

export function startWarranty(existing = {}, now = new Date()) {
  if (existing.deliveredAt && existing.endsAt) {
    return {
      days: existing.days || DEFAULT_WARRANTY_DAYS,
      deliveredAt: existing.deliveredAt,
      endsAt: existing.endsAt,
    }
  }
  const days = Number(existing.days) > 0 ? Number(existing.days) : DEFAULT_WARRANTY_DAYS
  const deliveredAt = existing.deliveredAt ? new Date(existing.deliveredAt) : now
  return {
    days,
    deliveredAt,
    endsAt: new Date(deliveredAt.getTime() + days * 24 * 60 * 60 * 1000),
  }
}

export function describeWarranty(client, now = new Date()) {
  const warranty = client.warranty || {}
  const endsAt = warranty.endsAt ? new Date(warranty.endsAt) : null
  const started = Boolean(warranty.deliveredAt || warranty.endsAt)
  const active = started && endsAt && now.getTime() <= endsAt.getTime()
  const expired = started && endsAt && now.getTime() > endsAt.getTime()
  const daysLeft = active ? Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))) : 0
  return {
    started,
    active,
    expired,
    days: warranty.days || DEFAULT_WARRANTY_DAYS,
    daysLeft,
    deliveredAt: warranty.deliveredAt || null,
    endsAt,
  }
}
