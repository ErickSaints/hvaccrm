import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Loader2, Plus, X, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

interface LineItem {
  key: string; description: string; quantity: number; unit: string; notes: string;
}

function genKey() { return Math.random().toString(36).slice(2); }

export default function RequisitionFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [branchId, setBranchId] = useState<number | null>(null);
  const [items, setItems] = useState<LineItem[]>([{ key: genKey(), description: '', quantity: 1, unit: 'pza', notes: '' }]);

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get('/inventory/branches').then(r => r.data),
  });

  const { data: editData } = useQuery({
    queryKey: ['material-requisition', id],
    queryFn: () => api.get(`/material-requisitions/${id}`).then(r => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (editData) {
      setTitle(editData.title);
      setNotes(editData.notes || '');
      setBranchId(editData.branchId);
      setItems(editData.items.map((i: any) => ({ key: genKey(), description: i.description, quantity: i.quantity, unit: i.unit, notes: i.notes || '' })));
    }
  }, [editData]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = { title, notes: notes || undefined, branchId: branchId || undefined, items: items.map(i => ({ description: i.description, quantity: i.quantity, unit: i.unit, notes: i.notes || undefined })) };
      if (isEdit) { return api.put(`/material-requisitions/${id}`, payload); }
      return api.post('/material-requisitions', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-requisitions'] });
      toast.success(isEdit ? 'Requisición actualizada' : 'Requisición creada');
      navigate('/requisitions');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Error al guardar'),
  });

  function addItem() { setItems(prev => [...prev, { key: genKey(), description: '', quantity: 1, unit: 'pza', notes: '' }]); }
  function removeItem(key: string) { setItems(prev => prev.filter(i => i.key !== key)); }
  function updateItem(key: string, field: keyof LineItem, value: any) { setItems(prev => prev.map(i => i.key === key ? { ...i, [field]: value } : i)); }

  const canSave = title.trim() && items.some(i => i.description.trim());

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/requisitions')} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{isEdit ? 'Editar Requisición' : 'Nueva Requisición de Materiales'}</h1>
          <p className="text-sm text-gray-500">{isEdit ? `MR-${id}` : 'Registra los materiales necesarios para tus trabajos'}</p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Información General</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Título *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="input-field" placeholder="Ej: Material para mantenimiento Edificio Centro" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Sucursal</label>
            <select value={branchId ?? ''} onChange={e => setBranchId(e.target.value ? Number(e.target.value) : null)} className="input-field">
              <option value="">Sin sucursal</option>
              {(Array.isArray(branches) ? branches : []).map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notas</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input-field" rows={2} placeholder="Observaciones generales..." />
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Artículos</h2>
            <button type="button" onClick={addItem} className="btn-secondary inline-flex items-center gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" /> Agregar
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={item.key} className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex-1 grid grid-cols-12 gap-2">
                  <div className="col-span-5">
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Descripción *</label>
                    <input value={item.description} onChange={e => updateItem(item.key, 'description', e.target.value)} className="input-field text-sm" placeholder="Nombre del material" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Cantidad</label>
                    <input value={item.quantity} onChange={e => updateItem(item.key, 'quantity', parseFloat(e.target.value) || 0)} type="number" min="0.01" step="0.01" className="input-field text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Unidad</label>
                    <select value={item.unit} onChange={e => updateItem(item.key, 'unit', e.target.value)} className="input-field text-sm">
                      <option value="pza">Pza</option>
                      <option value="metro">M</option>
                      <option value="kg">Kg</option>
                      <option value="litro">L</option>
                      <option value="caja">Caja</option>
                      <option value="rollo">Rollo</option>
                      <option value="servicio">Servicio</option>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Notas</label>
                    <input value={item.notes} onChange={e => updateItem(item.key, 'notes', e.target.value)} className="input-field text-sm" placeholder="Especificaciones" />
                  </div>
                </div>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(item.key)} className="p-1.5 mt-5 text-gray-400 hover:text-red-600 rounded-lg transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate('/requisitions')} className="btn-secondary text-sm">Cancelar</button>
          <button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending || !canSave} className="btn-primary inline-flex items-center gap-2 text-sm">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Actualizar' : 'Crear Requisición'}
          </button>
        </div>
      </div>
    </div>
  );
}
