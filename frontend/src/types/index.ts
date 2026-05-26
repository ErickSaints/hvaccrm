export interface User {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'TECHNICIAN' | 'SALES' | 'CLIENT' | 'PROYECTOS' | 'COMPRAS';
  phone?: string;
  avatar?: string;
  active: boolean;
  isSuperAdmin?: boolean;
}

export interface PermissionInfo {
  defaults: Record<string, string[]>;
  overrides: Record<string, string[]>;
  allPermissions: string[];
  categories: Record<string, { label: string; permissions: string[] }>;
  labels: Record<string, string>;
}

export interface Customer {
  id: number;
  companyName?: string;
  contactName: string;
  email?: string;
  phone: string;
  phone2?: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  taxId?: string;
  notes?: string;
  createdAt: string;
  equipment?: Equipment[];
}

export interface Equipment {
  id: number;
  type: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  capacity?: string;
  location?: string;
  installDate?: string;
  lastService?: string;
  notes?: string;
  customerId: number;
  customer?: Customer;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  level: 'EMERGENCIA' | 'ATENCION' | 'PROGRAMAR';
  status: 'ABIERTO' | 'EN_PROCESO' | 'RESUELTO' | 'CERRADO';
  resolution?: string;
  customerId: number;
  customer?: Customer;
  equipmentId?: number;
  equipment?: Equipment;
  assignedTo?: number;
  assignedUser?: User;
  serviceOrders?: ServiceOrder[];
  createdAt: string;
}

export interface Quotation {
  id: number;
  number: string;
  title?: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'BORRADOR' | 'ENVIADA' | 'APROBADA' | 'RECHAZADA' | 'VENCIDA';
  validUntil?: string;
  notes?: string;
  terms?: string;
  customerId: number;
  customer?: Customer;
  createdById: number;
  createdBy?: User;
  items?: QuotationItem[];
  createdAt: string;
}

export interface QuotationItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface MaintenancePolicy {
  id: number;
  number: string;
  name: string;
  description?: string;
  frequency: 'MENSUAL' | 'BIMESTRAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
  visitCount: number;
  pricePerVisit: number;
  totalPrice: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVA' | 'EXPIRADA' | 'CANCELADA';
  notes?: string;
  customerId: number;
  customer?: Customer;
  serviceOrders?: ServiceOrder[];
  maintenanceLogs?: MaintenanceLog[];
}

export interface ServiceOrder {
  id: number;
  number: string;
  description?: string;
  scheduledDate?: string;
  completedDate?: string;
  status: 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADO' | 'CANCELADO';
  laborHours?: number;
  materialsCost: number;
  laborCost: number;
  totalCost: number;
  notes?: string;
  customerId: number;
  customer?: Customer;
  equipmentId?: number;
  equipment?: Equipment;
  assignedTo?: number;
  assignedUser?: User;
  ticketId?: number;
  ticket?: Ticket;
  policyId?: number;
  policy?: MaintenancePolicy;
  report?: ServiceReport;
  photos?: Photo[];
}

export interface ServiceReport {
  id: number;
  title: string;
  description?: string;
  diagnosis?: string;
  workPerformed?: string;
  recommendations?: string;
  arrivalTime?: string;
  departureTime?: string;
  signature?: string;
  serviceOrderId: number;
  serviceOrder?: ServiceOrder;
  technicianId: number;
  technician?: User;
  customerId: number;
  customer?: Customer;
  equipmentId?: number;
  equipment?: Equipment;
  photos?: Photo[];
  usedMaterials?: UsedMaterial[];
}

export interface Photo {
  id: number;
  url: string;
  caption?: string;
  type?: string;
}

export interface UsedMaterial {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface MaintenanceLog {
  id: number;
  description: string;
  scheduledDate: string;
  completedDate?: string;
  status: string;
  notes?: string;
  policyId: number;
  policy?: MaintenancePolicy;
  equipmentId?: number;
  equipment?: Equipment;
  assignedTo?: number;
  assignedUser?: User;
}

export interface DashboardStats {
  totalCustomers: number;
  activeTickets: number;
  pendingOrders: number;
  activePolicies: number;
  monthlyQuotations: number;
  totalUsers: number;
  technicians: number;
  completedOrdersThisMonth: number;
  totalEquipment: number;
}

export interface ChartData {
  monthlyRevenue: { month: string; revenue: number; orders: number }[];
  ticketTrends: { month: string; creados: number; resueltos: number }[];
  ticketsByLevel: { name: string; value: number }[];
  ticketsByStatus: { name: string; value: number }[];
  technicianPerformance: { name: string; completadas: number; pendientes: number }[];
}
