import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

const FROM = process.env.SMTP_FROM || 'noreply@hvaccrm.com';
const APP_URL = process.env.APP_URL || 'https://hvaccrm.production.up.railway.app';

export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.log(`[email] SKIP (not configured): ${options.subject} -> ${options.to}`);
    return false;
  }
  try {
    await transporter.sendMail({
      from: FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log(`[email] Sent: ${options.subject} -> ${options.to}`);
    return true;
  } catch (err) {
    console.error(`[email] Error sending to ${options.to}:`, err);
    return false;
  }
}

const colors: Record<string, string> = {
  ABIERTO: '#2563eb',
  EN_PROCESO: '#d97706',
  RESUELTO: '#16a34a',
  CERRADO: '#6b7280',
  PENDIENTE: '#d97706',
  EN_PROGRESO: '#2563eb',
  COMPLETADO: '#16a34a',
  CANCELADO: '#ef4444',
  BORRADOR: '#6b7280',
  ENVIADA: '#2563eb',
  APROBADA: '#16a34a',
  RECHAZADA: '#ef4444',
  VENCIDA: '#d97706',
};

const labels: Record<string, string> = {
  ABIERTO: 'Abierto',
  EN_PROCESO: 'En Proceso',
  RESUELTO: 'Resuelto',
  CERRADO: 'Cerrado',
  PENDIENTE: 'Pendiente',
  EN_PROGRESO: 'En Progreso',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado',
  BORRADOR: 'Borrador',
  ENVIADA: 'Enviada',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  VENCIDA: 'Vencida',
};

function statusColor(status: string): string {
  return colors[status] || '#6b7280';
}

function statusLabel(status: string): string {
  return labels[status] || status;
}

function baseHtml(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f3f4f6;margin:0;padding:0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
<tr><td style="background:#2563eb;padding:24px 32px">
<h1 style="color:#ffffff;font-size:20px;margin:0;font-weight:600">HVAC-R CRM</h1>
</td></tr>
<tr><td style="padding:32px">
${content}
</td></tr>
<tr><td style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb">
<p style="color:#9ca3af;font-size:12px;margin:0">HVAC-R CRM &mdash; El CRM inteligente para HVAC-R</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function ticketStatusEmail(params: {
  to: string;
  customerName: string;
  ticketId: number;
  ticketTitle: string;
  oldStatus: string;
  newStatus: string;
  link: string;
}): { subject: string; html: string } {
  const subject = `[Ticket #${params.ticketId}] ${params.ticketTitle} — ${statusLabel(params.newStatus)}`;
  const html = baseHtml(`
    <h2 style="color:#111827;font-size:18px;margin:0 0 16px">Ticket actualizado</h2>
    <p style="color:#4b5563;margin:0 0 16px">Hola <strong>${params.customerName}</strong>, el ticket ha cambiado de estado:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0">
      <tr>
        <td style="background:#f3f4f6;border-radius:8px;padding:4px 12px;color:#6b7280;font-size:14px">${statusLabel(params.oldStatus)}</td>
        <td style="padding:0 12px;color:#9ca3af;font-size:18px">→</td>
        <td style="background:${statusColor(params.newStatus)}20;border-radius:8px;padding:4px 12px;color:${statusColor(params.newStatus)};font-size:14px;font-weight:600">${statusLabel(params.newStatus)}</td>
      </tr>
    </table>
    <p style="color:#6b7280;font-size:14px;margin:0 0 4px"><strong>Ticket:</strong> ${params.ticketTitle}</p>
    <p style="color:#6b7280;font-size:14px;margin:0 0 20px"><strong>#${params.ticketId}</strong></p>
    <a href="${APP_URL}${params.link}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:500;font-size:14px">Ver ticket</a>
  `);
  return { subject, html };
}

export function serviceOrderStatusEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  oldStatus: string;
  newStatus: string;
  scheduledDate?: string;
  link: string;
}): { subject: string; html: string } {
  const subject = `[OS ${params.orderNumber}] Orden de Servicio — ${statusLabel(params.newStatus)}`;
  const html = baseHtml(`
    <h2 style="color:#111827;font-size:18px;margin:0 0 16px">Orden de Servicio actualizada</h2>
    <p style="color:#4b5563;margin:0 0 16px">Hola <strong>${params.customerName}</strong>, la orden de servicio ha cambiado de estado:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0">
      <tr>
        <td style="background:#f3f4f6;border-radius:8px;padding:4px 12px;color:#6b7280;font-size:14px">${statusLabel(params.oldStatus)}</td>
        <td style="padding:0 12px;color:#9ca3af;font-size:18px">→</td>
        <td style="background:${statusColor(params.newStatus)}20;border-radius:8px;padding:4px 12px;color:${statusColor(params.newStatus)};font-size:14px;font-weight:600">${statusLabel(params.newStatus)}</td>
      </tr>
    </table>
    <p style="color:#6b7280;font-size:14px;margin:0 0 4px"><strong>Orden:</strong> ${params.orderNumber}</p>
    ${params.scheduledDate ? `<p style="color:#6b7280;font-size:14px;margin:0 0 20px"><strong>Programada:</strong> ${new Date(params.scheduledDate).toLocaleDateString('es-MX', { dateStyle: 'long' })}</p>` : ''}
    <a href="${APP_URL}${params.link}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:500;font-size:14px">Ver orden</a>
  `);
  return { subject, html };
}

export function quotationStatusEmail(params: {
  to: string;
  customerName: string;
  quotationNumber: string;
  quotationTitle: string;
  newStatus: string;
  link: string;
}): { subject: string; html: string } {
  const subject = `[${params.quotationNumber}] ${params.quotationTitle} — ${statusLabel(params.newStatus)}`;
  const html = baseHtml(`
    <h2 style="color:#111827;font-size:18px;margin:0 0 16px">Cotización actualizada</h2>
    <p style="color:#4b5563;margin:0 0 16px">Hola <strong>${params.customerName}</strong>, la cotización ha cambiado a:</p>
    <div style="background:${statusColor(params.newStatus)}20;border-radius:8px;padding:12px 16px;display:inline-block;margin:0 0 20px">
      <span style="color:${statusColor(params.newStatus)};font-size:16px;font-weight:600">${statusLabel(params.newStatus)}</span>
    </div>
    <p style="color:#6b7280;font-size:14px;margin:0 0 4px"><strong>Cotización:</strong> ${params.quotationNumber}</p>
    <p style="color:#6b7280;font-size:14px;margin:0 0 20px"><strong>${params.quotationTitle}</strong></p>
    <a href="${APP_URL}${params.link}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:500;font-size:14px">Ver cotización</a>
  `);
  return { subject, html };
}

export function reminderEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  scheduledDate: string;
  link: string;
}): { subject: string; html: string } {
  const subject = `Recordatorio: Orden ${params.orderNumber} programada para mañana`;
  const html = baseHtml(`
    <h2 style="color:#111827;font-size:18px;margin:0 0 16px">Recordatorio de servicio</h2>
    <p style="color:#4b5563;margin:0 0 16px">Hola <strong>${params.customerName}</strong>, te recordamos que tienes un servicio programado:</p>
    <div style="background:#eff6ff;border-radius:8px;padding:16px;margin:0 0 20px;border-left:4px solid #2563eb">
      <p style="color:#1e40af;font-size:14px;margin:0 0 4px"><strong>Orden:</strong> ${params.orderNumber}</p>
      <p style="color:#1e40af;font-size:14px;margin:0"><strong>Fecha:</strong> ${new Date(params.scheduledDate).toLocaleDateString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}</p>
    </div>
    <a href="${APP_URL}${params.link}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:500;font-size:14px">Ver detalles</a>
  `);
  return { subject, html };
}

export function welcomeEmail(params: {
  userName: string;
  planName?: string;
  loginUrl: string;
}): { subject: string; html: string } {
  const subject = `¡Bienvenido a HVAC-R CRM!`;
  const html = baseHtml(`
    <h2 style="color:#111827;font-size:18px;margin:0 0 16px">¡Bienvenido, ${params.userName}!</h2>
    <p style="color:#4b5563;margin:0 0 16px">Gracias por registrarte en <strong>HVAC-R CRM</strong>. Estamos emocionados de tenerte a bordo.</p>
    ${params.planName ? `<p style="color:#4b5563;margin:0 0 16px">Tu plan: <strong>${params.planName}</strong></p>` : ''}
    <p style="color:#4b5563;margin:0 0 20px">Ya puedes iniciar sesión y comenzar a gestionar tu negocio.</p>
    <a href="${params.loginUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:500;font-size:14px">Iniciar sesión</a>
  `);
  return { subject, html };
}

export function surveyEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  surveyLink: string;
}): { subject: string; html: string } {
  const subject = `¿Cómo fue tu servicio? — Orden ${params.orderNumber}`;
  const html = baseHtml(`
    <h2 style="color:#111827;font-size:18px;margin:0 0 16px">Encuesta de satisfacción</h2>
    <p style="color:#4b5563;margin:0 0 16px">Hola <strong>${params.customerName}</strong>, esperamos que el servicio haya sido de tu agrado.</p>
    <p style="color:#4b5563;margin:0 0 20px">Nos ayudarías mucho respondiendo esta breve encuesta:</p>
    <a href="${params.surveyLink}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:500;font-size:14px">Responder encuesta</a>
  `);
  return { subject, html };
}
