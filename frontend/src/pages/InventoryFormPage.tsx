import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import api from '../lib/api';
import type { InventoryItem } from '../types';

const itemSchema = z.object({
  code: z.string().min(1, 'El código es obligatorio'),
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  category: z.string().min(1, 'La categoría es obligatoria'),
  unit: z.string().default('pza'),
  minStock: z.coerce.number().min(0).default(0),
  currentStock: z.coerce.number().min(0).default(0),
  unitPrice: z.coerce.number().min(0).default(0),
  location: z.string().optional(),
});

type ItemFormData = z.infer<typeof itemSchema>;

const COMMON_CATEGORIES = [
  'GENERAL', 'REFRIGERANTES', 'FILTROS', 'VENTILADORES', 'MOTORES',
  'COMPRESORES', 'VALVULAS', 'TUBERIA', 'ELECTRICO', 'HERRAMIENTAS',
  'SEGURIDAD', 'LUBRICANTES', 'SELLADORES', 'CONTROLES', 'OTROS',
];

export default function InventoryFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: { unit: 'pza', minStock: 0, currentStock: 0, unitPrice: 0, category: 'GENERAL' },
  });

  const { data: item, isLoading: loadingItem } = useQuery<InventoryItem>({
    queryKey: ['inventory-item', id],
    queryFn: async () => {
      const { data } = await api.get(`/inventory/${id}`);
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (item) {
      reset({
        code: item.code,
        name: item.name,
        description: item.description || '',
        category: item.category,
        unit: item.unit,
        minStock: item.minStock,
        currentStock: item.currentStock,
        unitPrice: item.unitPrice,
        location: item.location || '',
      });
    }
  }, [item, reset]);

  const mutation = useMutation({
    mutationFn: async (data: ItemFormData) => {
      if (isEditing) {
        await api.put(`/inventory/${id}`, data);
      } else {
        await api.post('/inventory', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success(isEditing ? 'Artículo actualizado' : 'Artículo creado');
      navigate('/inventory');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Error al guardar');
    },
  });

  if (isEditing && loadingItem) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/inventory')} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isEditing ? 'Editar Artículo' : 'Nuevo Artículo'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isEditing ? `Editando: ${item?.name}` : 'Agrega un nuevo artículo al inventario'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Código *</label>
            <input {...register('code')} className="input-field" placeholder="Ej: REF-001" />
            {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Categoría *</label>
            <select {...register('category')} className="input-field">
              {COMMON_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre *</label>
            <input {...register('name')} className="input-field" placeholder="Nombre del artículo" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descripción</label>
            <textarea {...register('description')} className="input-field" rows={2} placeholder="Descripción opcional" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Unidad</label>
            <select {...register('unit')} className="input-field">
              <option value="pza">Pieza (pza)</option>
              <option value="kg">Kilogramo (kg)</option>
              <option value="lt">Litro (lt)</option>
              <option value="m">Metro (m)</option>
              <option value="m2">Metro cuadrado (m²)</option>
              <option value="caja">Caja</option>
              <option value="rollo">Rollo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Precio Unitario</label>
            <input {...register('unitPrice')} type="number" step="0.01" className="input-field" />
            {errors.unitPrice && <p className="text-red-500 text-xs mt-1">{errors.unitPrice.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Stock Actual</label>
            <input {...register('currentStock')} type="number" step="0.01" className="input-field" />
            {errors.currentStock && <p className="text-red-500 text-xs mt-1">{errors.currentStock.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Stock Mínimo</label>
            <input {...register('minStock')} type="number" step="0.01" className="input-field" />
            {errors.minStock && <p className="text-red-500 text-xs mt-1">{errors.minStock.message}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ubicación</label>
            <input {...register('location')} className="input-field" placeholder="Ej: Almacén A, Estante 3" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button type="button" onClick={() => navigate('/inventory')} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary flex items-center gap-2">
            {mutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
            ) : (
              <><Save className="w-4 h-4" /> {isEditing ? 'Actualizar' : 'Crear Artículo'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
