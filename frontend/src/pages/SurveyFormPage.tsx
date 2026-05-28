import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Loader2, Plus, Trash2, Camera, Package, Search } from 'lucide-react';
import api from '../lib/api';
import DrawingCanvas from '../components/DrawingCanvas';
import type { Customer } from '../types';

const surveySchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional(),
  location: z.string().optional(),
  customerId: z.number({ required_error: 'Selecciona un cliente' }),
});

type SurveyFormData = z.infer<typeof surveySchema>;

interface MaterialEntry {
  description: string;
  quantity: number;
  unit: string;
  category: string;
  notes: string;
}

interface PhotoEntry {
  url: string;
  caption: string;
}

interface DrawingEntry {
  name: string;
  canvasData: string;
}

const MATERIAL_CATEGORIES = [
  'Soportería',
  'Ductería',
  'Rejillas y Difusores',
  'Aislamientos',
  'Herramientas',
  'Refrigerantes',
  'Eléctrico',
  'Tubería y Conexiones',
  'Equipo de Protección',
  'Otros',
];

const UNITS = ['pza', 'm', 'm²', 'kg', 'lt', 'rollo', 'caja', 'paquete', 'juego'];

export default function SurveyFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [drawings, setDrawings] = useState<DrawingEntry[]>([{ name: 'Dibujo 1', canvasData: '' }]);
  const [currentDrawing, setCurrentDrawing] = useState(0);
  const [materials, setMaterials] = useState<MaterialEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<any>(null);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!val.trim()) { setSearchResults([]); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const { data } = await api.get('/catalog-materials', { params: { search: val } });
        setSearchResults(data);
      } catch { /* ignore */ }
      setSearching(false);
    }, 300);
  }, []);

  const selectCatalogMaterial = (mat: any) => {
    setMaterials(prev => [...prev, { description: mat.description, quantity: 1, unit: mat.unit, category: mat.category, notes: '' }]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SurveyFormData>({
    resolver: zodResolver(surveySchema),
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await api.get('/customers?limit=1000');
      return data.data ?? [];
    },
  });

  const { data: surveyData, isLoading } = useQuery({
    queryKey: ['survey', id],
    queryFn: () => api.get(`/surveys/${id}`).then(r => r.data),
    enabled: isEditing,
  });

  useEffect(() => {
    if (surveyData) {
      reset({
        title: surveyData.title,
        description: surveyData.description || '',
        location: surveyData.location || '',
        customerId: surveyData.customerId,
      });
      if (surveyData.photos) setPhotos(surveyData.photos.map((p: any) => ({ url: p.url, caption: p.caption || '' })));
      if (surveyData.drawings) setDrawings(surveyData.drawings.map((d: any) => ({ name: d.name || 'Dibujo', canvasData: d.canvasData })));
      if (surveyData.materials) setMaterials(surveyData.materials.map((m: any) => ({ description: m.description, quantity: m.quantity, unit: m.unit, category: m.category || '', notes: m.notes || '' })));
    }
  }, [surveyData, reset]);

  const mutation = useMutation({
    mutationFn: (data: any) =>
      isEditing ? api.put(`/surveys/${id}`, data) : api.post('/surveys', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      toast.success(isEditing ? 'Levantamiento actualizado' : 'Levantamiento creado');
      navigate('/surveys');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Error al guardar'),
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotos(prev => [...prev, { url: ev.target?.result as string, caption: '' }]);
    };
    reader.readAsDataURL(file);
  };

  const addMaterial = () => {
    setMaterials(prev => [...prev, { description: '', quantity: 1, unit: 'pza', category: 'Otros', notes: '' }]);
  };

  const updateMaterial = (idx: number, field: keyof MaterialEntry, value: any) => {
    setMaterials(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  const removeMaterial = (idx: number) => {
    setMaterials(prev => prev.filter((_, i) => i !== idx));
  };

  const addDrawing = () => {
    setDrawings(prev => [...prev, { name: `Dibujo ${prev.length + 1}`, canvasData: '' }]);
    setCurrentDrawing(drawings.length);
  };

  const updateDrawingName = (idx: number, name: string) => {
    setDrawings(prev => prev.map((d, i) => i === idx ? { ...d, name } : d));
  };

  const handleDrawingSave = (idx: number, json: string) => {
    setDrawings(prev => prev.map((d, i) => i === idx ? { ...d, canvasData: json } : d));
    toast.success('Dibujo guardado');
  };

  const removePhoto = (idx: number) => setPhotos(prev => prev.filter((_, i) => i !== idx));
  const removeDrawing = (idx: number) => {
    if (drawings.length <= 1) return;
    setDrawings(prev => prev.filter((_, i) => i !== idx));
    if (currentDrawing >= idx) setCurrentDrawing(Math.max(0, currentDrawing - 1));
  };

  const onSubmit = (formData: SurveyFormData) => {
    mutation.mutate({
      ...formData,
      photos: photos.filter(p => p.url),
      drawings: drawings.filter(d => d.canvasData),
      materials: materials.filter(m => m.description.trim()),
    });
  };

  if (isEditing && isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/surveys')} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{isEditing ? 'Editar Levantamiento' : 'Nuevo Levantamiento'}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Captura información técnica del sitio, dibujos y materiales</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="card space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Información General</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Título *</label>
              <input {...register('title')} className="input-field" placeholder="Ej: Levantamiento inicial - Hotel Paraíso" />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descripción</label>
              <textarea {...register('description')} rows={3} className="input-field" placeholder="Describe el alcance del levantamiento..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ubicación</label>
              <input {...register('location')} className="input-field" placeholder="Ej: Planta baja, azotea, etc." />
            </div>
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
          </div>
        </div>

        {/* Photos */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Camera className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              Fotos del Sitio
            </h2>
            <label className="btn-secondary text-sm cursor-pointer">
              <Plus className="w-4 h-4 inline mr-1" />
              Agregar Foto
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
          {photos.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-6">Aún no hay fotos. Toma o sube fotos del sitio.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map((photo, idx) => (
                <div key={idx} className="relative group">
                  <img src={photo.url} alt={photo.caption || ''} className="w-full h-28 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                  <button type="button" onClick={() => removePhoto(idx)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <input
                    value={photo.caption}
                    onChange={(e) => setPhotos(prev => prev.map((p, i) => i === idx ? { ...p, caption: e.target.value } : p))}
                    className="mt-1 w-full text-xs input-field py-1"
                    placeholder="Pie de foto..."
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawings */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Dibujos y Croquis</h2>
            <div className="flex items-center gap-2">
              <button type="button" onClick={addDrawing} className="btn-secondary text-sm">
                <Plus className="w-4 h-4 inline mr-1" />
                Nuevo Dibujo
              </button>
            </div>
          </div>

          {/* Drawing tabs */}
          {drawings.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap border-b border-gray-200 dark:border-gray-700 pb-2">
              {drawings.map((d, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentDrawing(idx)}
                    className={`px-3 py-1.5 text-sm rounded-t-lg border border-b-0 transition-colors ${
                      currentDrawing === idx ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-primary-700 font-medium' : 'bg-gray-50 dark:bg-gray-800 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <input
                      value={d.name}
                      onChange={(e) => updateDrawingName(idx, e.target.value)}
                      className="bg-transparent border-none outline-none w-24 text-center"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </button>
                  {drawings.length > 1 && (
                    <button type="button" onClick={() => removeDrawing(idx)} className="text-gray-300 hover:text-red-500 p-1">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {drawings.map((d, idx) => (
            <div key={idx} className={currentDrawing !== idx ? 'hidden' : ''}>
              <DrawingCanvas
                canvasData={d.canvasData}
                onSave={(json) => handleDrawingSave(idx, json)}
              />
            </div>
          ))}
        </div>

        {/* Materials */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              Lista de Materiales
            </h2>
            <button type="button" onClick={addMaterial} className="btn-secondary text-sm">
              <Plus className="w-4 h-4 inline mr-1" />
              Agregar Manual
            </button>
          </div>

          {/* Search catalog */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              value={searchQuery}
              onChange={handleSearchChange}
              className="input-field pl-10"
              placeholder="Buscar material en el catálogo HVAC..."
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-30 max-h-60 overflow-y-auto">
                {searchResults.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => selectCatalogMaterial(m)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <span className="text-gray-900 dark:text-gray-100">{m.description}</span>
                    <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">{m.category}</span>
                    <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">({m.unit})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {materials.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-6">
              Agrega materiales del proyecto: soportería, ductería, rejillas, aislamientos, herramientas...
            </p>
          ) : (
            <div className="space-y-2">
              {/* Header */}
              <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="col-span-4">Descripción</div>
                <div className="col-span-1">Cant</div>
                <div className="col-span-1">Unidad</div>
                <div className="col-span-3">Categoría</div>
                <div className="col-span-2">Notas</div>
                <div className="col-span-1" />
              </div>
              {materials.map((mat, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="col-span-12 md:col-span-4">
                    <input
                      value={mat.description}
                      onChange={(e) => updateMaterial(idx, 'description', e.target.value)}
                      className="input-field w-full text-sm"
                      placeholder="Ej: Ducto rectangular galvanizado"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-1">
                    <input
                      type="number"
                      value={mat.quantity}
                      onChange={(e) => updateMaterial(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      className="input-field w-full text-sm"
                      min="0"
                      step="0.5"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-1">
                    <select
                      value={mat.unit}
                      onChange={(e) => updateMaterial(idx, 'unit', e.target.value)}
                      className="input-field w-full text-sm"
                    >
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="col-span-4 md:col-span-3">
                    <select
                      value={mat.category}
                      onChange={(e) => updateMaterial(idx, 'category', e.target.value)}
                      className="input-field w-full text-sm"
                    >
                      {MATERIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-span-8 md:col-span-2">
                    <input
                      value={mat.notes}
                      onChange={(e) => updateMaterial(idx, 'notes', e.target.value)}
                      className="input-field w-full text-sm"
                      placeholder="Notas..."
                    />
                  </div>
                  <div className="col-span-4 md:col-span-1 flex justify-end">
                    <button type="button" onClick={() => removeMaterial(idx)} className="p-1.5 text-gray-300 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate('/surveys')} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary inline-flex items-center gap-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEditing ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
