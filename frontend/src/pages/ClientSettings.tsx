import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Lock, User, Building2, Phone, MapPin, Hash, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../lib/auth';

interface CustomerProfile {
  id: number;
  companyName?: string;
  contactName: string;
  email?: string;
  phone: string;
  phone2?: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  taxId?: string;
  notes?: string;
}

export default function ClientSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Partial<CustomerProfile>>({});
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const { data: profile, isLoading } = useQuery<CustomerProfile | null>({
    queryKey: ['client-profile'],
    queryFn: async () => {
      const { data } = await api.get('/profile/customer');
      return data;
    },
  });

  useEffect(() => {
    if (profile) {
      setForm({
        companyName: profile.companyName || '',
        contactName: profile.contactName || '',
        phone: profile.phone || '',
        phone2: profile.phone2 || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zipCode: profile.zipCode || '',
        taxId: profile.taxId || '',
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<CustomerProfile>) => {
      const { data: res } = await api.put('/profile/customer', data);
      return res;
    },
    onSuccess: () => {
      toast.success('Datos actualizados');
      queryClient.invalidateQueries({ queryKey: ['client-profile'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Error al actualizar');
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      await api.put('/profile/password', data);
    },
    onSuccess: () => {
      toast.success('Contraseña actualizada');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Error al cambiar contraseña');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    passwordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mi Perfil</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Administra tu información personal</p>
      </div>

      {/* Customer Info Card */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary-600" />
          Datos de la Empresa
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre de contacto</label>
            <input
              type="text" value={form.contactName || ''}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
              className="input-field" required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Empresa</label>
            <input
              type="text" value={form.companyName || ''}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
            <input
              type="text" value={form.phone || ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input-field" required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono 2</label>
            <input
              type="text" value={form.phone2 || ''}
              onChange={(e) => setForm({ ...form, phone2: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
            <input
              type="text" value={form.address || ''}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ciudad</label>
            <input
              type="text" value={form.city || ''}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
            <input
              type="text" value={form.state || ''}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código Postal</label>
            <input
              type="text" value={form.zipCode || ''}
              onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RFC</label>
            <input
              type="text" value={form.taxId || ''}
              onChange={(e) => setForm({ ...form, taxId: e.target.value })}
              className="input-field"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={updateMutation.isPending} className="btn-primary inline-flex items-center gap-2">
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>

      {/* Account Info Card */}
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <User className="w-5 h-5 text-primary-600" />
          Datos de la Cuenta
        </h2>
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-700 font-semibold text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Password Card */}
      <form onSubmit={handlePasswordSubmit} className="card p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary-600" />
          Cambiar Contraseña
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña actual</label>
            <input
              type="password" value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="input-field" required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nueva contraseña</label>
            <input
              type="password" value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="input-field" required minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar nueva contraseña</label>
            <input
              type="password" value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="input-field" required minLength={6}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={passwordMutation.isPending} className="btn-primary inline-flex items-center gap-2">
            <Lock className="w-4 h-4" />
            {passwordMutation.isPending ? 'Cambiando...' : 'Cambiar contraseña'}
          </button>
        </div>
      </form>
    </div>
  );
}
