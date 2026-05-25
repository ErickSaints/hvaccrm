import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Loader2, AlertTriangle } from 'lucide-react';
import api from '../lib/api';
import type { Ticket, Customer, User, Equipment } from '../types';

const ticketSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().min(1, 'La descripción es obligatoria'),
  level: z.enum(['EMERGENCIA', 'ATENCION', 'PROGRAMAR']),
  customerId: z.number({ required_error: 'Selecciona un cliente', invalid_type_error: 'Selecciona un cliente' }),
  equipmentId: z.number().optional().nullable(),
  assignedTo: z.number().optional().nullable(),
});

type TicketFormData = z.infer<typeof ticketSchema>;

export default function TicketFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);
  const preselectedCustomer = searchParams.get('customerId');

  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    preselectedCustomer ? Number(preselectedCustomer) : null
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      level: 'ATENCION',
      equipmentId: null,
      assignedTo: null,
    },
  });

  const watchedLevel = watch('level');

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

  const { data: ticketData, isLoading: loadingTicket } = useQuery<Ticket>({
    queryKey: ['ticket', id],
    queryFn: async () => {
      const { data } = await api.get<Ticket>(`/tickets/${id}`);
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (ticketData) {
      reset({
        title: ticketData.title,
        description: ticketData.description,
        level: ticketData.level,
        customerId: ticketData.customerId,
        equipmentId: ticketData.equipmentId ?? null,
        assignedTo: ticketData.assignedTo ?? null,
      });
      setSelectedCustomerId(ticketData.customerId);
    }
  }, [ticketData, reset]);

  useEffect(() => {
    if (preselectedCustomer) {
      const cid = Number(preselectedCustomer);
      setSelectedCustomerId(cid);
      setValue('customerId', cid);
    }
  }, [preselectedCustomer, setValue]);

  const mutation = useMutation({
    mutationFn: async (data: TicketFormData) => {
      if (isEditing) {
        await api.put(`/tickets/${id}`, data);
      } else {
        await api.post('/tickets', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success(isEditing ? 'Ticket actualizado' : 'Ticket creado');
      navigate('/tickets');
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al guardar'
          : 'Error al guardar';
      toast.error(message);
    },
  });

  const onSubmit = (data: TicketFormData) => {
    mutation.mutate(data);
  };

  if (isEditing && loadingTicket) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/tickets')} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Ticket' : 'Nuevo Ticket'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEditing ? 'Modifica los datos del ticket' : 'Registra un nuevo ticket de servicio'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={`card space-y-5 ${watchedLevel === 'EMERGENCIA' ? 'ring-2 ring-red-300 border-red-200' : ''}`}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nivel *</label>
          <div className="flex gap-2">
            {(['EMERGENCIA', 'ATENCION', 'PROGRAMAR'] as const).map((lvl) => (
              <label
                key={lvl}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all text-sm font-medium ${
                  watchedLevel === lvl
                    ? lvl === 'EMERGENCIA'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : lvl === 'ATENCION'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  value={lvl}
                  {...register('level')}
                  className="sr-only"
                />
                {lvl === 'EMERGENCIA' && <AlertTriangle className="w-4 h-4" />}
                {lvl === 'EMERGENCIA' ? 'Emergencia' : lvl === 'ATENCION' ? 'Atención' : 'Programar'}
              </label>
            ))}
          </div>
          {errors.level && <p className="text-red-500 text-xs mt-1">{errors.level.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Título *</label>
          <input {...register('title')} className="input-field" placeholder="Describre el problema en una línea" />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción *</label>
          <textarea {...register('description')} rows={4} className="input-field" placeholder="Describe el problema detalladamente..." />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Cliente *</label>
          <select
            {...register('customerId', { valueAsNumber: true })}
            className="input-field"
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
          {errors.equipmentId && <p className="text-red-500 text-xs mt-1">{errors.equipmentId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Asignar a (opcional)</label>
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
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            )}
          />
          {errors.assignedTo && <p className="text-red-500 text-xs mt-1">{errors.assignedTo.message}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={() => navigate('/tickets')} className="btn-secondary">
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
