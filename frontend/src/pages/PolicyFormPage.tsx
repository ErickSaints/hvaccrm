import { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Loader2, Calculator } from 'lucide-react';
import api from '../lib/api';
import type { Customer, MaintenancePolicy } from '../types';

const frequencies = [
  { value: 'MENSUAL', label: 'Mensual' },
  { value: 'BIMESTRAL', label: 'Bimestral' },
  { value: 'TRIMESTRAL', label: 'Trimestral' },
  { value: 'SEMESTRAL', label: 'Semestral' },
  { value: 'ANUAL', label: 'Anual' },
] as const;

const policySchema = z.object({
  customerId: z.number({ required_error: 'Selecciona un cliente' }),
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  frequency: z.enum(['MENSUAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'], {
    required_error: 'Selecciona una frecuencia',
  }),
  visitCount: z.number({ required_error: 'Indica el número de visitas' }).min(1, 'Debe ser al menos 1'),
  pricePerVisit: z.number({ required_error: 'Indica el precio por visita' }).min(0, 'No puede ser negativo'),
  totalPrice: z.number().optional(),
  startDate: z.string().min(1, 'La fecha de inicio es obligatoria'),
  endDate: z.string().min(1, 'La fecha de fin es obligatoria'),
  notes: z.string().optional(),
});

type PolicyFormData = z.infer<typeof policySchema>;

export default function PolicyFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PolicyFormData>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      visitCount: 1,
      pricePerVisit: 0,
    },
  });

  const visitCount = watch('visitCount');
  const pricePerVisit = watch('pricePerVisit');

  useEffect(() => {
    const total = (Number(visitCount) || 0) * (Number(pricePerVisit) || 0);
    setValue('totalPrice', total);
  }, [visitCount, pricePerVisit, setValue]);

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await api.get<Customer[]>('/customers');
      return data;
    },
  });

  const { data: policyData, isLoading: loadingPolicy } = useQuery<MaintenancePolicy>({
    queryKey: ['maintenance-policy', id],
    queryFn: async () => {
      const { data } = await api.get<MaintenancePolicy>(`/maintenance-policies/${id}`);
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (policyData) {
      reset({
        customerId: policyData.customerId,
        name: policyData.name,
        description: policyData.description || '',
        frequency: policyData.frequency,
        visitCount: policyData.visitCount,
        pricePerVisit: policyData.pricePerVisit,
        totalPrice: policyData.totalPrice,
        startDate: policyData.startDate.split('T')[0],
        endDate: policyData.endDate.split('T')[0],
        notes: policyData.notes || '',
      });
    }
  }, [policyData, reset]);

  const mutation = useMutation({
    mutationFn: async (data: PolicyFormData) => {
      const payload = {
        ...data,
        totalPrice: (Number(data.visitCount) || 0) * (Number(data.pricePerVisit) || 0),
      };
      if (isEditing) {
        await api.put(`/maintenance-policies/${id}`, payload);
      } else {
        await api.post('/maintenance-policies', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-policies'] });
      toast.success(isEditing ? 'Póliza actualizada' : 'Póliza creada');
      navigate('/policies');
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data?: { message?: string } } }).response?.data?.message || 'Error al guardar'
          : 'Error al guardar';
      toast.error(message);
    },
  });

  const onSubmit = (data: PolicyFormData) => {
    mutation.mutate(data);
  };

  if (isEditing && loadingPolicy) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/policies')} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Póliza' : 'Nueva Póliza de Mantenimiento'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEditing ? 'Modifica los datos de la póliza' : 'Registra una nueva póliza de mantenimiento'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Cliente *</label>
          <select {...register('customerId', { valueAsNumber: true })} className="input-field">
            <option value="">Seleccionar cliente...</option>
            {customers?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName ? `${c.companyName} - ${c.contactName}` : c.contactName}
              </option>
            ))}
          </select>
          {errors.customerId && <p className="text-red-500 text-xs mt-1">{errors.customerId.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de la Póliza *</label>
            <input {...register('name')} className="input-field" placeholder="Mantenimiento Preventivo Anual" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
            <textarea {...register('description')} rows={3} className="input-field" placeholder="Describe los servicios incluidos en la póliza..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Frecuencia *</label>
            <select {...register('frequency')} className="input-field">
              <option value="">Seleccionar frecuencia...</option>
              {frequencies.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            {errors.frequency && <p className="text-red-500 text-xs mt-1">{errors.frequency.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Número de Visitas *</label>
            <input {...register('visitCount', { valueAsNumber: true })} type="number" min="1" className="input-field" />
            {errors.visitCount && <p className="text-red-500 text-xs mt-1">{errors.visitCount.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Precio por Visita ($) *</label>
            <input {...register('pricePerVisit', { valueAsNumber: true })} type="number" min="0" step="0.01" className="input-field" placeholder="0.00" />
            {errors.pricePerVisit && <p className="text-red-500 text-xs mt-1">{errors.pricePerVisit.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Precio Total ($)</label>
            <div className="relative">
              <input
                {...register('totalPrice', { valueAsNumber: true })}
                type="number"
                readOnly
                className="input-field bg-gray-50 pr-10"
                placeholder="Calculado automáticamente"
              />
              <Calculator className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {visitCount || 0} visitas × ${Number(pricePerVisit || 0).toFixed(2)} = ${((visitCount || 0) * (pricePerVisit || 0)).toFixed(2)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de Inicio *</label>
            <input {...register('startDate')} type="date" className="input-field" />
            {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de Fin *</label>
            <input {...register('endDate')} type="date" className="input-field" />
            {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate.message}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas</label>
            <textarea {...register('notes')} rows={3} className="input-field" placeholder="Notas adicionales..." />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={() => navigate('/policies')} className="btn-secondary">
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
