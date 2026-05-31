import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Edit2, Power, PowerOff, Save, X, Loader2, Shield } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../lib/auth';

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: 'MENSUAL' | 'ANUAL';
  features: string;
  targetRole: 'CLIENT' | 'PROFESIONAL';
  active: boolean;
}

const planSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
  duration: z.enum(['MENSUAL', 'ANUAL']),
  targetRole: z.enum(['CLIENT', 'PROFESIONAL']),
  features: z.string().optional(),
});

type PlanFormData = z.infer<typeof planSchema>;

export default function SubscriptionsPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
  });

  const { data: plans, isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['subscription-plans-admin'],
    queryFn: async () => {
      const { data } = await api.get<SubscriptionPlan[]>('/subscriptions/plans');
      return data;
    },
    enabled: currentUser?.role === 'ADMIN',
  });

  const createMutation = useMutation({
    mutationFn: async (data: PlanFormData) => {
      await api.post('/subscriptions/plans', { ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans-admin'] });
      toast.success('Plan creado');
      closeModal();
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
            'Error al crear plan'
          : 'Error al crear plan';
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PlanFormData }) => {
      await api.put(`/subscriptions/plans/${id}`, { ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans-admin'] });
      toast.success('Plan actualizado');
      closeModal();
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
            'Error al actualizar plan'
          : 'Error al actualizar plan';
      toast.error(message);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      await api.put(`/subscriptions/plans/${id}`, { active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans-admin'] });
      toast.success('Estado actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar estado');
    },
  });

  const openCreateModal = () => {
    setEditingPlan(null);
    reset({ name: '', description: '', price: 0, duration: 'MENSUAL', targetRole: 'CLIENT', features: '' });
    setModalOpen(true);
  };

  const openEditModal = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    reset({
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      duration: plan.duration,
      targetRole: plan.targetRole,
      features: plan.features ? plan.features.split(',').join('\n') : '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPlan(null);
  };

  const onSubmit = (data: PlanFormData) => {
    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="card text-center py-12">
        <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Acceso restringido</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Solo administradores pueden gestionar suscripciones</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Planes de Suscripción</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona los planes disponibles para registro</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary inline-flex items-center gap-2 w-fit">
          <Plus className="w-4 h-4" />
          Nuevo Plan
        </button>
      </div>

      {isLoading ? (
        <div className="card">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-4 bg-gray-200 rounded w-1/5" />
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-4 bg-gray-200 rounded w-32" />
              </div>
            ))}
          </div>
        </div>
      ) : plans && plans.length > 0 ? (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Nombre</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Descripción</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">Precio</th>
                <th className="text-center px-6 py-4 font-semibold text-gray-600">Duración</th>
                <th className="text-center px-6 py-4 font-semibold text-gray-600">Tipo</th>
                <th className="text-center px-6 py-4 font-semibold text-gray-600">Activo</th>
                <th className="text-center px-6 py-4 font-semibold text-gray-600">Características</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{plan.name}</td>
                  <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                    {plan.description || '—'}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-gray-100">
                    ${plan.price.toLocaleString('es-MX')}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {plan.duration === 'ANUAL' ? 'Anual' : 'Mensual'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      plan.targetRole === 'CLIENT'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {plan.targetRole === 'CLIENT' ? 'Cliente' : 'Profesional'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        plan.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {plan.active ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    {                    (plan.features ? plan.features.split(',').filter(Boolean).length : 0)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(plan)}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          toggleActiveMutation.mutate({ id: plan.id, active: !plan.active })
                        }
                        className={`p-2 rounded-lg transition-colors ${
                          plan.active
                            ? 'text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50'
                            : 'text-gray-500 dark:text-gray-400 hover:text-green-600 hover:bg-green-50'
                        }`}
                        title={plan.active ? 'Desactivar' : 'Activar'}
                      >
                        {plan.active ? (
                          <PowerOff className="w-4 h-4" />
                        ) : (
                          <Power className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card text-center py-12">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No hay planes</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Crea el primer plan de suscripción</p>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {editingPlan ? 'Editar Plan' : 'Nuevo Plan'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre *</label>
                <input {...register('name')} className="input-field" placeholder="Plan Básico" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descripción</label>
                <input
                  {...register('description')}
                  className="input-field"
                  placeholder="Breve descripción del plan"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Precio *</label>
                  <input
                    {...register('price')}
                    type="number"
                    step="0.01"
                    className="input-field"
                    placeholder="0.00"
                  />
                  {errors.price && (
                    <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Duración *</label>
                  <select {...register('duration')} className="input-field">
                    <option value="MENSUAL">Mensual</option>
                    <option value="ANUAL">Anual</option>
                  </select>
                  {errors.duration && (
                    <p className="text-red-500 text-xs mt-1">{errors.duration.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tipo *</label>
                <select {...register('targetRole')} className="input-field">
                  <option value="CLIENT">Cliente</option>
                  <option value="PROFESIONAL">Profesional</option>
                </select>
                {errors.targetRole && <p className="text-red-500 text-xs mt-1">{errors.targetRole.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Características (una por línea)
                </label>
                <textarea
                  {...register('features')}
                  rows={4}
                  className="input-field"
                  placeholder="Hasta 5 usuarios&#10;Soporte técnico 24/7&#10;Reportes ilimitados"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingPlan ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
