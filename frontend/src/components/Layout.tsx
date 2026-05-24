import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Wrench,
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
} from 'lucide-react';
import { useAuth } from '../lib/auth';

const adminNav = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clientes', href: '/customers', icon: Users },
  { name: 'Equipos', href: '/equipment', icon: Wrench },
  { name: 'Tickets', href: '/tickets', icon: TicketCheck },
  { name: 'Cotizaciones', href: '/quotations', icon: FileText },
  { name: 'Órdenes de Servicio', href: '/service-orders', icon: ClipboardList },
  { name: 'Reportes', href: '/service-reports', icon: Camera },
  { name: 'Pólizas', href: '/policies', icon: ShieldCheck },
  { name: 'Mantenimientos', href: '/maintenance', icon: CalendarCheck },
  { name: 'Cálculos HVAC', href: '/calculos-hvac', icon: Calculator },
];

const techNav = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Tickets', href: '/tickets', icon: TicketCheck },
  { name: 'Herramientas e Insumos', href: '/refacciones', icon: PackageSearch },
  { name: 'Órdenes de Servicio', href: '/service-orders', icon: ClipboardList },
  { name: 'Reportes', href: '/service-reports', icon: Camera },
  { name: 'Pólizas', href: '/policies', icon: ShieldCheck },
  { name: 'Mantenimientos', href: '/maintenance', icon: CalendarCheck },
  { name: 'Cálculos HVAC', href: '/calculos-hvac', icon: Calculator },
];

const clientNav = [
  { name: 'Tickets', href: '/tickets', icon: TicketCheck },
  { name: 'Herramientas e Insumos', href: '/refacciones', icon: PackageSearch },
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
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const role = user?.role;
  const navigation = role === 'CLIENT' ? clientNav : role === 'TECHNICIAN' ? techNav : adminNav;
  const bottomNav = role === 'CLIENT' ? clientBottomNav : adminBottomNav;

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-blue-500 via-cyan-500 to-sky-400 text-white rounded-lg shadow-md">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v8m0 0l-3-3m3 3l3-3" />
                <path d="M12 14v8m0 0l-3-3m3 3l3-3" />
                <path d="M4 12h8m0 0l-3-3m3 3l3-3" />
                <path d="M14 12h8m0 0l-3-3m3 3l-3 3" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">HVAC-R</span> CRM
            </span>
          </div>
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.href);
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-3 py-2 border-t border-gray-200">
          {bottomNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.href);
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                {item.name}
              </NavLink>
            );
          })}
        </div>
      </aside>

      <div className="flex flex-col flex-1 w-0">
        <header className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 lg:px-6">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 lg:flex-none" />

          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{roleLabels[user.role] || user.role}</p>
                </div>
                <div className="flex items-center justify-center w-9 h-9 bg-primary-100 text-primary-700 rounded-full font-semibold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}