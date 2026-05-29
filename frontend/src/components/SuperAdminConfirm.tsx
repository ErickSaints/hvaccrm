import { useState, useEffect, useRef } from 'react';
import { Lock, Loader2, X, AlertTriangle, Smartphone } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface SuperAdminConfirmProps {
  open: boolean;
  onClose: () => void;
  onConfirmed: () => void;
  title?: string;
  message?: string;
}

export default function SuperAdminConfirm({
  open,
  onClose,
  onConfirmed,
  title = 'Confirmar acción de Super Admin',
  message = 'Ingresa tu contraseña de Super Admin para confirmar esta acción.',
}: SuperAdminConfirmProps) {
  const [step, setStep] = useState<'password' | 'code'>('password');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setStep('password');
      setPassword('');
      setCode('');
      setError('');
      setSmsSent(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/verify-super-admin', { password });
      if (data.verified) {
        if (data.smsRequired) {
          setSmsSent(data.smsSent);
          setStep('code');
          setTimeout(() => inputRef.current?.focus(), 100);
        } else {
          onConfirmed();
          onClose();
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Contraseña incorrecta');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/verify-super-admin-code', { code });
      if (data.verified) {
        onConfirmed();
        onClose();
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Código incorrecto');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/verify-super-admin', { password });
      if (data.verified) {
        setSmsSent(data.smsSent);
        toast.success('Código reenviado');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al reenviar código');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${step === 'code' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'} rounded-xl flex items-center justify-center`}>
            {step === 'code' ? <Smartphone className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {step === 'code' ? 'Verificación SMS' : title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {step === 'code'
                ? smsSent
                  ? 'Ingresa el código de verificación enviado a tu teléfono.'
                  : 'No se pudo enviar el SMS. Verifica tu número de teléfono.'
                : message}
            </p>
          </div>
        </div>

        {step === 'password' ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                ref={inputRef}
                type="password"
                placeholder="Contraseña de Super Admin"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="input-field pl-10 pr-4"
                autoComplete="off"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !password}
                className="btn-danger flex-1 inline-flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Confirmar
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Código de 6 dígitos"
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                className="input-field pl-10 pr-4 text-center text-lg tracking-widest"
                autoComplete="off"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="btn-danger flex-1 inline-flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                Verificar
              </button>
            </div>

            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium text-center"
            >
              {loading ? 'Enviando...' : 'Reenviar código'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
