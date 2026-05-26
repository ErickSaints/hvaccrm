import prisma from '../prisma';
import { sendServiceReminder } from './notifier';

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // every hour

let intervalHandle: ReturnType<typeof setInterval> | null = null;

export function startReminderScheduler() {
  // Check immediately on startup
  checkScheduledServices();
  intervalHandle = setInterval(checkScheduledServices, CHECK_INTERVAL_MS);
  console.log('[scheduler] Reminder scheduler started');
}

export function stopReminderScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

async function checkScheduledServices() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    const orders = await prisma.serviceOrder.findMany({
      where: {
        status: 'PENDIENTE',
        scheduledDate: {
          gte: tomorrow,
          lte: endOfTomorrow,
        },
      },
      include: {
        customer: { select: { contactName: true, email: true } },
      },
    });

    for (const order of orders) {
      if (!order.scheduledDate) continue;
      await sendServiceReminder({
        orderId: order.id,
        orderNumber: order.number,
        customerEmail: order.customer.email,
        customerName: order.customer.contactName,
        scheduledDate: order.scheduledDate,
      });
    }
  } catch (err) {
    console.error('[scheduler] Error checking scheduled services:', err);
  }
}
