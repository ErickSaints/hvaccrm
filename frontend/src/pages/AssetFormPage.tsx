import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import api from '../lib/api';
import type { Customer } from '../types';

const assetSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  serialNumber: z.string().optional(),
  location: z.string().optional(),
  customerId: z.number({ required_error: 'Selecciona un cliente' }),
});

type AssetFormData = z.infer<typeof assetSchema>;

export default function AssetFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await api.get('/customers?limit=1000');
      return data.data ?? [];
    },
  });

  const { data: assetData, isLoading } = useQuery({
    queryKey: ['asset', id],
    queryFn: () => api.get(`/assets/${id}`).then(r => r.data),
    enabled: isEditing,
  });

  useEffect(() => {
    if (assetData) {
      reset({
        name: assetData.name,
        description: assetData.description || '',
        serialNumber: assetData.serialNumber || '',
        location: assetData.location || '',
        customerId: assetData.customerId,
      });
    }
  }, [assetData, reset]);

  const mutation = useMutation({
    mutationFn: (data: AssetFormData) =>
      isEditing ? api.put(`/assets/${id}`, data) : api.post('/assets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success(isEditing ? 'Activo actualizado' : 'Activo creado');
      navigate('/assets');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Error al guardar'),
  });

  if (isEditing && isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/assets')} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{isEditing ? 'Editar Activo' : 'Nuevo Activo'}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Registra un equipo o activo fijo con código QR</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="card space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre del Activo *</label>
          <input {...register('name')} className="input-field" placeholder="Ej: Chiller Carrier 30RB-200" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descripción</label>
          <textarea {...register('description')} rows={3} className="input-field" placeholder="Descripción del activo..." />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Número de Serie</label>
            <input {...register('serialNumber')} className="input-field" placeholder="SN-001" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ubicación</label>
            <input {...register('location')} className="input-field" placeholder="Ej: Planta baja, cuarto técnico" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cliente *</label>
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

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button type="button" onClick={() => navigate('/assets')} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary inline-flex items-center gap-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEditing ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
