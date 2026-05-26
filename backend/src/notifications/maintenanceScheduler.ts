import prisma from '../prisma';

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours

let intervalHandle: ReturnType<typeof setInterval> | null = null;

function getMonthsBetween(start: Date, end: Date): number {
  return (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
}

function getFrequencyMonths(frequency: string): number {
  switch (frequency) {
    case 'MENSUAL': return 1;
    case 'BIMESTRAL': return 2;
    case 'TRIMESTRAL': return 3;
    case 'SEMESTRAL': return 6;
    case 'ANUAL': return 12;
    default: return 0;
  }
}

export function startMaintenanceScheduler() {
  checkMaintenancePolicies();
  intervalHandle = setInterval(checkMaintenancePolicies, CHECK_INTERVAL_MS);
  console.log('[maintenance-scheduler] Started');
}

export function stopMaintenanceScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

async function checkMaintenancePolicies() {
  try {
    const now = new Date();
    const policies = await prisma.maintenancePolicy.findMany({
      where: {
        status: 'ACTIVA',
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        customer: { select: { id: true, contactName: true } },
        maintenanceLogs: {
          orderBy: { scheduledDate: 'desc' },
          take: 1,
        },
      },
    });

    for (const policy of policies) {
      const freqMonths = getFrequencyMonths(policy.frequency);
      if (freqMonths === 0) continue;

      const lastLog = policy.maintenanceLogs[0];
      let lastDate = lastLog ? new Date(lastLog.scheduledDate) : new Date(policy.startDate);

      // Calculate how many visits should have been generated
      const monthsSinceLast = getMonthsBetween(lastDate, now);
      const visitsDue = Math.floor(monthsSinceLast / freqMonths);

      if (visitsDue <= 0) continue;

      // Cap at generating max 12 at a time to avoid flooding
      const toGenerate = Math.min(visitsDue, 12);

      const logsToCreate = [];
      for (let i = 1; i <= toGenerate; i++) {
        const dueDate = new Date(lastDate);
        dueDate.setMonth(dueDate.getMonth() + freqMonths * i);
        if (dueDate > now) break;

        logsToCreate.push({
          policyId: policy.id,
          description: `Mantenimiento programado - ${policy.name}`,
          scheduledDate: dueDate,
          status: 'PENDIENTE',
        });
      }

      if (logsToCreate.length > 0) {
        // Avoid duplicates: check if a log already exists for that date
        for (const log of logsToCreate) {
          const existing = await prisma.maintenanceLog.findFirst({
            where: {
              policyId: log.policyId,
              scheduledDate: log.scheduledDate,
            },
          });
          if (!existing) {
            await prisma.maintenanceLog.create({ data: log });
            console.log(`[maintenance-scheduler] Created log for policy #${policy.id} on ${log.scheduledDate.toISOString().split('T')[0]}`);
          }
        }
      }
    }
  } catch (err) {
    console.error('[maintenance-scheduler] Error:', err);
  }
}
