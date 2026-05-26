import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import type { Customer, Invoice } from '../types';

interface InvoiceItemForm {
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function InvoiceFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<InvoiceItemForm[]>([{ description: '', quantity: 1, unitPrice: 0 }]);

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await api.get<Customer[]>('/customers');
      return data;
    },
  });

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post('/invoices', {
        title,
        subtotal,
        tax,
        discount: 0,
        total,
        notes,
        dueDate: dueDate || null,
        customerId: parseInt(customerId),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Factura creada');
      navigate('/invoices');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Error al crear factura'),
  });

  const addItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof InvoiceItemForm, value: string | number) => {
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('El título es obligatorio'); return; }
    if (!customerId) { toast.error('Selecciona un cliente'); return; }
    mutation.mutate();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/invoices')} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Factura</h1>
          <p className="text-gray-500 mt-1">Crea una nueva factura para un cliente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Factura por servicios..." />
          </div>
          <div>
            <label className="label">Cliente</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="input-field">
              <option value="">Seleccionar cliente</option>
              {customers?.map((c) => (
                <option key={c.id} value={c.id}>{c.contactName} {c.companyName ? `- ${c.companyName}` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Fecha de vencimiento</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input-field" />
          </div>
        </div>

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Conceptos</label>
            <button type="button" onClick={addItem} className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />Agregar
            </button>
          </div>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <input
                  value={item.description}
                  onChange={(e) => updateItem(i, 'description', e.target.value)}
                  className="input-field flex-1"
                  placeholder="Descripción"
                />
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 0)}
                  className="input-field w-20 text-center"
                  placeholder="Cant."
                  min={1}
                />
                <input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                  className="input-field w-28 text-right"
                  placeholder="Precio"
                  min={0}
                  step={0.01}
                />
                <div className="w-20 text-right pt-2 text-sm text-gray-700 font-medium">
                  ${(item.quantity * item.unitPrice).toLocaleString('es-MX')}
                </div>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)} className="p-2 text-gray-400 hover:text-red-500 mt-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="border-t border-gray-200 pt-4">
          <div className="max-w-xs ml-auto space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="text-gray-900 font-medium">${subtotal.toLocaleString('es-MX')}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">IVA (16%)</span><span className="text-gray-900 font-medium">${tax.toLocaleString('es-MX')}</span></div>
            <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-1"><span className="text-gray-900">Total</span><span className="text-gray-900">${total.toLocaleString('es-MX')}</span></div>
          </div>
        </div>

        <div>
          <label className="label">Notas</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" rows={3} placeholder="Notas adicionales..." />
        </div>

        <div className="flex justify-end gap-3">
          <Link to="/invoices" className="btn-secondary">Cancelar</Link>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Crear Factura
          </button>
        </div>
      </form>
    </div>
  );
}
