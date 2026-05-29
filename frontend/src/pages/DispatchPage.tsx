import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, DateSelectArg, EventDropArg, DayCellMountArg } from '@fullcalendar/core';
import { Calendar as CalendarIcon, Loader2, MapPin, ChevronRight } from 'lucide-react';
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

const specialDates: Record<string, { label: string; emoji: string; color: string }> = {
  '01-01': { label: 'Año Nuevo', emoji: '🎉', color: '#fef2f2' },
  '01-06': { label: 'Día de Reyes', emoji: '👑', color: '#fffbeb' },
  '02-02': { label: 'Día de la Candelaria', emoji: '🕯️', color: '#fffbeb' },
  '02-14': { label: 'Día del Amor', emoji: '❤️', color: '#fdf2f8' },
  '03-21': { label: 'Primavera', emoji: '🌸', color: '#f0fdf4' },
  '04-30': { label: 'Día del Niño', emoji: '🧒', color: '#fefce8' },
  '05-01': { label: 'Día del Trabajo', emoji: '🔧', color: '#f0f9ff' },
  '05-05': { label: 'Batalla de Puebla', emoji: '🇲🇽', color: '#fef2f2' },
  '05-10': { label: 'Día de las Madres', emoji: '🌹', color: '#fdf2f8' },
  '06-01': { label: 'Día de la Marina', emoji: '⛵', color: '#f0f9ff' },
  '06-21': { label: 'Verano', emoji: '☀️', color: '#fffbeb' },
  '07-01': { label: 'Mitad de Año', emoji: '📅', color: '#f0fdf4' },
  '08-15': { label: 'Día de la Abuela', emoji: '👵', color: '#fdf2f8' },
  '09-16': { label: 'Independencia de México', emoji: '🇲🇽', color: '#fef2f2' },
  '10-31': { label: 'Halloween', emoji: '🎃', color: '#fff7ed' },
  '11-01': { label: 'Día de Muertos', emoji: '💀', color: '#fef2f2' },
  '11-02': { label: 'Día de Muertos', emoji: '🕯️', color: '#fef2f2' },
  '11-20': { label: 'Revolución Mexicana', emoji: '🇲🇽', color: '#fef2f2' },
  '12-12': { label: 'Virgen de Guadalupe', emoji: '🙏', color: '#fefce8' },
  '12-24': { label: 'Nochebuena', emoji: '🎄', color: '#f0fdf4' },
  '12-25': { label: 'Navidad', emoji: '🎅', color: '#fef2f2' },
  '12-31': { label: 'Fin de Año', emoji: '🎆', color: '#fdf2f8' },
};

interface MonthTheme {
  name: string;
  icon: string;
  image: string;
  gradient: string;
  overlay: string;
  decorations: string[];
  accentColor: string;
}

const monthThemes: MonthTheme[] = [
  { name: 'Enero', icon: '⛄', image: 'https://images.unsplash.com/photo-1541689229701-2e14e2e5c0a7?w=1000&q=80', gradient: 'from-blue-100 via-white to-indigo-50', overlay: 'from-blue-900/30 via-transparent to-indigo-900/20', decorations: ['❄️', '⛄', '🌟'], accentColor: '#6366f1' },
  { name: 'Febrero', icon: '❤️', image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1000&q=80', gradient: 'from-pink-100 via-white to-rose-50', overlay: 'from-pink-900/25 via-transparent to-rose-900/15', decorations: ['❤️', '💕', '🌹'], accentColor: '#ec4899' },
  { name: 'Marzo', icon: '🌸', image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1000&q=80', gradient: 'from-green-100 via-white to-emerald-50', overlay: 'from-green-900/25 via-transparent to-emerald-900/15', decorations: ['🌸', '🌼', '🦋'], accentColor: '#10b981' },
  { name: 'Abril', icon: '🌼', image: 'https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=1000&q=80', gradient: 'from-yellow-100 via-white to-amber-50', overlay: 'from-yellow-900/20 via-transparent to-amber-900/15', decorations: ['🌻', '🌷', '🐝'], accentColor: '#f59e0b' },
  { name: 'Mayo', icon: '🌺', image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=1000&q=80', gradient: 'from-pink-100 via-white to-fuchsia-50', overlay: 'from-pink-900/20 via-transparent to-fuchsia-900/15', decorations: ['🌺', '🌸', '🌹'], accentColor: '#d946ef' },
  { name: 'Junio', icon: '☀️', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&q=80', gradient: 'from-sky-100 via-white to-cyan-50', overlay: 'from-sky-900/20 via-transparent to-cyan-900/15', decorations: ['☀️', '🏖️', '⛱️'], accentColor: '#0ea5e9' },
  { name: 'Julio', icon: '🏖️', image: 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=1000&q=80', gradient: 'from-amber-100 via-white to-orange-50', overlay: 'from-amber-900/20 via-transparent to-orange-900/15', decorations: ['🏖️', '🌴', '🍹'], accentColor: '#f97316' },
  { name: 'Agosto', icon: '🌻', image: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1000&q=80', gradient: 'from-yellow-100 via-white to-orange-50', overlay: 'from-yellow-900/20 via-transparent to-orange-900/15', decorations: ['🌻', '🌾', '☀️'], accentColor: '#eab308' },
  { name: 'Septiembre', icon: '🇲🇽', image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1000&q=80', gradient: 'from-red-100 via-white to-green-50', overlay: 'from-red-900/20 via-transparent to-green-900/15', decorations: ['🇲🇽', '🍂', '🌽'], accentColor: '#ef4444' },
  { name: 'Octubre', icon: '🎃', image: 'https://images.unsplash.com/photo-1509551388413-e18d0c248dbb?w=1000&q=80', gradient: 'from-orange-100 via-white to-amber-50', overlay: 'from-orange-900/25 via-transparent to-amber-900/15', decorations: ['🎃', '🍁', '🕸️'], accentColor: '#ea580c' },
  { name: 'Noviembre', icon: '💀', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1000&q=80', gradient: 'from-purple-100 via-white to-fuchsia-50', overlay: 'from-purple-900/25 via-transparent to-fuchsia-900/15', decorations: ['💀', '🕯️', '🌼'], accentColor: '#a855f7' },
  { name: 'Diciembre', icon: '🎄', image: 'https://images.unsplash.com/photo-1512389142860-9c449e58a714?w=1000&q=80', gradient: 'from-red-100 via-white to-green-50', overlay: 'from-red-900/20 via-transparent to-green-900/15', decorations: ['🎄', '❄️', '🎅'], accentColor: '#dc2626' },
];

const pad = (n: number) => n.toString().padStart(2, '0');
const getDateKey = (date: Date) => `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

function FloatingDecorations({ theme }: { theme: MonthTheme }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {theme.decorations.map((emoji, i) => (
        <span
          key={i}
          className="absolute text-3xl opacity-15 animate-float"
          style={{
            left: `${15 + i * 30}%`,
            top: `${20 + (i % 3) * 25}%`,
            animationDelay: `${i * 1.5}s`,
            animationDuration: `${5 + i * 2}s`,
          }}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
}

export default function DispatchPage() {
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<ServiceOrder | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  const theme = monthThemes[currentMonth];

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

  const handleDateSelect = (_info: DateSelectArg) => {};

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
      arg.el.style.setProperty('--special-bg', special.color);
      const numberEl = arg.el.querySelector<HTMLElement>('.fc-daygrid-day-number');
      if (numberEl) {
        numberEl.style.fontWeight = '700';
      }
      const top = arg.el.querySelector<HTMLElement>('.fc-daygrid-day-top');
      if (top) {
        const badge = document.createElement('span');
        badge.className = 'holiday-emoji';
        badge.textContent = special.emoji;
        badge.title = special.label;
        top.appendChild(badge);
      }
    }
    const today = new Date();
    if (
      arg.date.getDate() === today.getDate() &&
      arg.date.getMonth() === today.getMonth() &&
      arg.date.getFullYear() === today.getFullYear()
    ) {
      arg.el.style.setProperty('--today-ring', theme.accentColor);
    }
  };

  const eventCounts = useMemo(() => {
    const total = events.length;
    const byStatus: Record<string, number> = {};
    for (const s of Object.keys(statusLabels)) byStatus[s] = 0;
    for (const o of orders || []) {
      if (byStatus[o.status] !== undefined) byStatus[o.status]++;
    }
    return { total, byStatus };
  }, [events, orders]);

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
        .fc-day--special {
          background: var(--special-bg, #fef3c7) !important;
          border-radius: 4px;
          transition: transform 0.2s;
        }
        .fc-day--special:hover {
          transform: scale(1.02);
          z-index: 1;
        }
        .holiday-emoji {
          position: absolute;
          bottom: 1px;
          right: 2px;
          font-size: 0.9rem;
          opacity: 0.8;
          pointer-events: none;
          line-height: 1;
          filter: drop-shadow(0 1px 1px rgba(0,0,0,0.2));
        }
        .fc .fc-daygrid-day-top {
          position: relative;
        }
        .fc .fc-day-today {
          background: transparent !important;
        }
        .fc .fc-day-today .fc-daygrid-day-frame {
          box-shadow: inset 0 0 0 2px var(--today-ring, #6366f1);
          border-radius: 6px;
        }
        .fc .fc-daygrid-day {
          transition: background 0.3s;
        }
        .fc .fc-daygrid-day-frame {
          min-height: 90px;
        }
        .fc .fc-daygrid-more-link {
          color: #6366f1;
          font-weight: 600;
        }
        .fc-theme-standard .fc-scrollgrid {
          border-radius: 8px;
          overflow: hidden;
        }
        .fc .fc-toolbar-title {
          font-size: 1.1rem !important;
          font-weight: 700;
        }
        .fc .fc-button-primary {
          border-radius: 8px !important;
          font-weight: 600 !important;
          text-transform: capitalize;
        }
        .fc .fc-button-primary:not(:disabled).fc-button-active {
          background: var(--today-ring, #6366f1) !important;
          border-color: var(--today-ring, #6366f1) !important;
        }
        .fc .fc-day-other .fc-daygrid-day-top {
          opacity: 0.4;
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(-12px) rotate(3deg); }
          66% { transform: translateY(-6px) rotate(-2deg); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.35; }
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
      `}</style>
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 p-6 lg:p-8">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary-400 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4" />
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">
                {theme.icon} Calendario de Servicios
              </h1>
              <p className="text-primary-200 text-sm mt-1">
                {theme.name} temático — Arrastra y suelta para reprogramar órdenes
              </p>
            </div>
            <Link to="/service-orders/new" className="btn-primary bg-white/20 border-white/30 text-white hover:bg-white/30 inline-flex items-center gap-2 backdrop-blur-sm">
              <CalendarIcon className="w-4 h-4" />
              Nueva Orden
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 relative overflow-hidden rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg" style={{ background: `linear-gradient(135deg, ${theme.gradient.split(' ')[0].replace('from-', '')} 0%, #ffffff 50%, ${theme.gradient.split(' ')[2].replace('to-', '')} 100%)` }}>
            <div
              className="absolute inset-0 bg-cover bg-center opacity-[0.07] dark:opacity-[0.04]"
              style={{ backgroundImage: `url(${theme.image})` }}
            />
            <FloatingDecorations theme={theme} />
            <div className="relative z-10 p-4 lg:p-6">
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
                buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana' }}
                height="auto"
                eventDisplay="block"
                datesSet={handleDatesSet}
                dayCellDidMount={handleDayCellDidMount}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="card-static overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.04] rounded-full -translate-y-1/2 translate-x-1/2" style={{ background: `radial-gradient(circle, ${theme.accentColor}, transparent 70%)` }} />
              <div className="relative z-10">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.accentColor }} />
                  Leyenda
                </h3>
                <div className="space-y-2.5">
                  {Object.entries(statusLabels).map(([status, label]) => (
                    <div key={status} className="flex items-center gap-2.5 group">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: statusColors[status] }} />
                      <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {selectedEvent && (
              <div className="card-static overflow-hidden relative animate-slide-up">
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: statusColors[selectedEvent.status] || '#6b7280' }} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{selectedEvent.number}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      selectedEvent.status === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' :
                      selectedEvent.status === 'EN_PROGRESO' ? 'bg-blue-100 text-blue-700' :
                      selectedEvent.status === 'COMPLETADO' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {statusLabels[selectedEvent.status] || selectedEvent.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    {selectedEvent.description && (
                      <p className="text-gray-900 dark:text-gray-100 font-medium">{selectedEvent.description}</p>
                    )}
                    {selectedEvent.scheduledDate && (
                      <p className="flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {new Date(selectedEvent.scheduledDate).toLocaleDateString('es-MX', { dateStyle: 'long' })}
                      </p>
                    )}
                    {selectedEvent.customer && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {selectedEvent.customer.contactName}
                      </p>
                    )}
                    <Link
                      to={`/service-orders/${selectedEvent.id}`}
                      className="mt-3 w-full btn-secondary inline-flex items-center justify-center gap-1 text-xs"
                    >
                      Ver detalle <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="card-static">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.accentColor }} />
                Resumen
              </h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">Total programadas</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100 text-lg">{eventCounts.total}</span>
                </div>
                {Object.entries(statusLabels).map(([status, label]) => {
                  const count = eventCounts.byStatus[status] || 0;
                  const pct = eventCounts.total > 0 ? Math.round((count / eventCounts.total) * 100) : 0;
                  return (
                    <div key={status}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColors[status] }} />
                          <span className="text-gray-600 dark:text-gray-400">{label}</span>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{count}</span>
                      </div>
                      {eventCounts.total > 0 && (
                        <div className="mt-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: statusColors[status] }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card-static text-center py-4">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-semibold">
                {theme.name} {new Date().getFullYear()}
              </p>
              <p className="text-lg mt-1">{theme.icon} {theme.name}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
