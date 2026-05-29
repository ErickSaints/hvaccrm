import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Search, Wrench, Building2, Hash, Calendar, MapPin, Trash2 } from 'lucide-react';
import api from '../lib/api';
import type { Equipment } from '../types';
import { useSuperAdminConfirm } from '../contexts/SuperAdminContext';

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

export default function EquipmentPage() {
  const confirmSuperAdmin = useSuperAdminConfirm();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterBrand, setFilterBrand] = useState('');

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/equipment/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipo eliminado');
    },
    onError: () => toast.error('Error al eliminar equipo'),
  });

  const { data: equipment, isLoading } = useQuery<Equipment[]>({
    queryKey: ['equipment'],
    queryFn: async () => {
      const { data } = await api.get<Equipment[]>('/equipment', {
        params: { include: 'customer' },
      });
      return data;
    },
  });

  const brands = equipment ? [...new Set(equipment.map((e) => e.brand).filter(Boolean))] : [];

  const filtered = equipment?.filter((eq) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !eq.type?.toLowerCase().includes(q) &&
        !eq.brand?.toLowerCase().includes(q) &&
        !eq.model?.toLowerCase().includes(q) &&
        !eq.serialNumber?.toLowerCase().includes(q) &&
        !eq.customer?.contactName?.toLowerCase().includes(q) &&
        !eq.customer?.companyName?.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (filterType && eq.type !== filterType) return false;
    if (filterBrand && eq.brand !== filterBrand) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 p-6 lg:p-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary-400 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-white">Equipos</h1>
            <p className="text-primary-200 text-sm mt-1">Inventario de equipos de climatización</p>
          </div>
          <Link to="/equipment/new" className="btn-primary bg-white/20 border-white/30 text-white hover:bg-white/30 inline-flex items-center gap-2 backdrop-blur-sm">
            <Plus className="w-4 h-4" />
            Nuevo Equipo
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por tipo, marca, modelo, serie o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="input-field sm:w-48"
        >
          <option value="">Todos los tipos</option>
          {equipmentTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
          className="input-field sm:w-44"
        >
          <option value="">Todas las marcas</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="card">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-4 bg-gray-200 rounded w-1/6" />
                <div className="h-4 bg-gray-200 rounded w-1/6" />
                <div className="h-4 bg-gray-200 rounded w-1/6" />
                <div className="h-4 bg-gray-200 rounded w-1/6" />
                <div className="h-4 bg-gray-200 rounded w-1/6" />
                <div className="h-4 bg-gray-200 rounded w-1/6" />
              </div>
            ))}
          </div>
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Tipo</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Marca</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Modelo</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Serie</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Cliente</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Ubicación</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Último Servicio</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((eq) => (
                <tr key={eq.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{eq.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{eq.brand || '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{eq.model || '—'}</td>
                  <td className="px-6 py-4">
                    {eq.serialNumber ? (
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <Hash className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                        {eq.serialNumber}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Building2 className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      {eq.customer?.contactName || eq.customer?.companyName || `Cliente #${eq.customerId}`}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {eq.location ? (
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <MapPin className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                        {eq.location}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {eq.lastService ? (
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <Calendar className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                        {new Date(eq.lastService).toLocaleDateString('es-MX')}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/equipment/${eq.id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                      >
                        Ver
                      </Link>
                      <button
                        onClick={() => confirmSuperAdmin(() => deleteMutation.mutate(eq.id))}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
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
          <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
            {search || filterType || filterBrand ? 'Sin resultados' : 'No hay equipos'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {search || filterType || filterBrand
              ? 'Intenta con otros filtros de búsqueda'
              : 'Comienza registrando el primer equipo'}
          </p>
          {!search && !filterType && !filterBrand && (
            <Link to="/equipment/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Equipo
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
