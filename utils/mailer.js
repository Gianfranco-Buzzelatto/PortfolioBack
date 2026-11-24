import nodemailer from 'nodemailer';

function canSend() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function transporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function notifyNewQuote(quote) {
  const to = process.env.NOTIFY_EMAIL || process.env.SMTP_USER;
  const features = Array.isArray(quote.requestedFeatures) && quote.requestedFeatures.length
    ? quote.requestedFeatures.join(', ')
    : '—';
  const infra = quote.infra
    ? Object.entries(quote.infra).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' · ')
    : '';

  const lines = [
    `Nueva consulta desde el portfolio`,
    ``,
    `Nombre: ${quote.clientName}`,
    `Email: ${quote.email}`,
    `WhatsApp: ${quote.whatsapp || '—'}`,
    `Objetivo: ${quote.projectType}`,
    `Negocio: ${quote.business || '—'}`,
    `Problema / necesidad: ${quote.need || '—'}`,
    `Público: ${quote.audience || '—'}`,
    `Servicios/productos: ${quote.servicesProducts || '—'}`,
    `Funcionalidades: ${features}`,
    `Presupuesto: ${quote.budget || 'no definido'}`,
    `Score: ${quote.leadScore || '—'} · Acción: ${quote.suggestedAction || '—'}`,
    `Fecha ideal: ${quote.launchDate || '—'}`,
    `Presencia: ${quote.presence || '—'}`,
    infra ? `Infra: ${infra}` : null,
    quote.references ? `Referencias: ${quote.references}` : null,
    ``,
    quote.description || '(sin detalle)',
  ].filter((line) => line !== null);

  if (quote.aiProposal?.headline) {
    lines.push('', 'Propuesta del agente:', quote.aiProposal.headline);
    if (quote.aiProposal.whyItFits) lines.push(quote.aiProposal.whyItFits);
    if (quote.finalPrice) lines.push(`Precio orientativo: USD ${quote.finalPrice}`);
  }

  const text = lines.join('\n');

  if (!canSend() || !to) {
    console.log('📬 Lead (email no configurado):\n' + text);
    return;
  }

  try {
    await transporter().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: `Nueva cotización — ${quote.clientName}`,
      text,
    });
  } catch (err) {
    console.error('No se pudo enviar el aviso de cotización:', err.message);
  }
}

export async function sendPasswordResetEmail(to, link, minutes = 30) {
  const text = [
    'Pediste restablecer la contraseña del panel admin.',
    '',
    `Usá este link (vence en ${minutes} minutos y sirve una sola vez):`,
    link,
    '',
    'Si no fuiste vos, ignorá este mensaje: tu contraseña actual sigue funcionando.',
  ].join('\n');

  if (!canSend()) {
    // Sin SMTP no hay forma de mandar el mail: el link queda en los logs del servidor.
    console.log(`🔑 Reset de contraseña para ${to} (email no configurado):\n${link}`);
    return;
  }

  try {
    await transporter().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: 'Restablecer contraseña — Panel admin',
      text,
    });
  } catch (err) {
    console.error('No se pudo enviar el mail de recuperación:', err.message);
  }
}
