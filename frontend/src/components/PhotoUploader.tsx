import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, Image } from 'lucide-react';
import api from '../lib/api';

interface Props {
  value: string;
  onChange: (url: string) => void;
  onClear?: () => void;
  preview?: boolean;
  className?: string;
}

export default function PhotoUploader({ value, onChange, onClear, preview = true, className = '' }: Props) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(value);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('La imagen es muy grande (máx 10MB)');
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('photo', file);
      const { data } = await api.post<{ url: string; inline?: boolean }>('/upload/photo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreviewUrl(data.url);
      onChange(data.url);
    } catch {
      // Fallback: convert to base64 data URL inline
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          setPreviewUrl(dataUrl);
          onChange(dataUrl);
          setUploading(false);
        };
        reader.onerror = () => {
          alert('Error al leer la imagen');
          setUploading(false);
        };
        reader.readAsDataURL(file);
      } catch {
        alert('Error al procesar la imagen');
        setUploading(false);
      }
      return;
    }
    setUploading(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
    e.target.value = '';
  }

  function handleClear() {
    setPreviewUrl('');
    onChange('');
    onClear?.();
  }

  const hasValue = value || previewUrl;

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {uploading ? (
        <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <Loader2 className="w-6 h-6 text-primary-600 animate-spin mx-auto" />
            <p className="text-xs text-gray-400 mt-1">Subiendo...</p>
          </div>
        </div>
      ) : hasValue && preview ? (
        <div className="relative group">
          <img
            src={value || previewUrl}
            alt="Preview"
            className="w-full h-32 object-cover rounded-lg border border-gray-200"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="opacity-0 group-hover:opacity-100 p-2 bg-white/90 rounded-lg text-gray-700 hover:bg-white transition-all"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="opacity-0 group-hover:opacity-100 p-2 bg-white/90 rounded-lg text-gray-700 hover:bg-white transition-all"
            >
              <Camera className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="opacity-0 group-hover:opacity-100 p-2 bg-red-50/90 rounded-lg text-red-600 hover:bg-red-50 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50/50 transition-colors text-gray-500 hover:text-primary-600"
          >
            <Upload className="w-6 h-6" />
            <div className="text-left">
              <p className="text-sm font-medium">Subir foto</p>
              <p className="text-xs text-gray-400">Desde archivos</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50/50 transition-colors text-gray-500 hover:text-primary-600"
          >
            <Camera className="w-6 h-6" />
            <div className="text-left">
              <p className="text-sm font-medium">Cámara</p>
              <p className="text-xs text-gray-400">Tomar foto</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
