import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Edit2, Building2, Phone, Mail, MapPin } from 'lucide-react';
import api from '../lib/api';
import type { Customer } from '../types';

export default function CustomersPage() {
  const [search, setSearch] = useState('');

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await api.get<Customer[]>('/customers');
      return data;
    },
  });

  const filtered = customers?.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.contactName?.toLowerCase().includes(q) ||
      c.companyName?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.city?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Clientes</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gestión de clientes registrados</p>
        </div>
        <Link to="/customers/new" className="btn-primary inline-flex items-center gap-2 w-fit">
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder="Buscar por nombre, empresa, email, teléfono o ciudad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {isLoading ? (
        <div className="card">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-4 bg-gray-200 rounded w-1/5" />
                <div className="h-4 bg-gray-200 rounded w-1/5" />
                <div className="h-4 bg-gray-200 rounded w-1/6" />
                <div className="h-4 bg-gray-200 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-20" />
              </div>
            ))}
          </div>
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Contacto</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Empresa</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Teléfono</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Email</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Ciudad</th>
                <th className="text-center px-6 py-4 font-semibold text-gray-600">Equipos</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-semibold text-sm">
                        {customer.contactName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{customer.contactName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Building2 className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      {customer.companyName || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      {customer.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      {customer.email || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      {customer.city || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                      {customer.equipment?.length ?? 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/customers/${customer.id}`}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/customers/${customer.id}/edit`}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card text-center py-12">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
            {search ? 'Sin resultados' : 'No hay clientes'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {search
              ? 'Intenta con otro término de búsqueda'
              : 'Comienza registrando tu primer cliente'}
          </p>
          {!search && (
            <Link to="/customers/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Cliente
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
