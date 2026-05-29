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
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  level: 'EMERGENCIA' | 'ATENCION' | 'PROGRAMAR';
  status: 'ABIERTO' | 'EN_PROCESO' | 'RESUELTO' | 'CERRADO';
  customerId: number;
  assignedTo?: number;
  createdAt: string;
}

export interface ServiceOrder {
  id: number;
  number: string;
  description?: string;
  status: 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADO' | 'CANCELADO';
  scheduledDate?: string;
  completedAt?: string;
  diagnosis?: string;
  workPerformed?: string;
  recommendations?: string;
  customerId: number;
  customer?: Customer;
  assignedTo?: number;
  assignedUser?: User;
  ticketId?: number;
  inventoryMovements?: any[];
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
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
  createdAt: string;
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
  notes?: string;
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
  cfdiUuid?: string;
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

export interface Asset {
  id: number;
  name: string;
  description?: string;
  serialNumber?: string;
  location?: string;
  qrCode?: string;
  customerId: number;
  customer?: Customer;
  createdAt: string;
}

export interface FleetLocation {
  id: number;
  lat: number;
  lng: number;
  userId: number;
  speed?: number;
  createdAt: string;
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
  createdAt: string;
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
  createdAt: string;
}

export interface Survey {
  id: number;
  title: string;
  description?: string;
  status: string;
  location?: string;
  customerId: number;
  customer?: Customer;
  createdById: number;
  createdBy?: User;
  photos?: SurveyPhoto[];
  materials?: SurveyMaterial[];
  createdAt: string;
}

export interface SurveyPhoto {
  id: number;
  url: string;
  caption?: string;
}

export interface SurveyMaterial {
  id: number;
  description: string;
  quantity: number;
  unit: string;
  category?: string;
  notes?: string;
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
  performedById?: number;
  performedBy?: { id: number; name: string };
  serviceOrderId?: number;
  reportId?: number;
  createdAt: string;
}

export interface Refaccion {
  id: number;
  name: string;
  description?: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category?: string;
}

export interface PricebookItem {
  id: number;
  name: string;
  description?: string;
  sku?: string;
  unit: string;
  categoryId?: number;
  categoryName?: string;
  goodPrice?: number;
  betterPrice?: number;
  bestPrice?: number;
  costPrice?: number;
  supplier?: string;
  active: boolean;
  createdAt: string;
}

export interface Campaign {
  id: number;
  name: string;
  description?: string;
  type: string;
  status: string;
  subject?: string;
  sentCount: number;
  openRate?: number;
  clickedCount: number;
  revenueAttributed: number;
  scheduledAt?: string;
  sentAt?: string;
  createdById: number;
  createdBy?: User;
  createdAt: string;
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

export interface Warranty {
  id: number;
  type: string;
  description?: string;
  startDate: string;
  endDate: string;
  terms?: string;
  notes?: string;
  equipmentId: number;
  equipment?: Equipment;
  serviceOrderId?: number;
  serviceOrder?: ServiceOrder;
  createdAt: string;
}

export interface Review {
  id: number;
  rating: number;
  comment?: string;
  source: string;
  customerId: number;
  customer?: Customer;
  serviceOrderId?: number;
  serviceOrder?: ServiceOrder;
  createdAt: string;
}

export interface PurchaseOrder {
  id: number;
  number: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  orderedAt?: string;
  receivedAt?: string;
  vendorId: number;
  vendor?: Vendor;
  createdById: number;
  createdBy?: User;
  branchId?: number;
  items?: PurchaseOrderItem[];
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  receivedQty: number;
  inventoryItemId?: number;
}

export interface Vendor {
  id: number;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  active: boolean;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  description?: string;
  price: number;
  duration: string;
  durationDays: number;
  features?: string;
  targetRole: string;
  active: boolean;
  createdById: number;
  createdAt: string;
}

export interface Subscription {
  id: number;
  startDate: string;
  endDate: string;
  status: string;
  autoRenew: boolean;
  paymentMethod?: string;
  paymentRef?: string;
  userId: number;
  user?: User;
  planId: number;
  plan?: SubscriptionPlan;
  createdAt: string;
}
