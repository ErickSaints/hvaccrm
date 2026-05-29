import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, Shield, ToggleLeft, ToggleRight, X, Save, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import { useSuperAdminConfirm } from '../contexts/SuperAdminContext';
import type { User } from '../types';

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  TECHNICIAN: 'Técnico',
  SALES: 'Ventas',
  CLIENT: 'Cliente',
  PROYECTOS: 'Proyectos',
  COMPRAS: 'Compras',
};

const roleColors: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  TECHNICIAN: 'bg-blue-100 text-blue-700',
  SALES: 'bg-green-100 text-green-700',
  CLIENT: 'bg-gray-100 text-gray-700',
  PROYECTOS: 'bg-amber-100 text-amber-700',
  COMPRAS: 'bg-rose-100 text-rose-700',
};

const userSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'TECHNICIAN', 'SALES', 'CLIENT', 'PROYECTOS', 'COMPRAS']),
  phone: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

export default function UsersPage() {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const confirmSuperAdmin = useSuperAdminConfirm();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get<User[]>('/users');
      return data;
    },
    enabled: isSuperAdmin,
  });

  const createMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const { password, ...rest } = data;
      const { data: newUser } = await api.post<User>('/users', { ...rest, password });
      return newUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario creado');
      closeModal();
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al crear usuario'
          : 'Error al crear usuario';
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UserFormData }) => {
      const { password, ...rest } = data;
      await api.put(`/users/${id}`, rest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario actualizado');
      closeModal();
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al actualizar'
          : 'Error al actualizar';
      toast.error(message);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      await api.put(`/users/${id}`, { active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Estado actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar estado');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario eliminado permanentemente');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Error al eliminar usuario'),
  });

  const openCreateModal = () => {
    setEditingUser(null);
    reset({ name: '', email: '', password: '', role: 'TECHNICIAN', phone: '' });
    setModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    reset({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
  };

  const onSubmit = (data: UserFormData) => {
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = users?.filter((u) => {
    if (!search && !roleFilter) return true;
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (!isSuperAdmin) {
    return (
      <div className="card text-center py-12">
        <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Acceso restringido</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Solo el Super Administrador puede gestionar usuarios</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 p-6 lg:p-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary-400 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-white">Usuarios</h1>
            <p className="text-primary-200 text-sm mt-1">Gestión de usuarios del sistema</p>
          </div>
          <button onClick={openCreateModal} className="btn-primary bg-white/20 border-white/30 text-white hover:bg-white/30 inline-flex items-center gap-2 backdrop-blur-sm">
            <Plus className="w-4 h-4" />
            Nuevo Usuario
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input-field sm:w-48"
        >
          <option value="">Todos los roles</option>
          <option value="ADMIN">Administrador</option>
          <option value="TECHNICIAN">Técnico</option>
          <option value="SALES">Ventas</option>
          <option value="PROYECTOS">Proyectos</option>
          <option value="COMPRAS">Compras</option>
          <option value="CLIENT">Cliente</option>
        </select>
      </div>

      {isLoading ? (
        <div className="card">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-4 bg-gray-200 rounded w-32" />
              </div>
            ))}
          </div>
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Nombre</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Email</th>
                <th className="text-center px-6 py-4 font-semibold text-gray-600">Rol</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Teléfono</th>
                <th className="text-center px-6 py-4 font-semibold text-gray-600">Activo</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Creado</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-semibold text-sm">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{u.email}</td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[u.role]}`}
                    >
                      <Shield className="w-3 h-3" />
                      {roleLabels[u.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{u.phone || '—'}</td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {u.active ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                    {'createdAt' in u && u.createdAt
                      ? new Date((u as any).createdAt).toLocaleDateString('es-MX')
                      : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(u)}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          toggleActiveMutation.mutate({ id: u.id, active: !u.active })
                        }
                        className={`p-2 rounded-lg transition-colors ${
                          u.active
                            ? 'text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50'
                            : 'text-gray-500 dark:text-gray-400 hover:text-green-600 hover:bg-green-50'
                        }`}
                        title={u.active ? 'Desactivar' : 'Activar'}
                      >
                        {u.active ? (
                          <ToggleRight className="w-4 h-4" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setDeletingUser(u)}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="w-4 h-4" />
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
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
            {search || roleFilter ? 'Sin resultados' : 'No hay usuarios'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {search || roleFilter
              ? 'Intenta con otros filtros'
              : 'Crea el primer usuario del sistema'}
          </p>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeletingUser(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                ¿Eliminar usuario?
              </h2>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-6">
                <p className="font-medium text-gray-900 dark:text-gray-100">{deletingUser.name}</p>
                <p>{deletingUser.email}</p>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[deletingUser.role]}`}>
                  {roleLabels[deletingUser.role]}
                </span>
                <p className="text-red-500 font-medium mt-3">
                  Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setDeletingUser(null)}
                  className="btn-secondary"
                  disabled={deleteMutation.isPending}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const id = deletingUser.id;
                    setDeletingUser(null);
                    confirmSuperAdmin(() => deleteMutation.mutate(id));
                  }}
                  disabled={deleteMutation.isPending}
                  className="btn-primary bg-red-600 hover:bg-red-700 border-red-600 inline-flex items-center gap-2"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <button onClick={closeModal} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre *</label>
                <input {...register('name')} className="input-field" placeholder="Nombre completo" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email *</label>
                <input {...register('email')} type="email" className="input-field" placeholder="correo@ejemplo.com" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Contraseña *</label>
                  <input
                    {...register('password')}
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                  />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Rol *</label>
                <select {...register('role')} className="input-field">
                  <option value="ADMIN">Administrador</option>
                  <option value="TECHNICIAN">Técnico</option>
                  <option value="SALES">Ventas</option>
                  <option value="PROYECTOS">Proyectos</option>
                  <option value="COMPRAS">Compras</option>
                  <option value="CLIENT">Cliente</option>
                </select>
                {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Teléfono</label>
                <input {...register('phone')} className="input-field" placeholder="55 1234 5678" />
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
                  {editingUser ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
