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
