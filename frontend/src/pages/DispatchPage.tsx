import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core';
import { ArrowLeft, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
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

export default function DispatchPage() {
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<ServiceOrder | null>(null);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Calendario de Servicios</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Arrastra y suelta para reprogramar órdenes</p>
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
        {/* Calendar */}
        <div className="lg:col-span-3 card">
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
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Legend */}
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

          {/* Selected Order Details */}
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

          {/* Summary */}
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
  );
}
