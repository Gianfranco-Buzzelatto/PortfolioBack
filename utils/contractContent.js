const PLAN_LABEL = { base: 'Básico', media: 'Intermedio', premium: 'Premium' }

export function buildContractContent(quote = {}) {
  const planKey = quote.selectedPlan || quote.acceptance?.selectedPlan || 'media'
  const plan = (quote.plans || []).find((p) => p.key === planKey)
  const price = plan?.finalPrice ?? quote.finalPrice
  const currency = quote.currency || 'USD'
  const features = [
    ...(plan?.features || quote.features || []).map((f) => f.name || f),
    ...(plan?.customFeatures || []).map((f) => f.name || f),
  ].filter(Boolean)

  const sections = [
    {
      title: '1. Servicio',
      body: `GB.Dev desarrolla el proyecto «${quote.projectName || quote.projectType}» para ${quote.clientName}, según la propuesta aceptada (plan ${PLAN_LABEL[planKey] || planKey}).`,
    },
    {
      title: '2. Alcance',
      body: `Incluye lo listado en la propuesta del plan elegido. No incluye publicidad paga, community management ni funcionalidades no especificadas.`,
      list: features.length ? features.slice(0, 12) : ['Alcance según propuesta aceptada'],
    },
    {
      title: '3. Funcionalidades',
      body: quote.requestedFeatures?.length
        ? `Funcionalidades pedidas en el brief (sujetas al plan cotizado): ${quote.requestedFeatures.join(', ')}.`
        : 'Las funcionalidades son las del plan aceptado en la propuesta.',
    },
    {
      title: '4. Revisiones',
      body: `Se incluyen ${quote.revisions || plan?.revisions || 3} rondas de revisión sobre lo acordado. Correcciones de errores del desarrollo están incluidas.`,
    },
    {
      title: '5. Cambios',
      body: 'Corrección ≠ nueva funcionalidad. Pedidos fuera de alcance se cotizan aparte antes de desarrollarlos.',
    },
    {
      title: '6. Propiedad intelectual',
      body: 'Al completar el pago, el cliente recibe el producto acordado y los accesos correspondientes. Frameworks, librerías y servicios de terceros mantienen sus propias licencias.',
    },
    {
      title: '7. Servicios de terceros',
      body: 'Hosting, bases de datos, storage, emails, Mercado Pago, APIs y similares pueden cambiar precios, límites o condiciones. Trabajo extra por cambios externos puede presupuestarse aparte. Los costos de planes pagos de terceros corresponden al cliente, salvo acuerdo escrito distinto.',
    },
    {
      title: '8. Pago',
      body: `Precio de referencia: ${currency} ${Number(price || 0).toLocaleString('es-AR')}. Forma de pago: 40% al arrancar, 30% a mitad de proyecto y 30% contra entrega. El desarrollo comienza cuando se cumplen las condiciones acordadas (incluida la seña).`,
    },
    {
      title: '9. Garantía',
      body: '15 días desde la entrega para corrección de bugs atribuibles al desarrollo original. No cubre nuevas funcionalidades, rediseños, cambios de alcance, fallos de terceros ni modificaciones hechas por otros.',
    },
    {
      title: '10. Mantenimiento y terceros',
      body: 'El desarrollo inicial no incluye mantenimiento indefinido. Puede contratarse un plan de cuidado. Si el cliente o un tercero modifica código o infraestructura, GB.Dev no responde por errores o pérdidas derivadas de esas modificaciones.',
    },
  ]

  return {
    version: '2026-v1',
    title: `Contrato de desarrollo — ${quote.projectName || quote.projectType}`,
    clientName: quote.clientName,
    business: quote.business,
    planKey,
    planLabel: PLAN_LABEL[planKey] || planKey,
    price,
    currency,
    deadline: quote.deadline || plan?.deadline,
    revisions: quote.revisions || plan?.revisions || 3,
    sections,
  }
}
