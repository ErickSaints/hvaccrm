import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Loader2, Ticket, Shield } from 'lucide-react';
import api from '../lib/api';
import type { ServiceOrder, Customer, User, Equipment, Ticket as TicketType, MaintenancePolicy } from '../types';

const serviceOrderSchema = z.object({
  customerId: z.number({ required_error: 'Selecciona un cliente' }),
  equipmentId: z.number().optional().nullable(),
  description: z.string().optional(),
  scheduledDate: z.string().optional(),
  assignedTo: z.number().optional().nullable(),
  notes: z.string().optional(),
});

type ServiceOrderFormData = z.infer<typeof serviceOrderSchema>;

export default function ServiceOrderFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);
  const ticketId = searchParams.get('ticketId');
  const policyId = searchParams.get('policyId');

  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ServiceOrderFormData>({
    resolver: zodResolver(serviceOrderSchema),
    defaultValues: {
      equipmentId: null,
      assignedTo: null,
    },
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await api.get<Customer[]>('/customers');
      return data;
    },
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get<User[]>('/users');
      return data;
    },
  });

  const { data: equipmentList } = useQuery<Equipment[]>({
    queryKey: ['equipment-by-customer', selectedCustomerId],
    queryFn: async () => {
      if (!selectedCustomerId) return [];
      const { data } = await api.get<Equipment[]>(`/customers/${selectedCustomerId}/equipment`);
      return data;
    },
    enabled: Boolean(selectedCustomerId),
  });

  const { data: linkedTicket } = useQuery<TicketType>({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      const { data } = await api.get<TicketType>(`/tickets/${ticketId}`);
      return data;
    },
    enabled: Boolean(ticketId),
  });

  const { data: linkedPolicy } = useQuery<MaintenancePolicy>({
    queryKey: ['policy', policyId],
    queryFn: async () => {
      const { data } = await api.get<MaintenancePolicy>(`/maintenance-policies/${policyId}`);
      return data;
    },
    enabled: Boolean(policyId),
  });

  const { data: orderData, isLoading: loadingOrder } = useQuery<ServiceOrder>({
    queryKey: ['service-order', id],
    queryFn: async () => {
      const { data } = await api.get<ServiceOrder>(`/service-orders/${id}`);
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (orderData) {
      reset({
        customerId: orderData.customerId,
        equipmentId: orderData.equipmentId ?? null,
        description: orderData.description || '',
        scheduledDate: orderData.scheduledDate ? orderData.scheduledDate.split('T')[0] : '',
        assignedTo: orderData.assignedTo ?? null,
        notes: orderData.notes || '',
      });
      setSelectedCustomerId(orderData.customerId);
    }
  }, [orderData, reset]);

  useEffect(() => {
    if (linkedTicket && !isEditing) {
      const cid = linkedTicket.customerId;
      setSelectedCustomerId(cid);
      setValue('customerId', cid);
      setValue('description', linkedTicket.description);
      if (linkedTicket.equipmentId) {
        setValue('equipmentId', linkedTicket.equipmentId);
      }
      if (linkedTicket.assignedTo) {
        setValue('assignedTo', linkedTicket.assignedTo);
      }
    }
  }, [linkedTicket, setValue, isEditing]);

  useEffect(() => {
    if (linkedPolicy && !isEditing) {
      const cid = linkedPolicy.customerId;
      setSelectedCustomerId(cid);
      setValue('customerId', cid);
      setValue('description', `Servicio de mantenimiento - Póliza ${linkedPolicy.number}`);
    }
  }, [linkedPolicy, setValue, isEditing]);

  const mutation = useMutation({
    mutationFn: async (data: ServiceOrderFormData) => {
      const payload = {
        ...data,
        ...(ticketId ? { ticketId: Number(ticketId) } : {}),
        ...(policyId ? { policyId: Number(policyId) } : {}),
      };
      if (isEditing) {
        await api.put(`/service-orders/${id}`, payload);
      } else {
        await api.post('/service-orders', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      if (ticketId) queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      if (policyId) queryClient.invalidateQueries({ queryKey: ['policy', policyId] });
      toast.success(isEditing ? 'Orden actualizada' : 'Orden creada');
      navigate('/service-orders');
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data?: { message?: string } } }).response?.data?.message || 'Error al guardar'
          : 'Error al guardar';
      toast.error(message);
    },
  });

  const onSubmit = (data: ServiceOrderFormData) => {
    mutation.mutate(data);
  };

  if (isEditing && loadingOrder) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/service-orders')} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Orden de Servicio' : 'Nueva Orden de Servicio'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEditing ? 'Modifica los datos de la orden' : 'Registra una nueva orden de servicio'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {linkedTicket && (
          <div className="card border-blue-200 bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <Ticket className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Ticket Vinculado</h3>
            </div>
            <p className="text-sm text-blue-800">
              <span className="font-medium">#{linkedTicket.id}</span> - {linkedTicket.title}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Cliente: {linkedTicket.customer?.contactName || linkedTicket.customer?.companyName}
            </p>
          </div>
        )}

        {linkedPolicy && (
          <div className="card border-green-200 bg-green-50">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-900">Póliza Vinculada</h3>
            </div>
            <p className="text-sm text-green-800">
              <span className="font-medium">{linkedPolicy.number}</span> - {linkedPolicy.name}
            </p>
            <p className="text-xs text-green-600 mt-1">
              Cliente: {linkedPolicy.customer?.contactName || linkedPolicy.customer?.companyName}
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Cliente *</label>
          <select
            {...register('customerId', { valueAsNumber: true })}
            className="input-field"
            disabled={Boolean(linkedPolicy || (linkedTicket && !isEditing))}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : null;
              setSelectedCustomerId(val);
              setValue('customerId', val ?? undefined as unknown as number);
              setValue('equipmentId', null);
            }}
          >
            <option value="">Seleccionar cliente...</option>
            {customers?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName ? `${c.companyName} - ${c.contactName}` : c.contactName}
              </option>
            ))}
          </select>
          {errors.customerId && <p className="text-red-500 text-xs mt-1">{errors.customerId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Equipo (opcional)</label>
          <select
            {...register('equipmentId', { valueAsNumber: true })}
            className="input-field"
            disabled={!selectedCustomerId}
          >
            <option value="">Sin equipo específico</option>
            {equipmentList?.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.type}{eq.brand ? ` - ${eq.brand}` : ''}{eq.model ? ` (${eq.model})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
          <textarea
            {...register('description')}
            rows={3}
            className="input-field"
            placeholder="Describe el trabajo a realizar..."
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha Programada</label>
            <input type="date" {...register('scheduledDate')} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Asignar a</label>
            <Controller
              name="assignedTo"
              control={control}
              render={({ field }) => (
                <select
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  className="input-field"
                >
                  <option value="">Sin asignar</option>
                  {users?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas</label>
          <textarea
            {...register('notes')}
            rows={2}
            className="input-field"
            placeholder="Notas internas o adicionales..."
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={() => navigate('/service-orders')} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary inline-flex items-center gap-2">
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isEditing ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
