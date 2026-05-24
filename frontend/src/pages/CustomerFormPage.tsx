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

const customerSchema = z.object({
  companyName: z.string().optional(),
  contactName: z.string().min(1, 'El nombre de contacto es obligatorio'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(1, 'El teléfono es obligatorio'),
  phone2: z.string().optional(),
  address: z.string().min(1, 'La dirección es obligatoria'),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  taxId: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function CustomerFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  const { data: customerData, isLoading: loadingCustomer } = useQuery<Customer>({
    queryKey: ['customer', id],
    queryFn: async () => {
      const { data } = await api.get<Customer>(`/customers/${id}`);
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (customerData) {
      reset({
        companyName: customerData.companyName || '',
        contactName: customerData.contactName,
        email: customerData.email || '',
        phone: customerData.phone,
        phone2: customerData.phone2 || '',
        address: customerData.address,
        city: customerData.city || '',
        state: customerData.state || '',
        zipCode: customerData.zipCode || '',
        taxId: customerData.taxId || '',
        notes: customerData.notes || '',
      });
    }
  }, [customerData, reset]);

  const mutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      if (isEditing) {
        await api.put(`/customers/${id}`, data);
      } else {
        await api.post('/customers', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(isEditing ? 'Cliente actualizado' : 'Cliente creado');
      navigate('/customers');
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data?: { message?: string } } }).response?.data?.message || 'Error al guardar'
          : 'Error al guardar';
      toast.error(message);
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    mutation.mutate(data);
  };

  if (isEditing && loadingCustomer) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/customers')} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEditing ? 'Modifica los datos del cliente' : 'Registra un nuevo cliente en el sistema'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de Contacto *</label>
            <input {...register('contactName')} className="input-field" placeholder="Juan Pérez" />
            {errors.contactName && <p className="text-red-500 text-xs mt-1">{errors.contactName.message}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Empresa</label>
            <input {...register('companyName')} className="input-field" placeholder="Climatización XYZ S.A. de C.V." />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono *</label>
            <input {...register('phone')} className="input-field" placeholder="55 1234 5678" />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono 2</label>
            <input {...register('phone2')} className="input-field" placeholder="55 8765 4321" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input {...register('email')} type="email" className="input-field" placeholder="juan@ejemplo.com" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Dirección *</label>
            <input {...register('address')} className="input-field" placeholder="Calle Principal #123, Col. Centro" />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ciudad</label>
            <input {...register('city')} className="input-field" placeholder="Ciudad de México" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Estado</label>
            <input {...register('state')} className="input-field" placeholder="CDMX" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Código Postal</label>
            <input {...register('zipCode')} className="input-field" placeholder="06600" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">RFC / Tax ID</label>
            <input {...register('taxId')} className="input-field" placeholder="XAXX010101000" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas</label>
            <textarea {...register('notes')} rows={3} className="input-field" placeholder="Notas adicionales..." />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={() => navigate('/customers')} className="btn-secondary">
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
