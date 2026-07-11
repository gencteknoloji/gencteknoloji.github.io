export interface Product {
  id: string;
  type: string;
  barcode: string | null;
  name: string;
  imei: string | null;
  category: string;
  stock: number;
  purchase_price: number;
  sale_price: number;
  kdv_ratio: number;
}

export interface Cari {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  balance: number;
  cari_type: string;
  tax_office: string;
  tax_number: string;
  tc_number: string;
}

export interface SaleItem {
  id?: number;
  sale_id?: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Sale {
  id: string;
  date: string;
  cari_id: string;
  total_amount: number;
  payment_method: string;
  notes: string;
  items?: SaleItem[];
  cari_name?: string;
}

export interface CariTransaction {
  id: string;
  cari_id: string;
  date: string;
  type: string;
  amount: number;
  description: string;
  items?: SaleItem[];
  payment_method?: string;
  total_amount?: number;
}

export interface TurkcellPremium {
  id: string;
  date: string;
  description: string;
  amount: number;
  notes: string;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  notes: string;
}

export interface TurkcellDevice {
  id: string;
  device_name: string;
  imei: string;
  purchase_price: number;
  sale_price: number;
  status: string;
  date_added: string;
  notes: string;
  kdv_ratio: number;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: string;
  permissions: string[];
}

export interface DailyClosing {
  id?: string;
  date: string;
  cash_revenue: number;
  card_revenue: number;
  kontor_sales: number;
  fatura_payments: number;
  today_expenses: number;
  expected_cash: number;
  physical_cash: number;
  physical_card: number;
  physical_eft: number;
  cash_diff: number;
  card_diff: number;
  eft_diff: number;
  eft_revenue: number;
}

export interface DashboardMetrics {
  todaySales: number;
  weekSales: number;
  monthSales: number;
  totalCariReceivables: number;
  criticalStockCount: number;
  totalSalesCount: number;
  totalTurkcellProfit: number;
  totalExpenses: number;
  totalCihazProfit: number;
  totalAksesuarProfit: number;
}

export interface ChartPoint {
  date?: string;
  day?: number;
  month?: string;
  amount: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  weeklyChart: ChartPoint[];
  monthlyChart: ChartPoint[];
  serverIp: string;
}

export interface SqlRunResult {
  changes: number;
  lastID: number | null;
}

export interface DbMock {
  all<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  get<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | null>;
  run(sql: string, params?: unknown[]): Promise<SqlRunResult>;
  exec?(sql: string): Promise<void>;
}

export type EditableProduct = Omit<Product, 'stock' | 'purchase_price' | 'sale_price' | 'kdv_ratio'> & {
  stock: string | number;
  purchase_price: string | number;
  sale_price: string | number;
  kdv_ratio: string | number;
};

export type EditableTurkcellPremium = Omit<TurkcellPremium, 'amount'> & { amount: string | number };

export type EditableTurkcellDevice = Omit<TurkcellDevice, 'purchase_price' | 'sale_price' | 'kdv_ratio'> & {
  purchase_price: string | number;
  sale_price: string | number;
  kdv_ratio: string | number;
};

export type EditableExpense = Omit<Expense, 'amount'> & { amount: string | number };

export interface AuthUser {
  id: string;
  username: string;
  role: string;
  permissions: string[];
}

export interface ToastState {
  show: boolean;
  message: string;
  type: string;
}

export interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: (() => void) | null;
  isDanger: boolean;
}

export interface SaleCartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ManualItemForm {
  name: string;
  price: string;
  quantity?: string;
}

export interface ProductForm {
  type: string;
  name: string;
  barcode: string;
  imei: string;
  category: string;
  stock: string;
  purchase_price: string;
  sale_price: string;
  kdv_ratio: string;
}

export interface CariForm {
  cari_type: string;
  name: string;
  phone: string;
  email: string;
  balance: string;
  tax_office: string;
  tax_number: string;
  tc_number: string;
  address: string;
}

export interface TurkcellForm {
  date: string;
  description: string;
  amount: string;
  notes: string;
}

export interface TurkcellDeviceForm {
  device_name: string;
  imei: string;
  purchase_price: string;
  sale_price: string;
  status: string;
  notes: string;
  kdv_ratio: string;
}

export interface ExpenseForm {
  date: string;
  description: string;
  amount: string;
  notes: string;
}

export interface EditingSaleItem {
  saleId: string;
  item: SaleItem;
}

export type CariInput = {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  balance?: string | number;
  cari_type?: string;
  tax_office?: string;
  tax_number?: string;
  tc_number?: string;
};

export type SaleInput = {
  date?: string;
  cari_id?: string;
  total_amount?: string | number;
  payment_method?: string;
  notes?: string;
  items: SaleItem[];
};
export type TurkcellPremiumInput = {
  date: string;
  description: string;
  amount?: string | number;
  notes?: string;
};

export type ExpenseInput = {
  date: string;
  description: string;
  amount?: string | number;
  notes?: string;
};

export type TurkcellDeviceInput = {
  device_name: string;
  imei: string;
  purchase_price?: string | number;
  sale_price?: string | number;
  status?: string;
  notes?: string;
  kdv_ratio?: string | number;
};

export type ProductInput = {
  type?: string;
  barcode?: string | null;
  name: string;
  imei?: string | null;
  category?: string;
  stock?: string | number;
  purchase_price?: string | number;
  sale_price?: string | number;
  kdv_ratio?: string | number;
};
