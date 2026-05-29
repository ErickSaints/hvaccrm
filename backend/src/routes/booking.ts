import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, requireBackoffice } from '../middleware/auth';
import { paginate, paginatedResponse } from '../middleware/pagination';

const router = Router();

function generateBookingCode(): string {
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `BK-${rand}`;
}

const bookingStatuses = ['CONFIRMADA', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO'] as const;

// ─── Public endpoints ────────────────────────────────────────

const publicSlotQuery = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  calendarId: z.string().optional(),
});

router.get('/public/slots', async (req: Request, res: Response) => {
  try {
    const { date, calendarId } = publicSlotQuery.parse(req.query);
    const requestedDate = new Date(date + 'T00:00:00.000Z');

    const calendars = await prisma.bookingCalendar.findMany({
      where: {
        active: true,
        ...(calendarId ? { id: parseInt(calendarId, 10) } : {}),
      },
      include: {
        technicians: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    if (calendars.length === 0) {
      return res.json([]);
    }

    const now = new Date();
    const maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + Math.max(...calendars.map((c) => c.maxDaysAhead)));

    if (requestedDate < new Date(now.toISOString().split('T')[0] + 'T00:00:00.000Z') || requestedDate > maxDate) {
      return res.json([]);
    }

    const slots: any[] = [];

    for (const cal of calendars) {
      const workingDays: number[] = JSON.parse(cal.workingDays);
      const dayOfWeek = requestedDate.getUTCDay();
      if (!workingDays.includes(dayOfWeek)) continue;

      const [startH, startM] = cal.workingHoursStart.split(':').map(Number);
      const [endH, endM] = cal.workingHoursEnd.split(':').map(Number);
      const slotMin = cal.slotDuration;
      const breakMin = cal.breakBetweenSlots;
      const totalSlotMin = slotMin + breakMin;

      const dayStart = new Date(requestedDate);
      dayStart.setUTCHours(startH, startM, 0, 0);
      const dayEnd = new Date(requestedDate);
      dayEnd.setUTCHours(endH, endM, 0, 0);

      const existingBookings = await prisma.booking.findMany({
        where: {
          calendarId: cal.id,
          status: { not: 'CANCELADA' },
          startTime: { gte: dayStart, lt: dayEnd },
        },
        select: { startTime: true, endTime: true, technicianId: true },
      });

      const slotStart = new Date(dayStart);
      while (slotStart.getTime() + slotMin * 60000 <= dayEnd.getTime()) {
        const slotEnd = new Date(slotStart.getTime() + slotMin * 60000);

        if (cal.technicians.length === 0) {
          const conflict = existingBookings.some(
            (b) => slotStart < b.endTime && slotEnd > b.startTime
          );
          if (!conflict) {
            slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() });
          }
        } else {
          for (const tech of cal.technicians) {
            const conflict = existingBookings.some(
              (b) => b.technicianId === tech.user.id && slotStart < b.endTime && slotEnd > b.startTime
            );
            if (!conflict) {
              slots.push({
                start: slotStart.toISOString(),
                end: slotEnd.toISOString(),
                technicianId: tech.user.id,
                technicianName: tech.user.name,
              });
            }
          }
        }

        slotStart.setMinutes(slotStart.getMinutes() + totalSlotMin);
      }
    }

    slots.sort((a, b) => a.start.localeCompare(b.start));
    res.json(slots);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al obtener horarios disponibles' });
  }
});

const publicBookSchema = z.object({
  calendarId: z.number(),
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerPhone: z.string().min(1),
  address: z.string().optional(),
  description: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  technicianId: z.number().optional(),
});

router.post('/public/book', async (req: Request, res: Response) => {
  try {
    const data = publicBookSchema.parse(req.body);

    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateBookingCode();
      const existing = await prisma.booking.findUnique({ where: { code } });
      if (!existing) {
        const booking = await prisma.booking.create({
          data: {
            code,
            customerName: data.customerName,
            customerEmail: data.customerEmail || null,
            customerPhone: data.customerPhone,
            address: data.address || null,
            description: data.description || null,
            startTime: new Date(data.startTime),
            endTime: new Date(data.endTime),
            calendarId: data.calendarId,
            technicianId: data.technicianId || null,
          },
          include: { calendar: true, technician: { select: { id: true, name: true } } },
        });
        return res.status(201).json(booking);
      }
    }
    res.status(500).json({ error: 'Error al generar código único' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al crear reservación' });
  }
});

// ─── Admin endpoints (authenticate + requireBackoffice) ─────

router.use(authenticate);
router.use(requireBackoffice);

// Calendars CRUD
router.get('/calendars', async (req: Request, res: Response) => {
  try {
    const calendars = await prisma.bookingCalendar.findMany({
      include: { _count: { select: { technicians: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(calendars);
  } catch {
    res.status(500).json({ error: 'Error al obtener calendarios' });
  }
});

const calendarSchema = z.object({
  name: z.string().optional(),
  timezone: z.string().optional(),
  weekStart: z.number().min(0).max(6).optional(),
  workingDays: z.array(z.number().min(0).max(6)).optional(),
  workingHoursStart: z.string().optional(),
  workingHoursEnd: z.string().optional(),
  slotDuration: z.number().min(15).optional(),
  breakBetweenSlots: z.number().min(0).optional(),
  maxDaysAhead: z.number().min(1).optional(),
});

router.post('/calendars', async (req: Request, res: Response) => {
  try {
    const data = calendarSchema.parse(req.body);
    const calendar = await prisma.bookingCalendar.create({
      data: {
        ...data,
        workingDays: data.workingDays ? JSON.stringify(data.workingDays) : undefined,
      },
    });
    res.status(201).json(calendar);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al crear calendario' });
  }
});

router.put('/calendars/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const data = calendarSchema.parse(req.body);
    const calendar = await prisma.bookingCalendar.update({
      where: { id },
      data: {
        ...data,
        workingDays: data.workingDays ? JSON.stringify(data.workingDays) : undefined,
      },
    });
    res.json(calendar);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al actualizar calendario' });
  }
});

router.delete('/calendars/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    await prisma.bookingCalendar.update({
      where: { id },
      data: { active: false },
    });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error al desactivar calendario' });
  }
});

// Bookings CRUD
router.get('/', paginate, async (req: Request, res: Response) => {
  try {
    const { status, dateFrom, dateTo, technicianId, calendarId } = req.query;
    const andConditions: any[] = [];

    if (status) andConditions.push({ status });
    if (technicianId) andConditions.push({ technicianId: parseInt(technicianId as string, 10) });
    if (calendarId) andConditions.push({ calendarId: parseInt(calendarId as string, 10) });
    if (dateFrom || dateTo) {
      const dateFilter: any = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom as string);
      if (dateTo) dateFilter.lte = new Date(dateTo as string + 'T23:59:59.999Z');
      andConditions.push({ startTime: dateFilter });
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip: req.pagination!.skip,
        take: req.pagination!.limit,
        include: {
          customer: { select: { id: true, contactName: true } },
          technician: { select: { id: true, name: true } },
          calendar: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.count({ where }),
    ]);
    res.json(paginatedResponse(bookings, total, req.pagination!.page, req.pagination!.limit));
  } catch {
    res.status(500).json({ error: 'Error al obtener reservaciones' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        calendar: true,
        technician: { select: { id: true, name: true, email: true, phone: true } },
        customer: { select: { id: true, contactName: true, companyName: true, email: true, phone: true } },
        serviceOrder: {
          include: {
            customer: { select: { id: true, contactName: true } },
            assignedUser: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!booking) {
      return res.status(404).json({ error: 'Reservación no encontrada' });
    }
    res.json(booking);
  } catch {
    res.status(500).json({ error: 'Error al obtener reservación' });
  }
});

const bookingUpdateSchema = z.object({
  customerName: z.string().min(1).optional(),
  customerEmail: z.string().email().optional().or(z.literal('')).optional(),
  customerPhone: z.string().min(1).optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(bookingStatuses).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  notes: z.string().optional(),
  technicianId: z.number().optional().nullable(),
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const data = bookingUpdateSchema.parse(req.body);
    const updateData: any = { ...data };
    if (data.startTime) updateData.startTime = new Date(data.startTime);
    if (data.endTime) updateData.endTime = new Date(data.endTime);

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        calendar: { select: { id: true, name: true } },
        technician: { select: { id: true, name: true } },
      },
    });
    res.json(booking);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al actualizar reservación' });
  }
});

router.put('/:id/convert', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { calendar: true },
    });
    if (!booking) {
      return res.status(404).json({ error: 'Reservación no encontrada' });
    }
    if (booking.serviceOrderId) {
      return res.status(400).json({ error: 'Esta reservación ya tiene una orden de servicio asociada' });
    }
    if (booking.status === 'CANCELADA') {
      return res.status(400).json({ error: 'No se puede convertir una reservación cancelada' });
    }

    const now = new Date();
    const prefix = 'ORD-';
    const last = await prisma.serviceOrder.findFirst({
      where: { number: { startsWith: prefix } },
      orderBy: { number: 'desc' },
    });
    let next = 1;
    if (last) {
      const parts = last.number.split('-');
      next = parseInt(parts[1]) + 1;
    }
    const orderNumber = `${prefix}${String(next).padStart(6, '0')}`;

    let customerId = booking.customerId;
    if (!customerId) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          OR: [
            { email: booking.customerEmail ?? undefined },
            { phone: booking.customerPhone },
          ].filter(Boolean) as any,
        },
      });
      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const newCustomer = await prisma.customer.create({
          data: {
            contactName: booking.customerName,
            email: booking.customerEmail,
            phone: booking.customerPhone,
            address: booking.address || '',
          },
        });
        customerId = newCustomer.id;
      }
    }

    const serviceOrder = await prisma.serviceOrder.create({
      data: {
        number: orderNumber,
        description: booking.description || `Servicio desde reservación ${booking.code}`,
        customerId,
        assignedTo: booking.technicianId || undefined,
        scheduledDate: booking.startTime,
        notes: booking.notes,
        status: 'PENDIENTE',
      },
    });

    await prisma.booking.update({
      where: { id },
      data: {
        serviceOrderId: serviceOrder.id,
        customerId,
        status: 'COMPLETADA',
      },
    });

    const updated = await prisma.booking.findUnique({
      where: { id },
      include: {
        serviceOrder: {
          include: {
            customer: { select: { id: true, contactName: true } },
            assignedUser: { select: { id: true, name: true } },
          },
        },
      },
    });
    res.status(201).json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Error al convertir reservación en orden de servicio' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELADA' },
    });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error al cancelar reservación' });
  }
});

export default router;
