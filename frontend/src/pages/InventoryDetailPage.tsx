import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Package, Edit2, AlertTriangle, DollarSign, MapPin, Layers,
  Clock, User, FileText, Plus, Minus, RefreshCw, ArrowRightLeft,
} from 'lucide-react';
import api from '../lib/api';
import type { InventoryItem, InventoryMovement, PaginatedResponse } from '../types';
import Pagination from '../components/Pagination';

const MOVEMENT_ICONS: Record<string, typeof Plus> = {
  ENTRADA: Plus,
  SALIDA: Minus,
  AJUSTE: RefreshCw,
  TRANSFERENCIA: ArrowRightLeft,
};

const MOVEMENT_COLORS: Record<string, string> = {
  ENTRADA: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
  SALIDA: 'text-red-600 bg-red-50 dark:bg-red-900/20',
  AJUSTE: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  TRANSFERENCIA: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
};

export default function InventoryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [movementPage, setMovementPage] = useState(1);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [movementType, setMovementType] = useState<'ENTRADA' | 'SALIDA' | 'AJUSTE'>('ENTRADA');
  const [movementQty, setMovementQty] = useState(1);
  const [movementNotes, setMovementNotes] = useState('');

  const { data: item, isLoading } = useQuery<InventoryItem>({
    queryKey: ['inventory-item', id],
    queryFn: async () => {
      const { data } = await api.get(`/inventory/${id}`);
      return data;
    },
  });

  const { data: movementsData } = useQuery<PaginatedResponse<InventoryMovement>>({
    queryKey: ['inventory-movements', id, movementPage],
    queryFn: async () => {
      const { data } = await api.get(`/inventory/${id}/movements?page=${movementPage}&limit=10`);
      return data;
    },
  });

  const movementMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/inventory/${id}/movement`, {
        type: movementType,
        quantity: movementQty,
        notes: movementNotes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-item', id] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements', id] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Movimiento registrado');
      setShowMovementForm(false);
      setMovementQty(1);
      setMovementNotes('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Error al registrar movimiento');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Artículo no encontrado</p>
      </div>
    );
  }

  const isLow = item.currentStock <= item.minStock;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/inventory')} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{item.name}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">
            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-mono">{item.code}</code>
          </p>
        </div>
        <Link to={`/inventory/${item.id}/edit`} className="btn-secondary flex items-center gap-2">
          <Edit2 className="w-4 h-4" /> Editar
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${isLow ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Stock Actual</p>
              <p className={`text-xl font-bold ${isLow ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
                {item.currentStock} <span className="text-sm font-normal text-gray-400">/{item.unit}</span>
              </p>
              {isLow && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                  <AlertTriangle className="w-3 h-3" /> Mín: {item.minStock}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Precio Unitario</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                ${item.unitPrice.toLocaleString('es-MX')}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Categoría</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.category}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Ubicación</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.location || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {item.description && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Descripción</h3>
          <p className="text-gray-900 dark:text-gray-100">{item.description}</p>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Movimientos</h2>
          <button onClick={() => setShowMovementForm(!showMovementForm)} className="btn-primary text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Registrar Movimiento
          </button>
        </div>

        {showMovementForm && (
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tipo</label>
                <select value={movementType} onChange={(e) => setMovementType(e.target.value as any)} className="input-field w-auto">
                  <option value="ENTRADA">Entrada</option>
                  <option value="SALIDA">Salida</option>
                  <option value="AJUSTE">Ajuste</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Cantidad</label>
                <input type="number" min={0.01} step={0.01} value={movementQty} onChange={(e) => setMovementQty(Number(e.target.value))} className="input-field w-24" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notas</label>
                <input type="text" value={movementNotes} onChange={(e) => setMovementNotes(e.target.value)} className="input-field" placeholder="Motivo del movimiento..." />
              </div>
              <button
                onClick={() => movementMutation.mutate()}
                disabled={movementMutation.isPending || movementQty <= 0}
                className="btn-primary text-sm"
              >
                {movementMutation.isPending ? 'Registrando...' : 'Registrar'}
              </button>
            </div>
          </div>
        )}

        {movementsData && movementsData.data.length > 0 ? (
          <>
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {movementsData.data.map((mov) => {
                const Icon = MOVEMENT_ICONS[mov.type] || FileText;
                const colorClass = MOVEMENT_COLORS[mov.type] || 'text-gray-600 bg-gray-50';
                return (
                  <div key={mov.id} className="p-4 flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {mov.type === 'ENTRADA' && `Entrada de ${mov.quantity} ${item.unit}`}
                        {mov.type === 'SALIDA' && `Salida de ${mov.quantity} ${item.unit}`}
                        {mov.type === 'AJUSTE' && `Ajuste de ${mov.quantity} ${item.unit}`}
                        {mov.type === 'TRANSFERENCIA' && `Transferencia de ${mov.quantity} ${item.unit}`}
                      </p>
                      {mov.notes && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{mov.notes}</p>}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(mov.createdAt).toLocaleDateString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        {mov.performedBy && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {mov.performedBy.name}</span>}
                      </div>
                    </div>
                    {mov.total != null && (
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-gray-100">${mov.total.toLocaleString('es-MX')}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <Pagination page={movementPage} totalPages={movementsData.totalPages} total={movementsData.total} limit={10} onPageChange={setMovementPage} />
          </>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p>Sin movimientos registrados</p>
          </div>
        )}
      </div>
    </div>
  );
}
