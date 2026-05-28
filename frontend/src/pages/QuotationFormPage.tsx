import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Loader2, Plus, Trash2, ShoppingCart } from 'lucide-react';
import api from '../lib/api';
import type { Customer, Quotation, QuotationItem } from '../types';
import MercadoLibreSearch from '../components/MercadoLibreSearch';

const quotationItemSchema = z.object({
  description: z.string().min(1, 'Requerido'),
  quantity: z.number().min(1, 'Mínimo 1'),
  unitPrice: z.number().min(0, 'Mínimo 0'),
  total: z.number(),
});

const quotationSchema = z.object({
  title: z.string().optional(),
  customerId: z.number({ required_error: 'Selecciona un cliente' }),
  notes: z.string().optional(),
  terms: z.string().optional(),
  validUntil: z.string().optional(),
});

type QuotationFormData = z.infer<typeof quotationSchema>;

interface ItemForm {
  description: string;
  quantity: number;
  unitPrice: number;
}

function createEmptyItem(): ItemForm {
  return { description: '', quantity: 1, unitPrice: 0 };
}

export default function QuotationFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const [items, setItems] = useState<ItemForm[]>([createEmptyItem()]);
  const [taxPercent, setTaxPercent] = useState(16);
  const [discount, setDiscount] = useState(0);
  const [showMLSearch, setShowMLSearch] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await api.get('/customers?limit=1000');
      return data.data ?? [];
    },
  });

  const { data: quotationData, isLoading: loadingQuotation } = useQuery<Quotation>({
    queryKey: ['quotation', id],
    queryFn: async () => {
      const { data } = await api.get<Quotation>(`/quotations/${id}`);
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (quotationData) {
      reset({
        title: quotationData.title || '',
        customerId: quotationData.customerId,
        notes: quotationData.notes || '',
        terms: quotationData.terms || '',
        validUntil: quotationData.validUntil ? quotationData.validUntil.split('T')[0] : '',
      });
      if (quotationData.items && quotationData.items.length > 0) {
        setItems(
          quotationData.items.map((i: QuotationItem) => ({
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          }))
        );
      }
      setTaxPercent(quotationData.tax > 0 ? Math.round((quotationData.tax / quotationData.subtotal) * 100) : 16);
      setDiscount(quotationData.discount);
    }
  }, [quotationData, reset]);

  const updateItem = useCallback((index: number, field: keyof ItemForm, value: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: typeof value === 'string' ? value : value };
      return next;
    });
  }, []);

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, createEmptyItem()]);
  }, []);

  const handleMLSelect = useCallback((mlItem: { description: string; quantity: number; unitPrice: number; total: number }) => {
    setItems((prev) => [...prev, { description: mlItem.description, quantity: mlItem.quantity, unitPrice: mlItem.unitPrice }]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const subtotal = items.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unitPrice || 0);
  }, 0);

  const taxTotal = subtotal * (taxPercent / 100);
  const grandTotal = subtotal + taxTotal - discount;

  const mutation = useMutation({
    mutationFn: async (data: QuotationFormData) => {
      const payload = {
        ...data,
        items: items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: (item.quantity || 0) * (item.unitPrice || 0),
        })),
        subtotal,
        tax: taxTotal,
        discount,
        total: grandTotal,
      };

      if (isEditing) {
        await api.put(`/quotations/${id}`, payload);
      } else {
        await api.post('/quotations', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success(isEditing ? 'Cotización actualizada' : 'Cotización creada');
      navigate('/quotations');
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al guardar'
          : 'Error al guardar';
      toast.error(message);
    },
  });

  const onSubmit = (data: QuotationFormData) => {
    const hasEmptyItem = items.some((item) => !item.description.trim());
    if (hasEmptyItem) {
      toast.error('Completa la descripción de todas las partidas');
      return;
    }
    if (items.length === 0 || items.every((i) => !i.description)) {
      toast.error('Agrega al menos una partida');
      return;
    }
    mutation.mutate(data);
  };

  if (isEditing && loadingQuotation) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/quotations')} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isEditing ? 'Editar Cotización' : 'Nueva Cotización'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isEditing ? 'Modifica los datos de la cotización' : 'Crea una nueva cotización para el cliente'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Datos Generales</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cliente *</label>
            <select {...register('customerId', { valueAsNumber: true })} className="input-field">
              <option value="">Seleccionar cliente...</option>
              {customers?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName ? `${c.companyName} - ${c.contactName}` : c.contactName}
                </option>
              ))}
            </select>
            {errors.customerId && <p className="text-red-500 text-xs mt-1">{errors.customerId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Título</label>
            <input {...register('title')} className="input-field" placeholder="Ej: Mantenimiento preventivo" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Válida hasta</label>
              <input {...register('validUntil')} type="date" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">IVA (%)</label>
              <input
                type="number"
                value={taxPercent}
                onChange={(e) => setTaxPercent(Math.max(0, Number(e.target.value)))}
                className="input-field"
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Partidas</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowMLSearch(true)}
                className="btn-secondary inline-flex items-center gap-2 text-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                Buscar en Mercado Libre
              </button>
              <button type="button" onClick={addItem} className="btn-secondary inline-flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" />
                Agregar Partida
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left px-3 py-3 font-semibold text-gray-600 w-1/2">Descripción</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-600 w-16">Cant.</th>
                  <th className="text-right px-3 py-3 font-semibold text-gray-600 w-28">P. Unitario</th>
                  <th className="text-right px-3 py-3 font-semibold text-gray-600 w-28">Total</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-600 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item, index) => {
                  const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
                  return (
                    <tr key={index}>
                      <td className="px-3 py-2">
                        <input
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className="input-field text-sm"
                          placeholder="Descripción del servicio/producto"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', Math.max(1, Number(e.target.value)))}
                          className="input-field text-sm text-center"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', Math.max(0, Number(e.target.value)))}
                          className="input-field text-sm text-right"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-gray-100">
                        ${lineTotal.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          disabled={items.length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <div className="space-y-2 ml-auto w-full sm:w-72">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">IVA ({taxPercent}%)</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">${taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-600">Descuento</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                  className="input-field text-sm text-right w-28"
                />
              </div>
              <div className="flex justify-between text-base font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                <span className="text-gray-900 dark:text-gray-100">Total</span>
                <span className="text-gray-900 dark:text-gray-100">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notas y Términos</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notas</label>
            <textarea {...register('notes')} rows={3} className="input-field" placeholder="Notas adicionales para el cliente..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Términos y condiciones</label>
            <textarea {...register('terms')} rows={3} className="input-field" placeholder="Términos de pago, garantía, etc..." />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate('/quotations')} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary inline-flex items-center gap-2">
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isEditing ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>

      {showMLSearch && (
        <MercadoLibreSearch
          onSelectItem={handleMLSelect}
          onClose={() => setShowMLSearch(false)}
        />
      )}
    </div>
  );
}
