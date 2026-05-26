import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Loader2, Plus, Trash2, Image, Package, Clock } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import PhotoUploader from '../components/PhotoUploader';
import type { ServiceReport, ServiceOrder } from '../types';

const photoSchema = z.object({
  url: z.string().min(1, 'La foto es requerida'),
  caption: z.string().optional(),
  type: z.string().optional(),
});

const materialSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  quantity: z.number().min(0, 'Mínimo 0'),
  unitPrice: z.number().min(0, 'Mínimo 0'),
  total: z.number(),
});

const serviceReportSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional(),
  diagnosis: z.string().optional(),
  workPerformed: z.string().optional(),
  recommendations: z.string().optional(),
  arrivalTime: z.string().optional(),
  departureTime: z.string().optional(),
  signature: z.string().optional(),
  photos: z.array(photoSchema).optional(),
  materials: z.array(materialSchema).optional(),
});

type ServiceReportFormData = z.infer<typeof serviceReportSchema>;

export default function ServiceReportFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);
  const serviceOrderId = searchParams.get('serviceOrderId');
  const { user: currentUser } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ServiceReportFormData>({
    resolver: zodResolver(serviceReportSchema),
    defaultValues: {
      title: '',
      description: '',
      diagnosis: '',
      workPerformed: '',
      recommendations: '',
      photos: [],
      materials: [{ name: '', quantity: 1, unitPrice: 0, total: 0 }],
    },
  });

  const { fields: photoFields, append: appendPhoto, remove: removePhoto } = useFieldArray({
    control,
    name: 'photos',
  });

  const { fields: materialFields, append: appendMaterial, remove: removeMaterial } = useFieldArray({
    control,
    name: 'materials',
  });

  const materials = watch('materials') || [];
  const materialsTotal = materials.reduce((sum, m) => sum + (m.quantity || 0) * (m.unitPrice || 0), 0);

  const { data: serviceOrder, isLoading: loadingOrder } = useQuery<ServiceOrder>({
    queryKey: ['service-order', serviceOrderId],
    queryFn: async () => {
      const { data } = await api.get<ServiceOrder>(`/service-orders/${serviceOrderId}`);
      return data;
    },
    enabled: Boolean(serviceOrderId),
  });

  const { data: reportData, isLoading: loadingReport } = useQuery<ServiceReport>({
    queryKey: ['service-report', id],
    queryFn: async () => {
      const { data } = await api.get<ServiceReport>(`/service-reports/${id}`);
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (reportData) {
      reset({
        title: reportData.title,
        description: reportData.description || '',
        diagnosis: reportData.diagnosis || '',
        workPerformed: reportData.workPerformed || '',
        recommendations: reportData.recommendations || '',
        arrivalTime: reportData.arrivalTime || '',
        departureTime: reportData.departureTime || '',
        signature: reportData.signature || '',
        photos: reportData.photos?.map((p) => ({ url: p.url, caption: p.caption || '', type: p.type || '' })) || [],
        materials: reportData.usedMaterials?.map((m) => ({
          name: m.name,
          quantity: m.quantity,
          unitPrice: m.unitPrice,
          total: m.total,
        })) || [{ name: '', quantity: 1, unitPrice: 0, total: 0 }],
      });
    }
  }, [reportData, reset]);

  useEffect(() => {
    if (serviceOrder && !isEditing && !reportData) {
      reset({
        title: `Reporte - ${serviceOrder.number}`,
        description: serviceOrder.description || '',
        diagnosis: '',
        workPerformed: '',
        recommendations: '',
        arrivalTime: '',
        departureTime: '',
        signature: '',
        photos: [],
        materials: [{ name: '', quantity: 1, unitPrice: 0, total: 0 }],
      });
    }
  }, [serviceOrder, isEditing, reportData, reset]);

  const mutation = useMutation({
    mutationFn: async (formData: ServiceReportFormData) => {
      const payload = {
        title: formData.title,
        description: formData.description,
        diagnosis: formData.diagnosis,
        workPerformed: formData.workPerformed,
        recommendations: formData.recommendations,
        arrivalTime: formData.arrivalTime,
        departureTime: formData.departureTime,
        signature: formData.signature,
        serviceOrderId: serviceOrderId ? Number(serviceOrderId) : reportData?.serviceOrderId,
        technicianId: currentUser?.id,
        customerId: serviceOrder?.customerId || reportData?.customerId,
        equipmentId: serviceOrder?.equipmentId || reportData?.equipmentId,
        photos: formData.photos?.filter((p) => p.url?.trim()).map((p) => ({
          url: p.url,
          caption: p.caption,
          type: p.type,
        })) || [],
        usedMaterials: formData.materials?.filter((m) => m.name.trim()).map((m) => ({
          name: m.name,
          quantity: m.quantity,
          unitPrice: m.unitPrice,
          total: (m.quantity || 0) * (m.unitPrice || 0),
        })) || [],
      };

      if (isEditing) {
        await api.put(`/service-reports/${id}`, payload);
      } else {
        await api.post('/service-reports', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-reports'] });
      if (serviceOrderId) {
        queryClient.invalidateQueries({ queryKey: ['service-order', serviceOrderId] });
      }
      toast.success(isEditing ? 'Reporte actualizado' : 'Reporte creado');
      navigate('/service-reports');
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const message = axiosErr?.response?.data?.error || 'Error al guardar';
      toast.error(message);
    },
  });

  const onSubmit = (data: ServiceReportFormData) => {
    mutation.mutate(data);
  };

  const addEmptyMaterial = useCallback(() => {
    appendMaterial({ name: '', quantity: 1, unitPrice: 0, total: 0 });
  }, [appendMaterial]);

  const addEmptyPhoto = useCallback(() => {
    appendPhoto({ url: '', caption: '', type: '' });
  }, [appendPhoto]);

  if ((isEditing && loadingReport) || (serviceOrderId && loadingOrder)) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/service-reports')} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isEditing ? 'Editar Reporte de Servicio' : 'Nuevo Reporte de Servicio'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isEditing ? 'Modifica el reporte técnico' : 'Registra el reporte del servicio realizado'}
          </p>
        </div>
      </div>

      {serviceOrder && (
        <div className="card border-primary-200 bg-primary-50 space-y-2">
          <h3 className="font-semibold text-primary-900">Orden de Servicio: {serviceOrder.number}</h3>
          <p className="text-sm text-primary-800">
            Cliente: {serviceOrder.customer?.contactName || serviceOrder.customer?.companyName}
            {serviceOrder.equipment && ` | Equipo: ${serviceOrder.equipment.type}`}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Información General</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Título *</label>
            <input
              {...register('title')}
              className="input-field"
              placeholder="Ej: Reporte de Mantenimiento Preventivo"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descripción</label>
            <textarea
              {...register('description')}
              rows={2}
              className="input-field"
              placeholder="Descripción general del servicio..."
            />
          </div>
        </div>

        <div className="card space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Diagnóstico</h2>
          <textarea
            {...register('diagnosis')}
            rows={4}
            className="input-field"
            placeholder="Describe los hallazgos del diagnóstico realizado..."
          />
        </div>

        <div className="card space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Trabajo Realizado</h2>
          <textarea
            {...register('workPerformed')}
            rows={4}
            className="input-field"
            placeholder="Describe detalladamente el trabajo realizado..."
          />
        </div>

        <div className="card space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recomendaciones</h2>
          <textarea
            {...register('recommendations')}
            rows={4}
            className="input-field"
            placeholder="Recomendaciones para el cliente, mantenimientos futuros, etc..."
          />
        </div>

        <div className="card space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            Tiempo de Servicio
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Hora de Llegada</label>
              <input type="time" {...register('arrivalTime')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Hora de Salida</label>
              <input type="time" {...register('departureTime')} className="input-field" />
            </div>
          </div>
        </div>

        <div className="card space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Image className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              Fotografías
            </h2>
            <button
              type="button"
              onClick={addEmptyPhoto}
              className="btn-secondary inline-flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Agregar Foto
            </button>
          </div>

          {photoFields.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No hay fotos agregadas</p>
          ) : (
            <div className="space-y-4">
              {photoFields.map((field, index) => (
                <div key={field.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3 relative">
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors z-10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <Controller
                    name={`photos.${index}.url`}
                    control={control}
                    render={({ field: ctrlField }) => (
                      <PhotoUploader
                        value={ctrlField.value || ''}
                        onChange={(url) => ctrlField.onChange(url)}
                        onClear={() => ctrlField.onChange('')}
                        className="max-w-xs"
                      />
                    )}
                  />
                  {errors.photos?.[index]?.url && (
                    <p className="text-red-500 text-xs mt-1">{errors.photos[index]?.url?.message}</p>
                  )}

                  <div className="flex gap-3">
                    <input
                      {...register(`photos.${index}.caption`)}
                      className="input-field text-sm flex-1"
                      placeholder="Descripción de la foto"
                    />
                    <select {...register(`photos.${index}.type`)} className="input-field text-sm w-36">
                      <option value="">Tipo</option>
                      <option value="ANTES">Antes</option>
                      <option value="DESPUES">Después</option>
                      <option value="PROCESO">En Proceso</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              Materiales Utilizados
            </h2>
            <button
              type="button"
              onClick={addEmptyMaterial}
              className="btn-secondary inline-flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Agregar Material
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left px-3 py-3 font-semibold text-gray-600">Material</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-600 w-24">Cant.</th>
                  <th className="text-right px-3 py-3 font-semibold text-gray-600 w-32">P. Unitario</th>
                  <th className="text-right px-3 py-3 font-semibold text-gray-600 w-32">Total</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-600 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {materialFields.map((field, index) => (
                  <tr key={field.id}>
                    <td className="px-3 py-2">
                      <input
                        {...register(`materials.${index}.name`)}
                        className="input-field text-sm"
                        placeholder="Nombre del material"
                      />
                      {errors.materials?.[index]?.name && (
                        <p className="text-red-500 text-xs mt-1">{errors.materials[index]?.name?.message}</p>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Controller
                        name={`materials.${index}.quantity`}
                        control={control}
                        render={({ field: ctrlField }) => (
                          <input
                            type="number"
                            min="0"
                            value={ctrlField.value || 0}
                            onChange={(e) => ctrlField.onChange(Math.max(0, Number(e.target.value)))}
                            className="input-field text-sm text-center"
                          />
                        )}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Controller
                        name={`materials.${index}.unitPrice`}
                        control={control}
                        render={({ field: ctrlField }) => (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={ctrlField.value || 0}
                            onChange={(e) => ctrlField.onChange(Math.max(0, Number(e.target.value)))}
                            className="input-field text-sm text-right"
                          />
                        )}
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-gray-100">
                      ${((materials[index]?.quantity || 0) * (materials[index]?.unitPrice || 0)).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeMaterial(index)}
                        className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        disabled={materialFields.length <= 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 dark:border-gray-700">
                  <td colSpan={3} className="px-3 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                    Total Materiales:
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-gray-900 dark:text-gray-100">
                    ${materialsTotal.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="card space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Firma Digital</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Nombre completo de quien recibe
            </label>
            <input
              {...register('signature')}
              className="input-field"
              placeholder="Nombre y apellido"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate('/service-reports')} className="btn-secondary">
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
