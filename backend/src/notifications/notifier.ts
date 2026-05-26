import prisma from '../prisma';
import { sendEmail, isEmailConfigured, ticketStatusEmail, serviceOrderStatusEmail, quotationStatusEmail, reminderEmail, surveyEmail } from './email';

type NotificationType = 'ticket' | 'service-order' | 'quotation' | 'reminder' | 'survey';

async function createInApp(params: {
  userId: number;
  type: string;
  title: string;
  message?: string;
  link?: string;
}) {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
      },
    });
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

export async function notifyTicketStatusChange(params: {
  ticketId: number;
  ticketTitle: string;
  customerId: number;
  customerEmail?: string | null;
  customerName: string;
  assignedTo?: number | null;
  oldStatus: string;
  newStatus: string;
}) {
  const link = customerNotificationLink('ticket', params.ticketId);

  // Notify assigned user
  if (params.assignedTo) {
    await createInApp({
      userId: params.assignedTo,
      type: 'ticket_status',
      title: `Ticket #${params.ticketId}: ${params.newStatus}`,
      message: params.ticketTitle,
      link,
    });
  }

  // Send email to customer
  if (params.customerEmail && isEmailConfigured()) {
    const email = ticketStatusEmail({
      to: params.customerEmail,
      customerName: params.customerName,
      ticketId: params.ticketId,
      ticketTitle: params.ticketTitle,
      oldStatus: params.oldStatus,
      newStatus: params.newStatus,
      link,
    });
    await sendEmail({ to: params.customerEmail, ...email });
  }
}

export async function notifyServiceOrderStatusChange(params: {
  orderId: number;
  orderNumber: string;
  customerId: number;
  customerEmail?: string | null;
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

  if (params.customerEmail && isEmailConfigured()) {
    const email = serviceOrderStatusEmail({
      to: params.customerEmail,
      customerName: params.customerName,
      orderNumber: params.orderNumber,
      oldStatus: params.oldStatus,
      newStatus: params.newStatus,
      scheduledDate: params.scheduledDate?.toISOString(),
      link,
    });
    await sendEmail({ to: params.customerEmail, ...email });
  }
}

export async function notifyQuotationStatusChange(params: {
  quotationId: number;
  quotationNumber: string;
  quotationTitle: string;
  customerId: number;
  customerEmail?: string | null;
  customerName: string;
  newStatus: string;
}) {
  const link = customerNotificationLink('quotation', params.quotationId);

  if (params.customerEmail && isEmailConfigured()) {
    const email = quotationStatusEmail({
      to: params.customerEmail,
      customerName: params.customerName,
      quotationNumber: params.quotationNumber,
      quotationTitle: params.quotationTitle,
      newStatus: params.newStatus,
      link,
    });
    await sendEmail({ to: params.customerEmail, ...email });
  }
}

export async function sendServiceReminder(params: {
  orderId: number;
  orderNumber: string;
  customerEmail?: string | null;
  customerName: string;
  scheduledDate: Date;
}) {
  if (!params.customerEmail || !isEmailConfigured()) return;

  const link = customerNotificationLink('service-order', params.orderId);
  const email = reminderEmail({
    to: params.customerEmail,
    customerName: params.customerName,
    orderNumber: params.orderNumber,
    scheduledDate: params.scheduledDate.toISOString(),
    link,
  });
  await sendEmail({ to: params.customerEmail, ...email });
}

export async function sendSurveyNotification(params: {
  orderNumber: string;
  customerEmail?: string | null;
  customerName: string;
  surveyLink: string;
}) {
  if (!params.customerEmail || !isEmailConfigured()) return;

  const email = surveyEmail({
    to: params.customerEmail,
    customerName: params.customerName,
    orderNumber: params.orderNumber,
    surveyLink: params.surveyLink,
  });
  await sendEmail({ to: params.customerEmail, ...email });
}
