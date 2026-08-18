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
  const lines = [
    `Nueva consulta desde el portfolio`,
    ``,
    `Nombre: ${quote.clientName}`,
    `Email: ${quote.email}`,
    `WhatsApp: ${quote.whatsapp || '—'}`,
    `Objetivo: ${quote.projectType}`,
    `Negocio: ${quote.business || '—'}`,
    `Presupuesto: ${quote.budget || 'no definido'}`,
    `Presencia: ${quote.presence || '—'}`,
    ``,
    quote.description || '(sin detalle)',
  ];

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
