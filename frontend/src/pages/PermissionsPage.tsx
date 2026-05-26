import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Shield, Save, RotateCcw, Loader2, Check, X } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import type { PermissionInfo } from '../types';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  TECHNICIAN: 'Técnico',
  SALES: 'Ventas',
  CLIENT: 'Cliente',
  PROYECTOS: 'Proyectos',
  COMPRAS: 'Compras',
};

export default function PermissionsPage() {
  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string>('TECHNICIAN');
  const [permissions, setPermissions] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery<PermissionInfo>({
    queryKey: ['permissions'],
    queryFn: () => api.get('/admin/permissions').then(r => r.data),
    enabled: isSuperAdmin,
  });

  useEffect(() => {
    if (!data) return;
    const overrides = data.overrides[selectedRole];
    if (overrides) {
      setPermissions(new Set(overrides));
    } else {
      const defaults = data.defaults[selectedRole] || [];
      setPermissions(new Set(defaults));
    }
  }, [data, selectedRole]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/admin/permissions/${selectedRole}`, {
        permissions: Array.from(permissions),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast.success(`Permisos guardados para ${ROLE_LABELS[selectedRole] || selectedRole}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Error al guardar permisos');
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      await api.post('/admin/reset-permissions');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast.success('Permisos restablecidos a valores por defecto');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Error al restablecer');
    },
  });

  const togglePermission = (perm: string) => {
    setPermissions(prev => {
      const next = new Set(prev);
      if (next.has(perm)) next.delete(perm);
      else next.add(perm);
      return next;
    });
  };

  const selectAll = () => {
    if (!data) return;
    setPermissions(new Set(data.allPermissions));
  };

  const deselectAll = () => {
    setPermissions(new Set());
  };

  if (!isSuperAdmin) {
    return (
      <div className="card text-center py-12">
        <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Acceso restringido</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Solo el Super Administrador puede gestionar permisos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-600" />
            Permisos por Rol
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Define qué puede hacer cada tipo de usuario en el sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => resetMutation.mutate()}
            disabled={resetMutation.isPending}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            {resetMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            Restablecer
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="btn-primary flex items-center gap-2"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </button>
        </div>
      </div>

      {/* Role selector */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <button
            key={role}
            onClick={() => setSelectedRole(role)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedRole === role
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-900 text-gray-600 border border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:text-primary-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-500 dark:text-gray-400">Acciones rápidas:</span>
        <button onClick={selectAll} className="text-primary-600 hover:text-primary-700 font-medium">
          Seleccionar todos
        </button>
        <span className="text-gray-300">|</span>
        <button onClick={deselectAll} className="text-red-600 hover:text-red-700 font-medium">
          Desseleccionar todos
        </button>
      </div>

      {/* Categories */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
      ) : !data ? (
        <div className="card text-center py-8 text-gray-400 dark:text-gray-500">No se pudieron cargar los permisos</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(data.categories).map(([key, category]) => {
            if (key === 'admin' && selectedRole !== 'ADMIN') return null;
            if (key === 'users' && selectedRole !== 'ADMIN') return null;
            if (key === 'subscriptions' && selectedRole !== 'ADMIN') return null;
            return (
              <div key={key} className="card">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">
                  {category.label}
                </h3>
                <div className="space-y-2">
                  {category.permissions.map((perm) => {
                    const enabled = permissions.has(perm);
                    return (
                      <label
                        key={perm}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          enabled ? 'bg-primary-50/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <button
                          onClick={() => togglePermission(perm)}
                          className={`flex items-center justify-center w-6 h-6 rounded-md border-2 transition-all ${
                            enabled
                              ? 'bg-primary-600 border-primary-600 text-white'
                              : 'border-gray-300 text-transparent'
                          }`}
                        >
                          {enabled && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <span className={`text-sm flex-1 ${enabled ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                          {data.labels[perm] || perm}
                        </span>
                        <span className={`text-[10px] font-mono ${enabled ? 'text-primary-600' : 'text-gray-300'}`}>
                          {perm}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-xs text-gray-400 dark:text-gray-500 text-center">
        Los cambios aplican inmediatamente después de guardar. Los permisos del Super Administrador (tú) no se pueden modificar.
      </div>
    </div>
  );
}
