import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, DateSelectArg, EventDropArg, DayCellMountArg } from '@fullcalendar/core';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import type { ServiceOrder, PaginatedResponse } from '../types';

const statusColors: Record<string, string> = {
  PENDIENTE: '#f59e0b',
  EN_PROGRESO: '#3b82f6',
  COMPLETADO: '#22c55e',
  CANCELADO: '#ef4444',
};

const statusLabels: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROGRESO: 'En Progreso',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado',
};

const specialDates: Record<string, { label: string; emoji: string }> = {
  '01-01': { label: 'Año Nuevo', emoji: '🎉' },
  '01-06': { label: 'Día de Reyes', emoji: '👑' },
  '02-02': { label: 'Día de la Candelaria', emoji: '🕯️' },
  '02-14': { label: 'Día del Amor', emoji: '❤️' },
  '03-21': { label: 'Primavera', emoji: '🌸' },
  '04-30': { label: 'Día del Niño', emoji: '🧒' },
  '05-01': { label: 'Día del Trabajo', emoji: '🔧' },
  '05-05': { label: 'Batalla de Puebla', emoji: '🇲🇽' },
  '05-10': { label: 'Día de las Madres', emoji: '🌹' },
  '06-01': { label: 'Día de la Marina', emoji: '⛵' },
  '06-21': { label: 'Verano', emoji: '☀️' },
  '07-01': { label: 'Mitad de Año', emoji: '📅' },
  '08-15': { label: 'Día de la Abuela', emoji: '👵' },
  '09-16': { label: 'Independencia de México', emoji: '🇲🇽' },
  '10-31': { label: 'Halloween', emoji: '🎃' },
  '11-01': { label: 'Día de Muertos', emoji: '💀' },
  '11-02': { label: 'Día de Muertos', emoji: '🕯️' },
  '11-20': { label: 'Revolución Mexicana', emoji: '🇲🇽' },
  '12-12': { label: 'Virgen de Guadalupe', emoji: '🙏' },
  '12-24': { label: 'Nochebuena', emoji: '🎄' },
  '12-25': { label: 'Navidad', emoji: '🎅' },
  '12-31': { label: 'Fin de Año', emoji: '🎆' },
};

const monthGradients = [
  'linear-gradient(135deg, #dbeafe 0%, #ffffff 50%, #e0e7ff 100%)',
  'linear-gradient(135deg, #fce7f3 0%, #ffffff 50%, #fecaca 100%)',
  'linear-gradient(135deg, #d1fae5 0%, #ffffff 50%, #bbf7d0 100%)',
  'linear-gradient(135deg, #fef9c3 0%, #ffffff 50%, #fde68a 100%)',
  'linear-gradient(135deg, #ffe4e6 0%, #ffffff 50%, #fbcfe8 100%)',
  'linear-gradient(135deg, #e0f2fe 0%, #ffffff 50%, #bae6fd 100%)',
  'linear-gradient(135deg, #ffedd5 0%, #ffffff 50%, #fed7aa 100%)',
  'linear-gradient(135deg, #fef3c7 0%, #ffffff 50%, #fde68a 100%)',
  'linear-gradient(135deg, #fecaca 0%, #ffffff 50%, #fed7aa 100%)',
  'linear-gradient(135deg, #f3e8ff 0%, #ffffff 50%, #fed7aa 100%)',
  'linear-gradient(135deg, #fff7ed 0%, #ffffff 50%, #fde68a 100%)',
  'linear-gradient(135deg, #fecaca 0%, #ffffff 50%, #d1fae5 100%)',
];

const monthIcons = ['⛄', '❤️', '🌸', '🌼', '🌺', '☀️', '🏖️', '🌻', '🇲🇽', '🎃', '💀', '🎄'];
const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const pad = (n: number) => n.toString().padStart(2, '0');
const getDateKey = (date: Date) => `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export default function DispatchPage() {
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<ServiceOrder | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  const { data: responseData, isLoading } = useQuery<PaginatedResponse<ServiceOrder>>({
    queryKey: ['dispatch-orders'],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<ServiceOrder>>('/service-orders');
      return data;
    },
  });
  const orders = responseData?.data ?? [];

  const updateDateMutation = useMutation({
    mutationFn: async ({ id, scheduledDate }: { id: number; scheduledDate: string }) => {
      await api.put(`/service-orders/${id}`, { scheduledDate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatch-orders'] });
      toast.success('Fecha actualizada');
    },
    onError: () => {
      toast.error('Error al actualizar fecha');
    },
  });

  const events = (orders || [])
    .filter((o) => o.scheduledDate)
    .map((o) => ({
      id: String(o.id),
      title: `${o.number} - ${o.description || o.customer?.contactName || ''}`,
      start: o.scheduledDate,
      allDay: true,
      backgroundColor: statusColors[o.status] || '#6b7280',
      borderColor: statusColors[o.status] || '#6b7280',
      textColor: '#ffffff',
      extendedProps: { order: o },
    }));

  const handleEventClick = (info: EventClickArg) => {
    const order = info.event.extendedProps.order as ServiceOrder;
    setSelectedEvent(order);
  };

  const handleDateSelect = (info: DateSelectArg) => {
    // TODO: create new order with selected date
  };

  const handleEventDrop = (info: EventDropArg) => {
    const orderId = parseInt(info.event.id);
    const newDate = info.event.start?.toISOString();
    if (newDate) {
      updateDateMutation.mutate({ id: orderId, scheduledDate: newDate });
    }
  };

  const handleDatesSet = (arg: { view: { currentStart: Date } }) => {
    setCurrentMonth(arg.view.currentStart.getMonth());
  };

  const handleDayCellDidMount = (arg: DayCellMountArg) => {
    const key = getDateKey(arg.date);
    const special = specialDates[key];
    if (special) {
      arg.el.classList.add('fc-day--special');
      const top = arg.el.querySelector<HTMLElement>('.fc-daygrid-day-top');
      if (top) {
        const badge = document.createElement('span');
        badge.className = 'holiday-emoji';
        badge.textContent = special.emoji;
        badge.title = special.label;
        top.appendChild(badge);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        .fc-day--special .fc-daygrid-day-number {
          font-weight: 700;
        }
        .holiday-emoji {
          position: absolute;
          bottom: 1px;
          right: 2px;
          font-size: 0.9rem;
          opacity: 0.75;
          pointer-events: none;
          line-height: 1;
        }
        .fc .fc-daygrid-day-top {
          position: relative;
        }
        .fc .fc-day-today {
          background-color: transparent !important;
        }
      `}</style>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {monthIcons[currentMonth]} Calendario de Servicios
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {monthNames[currentMonth]} temático — Arrastra y suelta para reprogramar órdenes
            </p>
          </div>
          <Link
            to="/service-orders/new"
            className="btn-primary inline-flex items-center gap-2"
          >
            <CalendarIcon className="w-4 h-4" />
            Nueva Orden
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 card" style={{ background: monthGradients[currentMonth] }}>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek',
              }}
              events={events}
              eventClick={handleEventClick}
              selectable={true}
              select={handleDateSelect}
              editable={true}
              eventDrop={handleEventDrop}
              locale="es"
              buttonText={{
                today: 'Hoy',
                month: 'Mes',
                week: 'Semana',
              }}
              height="auto"
              eventDisplay="block"
              datesSet={handleDatesSet}
              dayCellDidMount={handleDayCellDidMount}
            />
          </div>

          <div className="space-y-4">
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Leyenda</h3>
              <div className="space-y-2">
                {Object.entries(statusLabels).map(([status, label]) => (
                  <div key={status} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: statusColors[status] }}
                    />
                    <span className="text-sm text-gray-600">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedEvent && (
              <div className="card">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {selectedEvent.number}
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <strong>Estado:</strong>{' '}
                    {statusLabels[selectedEvent.status] || selectedEvent.status}
                  </p>
                  {selectedEvent.scheduledDate && (
                    <p>
                      <strong>Programada:</strong>{' '}
                      {new Date(selectedEvent.scheduledDate).toLocaleDateString('es-MX', {
                        dateStyle: 'long',
                      })}
                    </p>
                  )}
                  {selectedEvent.customer && (
                    <p>
                      <strong>Cliente:</strong> {selectedEvent.customer.contactName}
                    </p>
                  )}
                  <Link
                    to={`/service-orders/${selectedEvent.id}`}
                    className="btn-secondary inline-flex items-center gap-1 text-xs mt-2"
                  >
                    Ver detalle
                  </Link>
                </div>
              </div>
            )}

            <div className="card">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Resumen</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Total programadas</span>
                  <span className="font-medium">{events.length}</span>
                </div>
                {Object.entries(statusLabels).map(([status, label]) => {
                  const count = (orders || []).filter((o) => o.status === status).length;
                  return (
                    <div key={status} className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">{label}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
