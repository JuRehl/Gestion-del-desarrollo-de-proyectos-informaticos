export interface Building {
  id: number;
  nombre: string;
  direccion: string;
  propietario?: UserSummary;
  cantidadDepartamentos: number;
  cantidadInquilinos: number;
  expensasBase: number;
  gastosExtra?: number;
}

export interface UserSummary {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

export interface Tenant {
  id: string;
  userId?: number;
  buildingId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  floor: string;
  apartmentNumber: string;
  contractExpirationDate: string;
  paymentDayOfMonth: number;
  rentAmount: number;
  departmentPercentage: number;
  activo?: boolean; 
}

export interface Expense {
  id: string | number;
  buildingId: string;
  type: string;
  amount: number;
  description: string;
  date: string;
  receiptFileName?: string;
  receiptUrl?: string;
}

export interface NewExpenseInput {
  buildingId: string;
  type: string;
  amount: number;
  description: string;
  receiptFile: File;
}

export interface Payment {
  id: string;
  tenantId: string;
  buildingId: string;
  amount: number;
  month: string; // formato: "YYYY-MM"
  date: string;
  isPaid: boolean;
  status?: 'PENDIENTE' | 'PARCIAL' | 'PAGADO';
  remainingBalance?: number;
  applicationDetail?: string;
}