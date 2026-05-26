import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Shield, Users, Search, Eye, Power, Loader2, CheckCircle, XCircle, Edit3 } from 'lucide-react';
import api from '../lib/api';

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  active: boolean;
  isSuperAdmin?: boolean;
  trialEndsAt: string | null;
  createdAt: string;
  subscription: { status: string; plan: { name: string } } | null;
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '', phone: '', password: '' });

  const { data: users, isLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users').then(r => r.data),
  });

  const filteredUsers = users?.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await api.put(`/admin/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuario actualizado');
      setEditingUser(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Error al actualizar');
    },
  });

  const toggleActive = async (user: AdminUser) => {
    try {
      await api.put(`/admin/users/${user.id}`, { active: !user.active });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(user.active ? 'Usuario desactivado' : 'Usuario activado');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const spectateUser = (userId: number) => {
    window.open(`/?__user=${userId}`, '_blank');
  };

  const handleShutdown = async () => {
    if (!window.confirm('¿Estás seguro de apagar el sistema? Esto detendrá el servidor.')) return;
    try {
      await api.post('/admin/shutdown');
      toast.success('Apagando sistema...');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al apagar');
    }
  };

  const openEdit = (user: AdminUser) => {
    setEditingUser(user);
    setEditForm({ name: user.name, email: user.email, role: user.role, phone: user.phone || '', password: '' });
  };

  const saveEdit = () => {
    if (!editingUser) return;
    const payload: any = { name: editForm.name, email: editForm.email, role: editForm.role, phone: editForm.phone };
    if (editForm.password.trim()) payload.password = editForm.password;
    updateMutation.mutate({ id: editingUser.id, data: payload });
  };

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-700', TECHNICIAN: 'bg-blue-100 text-blue-700',
      SALES: 'bg-emerald-100 text-emerald-700', CLIENT: 'bg-gray-100 text-gray-700',
      PROYECTOS: 'bg-amber-100 text-amber-700', COMPRAS: 'bg-rose-100 text-rose-700',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[role] || 'bg-gray-100'}`}>{role}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600" />
            Panel de Administración
          </h1>
          <p className="text-gray-500 mt-1">Gestión de usuarios y sistema</p>
        </div>
        <button onClick={handleShutdown} className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-2">
          <Power className="w-4 h-4" />
          Apagar Sistema
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar usuarios..."
          className="input-field pl-10"
        />
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditingUser(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Editar Usuario</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} className="input-field">
                  {['ADMIN', 'TECHNICIAN', 'SALES', 'CLIENT', 'PROYECTOS', 'COMPRAS'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña (dejar vacío para no cambiar)</label>
                <input type="password" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} className="input-field" placeholder="••••••••" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={saveEdit} disabled={updateMutation.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Guardar
                </button>
                <button onClick={() => setEditingUser(null)} className="btn-secondary flex-1">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="pb-3 font-medium px-4">Usuario</th>
                  <th className="pb-3 font-medium px-4">Rol</th>
                  <th className="pb-3 font-medium px-4">Estado</th>
                  <th className="pb-3 font-medium px-4">Suscripción</th>
                  <th className="pb-3 font-medium px-4">Prueba</th>
                  <th className="pb-3 font-medium px-4">Registro</th>
                  <th className="pb-3 font-medium px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers?.map(user => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-gray-400 text-xs">{user.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {roleBadge(user.role)}
                        {user.isSuperAdmin && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">SUPER</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {user.active
                        ? <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-3.5 h-3.5" /> Activo</span>
                        : <span className="flex items-center gap-1 text-red-600"><XCircle className="w-3.5 h-3.5" /> Inactivo</span>
                      }
                    </td>
                    <td className="py-3 px-4">
                      {user.subscription
                        ? <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.subscription.status === 'ACTIVA' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{user.subscription.status}</span>
                        : <span className="text-gray-400">—</span>
                      }
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">
                      {user.trialEndsAt
                        ? new Date(user.trialEndsAt).toLocaleDateString('es-MX')
                        : '—'
                      }
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">
                      {new Date(user.createdAt).toLocaleDateString('es-MX')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(user)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Editar">
                          <Edit3 className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={() => toggleActive(user)} className="p-1.5 hover:bg-gray-100 rounded-lg" title={user.active ? 'Desactivar' : 'Activar'}>
                          {user.active ? <XCircle className="w-4 h-4 text-red-500" /> : <CheckCircle className="w-4 h-4 text-green-500" />}
                        </button>
                        <button onClick={() => spectateUser(user.id)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Ver como este usuario">
                          <Eye className="w-4 h-4 text-blue-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredUsers?.length === 0 && <p className="text-center py-8 text-gray-400">No hay usuarios</p>}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Solo tú como administrador tienes acceso a este panel. Usa "Ver como" para navegar como cualquier usuario.
      </p>
    </div>
  );
}
