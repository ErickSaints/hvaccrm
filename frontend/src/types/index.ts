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

export interface HvacReadings {
  ampsR1?: number;
  ampsR2?: number;
  ampsR3?: number;
  voltsSupply?: number;
  suctionPressure?: number;
  dischargePressure?: number;
  suctionTemp?: number;
  liquidLineTemp?: number;
  superheat?: number;
  subcooling?: number;
  supplyTemp?: number;
  returnTemp?: number;
  deltaT?: number;
  gasManifoldPressure?: number;
  gasInletPressure?: number;
  notes?: string;
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
  hvacReadings?: HvacReadings;
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

export interface Invoice {
  id: number;
  number: string;
  title: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'BORRADOR' | 'EMITIDA' | 'PAGADA' | 'CANCELADA' | 'VENCIDA';
  notes?: string;
  dueDate?: string;
  paidAt?: string;
  customerId: number;
  customer?: Customer;
  quotationId?: number;
  quotation?: Quotation;
  serviceOrderId?: number;
  serviceOrder?: ServiceOrder;
  createdById: number;
  createdBy?: User;
  createdAt: string;
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

export interface InventoryItem {
  id: number;
  code: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  minStock: number;
  currentStock: number;
  unitPrice: number;
  location?: string;
  active: boolean;
  branchId?: number;
  branch?: { id: number; name: string };
  movements?: InventoryMovement[];
  createdAt: string;
}

export interface InventoryMovement {
  id: number;
  type: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'TRANSFERENCIA';
  quantity: number;
  unitPrice?: number;
  total?: number;
  reference?: string;
  notes?: string;
  itemId: number;
  branchId?: number;
  branch?: { id: number; name: string };
  performedById?: number;
  performedBy?: { id: number; name: string };
  serviceOrderId?: number;
  reportId?: number;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ReportsSummary {
  summary: {
    totalCustomers: number;
    activeTickets: number;
    pendingOrders: number;
    activePolicies: number;
    periodQuotations: number;
    periodCompletedOrders: number;
    totalEquipment: number;
    periodRevenue: number;
    invoicesPaid: number;
    totalUsers: number;
    technicians: number;
    approvalRate: number;
    completionRate: number;
  };
  monthlyRevenue: { month: string; revenue: number; orders: number; quotations: number }[];
  ticketTrends: { month: string; creados: number; resueltos: number }[];
  ticketsByStatus: { name: string; value: number }[];
  ticketsByLevel: { name: string; value: number }[];
  quotationsByStatus: { name: string; value: number }[];
  ordersByStatus: { name: string; value: number }[];
  technicianPerformance: { name: string; completadas: number; pendientes: number; abiertos: number; ingresos: number }[];
  topCustomers: { id: number; name: string; totalSpent: number; orderCount: number }[];
}

export interface MLPrediction {
  equipmentId: number;
  equipmentType: string;
  equipmentBrand?: string;
  equipmentModel?: string;
  lastService?: string;
  failureProbability: number;
  estimatedDaysToFailure: number;
  riskLevel: 'BAJO' | 'MEDIO' | 'ALTO';
  recommendedAction: string;
  nextServiceRecommended: string;
}

export interface MLPredictionsResponse {
  generatedAt: string;
  total: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  predictions: MLPrediction[];
}
