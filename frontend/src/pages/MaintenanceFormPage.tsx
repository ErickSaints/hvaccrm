import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Loader2, Shield } from 'lucide-react';
import api from '../lib/api';
import type { MaintenanceLog, MaintenancePolicy, User, Equipment } from '../types';

const maintenanceSchema = z.object({
  policyId: z.number({ required_error: 'Selecciona una póliza' }),
  equipmentId: z.number().optional().nullable(),
  description: z.string().min(1, 'La descripción es obligatoria'),
  scheduledDate: z.string().min(1, 'La fecha programada es obligatoria'),
  assignedTo: z.number().optional().nullable(),
  notes: z.string().optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

export default function MaintenanceFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);
  const policyIdParam = searchParams.get('policyId');

  const [selectedPolicyId, setSelectedPolicyId] = useState<number | null>(
    policyIdParam ? Number(policyIdParam) : null
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      equipmentId: null,
      assignedTo: null,
    },
  });

  const watchPolicyId = watch('policyId');

  const { data: policies } = useQuery<MaintenancePolicy[]>({
    queryKey: ['maintenance-policies'],
    queryFn: async () => {
      const { data } = await api.get<MaintenancePolicy[]>('/maintenance-policies');
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

  const selectedPolicy = policies?.find((p) => p.id === (selectedPolicyId ?? watchPolicyId));

  useEffect(() => {
    if (selectedPolicy?.customerId) {
      setSelectedCustomerId(selectedPolicy.customerId);
    }
  }, [selectedPolicy]);

  const { data: equipmentList } = useQuery<Equipment[]>({
    queryKey: ['equipment-by-customer', selectedCustomerId],
    queryFn: async () => {
      if (!selectedCustomerId) return [];
      const { data } = await api.get<Equipment[]>(`/customers/${selectedCustomerId}/equipment`);
      return data;
    },
    enabled: Boolean(selectedCustomerId),
  });

  const { data: linkedPolicy } = useQuery<MaintenancePolicy>({
    queryKey: ['maintenance-policy', policyIdParam],
    queryFn: async () => {
      const { data } = await api.get<MaintenancePolicy>(`/maintenance-policies/${policyIdParam}`);
      return data;
    },
    enabled: Boolean(policyIdParam && !isEditing),
  });

  const { data: logData, isLoading: loadingLog } = useQuery<MaintenanceLog>({
    queryKey: ['maintenance', id],
    queryFn: async () => {
      const { data } = await api.get<MaintenanceLog>(`/maintenance/${id}`);
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (logData) {
      reset({
        policyId: logData.policyId,
        equipmentId: logData.equipmentId ?? null,
        description: logData.description || '',
        scheduledDate: logData.scheduledDate ? logData.scheduledDate.split('T')[0] : '',
        assignedTo: logData.assignedTo ?? null,
        notes: logData.notes || '',
      });
      setSelectedPolicyId(logData.policyId);
    }
  }, [logData, reset]);

  useEffect(() => {
    if (linkedPolicy && !isEditing) {
      setSelectedPolicyId(linkedPolicy.id);
      setValue('policyId', linkedPolicy.id);
      setValue('description', `Mantenimiento - ${linkedPolicy.name}`);
    }
  }, [linkedPolicy, setValue, isEditing]);

  const mutation = useMutation({
    mutationFn: async (data: MaintenanceFormData) => {
      if (isEditing) {
        await api.put(`/maintenance/${id}`, data);
      } else {
        await api.post('/maintenance', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      if (selectedPolicyId) {
        queryClient.invalidateQueries({ queryKey: ['maintenance-policy', selectedPolicyId] });
      }
      toast.success(isEditing ? 'Mantenimiento actualizado' : 'Mantenimiento programado');
      navigate('/maintenance');
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data?: { message?: string } } }).response?.data?.message || 'Error al guardar'
          : 'Error al guardar';
      toast.error(message);
    },
  });

  const onSubmit = (data: MaintenanceFormData) => {
    mutation.mutate(data);
  };

  if (isEditing && loadingLog) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/maintenance')} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Mantenimiento' : 'Programar Mantenimiento'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEditing ? 'Modifica los datos del mantenimiento' : 'Registra una nueva visita de mantenimiento'}
          </p>
        </div>
      </div>

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

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Póliza *</label>
          <select
            {...register('policyId', { valueAsNumber: true })}
            className="input-field"
            disabled={Boolean(linkedPolicy && !isEditing)}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : null;
              setSelectedPolicyId(val);
              setValue('policyId', val ?? undefined as unknown as number);
              setValue('equipmentId', null);
            }}
          >
            <option value="">Seleccionar póliza...</option>
            {policies?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.number} - {p.name}
                {p.customer ? ` (${p.customer.contactName})` : ''}
              </option>
            ))}
          </select>
          {errors.policyId && <p className="text-red-500 text-xs mt-1">{errors.policyId.message}</p>}
        </div>

        {selectedPolicy && (
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            <p><span className="font-medium text-gray-700">Cliente:</span> {selectedPolicy.customer?.contactName || selectedPolicy.customer?.companyName || `#${selectedPolicy.customerId}`}</p>
            <p className="mt-1"><span className="font-medium text-gray-700">Frecuencia:</span> {selectedPolicy.frequency} | <span className="font-medium text-gray-700">Vigencia:</span> {new Date(selectedPolicy.startDate).toLocaleDateString('es-MX')} - {new Date(selectedPolicy.endDate).toLocaleDateString('es-MX')}</p>
          </div>
        )}

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
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción *</label>
          <textarea
            {...register('description')}
            rows={3}
            className="input-field"
            placeholder="Describe la actividad de mantenimiento..."
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha Programada *</label>
            <input type="date" {...register('scheduledDate')} className="input-field" />
            {errors.scheduledDate && <p className="text-red-500 text-xs mt-1">{errors.scheduledDate.message}</p>}
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
            placeholder="Notas internas o instrucciones especiales..."
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={() => navigate('/maintenance')} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary inline-flex items-center gap-2">
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isEditing ? 'Actualizar' : 'Programar'}
          </button>
        </div>
      </form>
    </div>
  );
}
