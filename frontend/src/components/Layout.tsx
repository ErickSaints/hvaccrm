import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  Shield,
  Menu,
  X,
  LogOut,
  PackageSearch,
  Calculator,
  Search,
  ChevronDown,
  Building2,
  Ruler,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';

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
    { name: 'Reportes', href: '/service-reports', icon: Camera },
  ]},
  { section: 'Mantenimiento', items: [
    { name: 'Pólizas', href: '/policies', icon: ShieldCheck },
    { name: 'Mantenimientos', href: '/maintenance', icon: CalendarCheck },
  ]},
  { section: 'Proyectos', items: [
    { name: 'Levantamientos', href: '/surveys', icon: Ruler },
  ]},
  { section: 'Herramientas', items: [
    { name: 'Refacciones e Insumos', href: '/refacciones', icon: PackageSearch },
    { name: 'Cálculos HVAC', href: '/calculos-hvac', icon: Calculator },
  ]},
];

const clientNav = [
  { name: 'Tickets', href: '/tickets', icon: TicketCheck },
  { name: 'Refacciones e Insumos', href: '/refacciones', icon: PackageSearch },
];

const adminBottomNav = [
  { name: 'Mi Perfil', href: '/profile', icon: UserCircle },
  { name: 'Usuarios', href: '/users', icon: UserCog },
  { name: 'Suscripciones', href: '/subscriptions', icon: CreditCard },
];

const clientBottomNav = [
  { name: 'Mi Perfil', href: '/profile', icon: UserCircle },
];

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  TECHNICIAN: 'Técnico',
  SALES: 'Ventas',
  CLIENT: 'Cliente',
  PROYECTOS: 'Proyectos',
  COMPRAS: 'Compras',
};

const roleColors: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  TECHNICIAN: 'bg-blue-100 text-blue-700',
  SALES: 'bg-emerald-100 text-emerald-700',
  CLIENT: 'bg-gray-100 text-gray-700',
  PROYECTOS: 'bg-amber-100 text-amber-700',
  COMPRAS: 'bg-rose-100 text-rose-700',
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const role = user?.role as string || '';
  const isClient = role === 'CLIENT';
  const isSuperAdmin = user?.isSuperAdmin === true && role === 'ADMIN';

  const visibleMainNav = mainNav.filter(section =>
    section.section !== 'Proyectos' || (role === 'ADMIN' || role === 'SALES' || role === 'PROYECTOS' || role === 'COMPRAS')
  );

  const adminOnlyNav = isSuperAdmin
    ? [
        { name: 'Panel Admin', href: '/admin', icon: Shield },
        { name: 'Permisos', href: '/permissions', icon: Shield },
      ]
    : [];

  const userMgmtNav = isSuperAdmin
    ? [{ name: 'Usuarios', href: '/users', icon: UserCog }]
    : [];

  const bottomNav = isClient
    ? clientBottomNav
    : [...adminOnlyNav, ...userMgmtNav, ...adminBottomNav.filter(item => item.name !== 'Usuarios')];

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    setExpandedSections({ 'General': true, 'Clientes': true, 'Operaciones': true, 'Mantenimiento': true, 'Proyectos': true, 'Herramientas': true });
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
      if (e.key === 'Escape') setSearchOpen(false);
    }
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
      <NavLink to={href} className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
        isActive
          ? 'bg-primary-50 text-primary-700 shadow-sm'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}>
        {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary-600 rounded-r-full" />}
        <span className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150 ${
          isActive ? 'bg-primary-100 text-primary-600' : 'bg-transparent text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-600'
        }`}>
          <Icon className="w-4.5 h-4.5" />
        </span>
        <span>{name}</span>
      </NavLink>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-gray-200 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:static lg:translate-x-0 flex flex-col ${
        sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full shadow-none'
      }`}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-blue-600 via-cyan-500 to-sky-400 text-white rounded-xl shadow-md shadow-blue-200">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v8m0 0l-3-3m3 3l3-3" />
                <path d="M12 14v8m0 0l-3-3m3 3l3-3" />
                <path d="M4 12h8m0 0l-3-3m3 3l3-3" />
                <path d="M14 12h8m0 0l-3-3m3 3l-3 3" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-sm text-gray-900 block leading-tight">HVAC-R CRM</span>
              <span className="text-[10px] text-gray-400 leading-tight">El CRM inteligente para HVAC-R</span>
            </div>
          </div>
          <button className="lg:hidden text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors" onClick={() => setSidebarOpen(false)}>
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
            <div className="space-y-5">
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
                        hasActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {section.section}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
                    </button>
                    {isExpanded && (
                      <div className="mt-1 space-y-0.5">
                        {section.items.map((item) => <NavItem key={item.name} {...item} />)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </nav>

        {/* Bottom section */}
        <div className="shrink-0 border-t border-gray-100 bg-gray-50/50 px-3 py-3">
          {bottomNav.map((item) => <NavItem key={item.name} {...item} />)}

          {/* User info */}
          {user && (
            <div className="mt-3 pt-3 border-t border-gray-200 px-3">
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-9 h-9 rounded-full font-semibold text-sm shrink-0 ${roleColors[user.role] || 'bg-gray-100 text-gray-700'}`}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">{roleLabels[user.role] || user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
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
      <div className="flex flex-col flex-1 w-0 min-w-0">
        <header className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex justify-center px-4">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full max-w-lg flex items-center gap-2.5 px-4 py-2 text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all group"
            >
              <Search className="w-4 h-4 text-gray-400 group-hover:text-gray-500" />
              <span className="text-gray-400 group-hover:text-gray-500">Buscar en el CRM...</span>
              <span className="ml-auto hidden sm:inline-flex items-center gap-0.5 text-[11px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-md font-mono">
                <span className="text-[10px]">⌘</span>K
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <NotificationBell />
            {user && (
              <div className="hidden sm:flex items-center gap-2.5 ml-2 pl-2 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 leading-tight">{user.name}</p>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${roleColors[user.role] || 'bg-gray-100 text-gray-600'}`}>
                    {roleLabels[user.role] || user.role}
                  </span>
                </div>
              </div>
            )}
          </div>
        </header>

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