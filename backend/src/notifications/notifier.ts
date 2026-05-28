import prisma from '../prisma';
import { sendEmail, isEmailConfigured, ticketStatusEmail, serviceOrderStatusEmail, quotationStatusEmail, reminderEmail, surveyEmail } from './email';
import { sendWhatsApp, sendSms, isWhatsAppConfigured, isSmsConfigured, formatPhone } from './twilio';
import { emitToUser, emitToBackoffice } from '../websocket';

type NotificationType = 'ticket' | 'service-order' | 'quotation' | 'reminder' | 'survey';

async function createInApp(params: {
  userId: number;
  type: string;
  title: string;
  message?: string;
  link?: string;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
      },
    });
    emitToUser(params.userId, 'notification', notification);
    return notification;
  } catch (err) {
    console.error('[notifier] Error creating in-app notification:', err);
  }
}

function customerNotificationLink(type: NotificationType, id: number): string {
  switch (type) {
    case 'ticket': return `/tickets/${id}`;
    case 'service-order': return `/service-orders/${id}`;
    case 'quotation': return `/quotations/${id}`;
    default: return '/';
  }
}

async function sendCustomerMessage(params: {
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerName: string;
  subject: string;
  shortMessage: string;
  emailHtml?: { subject: string; html: string } | null;
}) {
  if (params.customerPhone) {
    const formattedPhone = formatPhone(params.customerPhone);
    if (isWhatsAppConfigured()) {
      await sendWhatsApp({ to: formattedPhone, body: params.shortMessage });
    }
    if (isSmsConfigured()) {
      await sendSms({ to: formattedPhone, body: params.shortMessage });
    }
  }
  if (params.customerEmail && isEmailConfigured() && params.emailHtml) {
    await sendEmail({ to: params.customerEmail, ...params.emailHtml });
  }
}

function statusLabel(s: string): string {
  const labels: Record<string, string> = {
    ABIERTO: 'Abierto', EN_PROCESO: 'En Proceso', RESUELTO: 'Resuelto',
    CERRADO: 'Cerrado', PENDIENTE: 'Pendiente', EN_PROGRESO: 'En Progreso',
    COMPLETADO: 'Completado', CANCELADO: 'Cancelado', BORRADOR: 'Borrador',
    ENVIADA: 'Enviada', APROBADA: 'Aprobada', RECHAZADA: 'Rechazada', VENCIDA: 'Vencida',
  };
  return labels[s] || s;
}

export async function notifyTicketStatusChange(params: {
  ticketId: number;
  ticketTitle: string;
  customerId: number;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerName: string;
  assignedTo?: number | null;
  oldStatus: string;
  newStatus: string;
}) {
  const link = customerNotificationLink('ticket', params.ticketId);

  // In-app to assigned user
  if (params.assignedTo) {
    await createInApp({
      userId: params.assignedTo,
      type: 'ticket_status',
      title: `Ticket #${params.ticketId}: ${params.newStatus}`,
      message: params.ticketTitle,
      link,
    });
  }
  emitToBackoffice('ticket:status_change', { ticketId: params.ticketId, newStatus: params.newStatus });

  // Email + WhatsApp + SMS to customer
  const emailHtml = params.customerEmail ? ticketStatusEmail({
    to: params.customerEmail,
    customerName: params.customerName,
    ticketId: params.ticketId,
    ticketTitle: params.ticketTitle,
    oldStatus: params.oldStatus,
    newStatus: params.newStatus,
    link,
  }) : null;

  await sendCustomerMessage({
    customerPhone: params.customerPhone,
    customerEmail: params.customerEmail,
    customerName: params.customerName,
    subject: `Ticket #${params.ticketId}: ${statusLabel(params.newStatus)}`,
    shortMessage: `Hola ${params.customerName}, el ticket "${params.ticketTitle}" cambió a ${statusLabel(params.newStatus)}. Ver: https://hvaccrm.production.up.railway.app${link}`,
    emailHtml,
  });
}

export async function notifyServiceOrderStatusChange(params: {
  orderId: number;
  orderNumber: string;
  customerId: number;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerName: string;
  assignedTo?: number | null;
  oldStatus: string;
  newStatus: string;
  scheduledDate?: Date | null;
}) {
  const link = customerNotificationLink('service-order', params.orderId);

  if (params.assignedTo) {
    await createInApp({
      userId: params.assignedTo,
      type: 'service_order_status',
      title: `OS ${params.orderNumber}: ${params.newStatus}`,
      message: `Orden de servicio ${params.orderNumber}`,
      link,
    });
  }

  const emailHtml = params.customerEmail ? serviceOrderStatusEmail({
    to: params.customerEmail,
    customerName: params.customerName,
    orderNumber: params.orderNumber,
    oldStatus: params.oldStatus,
    newStatus: params.newStatus,
    scheduledDate: params.scheduledDate?.toISOString(),
    link,
  }) : null;

  await sendCustomerMessage({
    customerPhone: params.customerPhone,
    customerEmail: params.customerEmail,
    customerName: params.customerName,
    subject: `OS ${params.orderNumber}: ${statusLabel(params.newStatus)}`,
    shortMessage: `Hola ${params.customerName}, la orden ${params.orderNumber} cambió a ${statusLabel(params.newStatus)}. Ver: https://hvaccrm.production.up.railway.app${link}`,
    emailHtml,
  });
}

export async function notifyQuotationStatusChange(params: {
  quotationId: number;
  quotationNumber: string;
  quotationTitle: string;
  customerId: number;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerName: string;
  newStatus: string;
}) {
  const link = customerNotificationLink('quotation', params.quotationId);

  const emailHtml = params.customerEmail ? quotationStatusEmail({
    to: params.customerEmail,
    customerName: params.customerName,
    quotationNumber: params.quotationNumber,
    quotationTitle: params.quotationTitle,
    newStatus: params.newStatus,
    link,
  }) : null;

  await sendCustomerMessage({
    customerPhone: params.customerPhone,
    customerEmail: params.customerEmail,
    customerName: params.customerName,
    subject: `${params.quotationNumber}: ${statusLabel(params.newStatus)}`,
    shortMessage: `Hola ${params.customerName}, la cotización ${params.quotationNumber} cambió a ${statusLabel(params.newStatus)}. Ver: https://hvaccrm.production.up.railway.app${link}`,
    emailHtml,
  });
}

export async function sendServiceReminder(params: {
  orderId: number;
  orderNumber: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerName: string;
  scheduledDate: Date;
}) {
  const link = customerNotificationLink('service-order', params.orderId);

  const emailHtml = params.customerEmail ? reminderEmail({
    to: params.customerEmail,
    customerName: params.customerName,
    orderNumber: params.orderNumber,
    scheduledDate: params.scheduledDate.toISOString(),
    link,
  }) : null;

  await sendCustomerMessage({
    customerPhone: params.customerPhone,
    customerEmail: params.customerEmail,
    customerName: params.customerName,
    subject: `Recordatorio: Orden ${params.orderNumber} programada`,
    shortMessage: `Hola ${params.customerName}, recordatorio: la orden ${params.orderNumber} está programada para ${params.scheduledDate.toLocaleDateString('es-MX')}.`,
    emailHtml,
  });
}

export async function sendSurveyNotification(params: {
  orderNumber: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerName: string;
  surveyLink: string;
}) {
  const emailHtml = params.customerEmail ? surveyEmail({
    to: params.customerEmail,
    customerName: params.customerName,
    orderNumber: params.orderNumber,
    surveyLink: params.surveyLink,
  }) : null;

  await sendCustomerMessage({
    customerPhone: params.customerPhone,
    customerEmail: params.customerEmail,
    customerName: params.customerName,
    subject: `¿Cómo fue tu servicio? — Orden ${params.orderNumber}`,
    shortMessage: `Hola ${params.customerName}, ¿cómo fue el servicio de la orden ${params.orderNumber}? Danos tu opinión: ${params.surveyLink}`,
    emailHtml,
  });
}
