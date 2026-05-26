import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import api from '../lib/api';
import type { Customer, Equipment } from '../types';

const equipmentTypes = [
  'Compresor',
  'Condensador',
  'Evaporador',
  'Unidad Manejo de Aire',
  'Termostato',
  'Bomba de Calor',
  'Caldera',
  'Chiller',
  'Torre de Enfriamiento',
  'Fan Coil',
  'Split',
  'VRF/VRV',
  'Mini Split',
  'Refrigerador',
  'Cámara Fría',
  'Otro',
];

const equipmentSchema = z.object({
  customerId: z.number({ required_error: 'El cliente es obligatorio', invalid_type_error: 'Selecciona un cliente' }),
  type: z.string().min(1, 'El tipo de equipo es obligatorio'),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  capacity: z.string().optional(),
  location: z.string().optional(),
  installDate: z.string().optional(),
  lastService: z.string().optional(),
  notes: z.string().optional(),
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;

export default function EquipmentFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await api.get<Customer[]>('/customers');
      return data;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
  });

  const { data: equipmentData, isLoading: loadingEquipment } = useQuery<Equipment>({
    queryKey: ['equipment', id],
    queryFn: async () => {
      const { data } = await api.get<Equipment>(`/equipment/${id}`);
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (equipmentData) {
      reset({
        customerId: equipmentData.customerId,
        type: equipmentData.type,
        brand: equipmentData.brand || '',
        model: equipmentData.model || '',
        serialNumber: equipmentData.serialNumber || '',
        capacity: equipmentData.capacity || '',
        location: equipmentData.location || '',
        installDate: equipmentData.installDate ? equipmentData.installDate.split('T')[0] : '',
        lastService: equipmentData.lastService ? equipmentData.lastService.split('T')[0] : '',
        notes: equipmentData.notes || '',
      });
    }
  }, [equipmentData, reset]);

  const mutation = useMutation({
    mutationFn: async (data: EquipmentFormData) => {
      if (isEditing) {
        await api.put(`/equipment/${id}`, data);
      } else {
        await api.post('/equipment', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success(isEditing ? 'Equipo actualizado' : 'Equipo creado');
      navigate('/equipment');
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al guardar'
          : 'Error al guardar';
      toast.error(message);
    },
  });

  const onSubmit = (data: EquipmentFormData) => {
    mutation.mutate(data);
  };

  if (isEditing && loadingEquipment) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/equipment')} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isEditing ? 'Editar Equipo' : 'Nuevo Equipo'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isEditing ? 'Modifica los datos del equipo' : 'Registra un nuevo equipo en el sistema'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cliente *</label>
            <select {...register('customerId', { valueAsNumber: true })} className="input-field">
              <option value="">Seleccionar cliente...</option>
              {customers?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.contactName}{c.companyName ? ` - ${c.companyName}` : ''}
                </option>
              ))}
            </select>
            {errors.customerId && <p className="text-red-500 text-xs mt-1">{errors.customerId.message}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tipo de Equipo *</label>
            <select {...register('type')} className="input-field">
              <option value="">Seleccionar tipo...</option>
              {equipmentTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Marca</label>
            <input {...register('brand')} className="input-field" placeholder="Carrier, Trane, etc." />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Modelo</label>
            <input {...register('model')} className="input-field" placeholder="Modelo del equipo" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Número de Serie</label>
            <input {...register('serialNumber')} className="input-field" placeholder="SN-12345" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Capacidad</label>
            <input {...register('capacity')} className="input-field" placeholder="5 Tons / 60,000 BTU" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ubicación</label>
            <input {...register('location')} className="input-field" placeholder="Planta baja, edificio A, etc." />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fecha de Instalación</label>
            <input {...register('installDate')} type="date" className="input-field" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Último Servicio</label>
            <input {...register('lastService')} type="date" className="input-field" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notas</label>
            <textarea {...register('notes')} rows={3} className="input-field" placeholder="Notas adicionales..." />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button type="button" onClick={() => navigate('/equipment')} className="btn-secondary">
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
