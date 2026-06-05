export type PermissionAction =
  | 'users:view' | 'users:create' | 'users:edit' | 'users:delete'
  | 'customers:view' | 'customers:create' | 'customers:edit' | 'customers:delete'
  | 'tickets:view' | 'tickets:create' | 'tickets:edit' | 'tickets:delete' | 'tickets:assign'
  | 'equipment:view' | 'equipment:create' | 'equipment:edit' | 'equipment:delete'
  | 'invoices:view' | 'invoices:create' | 'invoices:edit' | 'invoices:delete'
  | 'quotations:view' | 'quotations:create' | 'quotations:edit' | 'quotations:delete'
  | 'quotation-requests:view' | 'quotation-requests:create' | 'quotation-requests:manage'
  | 'service-orders:view' | 'service-orders:create' | 'service-orders:edit' | 'service-orders:delete'
  | 'service-reports:view' | 'service-reports:create' | 'service-reports:edit' | 'service-reports:delete'
  | 'policies:view' | 'policies:create' | 'policies:edit' | 'policies:delete'
  | 'maintenance:view' | 'maintenance:create' | 'maintenance:edit' | 'maintenance:delete'
  | 'dashboard:view'
  | 'notifications:view' | 'notifications:manage'
  | 'assets:view' | 'assets:create' | 'assets:edit' | 'assets:delete'
  | 'surveys:view' | 'surveys:create' | 'surveys:edit' | 'surveys:delete'
  | 'catalog:view' | 'catalog:create' | 'catalog:edit' | 'catalog:delete'
  | 'subscriptions:view' | 'subscriptions:manage'
  | 'admin:panel' | 'admin:users' | 'admin:permissions' | 'admin:spectate' | 'admin:system'
  | 'profile:view' | 'profile:edit'
  | 'upload:files'
  | 'campaigns:view' | 'campaigns:create' | 'campaigns:edit' | 'campaigns:delete' | 'campaigns:send'
  | 'fleet:view' | 'fleet:create' | 'fleet:edit' | 'fleet:delete'
  | 'reports:view'
  | 'dispatch:view' | 'dispatch:create' | 'dispatch:edit'
  | 'regional-prices:view';

export const ALL_PERMISSIONS: PermissionAction[] = [
  'users:view', 'users:create', 'users:edit', 'users:delete',
  'customers:view', 'customers:create', 'customers:edit', 'customers:delete',
  'tickets:view', 'tickets:create', 'tickets:edit', 'tickets:delete', 'tickets:assign',
  'equipment:view', 'equipment:create', 'equipment:edit', 'equipment:delete',
  'invoices:view', 'invoices:create', 'invoices:edit', 'invoices:delete',
  'quotations:view', 'quotations:create', 'quotations:edit', 'quotations:delete',
  'quotation-requests:view', 'quotation-requests:create', 'quotation-requests:manage',
  'service-orders:view', 'service-orders:create', 'service-orders:edit', 'service-orders:delete',
  'service-reports:view', 'service-reports:create', 'service-reports:edit', 'service-reports:delete',
  'policies:view', 'policies:create', 'policies:edit', 'policies:delete',
  'maintenance:view', 'maintenance:create', 'maintenance:edit', 'maintenance:delete',
  'dashboard:view',
  'notifications:view', 'notifications:manage',
  'assets:view', 'assets:create', 'assets:edit', 'assets:delete',
  'surveys:view', 'surveys:create', 'surveys:edit', 'surveys:delete',
  'catalog:view', 'catalog:create', 'catalog:edit', 'catalog:delete',
  'campaigns:view', 'campaigns:create', 'campaigns:edit', 'campaigns:delete', 'campaigns:send',
  'fleet:view', 'fleet:create', 'fleet:edit', 'fleet:delete',
  'reports:view',
  'dispatch:view', 'dispatch:create', 'dispatch:edit',
  'regional-prices:view',
  'subscriptions:view', 'subscriptions:manage',
  'admin:panel', 'admin:users', 'admin:permissions', 'admin:spectate', 'admin:system',
  'profile:view', 'profile:edit',
  'upload:files',
];

export const PERMISSION_CATEGORIES: Record<string, { label: string; permissions: PermissionAction[] }> = {
  users: {
    label: 'Usuarios',
    permissions: ['users:view', 'users:create', 'users:edit', 'users:delete'],
  },
  customers: {
    label: 'Clientes',
    permissions: ['customers:view', 'customers:create', 'customers:edit', 'customers:delete'],
  },
  tickets: {
    label: 'Tickets',
    permissions: ['tickets:view', 'tickets:create', 'tickets:edit', 'tickets:delete', 'tickets:assign'],
  },
  equipment: {
    label: 'Equipos',
    permissions: ['equipment:view', 'equipment:create', 'equipment:edit', 'equipment:delete'],
  },
  invoices: {
    label: 'Facturas',
    permissions: ['invoices:view', 'invoices:create', 'invoices:edit', 'invoices:delete'],
  },
  quotations: {
    label: 'Cotizaciones',
    permissions: ['quotations:view', 'quotations:create', 'quotations:edit', 'quotations:delete'],
  },
  'quotation-requests': {
    label: 'Solicitudes de Cotización',
    permissions: ['quotation-requests:view', 'quotation-requests:create', 'quotation-requests:manage'],
  },
  'service-orders': {
    label: 'Órdenes de Servicio',
    permissions: ['service-orders:view', 'service-orders:create', 'service-orders:edit', 'service-orders:delete'],
  },
  'service-reports': {
    label: 'Reportes',
    permissions: ['service-reports:view', 'service-reports:create', 'service-reports:edit', 'service-reports:delete'],
  },
  policies: {
    label: 'Pólizas',
    permissions: ['policies:view', 'policies:create', 'policies:edit', 'policies:delete'],
  },
  maintenance: {
    label: 'Mantenimientos',
    permissions: ['maintenance:view', 'maintenance:create', 'maintenance:edit', 'maintenance:delete'],
  },
  dashboard: {
    label: 'Dashboard',
    permissions: ['dashboard:view'],
  },
  notifications: {
    label: 'Notificaciones',
    permissions: ['notifications:view', 'notifications:manage'],
  },
  assets: {
    label: 'Activos QR',
    permissions: ['assets:view', 'assets:create', 'assets:edit', 'assets:delete'],
  },
  surveys: {
    label: 'Levantamientos',
    permissions: ['surveys:view', 'surveys:create', 'surveys:edit', 'surveys:delete'],
  },
  catalog: {
    label: 'Catálogo',
    permissions: ['catalog:view', 'catalog:create', 'catalog:edit', 'catalog:delete'],
  },
  subscriptions: {
    label: 'Suscripciones',
    permissions: ['subscriptions:view', 'subscriptions:manage'],
  },
  admin: {
    label: 'Administración',
    permissions: ['admin:panel', 'admin:users', 'admin:permissions', 'admin:spectate', 'admin:system'],
  },
  profile: {
    label: 'Perfil',
    permissions: ['profile:view', 'profile:edit'],
  },
  campaigns: {
    label: 'Campañas',
    permissions: ['campaigns:view', 'campaigns:create', 'campaigns:edit', 'campaigns:delete', 'campaigns:send'],
  },
  upload: {
    label: 'Archivos',
    permissions: ['upload:files'],
  },
  fleet: {
    label: 'Flotilla GPS',
    permissions: ['fleet:view', 'fleet:create', 'fleet:edit', 'fleet:delete'],
  },
  reports: {
    label: 'Reportes Ejecutivos',
    permissions: ['reports:view'],
  },
  dispatch: {
    label: 'Calendario',
    permissions: ['dispatch:view', 'dispatch:create', 'dispatch:edit'],
  },
  'regional-prices': {
    label: 'Precios por Estado',
    permissions: ['regional-prices:view'],
  },
};

export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionAction[]> = {
  ADMIN: [...ALL_PERMISSIONS],
  TECHNICIAN: [
    'customers:view', 'customers:edit',
    'equipment:view', 'equipment:edit',
    'tickets:view', 'tickets:create', 'tickets:edit',
    'service-orders:view', 'service-orders:create', 'service-orders:edit',
    'service-reports:view', 'service-reports:create', 'service-reports:edit',
    'policies:view',
    'maintenance:view', 'maintenance:create', 'maintenance:edit',
    'dashboard:view',
    'notifications:view',
    'assets:view',
    'surveys:view',
    'catalog:view',
    'profile:view', 'profile:edit',
    'upload:files',
  ],
  SALES: [
    'customers:view', 'customers:create', 'customers:edit',
    'equipment:view',
    'tickets:view', 'tickets:create',
    'quotations:view', 'quotations:create', 'quotations:edit',
    'quotation-requests:view', 'quotation-requests:create', 'quotation-requests:manage',
    'service-orders:view',
    'policies:view', 'policies:create', 'policies:edit',
    'maintenance:view',
    'dashboard:view',
    'notifications:view',
    'catalog:view',
    'campaigns:view', 'campaigns:create', 'campaigns:edit', 'campaigns:send',
    'profile:view', 'profile:edit',
    'upload:files',
  ],
  PROYECTOS: [
    'customers:view',
    'equipment:view',
    'tickets:view', 'tickets:assign',
    'quotations:view',
    'surveys:view', 'surveys:create', 'surveys:edit', 'surveys:delete',
    'dashboard:view',
    'profile:view', 'profile:edit',
    'upload:files',
  ],
  COMPRAS: [
    'catalog:view', 'catalog:create', 'catalog:edit',
    'profile:view', 'profile:edit',
  ],
  CLIENT: [
    'tickets:view', 'tickets:create',
    'service-orders:view',
    'quotations:view',
    'quotation-requests:view', 'quotation-requests:create',
    'equipment:view',
    'invoices:view',
    'catalog:view',
    'profile:view', 'profile:edit',
    'notifications:view',
  ],
};

export const LABELS: Record<string, string> = {
  'users:view': 'Ver usuarios',
  'users:create': 'Crear usuarios',
  'users:edit': 'Editar usuarios',
  'users:delete': 'Eliminar usuarios',
  'customers:view': 'Ver clientes',
  'customers:create': 'Crear clientes',
  'customers:edit': 'Editar clientes',
  'customers:delete': 'Eliminar clientes',
  'tickets:view': 'Ver tickets',
  'tickets:create': 'Crear tickets',
  'tickets:edit': 'Editar tickets',
  'tickets:delete': 'Eliminar tickets',
  'tickets:assign': 'Asignar tickets',
  'equipment:view': 'Ver equipos',
  'equipment:create': 'Crear equipos',
  'equipment:edit': 'Editar equipos',
  'equipment:delete': 'Eliminar equipos',
  'invoices:view': 'Ver facturas',
  'invoices:create': 'Crear facturas',
  'invoices:edit': 'Editar facturas',
  'invoices:delete': 'Eliminar facturas',
  'quotations:view': 'Ver cotizaciones',
  'quotations:create': 'Crear cotizaciones',
  'quotations:edit': 'Editar cotizaciones',
  'quotations:delete': 'Eliminar cotizaciones',
  'quotation-requests:view': 'Ver solicitudes de cotización',
  'quotation-requests:create': 'Crear solicitudes de cotización',
  'quotation-requests:manage': 'Gestionar solicitudes de cotización',
  'service-orders:view': 'Ver órdenes de servicio',
  'service-orders:create': 'Crear órdenes de servicio',
  'service-orders:edit': 'Editar órdenes de servicio',
  'service-orders:delete': 'Eliminar órdenes de servicio',
  'service-reports:view': 'Ver reportes',
  'service-reports:create': 'Crear reportes',
  'service-reports:edit': 'Editar reportes',
  'service-reports:delete': 'Eliminar reportes',
  'policies:view': 'Ver pólizas',
  'policies:create': 'Crear pólizas',
  'policies:edit': 'Editar pólizas',
  'policies:delete': 'Eliminar pólizas',
  'maintenance:view': 'Ver mantenimientos',
  'maintenance:create': 'Crear mantenimientos',
  'maintenance:edit': 'Editar mantenimientos',
  'maintenance:delete': 'Eliminar mantenimientos',
  'dashboard:view': 'Ver dashboard',
  'notifications:view': 'Ver notificaciones',
  'notifications:manage': 'Gestionar notificaciones',
  'assets:view': 'Ver activos',
  'assets:create': 'Crear activos',
  'assets:edit': 'Editar activos',
  'assets:delete': 'Eliminar activos',
  'surveys:view': 'Ver levantamientos',
  'surveys:create': 'Crear levantamientos',
  'surveys:edit': 'Editar levantamientos',
  'surveys:delete': 'Eliminar levantamientos',
  'catalog:view': 'Ver catálogo',
  'catalog:create': 'Crear en catálogo',
  'catalog:edit': 'Editar catálogo',
  'catalog:delete': 'Eliminar del catálogo',
  'subscriptions:view': 'Ver suscripciones',
  'subscriptions:manage': 'Gestionar suscripciones',
  'admin:panel': 'Panel de administración',
  'admin:users': 'Gestionar usuarios',
  'admin:permissions': 'Gestionar permisos',
  'admin:spectate': 'Modo espectador',
  'admin:system': 'Administrar sistema',
  'profile:view': 'Ver perfil',
  'profile:edit': 'Editar perfil',
  'campaigns:view': 'Ver campañas',
  'campaigns:create': 'Crear campañas',
  'campaigns:edit': 'Editar campañas',
  'campaigns:delete': 'Eliminar campañas',
  'campaigns:send': 'Enviar campañas',
  'upload:files': 'Subir archivos',
  'fleet:view': 'Ver flotilla GPS',
  'fleet:create': 'Agregar vehículos',
  'fleet:edit': 'Editar vehículos',
  'fleet:delete': 'Eliminar vehículos',
  'reports:view': 'Ver reportes ejecutivos',
  'dispatch:view': 'Ver calendario',
  'dispatch:create': 'Crear eventos',
  'dispatch:edit': 'Editar eventos',
  'regional-prices:view': 'Ver precios por estado',
};

export function hasPermission(role: string, permission: PermissionAction, customPermissions?: Record<string, boolean>): boolean {
  if (customPermissions && permission in customPermissions) {
    return customPermissions[permission];
  }
  const defaults = DEFAULT_ROLE_PERMISSIONS[role];
  if (!defaults) return false;
  return defaults.includes(permission);
}

export function getPermissionsForRole(role: string): PermissionAction[] {
  return DEFAULT_ROLE_PERMISSIONS[role] || [];
}
