import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Snowflake, Thermometer, Wind, Droplets } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth';

const floatingIcons = [
  { Icon: Snowflake, delay: 0, x: '10%', y: '20%', size: 24 },
  { Icon: Thermometer, delay: 1.5, x: '80%', y: '30%', size: 20 },
  { Icon: Wind, delay: 0.8, x: '20%', y: '70%', size: 28 },
  { Icon: Droplets, delay: 2.2, x: '70%', y: '75%', size: 22 },
  { Icon: Snowflake, delay: 3, x: '50%', y: '15%', size: 16 },
  { Icon: Thermometer, delay: 1.2, x: '85%', y: '60%', size: 18 },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/', { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al iniciar sesión'
          : 'Error al iniciar sesión';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-10 h-10 border-[3px] border-white/30 border-t-white rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-400/5 rounded-full blur-3xl" />
      </div>

      {/* Floating HVAC icons */}
      {floatingIcons.map(({ Icon, delay, x, y, size }, i) => (
        <motion.div
          key={i}
          className="absolute text-white/10"
          style={{ left: x, top: y }}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: [0, 0.15, 0.15, 0],
            y: [20, -20, -20, 20],
          }}
          transition={{
            duration: 8,
            delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Icon size={size} />
        </motion.div>
      ))}

      <div className="relative z-10 flex w-full">
        {/* Left side - Brand showcase */}
        <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-xl rounded-3xl mb-8 shadow-2xl"
            >
              <Snowflake className="w-12 h-12 text-white" />
            </motion.div>
            <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">HVAC-R CRM</h1>
            <p className="text-xl text-primary-200/80 mb-3">El CRM inteligente para la industria HVAC-R</p>
            <p className="text-primary-300/60 max-w-md mx-auto leading-relaxed">
              Gestiona clientes, órdenes, mantenimientos y más en un solo lugar. Diseñado para técnicos, por técnicos.
            </p>
            <div className="mt-12 grid grid-cols-3 gap-6 max-w-sm mx-auto">
              {[
                { label: 'Clientes', value: 'Gestión' },
                { label: 'Órdenes', value: 'Seguimiento' },
                { label: 'Reportes', value: 'Análisis' },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="text-white/40 text-xs uppercase tracking-widest mb-1">{item.label}</div>
                  <div className="text-white font-semibold">{item.value}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right side - Login form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-16">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md"
          >
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-primary-900/20 p-8 lg:p-10 border border-white/20 dark:border-gray-800/50">
              {/* Mobile logo */}
              <div className="lg:hidden text-center mb-8">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-2xl mb-4 shadow-lg"
                >
                  <Snowflake className="w-8 h-8 text-white" />
                </motion.div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">HVAC-R CRM</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Inicia sesión para continuar</p>
              </div>

              {/* Desktop heading */}
              <div className="hidden lg:block mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bienvenido de nuevo</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Inicia sesión en tu cuenta</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Correo Electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="admin@ejemplo.com"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={isSubmitting || !email || !password}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ scale: 1.01 }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Ingresando...
                    </>
                  ) : (
                    'Ingresar'
                  )}
                </motion.button>
              </form>

              <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                ¿No tienes cuenta?{' '}
                <a href="/register" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
                  Regístrate aquí
                </a>
              </div>
            </div>

            <p className="text-center text-primary-300/60 text-sm mt-6">
              &copy; {new Date().getFullYear()} HVAC-R CRM by semasi
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
