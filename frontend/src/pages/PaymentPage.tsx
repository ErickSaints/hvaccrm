import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Snowflake, Loader2, CreditCard, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../lib/auth';

export default function PaymentPage() {
  const [loading, setLoading] = useState(false);
  const [preference, setPreference] = useState<{ initPoint: string; sandboxInitPoint: string } | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => api.get('/subscriptions/my').then((r) => r.data),
    enabled: !!user,
  });

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get('/subscriptions/plans').then((r) => r.data),
  });

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success' || searchParams.get('payment') === 'success') {
      toast.success('¡Pago exitoso! Tu suscripción está activa.');
      setTimeout(() => navigate('/'), 2000);
    }
  }, [searchParams, navigate]);

  const handlePay = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/subscriptions/create-preference');
      setPreference(data);
      window.open(data.initPoint || data.sandboxInitPoint, '_blank');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al crear pago');
    } finally {
      setLoading(false);
    }
  };

  if (subLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const isActive = subscription?.status === 'ACTIVA';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <button onClick={() => navigate('/')} className="text-white/80 hover:text-white flex items-center gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </button>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur rounded-xl">
              <Snowflake className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Pago de Suscripción</h1>
              <p className="text-primary-200 text-sm">Completa tu pago para activar el servicio</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 w-full">
        {isActive ? (
          <div className="card text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">¡Suscripción Activa!</h2>
            <p className="text-gray-500 mb-6">
              Tu plan <strong>{subscription.plan.name}</strong> está vigente hasta{' '}
              {new Date(subscription.endDate).toLocaleDateString('es-MX')}
            </p>
            <button onClick={() => navigate('/')} className="btn-primary">
              Ir al Dashboard
            </button>
          </div>
        ) : subscription?.status === 'PENDIENTE' ? (
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Resumen de tu Plan</h2>
                <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
                  Pendiente de pago
                </span>
              </div>
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Plan</span>
                  <span className="font-medium text-gray-900">{subscription.plan.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Duración</span>
                  <span className="font-medium text-gray-900">
                    {subscription.plan.duration === 'MENSUAL' ? '30 días' : '1 año'}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
                  <span className="text-gray-900">Total</span>
                  <span className="text-primary-600">${subscription.plan.price.toLocaleString('es-MX')} MXN</span>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-100">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg flex-shrink-0">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Pago 100% Seguro</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Procesado por Mercado Pago. Aceptamos tarjetas de crédito, débito, OXXO y SPEI.
                  </p>
                  <button
                    onClick={handlePay}
                    disabled={loading}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Pagar ${subscription.plan.price.toLocaleString('es-MX')} con Mercado Pago
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {preference && (
              <div className="text-center text-sm text-gray-500">
                ¿No se abrió la ventana de pago?{' '}
                <a
                  href={preference.initPoint || preference.sandboxInitPoint}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  Haz clic aquí
                </a>
              </div>
            )}
          </div>
        ) : subscription?.status === 'CANCELADA' ? (
          <div className="card text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Suscripción Cancelada</h2>
            <p className="text-gray-500 mb-6">Tu suscripción ha sido cancelada. Puedes contratar un nuevo plan.</p>
            <button onClick={() => navigate('/subscriptions')} className="btn-primary">
              Ver Planes
            </button>
          </div>
        ) : (
          <div className="card text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Sin Suscripción</h2>
            <p className="text-gray-500 mb-6">No tienes ninguna suscripción activa.</p>
            <button onClick={() => navigate('/register')} className="btn-primary">
              Ver Planes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
