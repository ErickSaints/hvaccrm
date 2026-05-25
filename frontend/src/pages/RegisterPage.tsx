import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Snowflake, Check, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../lib/auth';

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: 'MENSUAL' | 'ANUAL';
  features: string;
  active: boolean;
}

const registerSchema = z
  .object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma la contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login, user, isLoading: authLoading } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const { data: plans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data } = await api.get<SubscriptionPlan[]>('/subscriptions/plans');
      return data;
    },
  });

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (plans && plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

  const onSubmit = async (formData: RegisterFormData) => {
    if (!selectedPlanId) {
      toast.error('Selecciona un plan de suscripción');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await api.post<{ token: string; user: unknown }>('/subscriptions/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        planId: selectedPlanId,
      });

      localStorage.setItem('token', data.token);
      await login(formData.email, formData.password);
      navigate('/payment', { replace: true });
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
            'Error al registrarse'
          : 'Error al registrarse';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800">
        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 flex flex-col">
      {/* Header */}
      <div className="text-center pt-8 pb-4 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur rounded-2xl mb-4">
          <Snowflake className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">HVAC-R CRM</h1>
        <p className="text-primary-200 mt-1">El CRM inteligente para HVAC-R · <span className="text-white/60">by semasi</span></p>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 pb-12">
        <div className="w-full max-w-4xl space-y-6">
          {/* Plan Selection */}
          {plansLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          ) : plans && plans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {plans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative text-left p-6 rounded-2xl transition-all duration-200 ${
                      isSelected
                        ? 'bg-white shadow-2xl scale-105 ring-2 ring-primary-400'
                        : 'bg-white/10 backdrop-blur hover:bg-white/20'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <h3
                      className={`text-lg font-bold ${
                        isSelected ? 'text-gray-900' : 'text-white'
                      }`}
                    >
                      {plan.name}
                    </h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span
                        className={`text-3xl font-bold ${
                          isSelected ? 'text-gray-900' : 'text-white'
                        }`}
                      >
                        ${plan.price.toLocaleString('es-MX')}
                      </span>
                      <span
                        className={`text-sm ${
                          isSelected ? 'text-gray-500' : 'text-white/70'
                        }`}
                      >
                        /{plan.duration === 'ANUAL' ? 'año' : 'mes'}
                      </span>
                    </div>
                    <p
                      className={`mt-2 text-sm ${
                        isSelected ? 'text-gray-600' : 'text-white/80'
                      }`}
                    >
                      {plan.description}
                    </p>
                    {(() => {
                      const featureList = plan.features ? plan.features.split(',').map(f => f.trim()).filter(Boolean) : [];
                      return featureList.length > 0 ? (
                      <ul className="mt-4 space-y-1.5">
                        {featureList.map((feature, i) => (
                          <li
                            key={i}
                            className={`flex items-center gap-2 text-sm ${
                              isSelected ? 'text-gray-600' : 'text-white/80'
                            }`}
                          >
                            <Check
                              className={`w-4 h-4 flex-shrink-0 ${
                                isSelected ? 'text-primary-600' : 'text-white/60'
                              }`}
                            />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      ) : null;
                    })()}
                  </button>
                );
              })}
            </div>
          ) : null}

          {/* Registration Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg mx-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Crear Cuenta</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre Completo *
                </label>
                <input
                  {...register('name')}
                  className="input-field"
                  placeholder="Juan Pérez"
                  autoFocus
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Correo Electrónico *
                </label>
                <input
                  {...register('email')}
                  type="email"
                  className="input-field"
                  placeholder="correo@ejemplo.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contraseña *
                </label>
                <input
                  {...register('password')}
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirmar Contraseña *
                </label>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !selectedPlanId}
                className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  'Crear Cuenta'
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              ¿Ya tienes cuenta?{' '}
              <a href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Iniciar Sesión
              </a>
            </p>
          </div>

          <p className="text-center text-primary-200 text-sm">
            &copy; {new Date().getFullYear()} HVAC-R CRM · by semasi. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
