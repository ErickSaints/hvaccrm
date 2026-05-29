import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Wrench,
  QrCode,
  TicketCheck,
  FileText,
  ClipboardList,
  Camera,
  ShieldCheck,
  CalendarCheck,
  UserCircle,
  UserCog,
  CreditCard,
  Menu,
  X,
  LogOut,
  PackageSearch,
  Calculator,
  Brain,
  Search,
  ChevronDown,
  Ruler,
  Moon,
  Sun,
  Settings,
  TrendingUp,
  Snowflake,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';
import { useDarkMode } from '../lib/useDarkMode';

const mainNav = [
  { section: 'General', items: [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  ]},
  { section: 'Clientes', items: [
    { name: 'Clientes', href: '/customers', icon: Users },
    { name: 'Equipos', href: '/equipment', icon: Wrench },
    { name: 'Activos con QR', href: '/assets', icon: QrCode },
  ]},
  { section: 'Operaciones', items: [
    { name: 'Tickets', href: '/tickets', icon: TicketCheck },
    { name: 'Cotizaciones', href: '/quotations', icon: FileText },
    { name: 'Órdenes de Servicio', href: '/service-orders', icon: ClipboardList },
    { name: 'Reportes de Servicio', href: '/service-reports', icon: Camera },
    { name: 'Reportes Ejecutivos', href: '/reports', icon: TrendingUp },
  ]},
  { section: 'Mantenimiento', items: [
    { name: 'Pólizas', href: '/policies', icon: ShieldCheck },
    { name: 'Mantenimientos', href: '/maintenance', icon: CalendarCheck },
    { name: 'Calendario', href: '/dispatch', icon: CalendarCheck },
    { name: 'Facturas', href: '/invoices', icon: FileText },
  ]},
  { section: 'Proyectos', items: [
    { name: 'Levantamientos', href: '/surveys', icon: Ruler },
  ]},
  { section: 'Herramientas', items: [
    { name: 'Inventario', href: '/inventory', icon: PackageSearch },
    { name: 'Refacciones e Insumos', href: '/refacciones', icon: PackageSearch },
    { name: 'Cálculos HVAC', href: '/calculos-hvac', icon: Calculator },
    { name: 'ML Predictions', href: '/ml-predictions', icon: Brain },
  ]},
];

const clientNav = [
  { name: 'Panel de Cliente', href: '/', icon: LayoutDashboard },
  { name: 'Tickets', href: '/tickets', icon: TicketCheck },
  { name: 'Órdenes de Servicio', href: '/service-orders', icon: ClipboardList },
  { name: 'Cotizaciones', href: '/quotations', icon: FileText },
  { name: 'Equipos', href: '/equipment', icon: Wrench },
  { name: 'Refacciones e Insumos', href: '/refacciones', icon: PackageSearch },
  { name: 'Configuración', href: '/client/settings', icon: Settings },
];

const adminBottomNav = [
  { name: 'Mi Perfil', href: '/profile', icon: UserCircle },
  { name: 'Usuarios', href: '/users', icon: UserCog },
  { name: 'Suscripciones', href: '/subscriptions', icon: CreditCard },
];

const clientBottomNav = [
  { name: 'Mi Perfil', href: '/profile', icon: UserCircle },
  { name: 'Configuración', href: '/client/settings', icon: Settings },
];

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  TECHNICIAN: 'Técnico',
  SALES: 'Ventas',
  CLIENT: 'Cliente',
  PROYECTOS: 'Proyectos',
  COMPRAS: 'Compras',
};

const roleBadgeColors: Record<string, string> = {
  ADMIN: 'bg-purple-500/20 text-purple-300 ring-purple-500/30',
  TECHNICIAN: 'bg-blue-500/20 text-blue-300 ring-blue-500/30',
  SALES: 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/30',
  CLIENT: 'bg-gray-500/20 text-gray-300 ring-gray-500/30',
  PROYECTOS: 'bg-cyan-500/20 text-cyan-300 ring-cyan-500/30',
  COMPRAS: 'bg-orange-500/20 text-orange-300 ring-orange-500/30',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDark, toggleDark] = useDarkMode();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const isClient = user?.role === 'CLIENT';

  const visibleMainNav = mainNav.filter((section) => {
    if (user?.role === 'ADMIN') return true;
    const adminSections = ['General', 'Herramientas'];
    const techSections = ['General', 'Clientes', 'Operaciones', 'Mantenimiento', 'Herramientas'];
    const salesSections = ['General', 'Clientes', 'Operaciones', 'Herramientas'];
    const proyectosSections = ['General', 'Proyectos', 'Herramientas'];
    const comprasSections = ['General', 'Herramientas'];

    switch (user?.role) {
      case 'TECHNICIAN': return techSections.includes(section.section);
      case 'SALES': return salesSections.includes(section.section);
      case 'PROYECTOS': return proyectosSections.includes(section.section);
      case 'COMPRAS': return comprasSections.includes(section.section);
      default: return adminSections.includes(section.section);
    }
  });

  const bottomNav = isClient ? clientBottomNav : adminBottomNav;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  function toggleSection(name: string) {
    setExpandedSections(prev => ({ ...prev, [name]: !prev[name] }));
  }

  function NavItem({ name, href, icon: Icon }: { name: string; href: string; icon: any }) {
    const isActive = href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);
    return (
      <NavLink to={href} className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200">
        {isActive && (
          <motion.div
            layoutId="activeNav"
            className="absolute inset-0 bg-primary-500/10 rounded-xl ring-1 ring-primary-500/20"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        <span className={`relative z-10 flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 ${
          isActive
            ? 'bg-primary-500/20 text-primary-400 shadow-sm'
            : 'text-gray-400 group-hover:bg-gray-800/50 group-hover:text-gray-200'
        }`}>
          <Icon className="w-4.5 h-4.5" />
        </span>
        <span className={`relative z-10 transition-colors duration-200 ${
          isActive ? 'text-primary-300 font-semibold' : 'text-gray-400 group-hover:text-gray-200'
        }`}>
          {name}
        </span>
      </NavLink>
    );
  }

  function NavItemBottom({ name, href, icon: Icon }: { name: string; href: string; icon: any }) {
    const isActive = href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);
    return (
      <NavLink to={href} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'text-primary-300 bg-primary-500/10'
          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
      }`}>
        <Icon className="w-4 h-4" />
        <span>{name}</span>
      </NavLink>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#0b1120]">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-[#0f172a] via-[#0f172a] to-[#0b1120] border-r border-white/5 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:static lg:translate-x-0 flex flex-col ${
        sidebarOpen ? 'translate-x-0 shadow-2xl shadow-primary-900/30' : '-translate-x-full shadow-none'
      }`}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 text-white rounded-xl shadow-lg shadow-primary-600/20">
              <Snowflake className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-white block leading-tight">HVAC-R CRM</span>
              <span className="text-[10px] text-gray-500 leading-tight">by semasi</span>
            </div>
          </div>
          <button className="lg:hidden text-gray-500 hover:text-gray-300 hover:bg-white/5 p-1.5 rounded-lg transition-colors" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          {isClient ? (
            <div className="space-y-1">
              {clientNav.map((item) => <NavItem key={item.name} {...item} />)}
            </div>
          ) : (
            <div className="space-y-4">
              {visibleMainNav.map((section) => {
                const isExpanded = expandedSections[section.section] !== false;
                const hasActive = section.items.some(
                  (item) => item.href === '/' ? location.pathname === '/' : location.pathname.startsWith(item.href)
                );
                return (
                  <div key={section.section}>
                    <button
                      onClick={() => toggleSection(section.section)}
                      className={`flex items-center justify-between w-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest transition-colors ${
                        hasActive ? 'text-primary-400' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {section.section}
                      <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
                    </button>
                    <div className="mt-0.5 space-y-0.5">
                      {section.items.map((item) => <NavItem key={item.name} {...item} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </nav>

        {/* Bottom section */}
        <div className="shrink-0 border-t border-white/5 px-3 py-3 bg-white/[0.02]">
          {bottomNav.map((item) => <NavItemBottom key={item.name} {...item} />)}

          {user && (
            <div className="mt-3 pt-3 border-t border-white/5 px-2">
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-9 h-9 rounded-full font-semibold text-sm shrink-0 ring-2 ring-white/10 ${roleBadgeColors[user.role] || 'bg-gray-500/20 text-gray-300'}`}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-200 truncate">{user.name}</p>
                  <p className="text-[11px] text-gray-500 truncate">{roleLabels[user.role] || user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="relative flex flex-col flex-1 w-0 min-w-0">
        {/* Subtle background mesh */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl dark:bg-primary-400/5" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-500/5 rounded-full blur-3xl dark:bg-secondary-400/5" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-accent-500/3 rounded-full blur-3xl dark:bg-accent-400/3" />
        </div>
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-4 lg:px-6 shrink-0 border-b border-gray-200/50 dark:border-white/5 bg-white/70 dark:bg-[#0b1120]/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-xl transition-colors dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-white/5"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex justify-center px-4">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full max-w-lg flex items-center gap-2.5 px-4 py-2 text-sm text-gray-400 bg-gray-100/50 border border-gray-200/50 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all group dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 dark:hover:border-white/20"
            >
              <Search className="w-4 h-4 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
              <span className="text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300">Buscar en el CRM...</span>
              <span className="ml-auto hidden sm:inline-flex items-center gap-0.5 text-[11px] text-gray-400 bg-gray-200/50 px-1.5 py-0.5 rounded-md font-mono dark:bg-white/10 dark:text-gray-500">
                <span className="text-[10px]">⌘</span>K
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleDark}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
              title={isDark ? 'Modo claro' : 'Modo oscuro'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <NotificationBell />
            {user && (
              <div className="hidden sm:flex items-center gap-2.5 ml-2 pl-2 border-l border-gray-200/50 dark:border-white/10">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 leading-tight dark:text-gray-100">{user.name}</p>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ring-1 ${roleBadgeColors[user.role] || 'bg-gray-100 text-gray-600 ring-gray-200'}`}>
                    {roleLabels[user.role] || user.role}
                  </span>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
