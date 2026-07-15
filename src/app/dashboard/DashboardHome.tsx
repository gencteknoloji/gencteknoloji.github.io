"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, 
  Users, 
  Package, 
  CreditCard, 
  Plus, 
  Barcode, 
  Search, 
  TrendingUp, 
  Trash2,
  Printer,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  UserCheck,
  ArrowRightLeft,
  Coins,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Smartphone,
  Tablet,
  Laptop,
  Headphones,
  X,
  Menu,
  Calendar,
  Edit2,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { dbService } from '@/services/db';
import { LoadingScreen } from '@/components/LoadingScreen';
import { getErrorMessage } from '@/lib/utils/error';
import { toInt, toNum } from '@/lib/utils/numbers';
import type {
  AuthUser,
  Cari,
  CariForm,
  CariTransaction,
  ChartPoint,
  ConfirmModalState,
  DailyClosing,
  DashboardMetrics,
  EditingSaleItem,
  Expense,
  ExpenseForm,
  ManualItemForm,
  Product,
  ProductForm,
  EditableProduct,
  EditableTurkcellDevice,
  EditableTurkcellPremium,
  Sale,
  SaleCartItem,
  ToastState,
  TurkcellDevice,
  TurkcellDeviceForm,
  TurkcellForm,
  TurkcellPremium,
  User,
} from '@/types/database';

const code39Dict: Record<string, string> = {
  '0': '101001101101', '1': '110100101011', '2': '101100101011', '3': '110110010101',
  '4': '101001101011', '5': '110100110101', '6': '101100110101', '7': '101001011011',
  '8': '110100101101', '9': '101100101101', 'A': '110101001011', 'B': '101101001011',
  'C': '110110100101', 'D': '101011001011', 'E': '110101100101', 'F': '101101100101',
  'G': '101010011011', 'H': '110101001101', 'I': '101101001101', 'J': '101011001101',
  'K': '110101010011', 'L': '101101010011', 'M': '110110101001', 'N': '101011010011',
  'O': '110101101001', 'P': '101101101001', 'Q': '101010110011', 'R': '110101011001',
  'S': '101101011001', 'T': '101011011001', 'U': '110010101011', 'V': '100110101011',
  'W': '110011010101', 'X': '100101101011', 'Y': '110010110101', 'Z': '100110110101',
  '-': '100101011011', '.': '110010101101', ' ': '100110101101', '*': '100101101101'
};

function BarcodeSVG({ value }: { value: string }) {
  const cleanVal = (value || '').toUpperCase().replace(/[^0-9A-Z\-\.\s]/g, '');
  const barcodeText = `*${cleanVal}*`;
  
  let pattern = '';
  for (let i = 0; i < barcodeText.length; i++) {
    const char = barcodeText[i];
    const charPattern = code39Dict[char] || code39Dict[' '];
    pattern += charPattern + '0'; // 0 is narrow spacing between chars
  }

  const barWidth = 2;
  const height = 60;
  const bars: React.ReactElement[] = [];
  
  for (let idx = 0; idx < pattern.length; idx++) {
    if (pattern[idx] === '1') {
      bars.push(
        <rect 
          key={idx} 
          x={idx * barWidth} 
          y={0} 
          width={barWidth} 
          height={height} 
          fill="black" 
        />
      );
    }
  }

  const totalWidth = pattern.length * barWidth;

  return (
    <div className="flex flex-col items-center bg-white p-2 rounded">
      <svg width={totalWidth} height={height} viewBox={`0 0 ${totalWidth} ${height}`}>
        {bars}
      </svg>
      <span className="text-[10px] font-mono text-black mt-1 tracking-widest">{cleanVal}</span>
    </div>
  );
}

const normalizeString = (str: unknown) => {
  if (!str) return '';
  let lower = '';
  try {
    lower = str.toString().toLocaleLowerCase('tr-TR');
  } catch (e: unknown) {
    lower = str.toString().toLowerCase();
  }
  return lower
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .toLowerCase();
};

const ALL_TABS = [
  { key: 'sales', label: 'Satış Kasa' },
  { key: 'gun_sonu', label: 'Gün Sonu' },
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'history', label: 'Satış Geçmişi' },
  { key: 'products', label: 'Stok Kartları' },
  { key: 'turkcell_stock', label: 'Turkcell Cihaz Stok' },
  { key: 'cariler', label: 'Müşteri Hesaplar' },
  { key: 'debt', label: 'Müşteri Borç Takibi' },
  { key: 'reports', label: 'Satış Analizi' },
  { key: 'turkcell', label: 'Turkcell Prim' }
];

type SidebarNavItem = {
  key: string;
  label: string;
  icon: typeof CreditCard;
  adminOnly?: boolean;
  highlight?: boolean;
};

const SIDEBAR_GROUPS: { title: string; items: SidebarNavItem[]; accent?: 'turkcell' }[] = [
  {
    title: 'Satış & Kasa',
    items: [
      { key: 'sales', label: 'Kasa / Satış', icon: CreditCard },
      { key: 'gun_sonu', label: 'Gün Sonu', icon: Calendar },
    ],
  },
  {
    title: 'Analiz & Rapor',
    items: [
      { key: 'reports', label: 'Satış Analizi', icon: TrendingUp },
      { key: 'history', label: 'Satış Geçmişi', icon: ArrowRightLeft },
    ],
  },
  {
    title: 'Stok',
    items: [
      { key: 'products', label: 'Stok Kartları', icon: Package },
    ],
  },
  {
    title: 'Müşteri',
    items: [
      { key: 'cariler', label: 'Müşteri Hesaplar', icon: Users },
      { key: 'debt', label: 'Müşteri Borç Takibi', icon: UserCheck },
    ],
  },
  {
    title: 'Turkcell',
    accent: 'turkcell',
    items: [
      { key: 'turkcell_stock', label: 'Turkcell Cihaz Stok', icon: Tablet },
      { key: 'turkcell', label: 'Turkcell Prim', icon: Smartphone },
    ],
  },
  {
    title: 'Yönetim',
    items: [
      { key: 'users', label: 'Kullanıcı Yetkileri', icon: Users, adminOnly: true, highlight: true },
    ],
  },
];

const renderLineChart = (data: ChartPoint[], type: 'weekly' | 'monthly') => {
  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-secondary text-xs">Veri bulunmamaktadır.</div>;
  }
  const maxVal = Math.max(...data.map(x => x.amount)) || 1;
  
  // SVG Dimensions
  const width = 500;
  const height = 150;
  const paddingLeft = 20;
  const paddingRight = 20;
  const paddingTop = 15;
  const paddingBottom = 15;
  
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  
  // Generate points
  const points = data.map((item, idx) => {
    const x = paddingLeft + (data.length > 1 ? (idx / (data.length - 1)) * chartWidth : 0);
    const y = height - paddingBottom - (item.amount / maxVal) * chartHeight;
    return { x, y, item, idx };
  });
  
  // Create path strings
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z` 
    : '';
  
  const strokeColor = type === 'weekly' ? '#818cf8' : '#a78bfa'; // indigo-400 vs violet-400
  const fillColorId = `grad-${type}`;
  
  return (
    <div className="relative w-full pt-2 pb-6">
      <div className="h-40 w-full relative">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="none" className="overflow-visible">
          <defs>
            <linearGradient id={fillColorId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingTop + ratio * chartHeight;
            return (
              <line 
                key={i} 
                x1={paddingLeft} 
                y1={y} 
                x2={width - paddingRight} 
                y2={y} 
                stroke="white" 
                strokeOpacity="0.05" 
                strokeDasharray="3 3" 
              />
            );
          })}
          
          {/* Area fill */}
          {areaPath && <path d={areaPath} fill={`url(#${fillColorId})`} />}
          
          {/* Line stroke */}
          {linePath && <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
          
          {/* Connection circles */}
          {points.map((p) => (
            <circle
              key={p.idx}
              cx={p.x}
              cy={p.y}
              r="4"
              fill={strokeColor}
              stroke="#1e1b4b"
              strokeWidth="1.5"
              className="transition-all duration-150 pointer-events-none opacity-0"
              id={`circle-${type}-${p.idx}`}
              style={{ transition: 'opacity 0.15s ease, r 0.15s ease' }}
            />
          ))}
        </svg>
        
        {/* Interactive hover overlay columns */}
        <div className="absolute inset-0 flex justify-between" style={{ paddingLeft: `${paddingLeft}px`, paddingRight: `${paddingRight}px` }}>
          {points.map((p) => {
            const label = type === 'weekly' ? p.item.date : (p.item.date || `${p.item.day}. Gün`);
            const heightPct = (p.item.amount / maxVal) * 85;
            
            return (
              <div 
                key={p.idx} 
                className="flex-1 flex flex-col items-center justify-end relative group cursor-pointer"
                onMouseEnter={() => {
                  const circle = document.getElementById(`circle-${type}-${p.idx}`);
                  if (circle) {
                    circle.setAttribute('r', '6');
                    circle.style.opacity = '1';
                  }
                }}
                onMouseLeave={() => {
                  const circle = document.getElementById(`circle-${type}-${p.idx}`);
                  if (circle) {
                    circle.setAttribute('r', '4');
                    circle.style.opacity = '0';
                  }
                }}
              >
                {/* Tooltip */}
                <div 
                  className="absolute opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none bg-slate-950/95 border border-white/10 px-2 py-1 rounded-md shadow-xl text-center z-20 font-mono text-[9px] text-white whitespace-nowrap scale-95 group-hover:scale-100"
                  style={{ 
                    bottom: `${Math.min(95, Math.max(12, heightPct + 8))}%`,
                    left: '50%',
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="font-bold">{p.item.amount.toLocaleString('tr-TR')} TL</div>
                  <div className="text-[7px] text-slate-400 mt-0.5">{label}</div>
                </div>
                
                {/* Vertical dotted hover line */}
                <div className="w-[1px] h-full border-l border-dashed border-white/10 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-0 pointer-events-none"></div>
                
                {/* Bottom label */}
                {(type === 'weekly' || p.idx % 5 === 0 || p.idx === points.length - 1) && (
                  <span className="text-[9px] text-slate-400 absolute -bottom-6 transform translate-y-1 font-semibold whitespace-nowrap font-sans pointer-events-none">
                    {label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default function DashboardHome() {
  // Navigation
  const [activeTab, setActiveTab] = useState('sales'); // Default Tab: Satış Kasa
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem('erp_sidebar_collapsed') === '1') {
        setSidebarCollapsed(true);
      }
    } catch {
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('erp_sidebar_collapsed', next ? '1' : '0');
      } catch {
      }
      return next;
    });
  };

  // CUSTOM TOAST NOTIFICATION STATE & SHADOW ALERT FUNCTION
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });

  const alert = (msg: string) => {
    let type = 'success';
    const lower = (msg || '').toLowerCase();
    if (lower.includes('hata') || lower.includes('failed') || lower.includes('başarısız') || lower.includes('zorunludur') || lower.includes('boş') || lower.includes('bulunamadı') || lower.includes('zaten')) {
      type = 'danger';
    } else if (lower.includes('silindi') || lower.includes('iptal') || lower.includes('kaldırıldı') || lower.includes('çıkış')) {
      type = 'warning';
    }
    setToast({ show: true, message: msg, type });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // CUSTOM CONFIRMATION STATE
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isDanger: true
  });

  const triggerConfirm = (title: string, message: string, onConfirm: () => void, isDanger = true) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      isDanger
    });
  };

  // PAGINATION STATES
  const [pageCari, setPageCari] = useState(1);
  const [pageDebt, setPageDebt] = useState(1);
  const [pageTcellStock, setPageTcellStock] = useState(1);
  const [pagePremium, setPagePremium] = useState(1);
  const [pageHistory, setPageHistory] = useState(1);
  const [pageCariTx, setPageCariTx] = useState(1);
  const [pageUsers, setPageUsers] = useState(1);
  const [pageReportDevice, setPageReportDevice] = useState(1);
  const [pageReportOther, setPageReportOther] = useState(1);
  
  // Products tab per-category page states
  const [pageProdDevice, setPageProdDevice] = useState(1);
  const [pageProdKilif, setPageProdKilif] = useState(1);
  const [pageProdCam, setPageProdCam] = useState(1);
  const [pageProdSarj, setPageProdSarj] = useState(1);
  const [pageProdKulaklik, setPageProdKulaklik] = useState(1);
  const [pageProdDiger, setPageProdDiger] = useState(1);

  const renderPagination = (currentPage: number, totalItems: number, onPageChange: (page: number) => void, pageSize = 10) => {
    const totalPages = Math.ceil(totalItems / pageSize);
    if (totalPages <= 1) return null;

    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4 px-4 py-3 bg-white/2 border-t border-white/5 rounded-b-lg text-xs">
        <span className="text-secondary text-[10px] sm:text-xs leading-snug">
          Toplam <strong>{totalItems}</strong> kayıttan <strong>{(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)}</strong> arası gösteriliyor
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="px-2.5 py-1.5 rounded bg-white/2 hover:bg-white/5 border border-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-[10px] font-semibold text-white"
          >
            Önceki
          </button>
          <span className="text-white px-2 font-medium">Sayfa {currentPage} / {totalPages}</span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="px-2.5 py-1.5 rounded bg-white/2 hover:bg-white/5 border border-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-[10px] font-semibold text-white"
          >
            Sonraki
          </button>
        </div>
      </div>
    );
  };

  // --- USER AUTH STATES ---
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // --- USER MANAGEMENT STATES ---
  const [usersList, setUsersList] = useState<User[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [editUserData, setEditUserData] = useState<User | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('Staff');
  const [newUserPermissions, setNewUserPermissions] = useState<string[]>([]);
  const [editUserPassword, setEditUserPassword] = useState('');
  
  // Data State
  const [customers, setCustomers] = useState<Cari[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    todaySales: 0,
    weekSales: 0,
    monthSales: 0,
    totalCariReceivables: 0,
    criticalStockCount: 0,
    totalSalesCount: 0,
    totalTurkcellProfit: 0,
    totalExpenses: 0,
    totalCihazProfit: 0,
    totalAksesuarProfit: 0,
  });
  const [weeklyChart, setWeeklyChart] = useState<ChartPoint[]>([]);
  const [monthlyChart, setMonthlyChart] = useState<ChartPoint[]>([]);
  const [reportSubTab, setReportSubTab] = useState<'analiz' | 'detay'>('analiz');
  const [loading, setLoading] = useState(true);

  // KASA / SATIŞ STATE
  const [saleType, setSaleType] = useState('perakende'); // "perakende", "cari" veya "gider"
  const [saleItems, setSaleItems] = useState<SaleCartItem[]>([]);
  const [manualItem, setManualItem] = useState<ManualItemForm>({ name: '', price: '', quantity: '1' });
  const [selectedProductIdForManual, setSelectedProductIdForManual] = useState('manual');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedCariId, setSelectedCariId] = useState('pesin');
  const [paymentMethod, setPaymentMethod] = useState('Nakit');
  const [saleNotes, setSaleNotes] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toLocaleDateString('sv-SE'));

  // STOK STATE
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editProductData, setEditProductData] = useState<EditableProduct | null>(null);
  const [newProduct, setNewProduct] = useState<ProductForm>({ type: 'Diğer', name: '', barcode: '', imei: '', category: 'Telefon Kılıfı', stock: '', purchase_price: '', sale_price: '', kdv_ratio: '20' });
  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState<Product | null>(null);
  const [deviceFolderOpen, setDeviceFolderOpen] = useState(false);
  const [kiliffFolderOpen, setKiliffFolderOpen] = useState(false);
  const [camFolderOpen, setCamFolderOpen] = useState(false);
  const [sarjFolderOpen, setSarjFolderOpen] = useState(false);
  const [kulaklikFolderOpen, setKulaklikFolderOpen] = useState(false);
  const [digerFolderOpen, setDigerFolderOpen] = useState(false);
  const [physicalCash, setPhysicalCash] = useState('');
  const [physicalCard, setPhysicalCard] = useState('');
  const [kontorSales, setKontorSales] = useState('');
  const [faturaPayments, setFaturaPayments] = useState('');

  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReconciled, setIsReconciled] = useState(false);

  // Daily Closings & History States
  const [dailyClosingsList, setDailyClosingsList] = useState<DailyClosing[]>([]);
  const [editingClosing, setEditingClosing] = useState<DailyClosing | null>(null);
  const [showEditClosingModal, setShowEditClosingModal] = useState(false);
  const [editPhysicalCash, setEditPhysicalCash] = useState('');
  const [editPhysicalCard, setEditPhysicalCard] = useState('');
  const [editKontorSales, setEditKontorSales] = useState('');
  const [editFaturaPayments, setEditFaturaPayments] = useState('');
  const [pageDailyClosings, setPageDailyClosings] = useState(1);

  const pullDistanceRef = useRef(0);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    pullDistanceRef.current = pullDistance;
  }, [pullDistance]);

  useEffect(() => {
    isRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  // CARİ STATE
  const [showAddCari, setShowAddCari] = useState(false);
  const [showEditCari, setShowEditCari] = useState(false);
  const [editCariData, setEditCariData] = useState<Cari | null>(null);
  const [newCari, setNewCari] = useState<CariForm>({ cari_type: 'Bireysel', name: '', phone: '', email: '', balance: '', tax_office: '', tax_number: '', tc_number: '', address: '' });
  const [showCariDetails, setShowCariDetails] = useState<Cari | null>(null);
  const [cariTransactions, setCariTransactions] = useState<CariTransaction[]>([]);
  const [tahsilatAmount, setTahsilatAmount] = useState('');
  const [tahsilatDesc, setTahsilatDesc] = useState('');

  // DEBT TRACKING STATE
  const [selectedDebtCariId, setSelectedDebtCariId] = useState<string | null>(null);
  const [selectedCariTxList, setSelectedCariTxList] = useState<CariTransaction[]>([]);
  const [debtSearch, setDebtSearch] = useState('');
  const [editingTxId, setEditingTxId] = useState(null);
  const [editTxAmount, setEditTxAmount] = useState('');
  const [editTxDesc, setEditTxDesc] = useState('');
  const [editTxDate, setEditTxDate] = useState('');
  const [tahsilatDate, setTahsilatDate] = useState(new Date().toLocaleDateString('sv-SE'));
  const [debtActionType, setDebtActionType] = useState('tahsilat');

  // Sale Item Editing States
  const [editingSaleItem, setEditingSaleItem] = useState<EditingSaleItem | null>(null);
  const [showEditSaleItemModal, setShowEditSaleItemModal] = useState(false);
  const [editSaleItemPrice, setEditSaleItemPrice] = useState('');
  const [editSaleItemQuantity, setEditSaleItemQuantity] = useState('');

  // TURKCELL STATE
  const [turkcellPremiums, setTurkcellPremiums] = useState<TurkcellPremium[]>([]);
  const [showAddTurkcell, setShowAddTurkcell] = useState(false);
  const [showEditTurkcell, setShowEditTurkcell] = useState(false);
  const [editTurkcellData, setEditTurkcellData] = useState<EditableTurkcellPremium | null>(null);
  const [newTurkcell, setNewTurkcell] = useState<TurkcellForm>({ date: new Date().toLocaleDateString('sv-SE'), description: '', amount: '', notes: '' });
  const [turkcellSearch, setTurkcellSearch] = useState('');

  // TURKCELL DEVICE STOCK STATE
  const [turkcellStockList, setTurkcellStockList] = useState<TurkcellDevice[]>([]);
  const [showAddTcellDevice, setShowAddTcellDevice] = useState(false);
  const [showEditTcellDevice, setShowEditTcellDevice] = useState(false);
  const [editTcellDeviceData, setEditTcellDeviceData] = useState<EditableTurkcellDevice | null>(null);
  const [newTcellDevice, setNewTcellDevice] = useState<TurkcellDeviceForm>({ device_name: '', imei: '', purchase_price: '', sale_price: '', status: 'Stokta', notes: '', kdv_ratio: '20' });
  const [tcellDeviceSearch, setTcellDeviceSearch] = useState('');
  const [tcellStatusFilter, setTcellStatusFilter] = useState('Hepsi');

  // EXPENSE STATE
  const [expensesList, setExpensesList] = useState<Expense[]>([]);
  const [newExpense, setNewExpense] = useState<ExpenseForm>({ date: new Date().toLocaleDateString('sv-SE'), description: '', amount: '', notes: '', category: 'Genel Gider' });

  // NETWORK STATE
  const [serverIp, setServerIp] = useState('localhost');

  // HISTORY STATE
  const [historyDateFilter, setHistoryDateFilter] = useState(new Date().toLocaleDateString('sv-SE'));
  const [historyRangeFilter, setHistoryRangeFilter] = useState('today');
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  // REPORT STATE
  const [reportRangeFilter, setReportRangeFilter] = useState('month');
  const [reportDateFilter, setReportDateFilter] = useState(new Date().toLocaleDateString('sv-SE'));
  const [reportSearch, setReportSearch] = useState('');

  // UTILS / SEARCHES
  const [globalProductSearch, setGlobalProductSearch] = useState('');
  const [globalCariSearch, setGlobalCariSearch] = useState('');

  // Print Ref
  const printRef = useRef<HTMLDivElement>(null);

  // Load Users
  const loadUsers = async () => {
    try {
      const data = await dbService.getUsers();
      setUsersList(data);
    } catch (err: unknown) {
      console.error("Users load error:", err);
    }
  };

  // Load Data
  const loadAllData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const initData = await dbService.getInitialData();

      const itemsBySaleId: Record<string, any[]> = {};
      (initData.sale_items || []).forEach((item: any) => {
        if (!itemsBySaleId[item.sale_id]) {
          itemsBySaleId[item.sale_id] = [];
        }
        itemsBySaleId[item.sale_id].push(item);
      });

      (initData.sales || []).forEach((s: any) => {
        s.items = itemsBySaleId[s.id] || [];
      });

      setCustomers(initData.cariler || []);
      setProducts(initData.products || []);
      setSales(initData.sales || []);
      setTurkcellPremiums(initData.turkcell_premiums || []);
      setExpensesList(initData.expenses || []);
      setTurkcellStockList(initData.turkcell_devices || []);
      setDailyClosingsList(initData.daily_closings || []);
      setMetrics(initData.dashboard.metrics);
      setWeeklyChart(initData.dashboard.weeklyChart);
      setMonthlyChart(initData.dashboard.monthlyChart);
      setServerIp(initData.dashboard.serverIp || 'localhost');
    } catch (err: unknown) {
      console.error("Data load error:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setCurrentUser(parsed);
          if (parsed.role === 'Admin') {
            await loadUsers();
          }
        } catch (e: unknown) {
          console.error("Parse user error:", e);
        }
      }
      setAuthLoading(false);
    };

    checkAuthAndLoad();
    loadAllData();
  }, []);

  // Automatic background synchronization every 10 seconds
  useEffect(() => {
    if (!currentUser) return;
    
    const interval = setInterval(() => {
      loadAllData(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [currentUser]);

  // Touch listener for Pull to Refresh (Tablet/Mobile)
  useEffect(() => {
    let startY = 0;
    let active = false;

    const handleTouchStart = (e) => {
      // Trigger only if scrolled to the top
      if (window.scrollY === 0 && !isRefreshingRef.current) {
        startY = e.touches[0].clientY;
        active = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!active || isRefreshingRef.current) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;

      if (diff > 0 && window.scrollY === 0) {
        // Prevent default browser refresh only when pulling down
        if (e.cancelable) {
          e.preventDefault();
        }
        setIsPulling(true);
        const dist = Math.min(diff * 0.35, 100);
        setPullDistance(dist);
      } else {
        active = false;
        setIsPulling(false);
        setPullDistance(0);
      }
    };

    const handleTouchEnd = async () => {
      if (!active || isRefreshingRef.current) return;
      active = false;
      setIsPulling(false);

      const finalDist = pullDistanceRef.current;
      if (finalDist > 55) {
        setIsRefreshing(true);
        setPullDistance(45);
        try {
          await loadAllData();
        } catch (err: unknown) {
          console.error("Refresh error:", err);
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Reset details views when activeTab changes
  useEffect(() => {
    setShowCariDetails(null);
    setSelectedDebtCariId(null);
    setEditingTxId(null);
  }, [activeTab]);

  useEffect(() => { setPageCari(1); }, [globalCariSearch]);
  useEffect(() => { setPageDebt(1); }, [debtSearch]);
  useEffect(() => { setPageTcellStock(1); }, [tcellDeviceSearch, tcellStatusFilter]);
  useEffect(() => { setPagePremium(1); }, [turkcellSearch]);
  useEffect(() => { setPageHistory(1); }, [historyDateFilter, historyRangeFilter]);
  useEffect(() => { setPageCariTx(1); }, [showCariDetails]);
  useEffect(() => {
    setPageReportDevice(1);
    setPageReportOther(1);
  }, [reportSearch, reportRangeFilter, reportDateFilter]);
  useEffect(() => {
    setPageProdDevice(1);
    setPageProdKilif(1);
    setPageProdCam(1);
    setPageProdSarj(1);
    setPageProdKulaklik(1);
    setPageProdDiger(1);
  }, [globalProductSearch]);

  // --- GÜN SONU Kapatma ve Düzenleme İşleyicileri ---
  const handleCloseDay = async (expectedCash, cashRevenue, cardRevenue, todayExpenses, kSales, fPayments, cashDiff, cardDiff) => {
    if (physicalCash === '' || physicalCard === '') {
      alert("Lütfen eldeki fiziksel nakit ve kart miktarlarını girip 'Hesapla' butonuna basın!");
      return;
    }

    const dateStr = new Date().toLocaleDateString('sv-SE');
    const confirmMsg = `${dateStr} tarihine ait gün sonu hesabını kapatmak istediğinize emin misiniz? Bu işlem geçmiş raporlara kaydedilecektir.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setLoading(true);
      await dbService.saveDailyClosing({
        date: dateStr,
        cash_revenue: cashRevenue,
        card_revenue: cardRevenue,
        kontor_sales: kSales,
        fatura_payments: fPayments,
        today_expenses: todayExpenses,
        expected_cash: expectedCash,
        physical_cash: toNum(physicalCash) || 0,
        physical_card: toNum(physicalCard) || 0,
        physical_eft: 0,
        cash_diff: cashDiff,
        card_diff: cardDiff,
        eft_diff: 0,
        eft_revenue: 0
      });

      alert("Gün sonu hesabı başarıyla kapatıldı ve kaydedildi!");
      setPhysicalCash('');
      setPhysicalCard('');
      setKontorSales('');
      setFaturaPayments('');
      setIsReconciled(false);
      await loadAllData();
    } catch (err: unknown) {
      alert("Gün sonu kaydedilirken hata oluştu: " + getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditClosingModal = (closing) => {
    setEditingClosing(closing);
    setEditPhysicalCash(String(closing.physical_cash));
    setEditPhysicalCard(String(closing.physical_card));
    setEditKontorSales(String(closing.kontor_sales));
    setEditFaturaPayments(String(closing.fatura_payments));
    setShowEditClosingModal(true);
  };

  const handleSaveEditClosing = async (e) => {
    e.preventDefault();
    if (!editingClosing) return;

    try {
      setLoading(true);
      const pDate = editingClosing.date;
      const pastSales = sales.filter(s => s.date === pDate);
      const pastExpenses = expensesList
        .filter(exp => exp.date === pDate)
        .reduce((sum, exp) => sum + (toNum(exp.amount) || 0), 0);

      const cashRev = pastSales
        .filter(s => s.payment_method === 'Nakit')
        .reduce((sum, s) => sum + (toNum(s.total_amount) || 0), 0);

      const cardRev = pastSales
        .filter(s => s.payment_method === 'Kredi Kartı')
        .reduce((sum, s) => sum + (toNum(s.total_amount) || 0), 0);

      const kSales = toNum(editKontorSales) || 0;
      const fPayments = toNum(editFaturaPayments) || 0;

      const expCash = cashRev + kSales + fPayments - pastExpenses;
      const physCash = toNum(editPhysicalCash) || 0;
      const physCard = toNum(editPhysicalCard) || 0;

      const cashDiff = physCash - expCash;
      const cardDiff = physCard - cardRev;

      await dbService.saveDailyClosing({
        id: editingClosing.id,
        date: pDate,
        cash_revenue: cashRev,
        card_revenue: cardRev,
        kontor_sales: kSales,
        fatura_payments: fPayments,
        today_expenses: pastExpenses,
        expected_cash: expCash,
        physical_cash: physCash,
        physical_card: physCard,
        physical_eft: 0,
        cash_diff: cashDiff,
        card_diff: cardDiff,
        eft_diff: 0,
        eft_revenue: 0
      });

      alert("Gün sonu raporu başarıyla güncellendi!");
      setShowEditClosingModal(false);
      setEditingClosing(null);
      await loadAllData();
    } catch (err: unknown) {
      alert("Düzenlenirken hata oluştu: " + getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // --- USER AUTH HANDLERS ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!loginUsername || !loginPassword) {
      setLoginError('Kullanıcı adı ve şifre gereklidir!');
      return;
    }
    try {
      const res = await dbService.login(loginUsername, loginPassword);
      if (res.success && res.user) {
        localStorage.setItem('currentUser', JSON.stringify(res.user));
        setCurrentUser(res.user);
        
        // Auto-select first permitted tab if current activeTab is not permitted
        const defaultTab = 'sales';
        if (res.user.role !== 'Admin' && res.user.permissions && res.user.permissions.length > 0) {
          if (!res.user.permissions.includes(defaultTab)) {
            setActiveTab(res.user.permissions[0]);
          } else {
            setActiveTab(defaultTab);
          }
        } else {
          setActiveTab(defaultTab);
        }
        
        if (res.user.role === 'Admin') {
          loadUsers();
        }
        setLoginUsername('');
        setLoginPassword('');
      }
    } catch (err: unknown) {
      setLoginError(getErrorMessage(err) || 'Giriş başarısız!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setActiveTab('sales');
  };

  // --- USER MANAGEMENT HANDLERS ---
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUsername || !newPassword || !newUserRole) {
      alert('Lütfen kullanıcı adı, şifre ve rol alanlarını doldurun!');
      return;
    }
    try {
      await dbService.createUser({
        username: newUsername,
        password: newPassword,
        role: newUserRole,
        permissions: newUserPermissions
      });
      alert('Kullanıcı başarıyla oluşturuldu.');
      setShowAddUser(false);
      setNewUsername('');
      setNewPassword('');
      setNewUserRole('Staff');
      setNewUserPermissions([]);
      loadUsers();
    } catch (err: unknown) {
      alert(getErrorMessage(err) || 'Kullanıcı oluşturulurken hata oluştu!');
    }
  };

  const handleUpdateUser = (e) => {
    e.preventDefault();
    if (!editUserData.username || !editUserData.role) {
      alert('Lütfen kullanıcı adı ve rol alanlarını doldurun!');
      return;
    }
    triggerConfirm(
      'Kullanıcıyı Güncelle',
      `"${editUserData.username}" kullanıcısının bilgilerini güncellemek istediğinize emin misiniz?`,
      async () => {
        try {
          await dbService.updateUser({
            id: editUserData.id,
            username: editUserData.username,
            password: editUserPassword,
            role: editUserData.role,
            permissions: editUserData.permissions
          });
          alert('Kullanıcı başarıyla güncellendi.');
          setShowEditUser(false);
          setEditUserData(null);
          setEditUserPassword('');
          loadUsers();
          if (currentUser && currentUser.id === editUserData.id) {
            const updatedUser = {
              ...currentUser,
              username: editUserData.username,
              role: editUserData.role,
              permissions: editUserData.permissions
            };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            setCurrentUser(updatedUser);
          }
        } catch (err: unknown) {
          alert(getErrorMessage(err) || 'Kullanıcı güncellenirken hata oluştu!');
        }
      },
      false
    );
  };

  const handleDeleteUser = (id) => {
    triggerConfirm(
      'Kullanıcıyı Sil',
      'Bu kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      async () => {
        try {
          await dbService.deleteUser(id);
          alert('Kullanıcı başarıyla silindi.');
          loadUsers();
        } catch (err: unknown) {
          alert(getErrorMessage(err) || 'Kullanıcı silinirken hata oluştu!');
        }
      },
      true
    );
  };

  const hasTabPermission = (tabKey) => {
    if (!currentUser) return false;
    if (currentUser.role === 'Admin') return true;
    let permitted = currentUser.permissions && currentUser.permissions.includes(tabKey);
    if (tabKey === 'reports' && currentUser.permissions && currentUser.permissions.includes('dashboard')) {
      permitted = true;
    }
    return permitted;
  };

  // Fetch individual Cari Transactions
  const loadCariTransactions = async (cariId) => {
    try {
      const res = await fetch('/api/cariler');
      const cariler = await res.json();
      const selected = cariler.find(c => c.id === cariId);
      
      const txRes = await fetch('/api/sales'); // or get transactions
      // To keep it simple, load transactions from api
      const response = await fetch('/api/cariler', { method: 'GET' });
      // We can also fetch the database directly to get the transactions
      const dbRes = await fetch('/api/dashboard');
      const dbData = await dbRes.json();
      
      // Since transactions are not exposed in a single endpoint, let's fetch erp_db data
      const rawRes = await fetch('/api/sales'); // just load and filter
    } catch (e: unknown) {
      console.error(e);
    }
  };

  // Add Product to Sale Cart
  const addProductToCart = (prod) => {
    const exists = saleItems.find(item => item.product_id === prod.id);
    const newQty = exists ? exists.quantity + 1 : 1;

    if (exists) {
      setSaleItems(saleItems.map(item => 
        item.product_id === prod.id ? { ...item, quantity: newQty } : item
      ));
    } else {
      setSaleItems([...saleItems, {
        product_id: prod.id,
        name: prod.name,
        price: prod.sale_price,
        quantity: 1
      }]);
    }
    setProductSearch('');
  };

  // Add Manual Item to Cart
  const handleAddManualItem = (e) => {
    e.preventDefault();
    if (!manualItem.name || !manualItem.price) return;
    
    const qty = toInt(manualItem.quantity, 1);
    
    setSaleItems([...saleItems, {
      product_id: selectedProductIdForManual || 'manual',
      name: manualItem.name,
      price: toNum(manualItem.price) || 0,
      quantity: qty
    }]);

    setManualItem({ name: '', price: '', quantity: '1' });
    setSelectedProductIdForManual('manual');
  };

  // Update Cart Item Quantity
  const updateCartItemQuantity = (idx, newQuantity) => {
    if (newQuantity < 1) return;
    
    setSaleItems(saleItems.map((itm, i) => 
      i === idx ? { ...itm, quantity: newQuantity } : itm
    ));
  };

  // Remove Item from Cart
  const removeCartItem = (idx) => {
    setSaleItems(saleItems.filter((_, i) => i !== idx));
  };

  // Cart total amount
  const cartTotal = saleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Complete Sale
  const handleCompleteSale = async () => {
    if (saleItems.length === 0) {
      alert("Sepet boş! Önce satılan ürün veya hizmeti yazın/seçin.");
      return;
    }

    try {
      // cari_id mantığı: 
      // - Perakende satışta her zaman 'pesin'
      // - Cari satışta sadece 'Cari (Borç)' yöntemi seçildiyse cari ID kullan, aksi halde 'pesin'
      const effectiveCariId = 
        saleType === 'perakende' 
          ? 'pesin' 
          : (paymentMethod === 'Cari (Borç)' ? selectedCariId : 'pesin');

      const saleData = {
        cari_id: effectiveCariId,
        items: saleItems,
        total_amount: cartTotal,
        payment_method: paymentMethod,
        notes: saleNotes,
        date: saleDate
      };

      await dbService.addSale(saleData);
      
      // Reset Sale fields
      setSaleItems([]);
      setSelectedCariId('pesin');
      setPaymentMethod('Nakit');
      setSaleNotes('');
      setSaleDate(new Date().toLocaleDateString('sv-SE'));
      
      // Reload Data (Stoks, Cariler, Dashboard)
      await loadAllData();
      alert("Satış başarıyla kaydedildi!");
    } catch (error: unknown) {
      console.error('[handleCompleteSale] Hata:', error);
      alert("Satış kaydedilirken hata oluştu:\n" + getErrorMessage(error));
    }
  };

  // Add New Product
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name) return;

    try {
      const prod = {
        ...newProduct,
        imei: newProduct.imei && newProduct.imei.trim() !== '' ? newProduct.imei.trim() : null,
        barcode: newProduct.barcode && newProduct.barcode.trim() !== '' ? newProduct.barcode.trim() : null,
        stock: newProduct.type === 'Cihaz' ? 1 : newProduct.type === 'Hizmet' ? 0 : toInt(newProduct.stock),
        purchase_price: toNum(newProduct.purchase_price) || 0,
        sale_price: toNum(newProduct.sale_price) || 0,
        kdv_ratio: toInt(newProduct.kdv_ratio, 20)
      };

      await dbService.addProduct(prod);
      setShowAddProduct(false);
      setNewProduct({ type: 'Diğer', name: '', barcode: '', imei: '', category: 'Telefon Kılıfı', stock: '', purchase_price: '', sale_price: '', kdv_ratio: '20' });
      await loadAllData();
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    }
  };

  // Delete Product
  const handleDeleteProduct = (id, name) => {
    triggerConfirm(
      'Stok Kartını Sil',
      `"${name}" ürününü silmek istediğinize emin misiniz? Bu işlem stok kaydını tamamen silecektir.`,
      async () => {
        try {
          await dbService.deleteProduct(id);
          await loadAllData();
        } catch (err: unknown) {
          alert(getErrorMessage(err));
        }
      },
      true
    );
  };

  // --- TURKCELL PRİMLERİ İŞLEMLERİ ---
  const handleCreateTurkcell = async (e) => {
    e.preventDefault();
    if (!newTurkcell.description || !newTurkcell.amount) return;
    try {
      await dbService.addTurkcellPremium(newTurkcell);
      setShowAddTurkcell(false);
      setNewTurkcell({ date: new Date().toLocaleDateString('sv-SE'), description: '', amount: '', notes: '' });
      await loadAllData();
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    }
  };

  const handleUpdateTurkcell = (e) => {
    e.preventDefault();
    if (!editTurkcellData.id || !editTurkcellData.description || !editTurkcellData.amount) return;
    triggerConfirm(
      'Prim Kaydını Güncelle',
      `"${editTurkcellData.description}" prim kaydı bilgilerini güncellemek istediğinize emin misiniz?`,
      async () => {
        try {
          await dbService.updateTurkcellPremium(editTurkcellData.id, editTurkcellData);
          setShowEditTurkcell(false);
          setEditTurkcellData(null);
          await loadAllData();
        } catch (err: unknown) {
          alert(getErrorMessage(err));
        }
      },
      false
    );
  };

  const handleDeleteTurkcell = (id, description) => {
    triggerConfirm(
      'Prim Kaydını Sil',
      `"${description}" prim kaydını silmek istediğinize emin misiniz?`,
      async () => {
        try {
          await dbService.deleteTurkcellPremium(id);
          await loadAllData();
        } catch (err: unknown) {
          alert(getErrorMessage(err));
        }
      },
      true
    );
  };

  // --- TURKCELL CİHAZ STOK İŞLEMLERİ ---
  const handleCreateTcellDevice = async (e) => {
    e.preventDefault();
    if (!newTcellDevice.device_name) {
      alert("Cihaz adı girilmesi zorunludur!");
      return;
    }
    try {
      await dbService.addTurkcellDevice(newTcellDevice);
      setShowAddTcellDevice(false);
      setNewTcellDevice({ device_name: '', imei: '', purchase_price: '', sale_price: '', status: 'Stokta', notes: '', kdv_ratio: '20' });
      await loadAllData();
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    }
  };

  const handleUpdateTcellDevice = (e) => {
    e.preventDefault();
    if (!editTcellDeviceData.id || !editTcellDeviceData.device_name) {
      alert("Cihaz adı zorunludur!");
      return;
    }
    triggerConfirm(
      'Cihaz Stokunu Güncelle',
      `"${editTcellDeviceData.device_name}" cihaz stok kaydını güncellemek istediğinize emin misiniz?`,
      async () => {
        try {
          await dbService.updateTurkcellDevice(editTcellDeviceData.id, editTcellDeviceData);
          setShowEditTcellDevice(false);
          setEditTcellDeviceData(null);
          await loadAllData();
        } catch (err: unknown) {
          alert(getErrorMessage(err));
        }
      },
      false
    );
  };

  const handleDeleteTcellDevice = (id, device_name) => {
    triggerConfirm(
      'Cihaz Stokunu Sil',
      `"${device_name}" cihaz stok kaydını silmek istediğinize emin misiniz?`,
      async () => {
        try {
          await dbService.deleteTurkcellDevice(id);
          await loadAllData();
        } catch (err: unknown) {
          alert(getErrorMessage(err));
        }
      },
      true
    );
  };

  const handleToggleTcellDeviceStatus = async (device, newStatus) => {
    try {
      await dbService.updateTurkcellDevice(device.id, {
        ...device,
        status: newStatus
      });
      await loadAllData();
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    }
  };

  // --- GİDER İŞLEMLERİ ---
  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount) return;
    try {
      await dbService.addExpense(newExpense);
      setNewExpense({ date: new Date().toLocaleDateString('sv-SE'), description: '', amount: '', notes: '', category: 'Genel Gider' });
      await loadAllData();
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    }
  };

  const handleDeleteExpense = (id, description) => {
    triggerConfirm(
      'Gider Kaydını Sil',
      `"${description}" gider kaydını silmek istediğinize emin misiniz?`,
      async () => {
        try {
          await dbService.deleteExpense(id);
          await loadAllData();
        } catch (err: unknown) {
          alert(getErrorMessage(err));
        }
      },
      true
    );
  };

  const handleOpenEditProductFromReport = (productId) => {
    const prod = products.find(p => p.id === productId);
    if (prod) {
      setEditProductData(prod);
      setShowEditProduct(true);
    }
  };

  const handleUpdateProduct = (e) => {
    e.preventDefault();
    if (!editProductData.name) return;

    triggerConfirm(
      'Stok Kartını Güncelle',
      `"${editProductData.name}" stok kartı bilgilerini güncellemek istediğinize emin misiniz?`,
      async () => {
        try {
          const prod = {
            ...editProductData,
            imei: editProductData.imei && editProductData.imei.trim() !== '' ? editProductData.imei.trim() : null,
            barcode: editProductData.barcode && editProductData.barcode.trim() !== '' ? editProductData.barcode.trim() : null,
            stock: editProductData.type === 'Cihaz' ? 1 : editProductData.type === 'Hizmet' ? 0 : toInt(editProductData.stock),
            purchase_price: toNum(editProductData.purchase_price) || 0,
            sale_price: toNum(editProductData.sale_price) || 0,
            kdv_ratio: toInt(editProductData.kdv_ratio, 20)
          };

          await dbService.updateProduct(editProductData.id, prod);
          setShowEditProduct(false);
          await loadAllData();
          alert("Stok kartı başarıyla güncellendi!");
        } catch (err: unknown) {
          alert(getErrorMessage(err));
        }
      },
      false
    );
  };

  // Add New Cari
  const handleCreateCari = async (e) => {
    e.preventDefault();
    if (!newCari.name) return;
    if (newCari.cari_type === 'Kurumsal' && (!newCari.tax_office || !newCari.tax_number)) {
      alert("Kurumsal cariler için Vergi Dairesi ve Vergi Numarası girilmesi zorunludur!");
      return;
    }

    try {
      const cari = {
        ...newCari,
        balance: toNum(newCari.balance) || 0
      };

      await dbService.addCustomer(cari);
      setShowAddCari(false);
      setNewCari({ cari_type: 'Bireysel', name: '', phone: '', email: '', balance: '', tax_office: '', tax_number: '', tc_number: '', address: '' });
      await loadAllData();
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    }
  };

  // Delete Cari
  const handleDeleteCari = (id, name) => {
    triggerConfirm(
      'Cari Hesabı Sil',
      `"${name}" cari hesabını silmek istediğinize emin misiniz? Bu işlem ilgili tüm hareketlerini temizleyecektir.`,
      async () => {
        try {
          await dbService.deleteCustomer(id);
          if (showCariDetails && showCariDetails.id === id) {
            setShowCariDetails(null);
          }
          await loadAllData();
        } catch (err: unknown) {
          alert(getErrorMessage(err));
        }
      },
      true
    );
  };

  // Update Cari (Edit)
  const handleUpdateCari = (e) => {
    e.preventDefault();
    if (!editCariData.name) return;
    if (editCariData.cari_type === 'Kurumsal' && (!editCariData.tax_office || !editCariData.tax_number)) {
      alert("Kurumsal cariler için Vergi Dairesi ve Vergi Numarası girilmesi zorunludur!");
      return;
    }

    triggerConfirm(
      'Cari Hesabı Güncelle',
      `"${editCariData.name}" cari hesap bilgilerini kaydetmek istediğinize emin misiniz?`,
      async () => {
        try {
          await dbService.updateCustomer(editCariData.id, editCariData);
          setShowEditCari(false);
          // Refresh details and datasets
          const updatedCusts = await dbService.getCustomers();
          setCustomers(updatedCusts);
          if (showCariDetails && showCariDetails.id === editCariData.id) {
            setShowCariDetails(updatedCusts.find(c => c.id === editCariData.id));
          }
          await loadAllData();
          alert("Cari hesap bilgileri başarıyla güncellendi!");
        } catch (err: unknown) {
          alert(getErrorMessage(err));
        }
      },
      false
    );
  };

  // Delete/Cancel Sale
  const handleDeleteSale = (id) => {
    triggerConfirm(
      'Satışı İptal Et',
      "Bu satışı iptal etmek istediğinize emin misiniz? Bu işlem stok miktarlarını ve ilgili cari bakiyesini otomatik geri alacaktır.",
      async () => {
        try {
          await dbService.deleteSale(id);
          await loadAllData();
          alert("Satış iptal edildi, stoklar ve cari hesap bakiyesi iade edildi.");
        } catch (err: unknown) {
          alert(getErrorMessage(err));
        }
      },
      true
    );
  };

  // Delete Sale Item
  const handleDeleteSaleItem = (saleId, item) => {
    triggerConfirm(
      'Ürünü Satıştan Çıkar',
      `"${item.name}" ürününü bu satıştan silmek istediğinize emin misiniz? Bu işlem bu ürünün stok miktarını ve varsa cari bakiye farkını otomatik düzeltecektir. Eğer bu satışın tek ürünü ise tüm satış silinecektir.`,
      async () => {
        try {
          await dbService.deleteSaleItem(saleId, item.id);
          await loadAllData(true);
        } catch (err: unknown) {
          alert(getErrorMessage(err));
        }
      },
      true
    );
  };

  // Open Edit Sale Item Modal
  const handleOpenEditSaleItem = (saleId, item) => {
    setEditingSaleItem({ saleId, item });
    setEditSaleItemPrice(item.price.toString());
    setEditSaleItemQuantity(item.quantity.toString());
    setShowEditSaleItemModal(true);
  };

  // Save Sale Item Changes
  const handleSaveEditSaleItem = async (e) => {
    e.preventDefault();
    if (!editingSaleItem || !editSaleItemPrice || !editSaleItemQuantity) return;
    
    try {
      await dbService.updateSaleItem(
        editingSaleItem.saleId,
        editingSaleItem.item.id,
        toNum(editSaleItemPrice),
        parseInt(editSaleItemQuantity)
      );
      setShowEditSaleItemModal(false);
      setEditingSaleItem(null);
      await loadAllData(true);
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    }
  };

  // Cari Tahsilat Ekle
  const handleAddTahsilat = async (e) => {
    e.preventDefault();
    if (!tahsilatAmount) return;

    try {
      await dbService.logPayment(
        showCariDetails.id, 
        'tahsilat', 
        toNum(tahsilatAmount), 
        tahsilatDesc || 'Nakit Tahsilat',
        tahsilatDate
      );
      setTahsilatAmount('');
      setTahsilatDesc('');
      
      // Reload details and main datasets
      const updatedCusts = await dbService.getCustomers();
      setCustomers(updatedCusts);
      const updatedCari = updatedCusts.find(c => c.id === showCariDetails.id);
      setShowCariDetails(updatedCari);
      await loadAllData();
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    }
  };

  // Müşteri Borç Takibi Sekmesi Tahsilat Ekleme / Borç Yazma
  const handleDebtTahsilat = async (e) => {
    e.preventDefault();
    if (!tahsilatAmount || !selectedDebtCariId) return;

    try {
      const isTahsilat = debtActionType === 'tahsilat';
      await dbService.logPayment(
        selectedDebtCariId, 
        debtActionType, 
        toNum(tahsilatAmount), 
        tahsilatDesc || (isTahsilat ? 'Nakit Tahsilat' : 'Manuel Borç Girişi'),
        tahsilatDate
      );
      setTahsilatAmount('');
      setTahsilatDesc('');
      setTahsilatDate(new Date().toLocaleDateString('sv-SE'));
      
      // Detayları ve listeyi yenile
      const txs = await dbService.getCariTransactions(selectedDebtCariId);
      setSelectedCariTxList(txs);
      await loadAllData();
      alert(isTahsilat ? "Ödeme kaydı başarıyla eklendi!" : "Borç kaydı başarıyla eklendi!");
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    }
  };

  // Cari Hareket Silme (Düzeltme)
  const handleDeleteTransaction = (txId, description) => {
    triggerConfirm(
      'Cari İşlem Hareketi Sil',
      `"${description}" işlemini silmek istediğinize emin misiniz? Bu işlem cari hesabın bakiyesini otomatik olarak düzeltecektir.`,
      async () => {
        try {
          await dbService.deleteCariTransaction(txId);
          
          // Detayları yenile
          if (selectedDebtCariId) {
            const txs = await dbService.getCariTransactions(selectedDebtCariId);
            setSelectedCariTxList(txs);
          }
          await loadAllData();
          alert("İşlem silindi ve bakiye düzeltildi!");
        } catch (err: unknown) {
          alert(getErrorMessage(err));
        }
      },
      true
    );
  };

  // Cari Hareket Kaydetme (Düzeltme)
  const handleSaveTxEdit = (txId) => {
    if (!editTxAmount) return;
    triggerConfirm(
      'Cari İşlem Hareketini Güncelle',
      'Bu işlemi güncellemek istediğinize emin misiniz? Cari hesap bakiyesi güncellenen tutara göre otomatik olarak yeniden hesaplanacaktır.',
      async () => {
        try {
          await dbService.updateCariTransaction(txId, toNum(editTxAmount), editTxDesc, editTxDate);
          setEditingTxId(null);
          
          // Detayları yenile
          if (selectedDebtCariId) {
            const txs = await dbService.getCariTransactions(selectedDebtCariId);
            setSelectedCariTxList(txs);
          }
          await loadAllData();
          alert("İşlem başarıyla güncellendi!");
        } catch (err: unknown) {
          alert(getErrorMessage(err));
        }
      },
      false
    );
  };

  // Print Barcode Trigger
  const handlePrintBarcode = (prod) => {
    setSelectedProductForBarcode(prod);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Product Search Filter
  const filteredProducts = products.filter(p => {
    const queryNorm = normalizeString(globalProductSearch);
    return (
      (p.name && normalizeString(p.name).includes(queryNorm)) ||
      (p.barcode && normalizeString(p.barcode).includes(queryNorm)) ||
      (p.imei && normalizeString(p.imei).includes(queryNorm))
    );
  });

  // Cari Search Filter
  const filteredCariler = customers.filter(c => {
    const queryNorm = normalizeString(globalCariSearch);
    return (
      (c.name && normalizeString(c.name).includes(queryNorm)) ||
      (c.phone && c.phone.includes(globalCariSearch))
    );
  });

  // Filter products for Kasa checkout search dropdown
  const checkoutProductDropdown = products.filter(p => {
    const queryNorm = normalizeString(productSearch);
    return (
      queryNorm && (
        (p.name && normalizeString(p.name).includes(queryNorm)) ||
        (p.barcode && normalizeString(p.barcode).includes(queryNorm)) ||
        (p.imei && normalizeString(p.imei).includes(queryNorm))
      )
    );
  });

  if (authLoading) {
    return <LoadingScreen variant="auth" />;
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen min-h-dvh bg-[#060913] text-white flex items-center justify-center font-sans pwa-auth-screen p-4 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-violet-500/10 blur-[120px]" />

        <div className="glass-panel p-8 w-full max-w-md bg-slate-900/60 border border-white/10 backdrop-blur-md shadow-2xl relative z-10 animate-fade-in flex flex-col gap-6">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-extrabold text-2xl text-white shadow-xl shadow-indigo-500/25 mb-2">
              GT
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight text-white">Dashboard Giriş</h1>
              <p className="text-secondary text-[11px] mt-1">Lütfen kullanıcı adı ve şifrenizle giriş yapın</p>
            </div>
          </div>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs flex items-center gap-2.5 animate-shake">
              <AlertTriangle size={16} className="shrink-0 text-red-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-[10px] text-secondary font-semibold uppercase tracking-wider block mb-1">Kullanıcı Adı</label>
              <input 
                type="text" 
                required 
                placeholder="Kullanıcı adınızı girin..." 
                className="custom-input py-2 bg-slate-950/40 border-white/5 focus:border-indigo-500/50"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] text-secondary font-semibold uppercase tracking-wider block mb-1">Şifre</label>
              <input 
                type="password" 
                required 
                placeholder="Şifrenizi girin..." 
                className="custom-input py-2 bg-slate-950/40 border-white/5 focus:border-indigo-500/50"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-primary py-2.5 w-full font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all mt-2 cursor-pointer">
              Giriş Yap
            </button>
          </form>

          <div className="text-center text-[10px] text-muted font-sans">
            © {new Date().getFullYear()} Genç Teknoloji Bilişim Hizmetleri
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      {/* Pull to Refresh Indicator */}
      {(isPulling || isRefreshing) && (
        <div 
          className="fixed left-0 right-0 z-[9999] flex justify-center pointer-events-none transition-all duration-75"
          style={{
            top: `${Math.max(-40, pullDistance - 45)}px`,
            opacity: Math.min(pullDistance / 40, 1)
          }}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/95 border border-white/10 shadow-2xl backdrop-blur-md text-[10px] font-bold text-indigo-400 font-sans">
            <div className={`w-3.5 h-3.5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full ${isRefreshing ? 'animate-spin' : ''}`}
                 style={{ transform: !isRefreshing ? `rotate(${pullDistance * 4}deg)` : undefined }} />
            <span>{isRefreshing ? 'Veriler Güncelleniyor...' : pullDistance > 55 ? 'Bırakın Güncellensin' : 'Güncellemek için Çekin'}</span>
          </div>
        </div>
      )}

      {/* 1. SIDEBAR (Desktop / Mobile Drawer) */}
      {mobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="flex items-center justify-between mb-3 pl-1 pr-1 gap-2">
          <div className="flex flex-col gap-0.5 leading-none min-w-0 flex-1">
            <h1 className="font-extrabold text-lg tracking-tight text-white leading-tight">Genç Teknoloji</h1>
            <span className="text-xs text-indigo-400 font-semibold leading-tight">Bilişim Hizmetleri</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/5 text-secondary hover:text-white cursor-pointer"
              title="Menüyü gizle"
              aria-label="Menüyü gizle"
            >
              <PanelLeftClose size={16} />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-white/5 text-secondary hover:text-white cursor-pointer"
              aria-label="Menüyü kapat"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto pr-0.5">
          {SIDEBAR_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => {
              if (item.adminOnly) return currentUser?.role === 'Admin';
              return hasTabPermission(item.key);
            });
            if (visibleItems.length === 0) return null;

            const isTurkcellGroup = group.accent === 'turkcell';

            return (
              <div key={group.title} className={`nav-group${isTurkcellGroup ? ' nav-group-turkcell' : ''}`}>
                <p className="nav-group-title">{group.title}</p>
                <div className="flex flex-col gap-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => { setActiveTab(item.key); setMobileMenuOpen(false); }}
                        className={`nav-item text-left w-full ${isActive ? 'active' : ''}`}
                      >
                        <Icon
                          size={16}
                          className={
                            item.highlight
                              ? 'text-indigo-400'
                              : isTurkcellGroup
                                ? isActive
                                  ? 'text-[#FFD100]'
                                  : 'text-[#FFD100]/70'
                                : undefined
                          }
                        />
                        <span
                          className={
                            item.highlight
                              ? 'text-indigo-400 font-medium'
                              : isTurkcellGroup
                                ? isActive
                                  ? 'text-[#FFD100] font-medium'
                                  : 'text-[#FFD100]/80'
                                : undefined
                          }
                        >
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto glass-panel p-2.5 border-t border-white/5 flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col truncate">
              <span className="text-[10px] text-white font-bold truncate">{currentUser?.username}</span>
              <span className="text-[9px] text-secondary">{currentUser?.role === 'Admin' ? 'Yönetici' : 'Çalışan'}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="text-[10px] text-red-400 hover:text-red-300 font-semibold px-2.5 py-1 rounded bg-red-500/10 border border-red-500/10 hover:bg-red-500/20 transition-all cursor-pointer"
            >
              Çıkış
            </button>
          </div>
        </div>
      </aside>

      {/* 3. MAIN WORKSPACE */}
      <main className="main-content">
        {sidebarCollapsed && (
          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden lg:flex fixed z-[110] p-2 rounded-lg glass-panel hover:bg-white/5 text-secondary hover:text-white cursor-pointer border border-white/10 shadow-lg"
            style={{ left: 'max(0.75rem, var(--safe-left))', top: 'max(0.75rem, var(--safe-top))' }}
            title="Menüyü göster"
            aria-label="Menüyü göster"
          >
            <PanelLeft size={18} />
          </button>
        )}

        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between mb-5 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded glass-panel hover:bg-white/5 cursor-pointer text-secondary hover:text-white"
            >
              <Menu size={18} />
            </button>
            <div className="flex flex-col gap-0.5 leading-none min-w-0">
              <h1 className="font-extrabold text-base tracking-tight text-white leading-tight">Genç Teknoloji</h1>
              <span className="text-[11px] text-indigo-400 font-semibold leading-tight">Bilişim Hizmetleri</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="text-[10px] text-red-400 hover:text-red-300 font-semibold px-2.5 py-1 rounded glass-panel bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 cursor-pointer"
            >
              Çıkış
            </button>
          </div>
        </header>

        {loading ? (
          <LoadingScreen variant="content" />
        ) : (
          <div className="animate-fade-in">
            
            {/* ==================================================== */}
            {/* TAB: KASA / SATIŞ */}
            {/* ==================================================== */}
            {activeTab === 'sales' && (
              <div>
                <div className="mb-5">
                  <h2 className="text-xl font-bold tracking-tight text-white mb-0.5">Hızlı Satış Kasası</h2>
                  <p className="text-secondary text-xs">Satılan ürün veya hizmeti manuel yazarak veya stoklardan seçerek hızlıca kaydedin.</p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Left Column: Cart & Input details */}
                  <div className="xl:col-span-2 flex flex-col gap-5">
                    
                    {/* Hızlı Kartlar */}
                    {(() => {
                      const quickProducts = products.filter(p => (p.type === 'Hizmet' || p.category === 'Aksesuar' || p.category === 'Şarj' || p.category === 'Kılıf' || p.category === 'Cam') && p.sale_price > 0).slice(0, 10);
                      const popularProducts = quickProducts.length > 0 ? quickProducts : products.filter(p => p.sale_price > 0).slice(0, 10);
                      
                      return popularProducts.length > 0 && (
                        <div className="glass-panel p-5">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-white text-sm">Sık Kullanılan Hızlı Kartlar</h4>
                            <span className="text-[10px] text-secondary">Giriş alanını doldurmak için tıklayın</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {popularProducts.map(prod => (
                              <button
                                key={prod.id}
                                type="button"
                                onClick={() => {
                                  setManualItem({
                                    name: prod.name,
                                    price: prod.sale_price.toString()
                                  });
                                  setSelectedProductIdForManual(prod.id);
                                }}
                                className="glass-panel p-3 flex flex-col items-center justify-between text-center gap-1.5 hover:border-indigo-500 hover:bg-indigo-500/5 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer h-24"
                              >
                                <div className="flex flex-col items-center gap-0.5 w-full">
                                  <span className="text-[8px] text-indigo-400 font-bold uppercase tracking-wider block truncate w-full">
                                    {prod.category}
                                  </span>
                                  <span className="text-[11px] text-white font-semibold line-clamp-2 leading-tight w-full">
                                    {prod.name}
                                  </span>
                                </div>
                                <div className="flex flex-col items-center w-full">
                                  <span className="text-xs text-emerald-400 font-mono font-bold">
                                    {prod.sale_price} TL
                                  </span>
                                  {prod.type !== 'Hizmet' && (
                                    <span className={`text-[8px] mt-0.5 font-bold ${prod.stock < 5 ? 'text-red-400 font-bold' : 'text-secondary'}`}>
                                      Stok: {prod.stock}
                                    </span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Manual Input Area (AS REQUESTED) */}
                    <div className="glass-panel p-5">
                      <h4 className="font-bold text-white text-sm mb-4">Manuel Ürün / Hizmet Satışı Ekle</h4>
                      <form onSubmit={handleAddManualItem} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                        <div className="sm:col-span-6 relative">
                          <label className="text-xs text-secondary block mb-1">Ne Sattınız? (Ürün veya Hizmet Adı)*</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="Örn: 500GB SSD Satışı ve Windows Kurulumu" 
                            className="custom-input"
                            value={manualItem.name}
                            onChange={(e) => {
                              setManualItem({ ...manualItem, name: e.target.value });
                              setSelectedProductIdForManual('manual');
                              setShowAutocomplete(true);
                            }}
                            onFocus={() => setShowAutocomplete(true)}
                            onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                          />

                          {(() => {
                            const matches = products.filter(p => {
                              if (!manualItem.name || selectedProductIdForManual !== 'manual') return false;
                              const queryNorm = normalizeString(manualItem.name);
                              return (
                                (p.name && normalizeString(p.name).includes(queryNorm)) ||
                                (p.barcode && normalizeString(p.barcode).includes(queryNorm)) ||
                                (p.imei && normalizeString(p.imei).includes(queryNorm))
                              );
                            });

                            return showAutocomplete && manualItem.name && matches.length > 0 && (
                              <div className="absolute left-0 right-0 mt-1 z-50 border border-white/5 rounded-lg p-2 bg-neutral-950/95 shadow-xl max-h-80 overflow-y-auto">
                                <span className="text-[9px] text-muted block mb-1 uppercase font-semibold">Stok Ürünü Eşleşmeleri (Otomatik Doldurmak İçin Seçin)</span>
                                <div className="flex flex-col gap-1">
                                  {matches.map(prod => (
                                    <button
                                      key={prod.id}
                                      type="button"
                                      onClick={() => {
                                        setManualItem({
                                          name: prod.name,
                                          price: prod.sale_price.toString(),
                                          quantity: '1'
                                        });
                                        setSelectedProductIdForManual(prod.id);
                                        setShowAutocomplete(false);
                                      }}
                                      className="text-left p-2 rounded hover:bg-white/5 text-xs flex justify-between items-center text-white font-sans w-full"
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-semibold">{prod.name}</span>
                                        <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-indigo-400 font-mono mt-0.5">
                                          <span>{prod.category} {prod.stock !== undefined ? `(Stok: ${prod.stock})` : ''}</span>
                                          {prod.type === 'Cihaz' && prod.imei && (
                                            <span className="text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">IMEI: {prod.imei}</span>
                                          )}
                                        </div>
                                      </div>
                                      <span className="font-bold text-indigo-400 font-mono">{prod.sale_price} TL</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        <div className="sm:col-span-3">
                          <label className="text-xs text-secondary block mb-1">Satış Ücreti (TL)*</label>
                          <input 
                            type="number" 
                            required 
                            placeholder="0.00" 
                            className="custom-input"
                            value={manualItem.price}
                            onChange={(e) => setManualItem({ ...manualItem, price: e.target.value })}
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="text-xs text-secondary block mb-1">Adet*</label>
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              required 
                              min="1"
                              placeholder="1" 
                              className="custom-input"
                              value={manualItem.quantity || '1'}
                              onChange={(e) => setManualItem({ ...manualItem, quantity: e.target.value })}
                            />
                            <button type="submit" className="btn-primary shrink-0 py-2">
                              Ekle
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>

                    {/* Cart List */}
                    <div className="glass-panel p-5">
                      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                        <h4 className="font-bold text-white text-sm">Satış Sepeti</h4>
                        <span className="text-xs text-secondary">Sepetteki Kalem: {saleItems.length}</span>
                      </div>

                      {saleItems.length === 0 ? (
                        <div className="text-center py-8 text-secondary text-xs">
                          Sepetiniz boş. Yukarıdan elle yazıp ekleyin veya sağdaki paneli kullanarak stoklardan ekleyin.
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2.5">
                          {saleItems.map((item, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-white/2 border border-white/5 flex items-center justify-between text-xs">
                              <div className="flex-1 min-w-0 pr-4">
                                <h5 className="font-semibold text-white truncate">{item.name}</h5>
                                <span className="text-[10px] text-indigo-400 font-mono mt-0.5 block">
                                  {item.product_id === 'manual' ? 'Manuel Giriş' : 'Stok Ürünü'}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 shrink-0 font-sans">
                                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded p-0.5">
                                  <button 
                                    type="button"
                                    onClick={() => updateCartItemQuantity(idx, item.quantity - 1)}
                                    className="w-4 h-4 rounded hover:bg-white/10 text-white flex items-center justify-center font-bold text-xs select-none transition-colors"
                                  >
                                    -
                                  </button>
                                  <span className="w-5 text-center text-white font-mono font-bold text-xs">
                                    {item.quantity}
                                  </span>
                                  <button 
                                    type="button"
                                    onClick={() => updateCartItemQuantity(idx, item.quantity + 1)}
                                    className="w-4 h-4 rounded hover:bg-white/10 text-white flex items-center justify-center font-bold text-xs select-none transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                                <div className="text-right min-w-[70px]">
                                  <span className="font-bold text-emerald-400 font-mono">
                                    {(item.price * item.quantity).toLocaleString('tr-TR')} TL
                                  </span>
                                  {item.quantity > 1 && (
                                    <span className="block text-[8px] text-secondary font-mono leading-none mt-0.5">
                                      ({item.price.toLocaleString('tr-TR')} x{item.quantity})
                                    </span>
                                  )}
                                </div>
                                <button 
                                  onClick={() => removeCartItem(idx)}
                                  className="text-red-400 hover:text-red-300 p-1 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Checkout details, Client mapping and Stock select */}
                  <div className="flex flex-col gap-5">
                    
                    {/* Checkout Card */}
                    <div className="glass-panel p-5 bg-gradient-to-b from-slate-900 to-indigo-950/20">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                          {saleType === 'gider' && <Coins size={14} className="text-indigo-400" />}
                          <h4 className="font-bold text-white text-sm">
                            {saleType === 'gider' ? 'Gider Kayıt' : 'Satış İşlemini Tamamla'}
                          </h4>
                        </div>
                        {saleType === 'gider' && (
                          <span className="text-[10px] text-red-400 font-mono font-bold">
                            -{expensesList.reduce((sum, e) => sum + e.amount, 0).toLocaleString('tr-TR')} TL
                          </span>
                        )}
                      </div>

                      {/* Sale Type Tabs */}
                      <div className="grid grid-cols-3 gap-1 mb-4 bg-white/2 p-1 rounded-lg border border-white/5 text-[10px]">
                        <button 
                          onClick={() => {
                            setSaleType('perakende');
                            setSelectedCariId('pesin');
                            setPaymentMethod('Nakit');
                          }}
                          className={`py-2 px-1.5 rounded-md font-semibold text-center transition-colors ${saleType === 'perakende' ? 'bg-indigo-600 text-white' : 'text-secondary hover:bg-white/5'}`}
                        >
                          Perakende Satış
                        </button>
                        <button 
                          onClick={() => {
                            setSaleType('cari');
                            if (customers.length > 0) {
                              setSelectedCariId(customers[0].id);
                              setPaymentMethod('Cari (Borç)');
                            }
                          }}
                          className={`py-2 px-1.5 rounded-md font-semibold text-center transition-colors ${saleType === 'cari' ? 'bg-indigo-600 text-white' : 'text-secondary hover:bg-white/5'}`}
                        >
                          Cari / Kurumsal
                        </button>
                        <button 
                          onClick={() => setSaleType('gider')}
                          className={`py-2 px-1.5 rounded-md font-semibold text-center transition-colors ${saleType === 'gider' ? 'bg-indigo-600 text-white' : 'text-secondary hover:bg-white/5'}`}
                        >
                          Gider
                        </button>
                      </div>

                      {saleType === 'gider' ? (
                        <>
                          <form onSubmit={handleCreateExpense} className="flex flex-col gap-3 text-xs mb-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-secondary block mb-1 font-sans">Tarih</label>
                                <input 
                                  type="date" 
                                  required 
                                  className="custom-input text-xs py-1.5 h-9" 
                                  value={newExpense.date}
                                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-secondary block mb-1 font-sans">Tutar (TL)*</label>
                                <input 
                                  type="number" 
                                  required 
                                  placeholder="0.00" 
                                  className="custom-input text-xs py-1.5 h-9" 
                                  value={newExpense.amount}
                                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] text-secondary block mb-1 font-sans">Kategori*</label>
                              <select 
                                required
                                className="custom-input text-xs h-9 w-full text-white bg-neutral-900 border-white/10"
                                value={newExpense.category}
                                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                              >
                                <option value="Genel Gider">Genel Gider</option>
                                <option value="Kargo">Kargo</option>
                                <option value="Emanet">Emanet</option>
                                <option value="Teknik Servis">Teknik Servis</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] text-secondary block mb-1 font-sans">Gider Açıklaması*</label>
                              <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  required 
                                  placeholder="Yemek, Yol, Kargo vb." 
                                  className="custom-input text-xs py-1.5 h-9 min-w-0 flex-1" 
                                  value={newExpense.description}
                                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                />
                                <button type="submit" className="btn-primary shrink-0 py-1.5 px-4 text-xs cursor-pointer h-9">
                                  Kaydet
                                </button>
                              </div>
                            </div>
                          </form>

                          <div className="overflow-y-auto max-h-[180px] border border-white/5 rounded-lg p-1 bg-black/10">
                            {expensesList.length === 0 ? (
                              <div className="text-center py-4 text-muted text-[10px] font-sans">Gider kaydı yok.</div>
                            ) : (
                              <div className="flex flex-col gap-1">
                                {expensesList.map((expense) => (
                                  <div key={expense.id} className="p-2 rounded bg-white/2 border border-white/5 flex items-center justify-between text-[10px] hover:bg-white/5 transition-colors">
                                    <div className="min-w-0 pr-2 flex flex-col gap-0.5">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-semibold text-white truncate block max-w-[140px] font-sans">{expense.description}</span>
                                        <span className={`text-[7px] px-1 py-0.2 rounded font-bold font-mono ${
                                          expense.category === 'Kargo' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/10' :
                                          expense.category === 'Emanet' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/10' :
                                          expense.category === 'Teknik Servis' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/10' :
                                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/10'
                                        }`}>
                                          {expense.category || 'Genel Gider'}
                                        </span>
                                      </div>
                                      <span className="text-[8px] text-secondary font-mono">{expense.date}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="font-bold text-red-400 font-mono">-{expense.amount.toLocaleString('tr-TR')} TL</span>
                                      <button 
                                        onClick={() => handleDeleteExpense(expense.id, expense.description)}
                                        className="text-red-400 hover:text-red-300 p-0.5 cursor-pointer"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                      <div className="flex flex-col gap-4">
                        <div>
                          <label className="text-xs text-secondary block mb-1">Satış Tarihi</label>
                          <input 
                            type="date" 
                            className="custom-input text-xs"
                            value={saleDate}
                            onChange={(e) => setSaleDate(e.target.value)}
                          />
                        </div>

                        {saleType === 'cari' && (
                          <div>
                            <label className="text-xs text-secondary block mb-1">Cari Hesap (Müşteri Seçimi)*</label>
                            <select 
                              className="custom-input text-xs"
                              value={selectedCariId === 'pesin' ? (customers[0]?.id || '') : selectedCariId}
                              onChange={(e) => {
                                setSelectedCariId(e.target.value);
                                setPaymentMethod('Cari (Borç)');
                              }}
                            >
                              {customers.map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.name} ({c.cari_type === 'Kurumsal' ? 'Şirket' : 'Şahıs'})
                                </option>
                              ))}
                            </select>

                            {/* Show billing details of selected Cari */}
                            {selectedCariId && selectedCariId !== 'pesin' && customers.find(c => c.id === selectedCariId) && (
                              <div className="mt-2.5 p-3 rounded-lg bg-black/30 border border-white/5 text-[10px] text-secondary leading-relaxed flex flex-col gap-1">
                                <span className="text-indigo-400 font-bold uppercase text-[9px] tracking-wide">Fatura Bilgileri</span>
                                <div><strong>Cari Bakiye:</strong> <span className={customers.find(c => c.id === selectedCariId).balance > 0 ? 'text-red-400' : 'text-emerald-400'}>{customers.find(c => c.id === selectedCariId).balance.toLocaleString('tr-TR')} TL</span></div>
                                {customers.find(c => c.id === selectedCariId).cari_type === 'Kurumsal' ? (
                                  <>
                                    <div><strong>Vergi Dairesi:</strong> {customers.find(c => c.id === selectedCariId).tax_office}</div>
                                    <div><strong>Vergi Numarası:</strong> {customers.find(c => c.id === selectedCariId).tax_number}</div>
                                  </>
                                ) : (
                                  customers.find(c => c.id === selectedCariId).tc_number && (
                                    <div><strong>T.C. Kimlik No:</strong> {customers.find(c => c.id === selectedCariId).tc_number}</div>
                                  )
                                )}
                                {customers.find(c => c.id === selectedCariId).address && (
                                  <div className="truncate"><strong>Adres:</strong> {customers.find(c => c.id === selectedCariId).address}</div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        <div>
                          <label className="text-xs text-secondary block mb-1">Ödeme Yöntemi</label>
                          <select 
                            className="custom-input text-xs"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                          >
                            {saleType === 'perakende' ? (
                              <>
                                <option value="Nakit">Nakit</option>
                                <option value="Kredi Kartı">Kredi Kartı</option>
                                <option value="Havale/EFT">Havale / EFT</option>
                              </>
                            ) : (
                              <>
                                <option value="Cari (Borç)">Cari Hesaba Borç Kaydet</option>
                                <option value="Nakit">Nakit (Tahsil Edildi)</option>
                                <option value="Kredi Kartı">Kredi Kartı (Tahsil Edildi)</option>
                                <option value="Havale/EFT">Havale / EFT (Tahsil Edildi)</option>
                              </>
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-secondary block mb-1">Satış Notu</label>
                          <textarea 
                            rows={2} 
                            placeholder="İşlemle ilgili not..." 
                            className="custom-input resize-none text-xs"
                            value={saleNotes}
                            onChange={(e) => setSaleNotes(e.target.value)}
                          />
                        </div>

                        <div className="pt-3 border-t border-white/5 mt-2 flex items-center justify-between">
                          <span className="text-xs text-secondary font-semibold">Toplam Tutar:</span>
                          <span className="text-lg font-extrabold text-white">{cartTotal.toLocaleString('tr-TR')} TL</span>
                        </div>

                        <button 
                          onClick={handleCompleteSale}
                          className="btn-primary w-full justify-center py-2.5 mt-2"
                        >
                          Satışı Kaydet ve Bitir
                        </button>
                      </div>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* TAB: GÜN SONU */}
            {/* ==================================================== */}
            {activeTab === 'gun_sonu' && (
              <div className="animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-white mb-0.5">Gün Sonu Raporu</h2>
                    <p className="text-secondary text-xs">Bugün yapılan satışları, toplam hasılatı ve bugün satılan ürünleri inceleyin.</p>
                  </div>
                  <div className="flex items-center gap-2 glass-panel px-3 py-1.5 border border-white/5 font-mono text-xs text-amber-400 font-bold">
                    Tarih: {new Date().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                {(() => {
                  const todayStr = new Date().toLocaleDateString('sv-SE');
                  const todaySales = sales.filter(s => s.date === todayStr);

                  const kSales = toNum(kontorSales) || 0;
                  const fPayments = toNum(faturaPayments) || 0;
                  const todayExpenses = expensesList
                    .filter(e => e.date === todayStr && (!e.category || e.category === 'Genel Gider'))
                    .reduce((sum, e) => sum + (toNum(e.amount) || 0), 0);

                  const todayOtherExits = expensesList
                    .filter(e => e.date === todayStr && e.category && e.category !== 'Genel Gider')
                    .reduce((sum, e) => sum + (toNum(e.amount) || 0), 0);

                  // Calculate metrics
                  const totalSalesCount = todaySales.length;
                  const totalRevenue = todaySales.reduce((sum, s) => sum + (toNum(s.total_amount) || 0), 0) + kSales + fPayments;
                  
                  const cashRevenue = todaySales
                    .filter(s => s.payment_method === 'Nakit')
                    .reduce((sum, s) => sum + (toNum(s.total_amount) || 0), 0);
                    
                  const totalCashRevenue = cashRevenue + kSales + fPayments - todayExpenses - todayOtherExits;
                    
                  const cardRevenue = todaySales
                    .filter(s => s.payment_method === 'Kredi Kartı')
                    .reduce((sum, s) => sum + (toNum(s.total_amount) || 0), 0);
                    
                  const cariRevenue = todaySales
                    .filter(s => s.payment_method === 'Veresiye' || s.cari_id !== 'pesin')
                    .reduce((sum, s) => sum + (toNum(s.total_amount) || 0), 0);

                  const expectedCash = totalCashRevenue;
                  const cashDiff = physicalCash !== '' ? (toNum(physicalCash) - expectedCash) : 0;
                  const cardDiff = physicalCard !== '' ? (toNum(physicalCard) - cardRevenue) : 0;

                  // Aggregate sold products today
                  const soldProductsMap: Record<string, { name: string; quantity: number; total: number }> = {};
                  todaySales.forEach(s => {
                    if (s.items && Array.isArray(s.items)) {
                      s.items.forEach(item => {
                        const name = item.name || 'Bilinmeyen Ürün';
                        const qty = toInt(item.quantity, 1);
                        const price = toNum(item.price) || 0;
                        if (!soldProductsMap[name]) {
                          soldProductsMap[name] = {
                            name,
                            quantity: 0,
                            total: 0
                          };
                        }
                        soldProductsMap[name].quantity += qty;
                        soldProductsMap[name].total += qty * price;
                      });
                    }
                  });

                  const soldProductsList = Object.values(soldProductsMap).sort((a, b) => b.quantity - a.quantity);

                  return (
                    <div className="flex flex-col gap-6">
                      {/* Metrik Kartları */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="glass-panel p-4 border border-white/5 bg-gradient-to-br from-blue-600/10 to-indigo-600/10 relative overflow-hidden group">
                          <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                            <TrendingUp size={120} />
                          </div>
                          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Toplam Günlük Ciro</span>
                          <h3 className="text-2xl font-black text-white mt-1.5 font-mono">{totalRevenue.toLocaleString('tr-TR')} TL</h3>
                          <p className="text-[10px] text-secondary mt-1">{totalSalesCount} Satış Fişi Kesildi</p>
                        </div>

                        <div className="glass-panel p-4 border border-white/5 bg-gradient-to-br from-emerald-600/10 to-teal-600/10 relative overflow-hidden group">
                          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Nakit Tahsilat</span>
                          <h3 className="text-2xl font-black text-white mt-1.5 font-mono">{totalCashRevenue.toLocaleString('tr-TR')} TL</h3>
                          <p className="text-[10px] text-secondary mt-1">Sistem: {cashRevenue.toLocaleString('tr-TR')} TL + Ek: {(kSales + fPayments).toLocaleString('tr-TR')} TL - Kasa Gideri: {todayExpenses.toLocaleString('tr-TR')} TL{todayOtherExits > 0 ? ` - Çıkış: ${todayOtherExits.toLocaleString('tr-TR')} TL` : ''}</p>
                        </div>

                        <div className="glass-panel p-4 border border-white/5 bg-gradient-to-br from-cyan-600/10 to-blue-600/10 relative overflow-hidden group">
                          <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Kredi Kartı Satış</span>
                          <h3 className="text-2xl font-black text-white mt-1.5 font-mono">{cardRevenue.toLocaleString('tr-TR')} TL</h3>
                          <p className="text-[10px] text-secondary mt-1">POS Cihazı Toplamı</p>
                        </div>

                        <div className="glass-panel p-4 border border-white/5 bg-gradient-to-br from-amber-600/10 to-orange-600/10 relative overflow-hidden group">
                          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Cari / Veresiye</span>
                          <h3 className="text-2xl font-black text-white mt-1.5 font-mono">{cariRevenue.toLocaleString('tr-TR')} TL</h3>
                          <p className="text-[10px] text-secondary mt-1">Müşteri Hesabına Borç</p>
                        </div>
                      </div>

                      {/* Kasa Mutabakatı (Hesap Kapatma) Kartı */}
                      <div className="glass-panel p-5 border border-white/5 bg-white/2">
                        <div className="flex items-center gap-2 mb-3.5">
                          <Coins className="text-amber-400" size={16} />
                          <h4 className="font-bold text-white text-xs">Akşam Kasa Hesabı Mutabakatı</h4>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Sol Kısım: Giriş Alanları */}
                          <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="text-[10px] text-secondary block mb-1">Eldeki Nakit Miktar (TL)</label>
                                <input 
                                  type="number" 
                                  placeholder="Eldeki fiziksel nakit..."
                                  className="custom-input text-xs font-mono"
                                  value={physicalCash}
                                  onChange={(e) => { setPhysicalCash(e.target.value); setIsReconciled(false); }}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-secondary block mb-1">POS / Kredi Kartı Toplamı (TL)</label>
                                <input 
                                  type="number" 
                                  placeholder="POS gün sonu slip toplamı..."
                                  className="custom-input text-xs font-mono"
                                  value={physicalCard}
                                  onChange={(e) => { setPhysicalCard(e.target.value); setIsReconciled(false); }}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-secondary block mb-1">Kontör Toplam Satış Miktarı (TL)</label>
                                <input 
                                  type="number" 
                                  placeholder="Toplam kontör satışı..."
                                  className="custom-input text-xs font-mono"
                                  value={kontorSales}
                                  onChange={(e) => { setKontorSales(e.target.value); setIsReconciled(false); }}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-secondary block mb-1">Fatura Ödeme Miktarı (TL)</label>
                                <input 
                                  type="number" 
                                  placeholder="Toplam fatura tahsilatı..."
                                  className="custom-input text-xs font-mono"
                                  value={faturaPayments}
                                  onChange={(e) => { setFaturaPayments(e.target.value); setIsReconciled(false); }}
                                />
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => setIsReconciled(true)}
                                className="btn-primary flex-1 py-2.5 font-bold text-xs uppercase cursor-pointer shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/25 transition-all"
                              >
                                Hesapla
                              </button>
                              {isReconciled && (
                                <button
                                  type="button"
                                  onClick={() => handleCloseDay(expectedCash, cashRevenue, cardRevenue, todayExpenses, kSales, fPayments, cashDiff, cardDiff)}
                                  className="py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-505 text-white font-bold text-xs uppercase cursor-pointer transition-all animate-pulse"
                                >
                                  Gün Sonu Kapat (Tamamla)
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {/* Sağ Kısım: Sonuç Alanları */}
                          <div className="flex flex-col justify-center">
                            {!isReconciled ? (
                              <div className="flex flex-col items-center justify-center text-center p-6 border border-white/5 rounded-xl bg-slate-950/20 backdrop-blur-sm min-h-[160px]">
                                <Coins className="text-amber-400 mb-2 animate-bounce" size={24} />
                                <h5 className="font-bold text-white text-[11px] mb-1">Hesaplama Bekleniyor</h5>
                                <p className="text-[9px] text-secondary max-w-[240px]">
                                  Eldeki nakit ve kart miktarlarını girip <strong>"Hesapla"</strong> butonuna basarak mutabakat farklarını hesaplayın.
                                </p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Beklenen Nakit */}
                                <div className="p-2.5 rounded-lg border border-white/5 bg-white/1 flex flex-col justify-center">
                                  <span className="text-[9px] text-secondary">Beklenen Nakit</span>
                                  <span className="text-xs font-mono font-bold mt-0.5 text-white">
                                    {expectedCash.toLocaleString('tr-TR')} TL
                                  </span>
                                  <span className="text-[8px] text-muted/60 mt-0.5 font-sans leading-tight">
                                    (Sistem: {cashRevenue.toLocaleString('tr-TR')} + Kontör: {kSales.toLocaleString('tr-TR')} + Fatura: {fPayments.toLocaleString('tr-TR')} - Kasa Gideri: {todayExpenses.toLocaleString('tr-TR')}{todayOtherExits > 0 ? ` - Çıkış: ${todayOtherExits.toLocaleString('tr-TR')}` : ''})
                                  </span>
                                </div>

                                {/* Nakit Farkı */}
                                <div className={`p-2.5 rounded-lg border font-semibold flex flex-col justify-center ${physicalCash === '' ? 'bg-white/2 border-white/5 text-white' : cashDiff === 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : cashDiff > 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                  <span className="text-[9px] text-secondary">Nakit Farkı</span>
                                  <span className="text-xs font-mono font-black mt-0.5">
                                    {physicalCash === '' ? '0,00 TL' : cashDiff > 0 ? `+${cashDiff.toLocaleString('tr-TR')} TL (Kasa Fazlası)` : cashDiff < 0 ? `${cashDiff.toLocaleString('tr-TR')} TL (Kasa Eksiği)` : '0,00 TL (Net)'}
                                  </span>
                                </div>

                                {/* Beklenen POS */}
                                <div className="p-2.5 rounded-lg border border-white/5 bg-white/1 flex flex-col justify-center">
                                  <span className="text-[9px] text-secondary">Beklenen POS / Kart</span>
                                  <span className="text-xs font-mono font-bold mt-0.5 text-white">
                                    {cardRevenue.toLocaleString('tr-TR')} TL
                                  </span>
                                  <span className="text-[8px] text-muted/60 mt-0.5 font-sans leading-tight">
                                    (POS Cihazı Toplamı)
                                  </span>
                                </div>

                                {/* POS Farkı */}
                                <div className={`p-2.5 rounded-lg border font-semibold flex flex-col justify-center ${physicalCard === '' ? 'bg-white/2 border-white/5 text-white' : cardDiff === 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : cardDiff > 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                  <span className="text-[9px] text-secondary">POS / Kart Farkı</span>
                                  <span className="text-xs font-mono font-black mt-0.5">
                                    {physicalCard === '' ? '0,00 TL' : cardDiff > 0 ? `+${cardDiff.toLocaleString('tr-TR')} TL (POS Fazlası)` : cardDiff < 0 ? `${cardDiff.toLocaleString('tr-TR')} TL (POS Eksiği)` : '0,00 TL (Net)'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Sold Products Grid / Tables */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Bugün Satılan Ürünler */}
                        <div className="lg:col-span-2 glass-panel p-0 overflow-hidden flex flex-col">
                          <div className="p-4 border-b border-white/5 bg-white/2 flex items-center justify-between">
                            <h4 className="font-bold text-white text-xs">Bugün Satılan Ürün Listesi ({soldProductsList.length} Çeşit)</h4>
                            <span className="text-[10px] text-indigo-400 font-semibold font-mono">Özet Rapor</span>
                          </div>

                          <div className="overflow-x-auto flex-1">
                            {soldProductsList.length === 0 ? (
                              <div className="p-8 text-center text-secondary text-xs">
                                Bugün henüz bir ürün satışı yapılmadı.
                              </div>
                            ) : (
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="border-b border-white/5 text-muted font-semibold bg-white/1">
                                    <th className="p-3 pl-4">Sıra</th>
                                    <th className="p-3">Ürün / Hizmet Adı</th>
                                    <th className="p-3 text-center">Adet</th>
                                    <th className="p-3 text-right">Ortalama Birim Fiyat</th>
                                    <th className="p-3 text-right pr-4">Toplam Tutar</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                  {soldProductsList.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                                      <td className="p-3 pl-4 font-mono text-secondary">{idx + 1}</td>
                                      <td className="p-3 font-semibold text-white">{item.name}</td>
                                      <td className="p-3 text-center font-bold text-indigo-400 font-mono">{item.quantity}</td>
                                      <td className="p-3 text-right font-mono text-secondary">
                                        {(item.total / item.quantity).toLocaleString('tr-TR')} TL
                                      </td>
                                      <td className="p-3 text-right pr-4 font-mono font-semibold text-emerald-400">
                                        {item.total.toLocaleString('tr-TR')} TL
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>

                        {/* Günlük Fişler / İşlem Listesi */}
                        <div className="glass-panel p-0 overflow-hidden flex flex-col">
                          <div className="p-4 border-b border-white/5 bg-white/2 flex items-center justify-between">
                            <h4 className="font-bold text-white text-xs">Bugünkü Fişler ({todaySales.length} Fiş)</h4>
                            <span className="text-[10px] text-amber-400 font-semibold font-mono">Bugün</span>
                          </div>

                          <div className="overflow-y-auto max-h-[450px]">
                            {todaySales.length === 0 ? (
                              <div className="p-8 text-center text-secondary text-xs">
                                Bugün henüz fiş kaydı bulunmamaktadır.
                              </div>
                            ) : (
                              <div className="divide-y divide-white/5">
                                {todaySales.map((sale, idx) => (
                                  <div key={sale.id || idx} className="p-3.5 hover:bg-white/[0.01] transition-colors flex flex-col gap-1 text-xs">
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-white truncate max-w-[180px]">
                                        {sale.cari_id === 'pesin' ? 'Peşin Müşteri' : (sale.cari_name || 'Cari Müşteri')}
                                      </span>
                                      <span className="font-mono text-emerald-400 font-semibold">
                                        {toNum(sale.total_amount || 0).toLocaleString('tr-TR')} TL
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-secondary">
                                      <span className="flex items-center gap-1 font-mono">
                                        {sale.id.replace('s_', '')} | {sale.payment_method}
                                      </span>
                                      <span className="font-mono">{sale.date}</span>
                                    </div>
                                    {sale.items && (
                                      <div className="text-[9px] text-muted truncate mt-0.5">
                                        {sale.items.map(item => `${item.name} (${item.quantity} adet)`).join(', ')}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Geçmiş Gün Sonu Raporları Listesi */}
                      <div className="glass-panel p-0 overflow-hidden flex flex-col mt-6">
                        <div className="p-4 border-b border-white/5 bg-white/2 flex items-center justify-between">
                          <h4 className="font-bold text-white text-xs">Geçmiş Gün Sonu Raporları (Arşiv)</h4>
                          <span className="text-[10px] text-indigo-400 font-semibold font-mono">Toplam {dailyClosingsList.length} Gün</span>
                        </div>

                        <div className="overflow-x-auto">
                          {dailyClosingsList.length === 0 ? (
                            <div className="p-8 text-center text-secondary text-xs">
                              Kayıtlı gün sonu raporu bulunmamaktadır. Günü kapattığınızda buraya eklenecektir.
                            </div>
                          ) : (
                            <table className="w-full text-left text-xs border-collapse font-sans">
                              <thead>
                                <tr className="border-b border-white/5 text-muted font-semibold bg-white/1">
                                  <th className="p-3 pl-4">Tarih</th>
                                  <th className="p-3 text-right">Nakit</th>
                                  <th className="p-3 text-right">POS</th>
                                  <th className="p-3 text-right">Kasa Farkı</th>
                                  <th className="p-3 text-center pr-4">İşlemler</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {dailyClosingsList.slice((pageDailyClosings - 1) * 10, pageDailyClosings * 10).map((closing) => {
                                  const cDiff = toNum(closing.cash_diff) || 0;
                                  const pDiff = toNum(closing.card_diff) || 0;
                                  const expectedCash = toNum(closing.expected_cash) || 0;
                                  const physicalCash = toNum(closing.physical_cash) || 0;
                                  const expectedPos = toNum(closing.card_revenue) || 0;
                                  const physicalPos = toNum(closing.physical_card) || 0;
                                  const totalExpected = expectedCash + expectedPos;
                                  const totalPhysical = physicalCash + physicalPos;
                                  const totalDiff = cDiff + pDiff;

                                  const formatDiff = (diff: number) =>
                                    diff > 0 ? `+${diff.toLocaleString('tr-TR')}` : diff.toLocaleString('tr-TR');

                                  const diffClass = (diff: number) =>
                                    diff === 0 ? 'text-emerald-400' : diff > 0 ? 'text-emerald-400' : 'text-red-400';

                                  const stackedCell = (
                                    expected: number,
                                    physical: number,
                                    diff: number,
                                  ) => (
                                    <div className="flex flex-col gap-1 font-mono text-[10px] leading-tight">
                                      <div className="flex items-center justify-between gap-3">
                                        <span className="text-secondary shrink-0">Beklenen</span>
                                        <span className="text-secondary">{expected.toLocaleString('tr-TR')} TL</span>
                                      </div>
                                      <div className="flex items-center justify-between gap-3">
                                        <span className="text-white/70 shrink-0">Eldeki</span>
                                        <span className="text-white">{physical.toLocaleString('tr-TR')} TL</span>
                                      </div>
                                      <div className="flex items-center justify-between gap-3 pt-0.5 border-t border-white/5">
                                        <span className="text-secondary shrink-0">Fark</span>
                                        <span className={`font-bold ${diffClass(diff)}`}>{formatDiff(diff)} TL</span>
                                      </div>
                                    </div>
                                  );
                                  
                                  return (
                                    <tr key={closing.id} className="hover:bg-white/[0.01] transition-colors">
                                      <td className="p-3 pl-4 font-mono font-bold text-white align-top">{closing.date}</td>
                                      <td className="p-3 text-right align-top">{stackedCell(expectedCash, physicalCash, cDiff)}</td>
                                      <td className="p-3 text-right align-top">{stackedCell(expectedPos, physicalPos, pDiff)}</td>
                                      <td className="p-3 text-right align-top">{stackedCell(totalExpected, totalPhysical, totalDiff)}</td>
                                      <td className="p-3 text-center pr-4 align-top">
                                        <button
                                          onClick={() => handleOpenEditClosingModal(closing)}
                                          className="px-2.5 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-[10px] text-indigo-400 border border-indigo-500/20 font-semibold cursor-pointer transition-all"
                                        >
                                          Düzenle
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                        {dailyClosingsList.length > 10 && (
                          <div className="p-3 border-t border-white/5 bg-white/1">
                            {renderPagination(pageDailyClosings, dailyClosingsList.length, setPageDailyClosings, 10)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}



            {/* ==================================================== */}
            {/* TAB: SATIŞ GEÇMİŞİ (SALES HISTORY) */}
            {/* ==================================================== */}
            {activeTab === 'history' && (
              <div className="animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-white mb-0.5">Satış Geçmişi ve Raporlama</h2>
                    <p className="text-secondary text-xs">Yapılan tüm satışları günlük veya dönem bazlı olarak listeleyin, ciroları inceleyin ve satış iptallerini yönetin.</p>
                  </div>
                  
                  {/* Date Filter Selection */}
                  <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
                    <div className="flex items-center gap-2 glass-panel px-3 py-1.5 border border-white/5">
                      <span className="text-xs text-secondary font-medium">Tarih Aralığı:</span>
                      <select 
                        value={historyRangeFilter}
                        onChange={(e) => setHistoryRangeFilter(e.target.value)}
                        className="bg-transparent border-0 text-white font-semibold text-xs focus:ring-0 cursor-pointer outline-none font-sans mr-2"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="today" className="bg-neutral-900 text-white">Bugün</option>
                        <option value="tomorrow" className="bg-neutral-900 text-white">Yarın</option>
                        <option value="7days" className="bg-neutral-900 text-white">Son 7 Gün</option>
                        <option value="month" className="bg-neutral-900 text-white">Son Ay</option>
                        <option value="3months" className="bg-neutral-900 text-white">Son 3 Ay</option>
                        <option value="6months" className="bg-neutral-900 text-white">Son 6 Ay</option>
                        <option value="year" className="bg-neutral-900 text-white">Son 1 Yıl</option>
                        <option value="custom" className="bg-neutral-900 text-white">Özel Tarih Seç</option>
                      </select>
                    </div>

                    {historyRangeFilter === 'custom' && (
                      <div className="flex items-center gap-2 glass-panel px-3.5 py-1.5 border border-white/5 animate-fade-in">
                        <span className="text-xs text-secondary font-medium">Tarih Filtresi:</span>
                        <input 
                          type="date" 
                          className="bg-transparent border-0 text-white font-semibold text-xs focus:ring-0 cursor-pointer outline-none font-mono"
                          value={historyDateFilter}
                          onChange={(e) => setHistoryDateFilter(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Daily Summary Card */}
                {(() => {
                  const today = new Date();
                  const todayStr = today.toLocaleDateString('sv-SE');
                  
                  let filteredSales = [];
                  if (historyRangeFilter === 'today') {
                    filteredSales = sales.filter(s => s.date === todayStr);
                  } else if (historyRangeFilter === 'tomorrow') {
                    const tomorrow = new Date();
                    tomorrow.setDate(today.getDate() + 1);
                    const tomorrowStr = tomorrow.toLocaleDateString('sv-SE');
                    filteredSales = sales.filter(s => s.date === tomorrowStr);
                  } else if (historyRangeFilter === '7days') {
                    const limitDate = new Date();
                    limitDate.setDate(today.getDate() - 7);
                    const limitStr = limitDate.toLocaleDateString('sv-SE');
                    filteredSales = sales.filter(s => s.date >= limitStr && s.date <= todayStr);
                  } else if (historyRangeFilter === 'month') {
                    const limitDate = new Date();
                    limitDate.setMonth(today.getMonth() - 1);
                    const limitStr = limitDate.toLocaleDateString('sv-SE');
                    filteredSales = sales.filter(s => s.date >= limitStr && s.date <= todayStr);
                  } else if (historyRangeFilter === '3months') {
                    const limitDate = new Date();
                    limitDate.setMonth(today.getMonth() - 3);
                    const limitStr = limitDate.toLocaleDateString('sv-SE');
                    filteredSales = sales.filter(s => s.date >= limitStr && s.date <= todayStr);
                  } else if (historyRangeFilter === '6months') {
                    const limitDate = new Date();
                    limitDate.setMonth(today.getMonth() - 6);
                    const limitStr = limitDate.toLocaleDateString('sv-SE');
                    filteredSales = sales.filter(s => s.date >= limitStr && s.date <= todayStr);
                  } else if (historyRangeFilter === 'year') {
                    const limitDate = new Date();
                    limitDate.setFullYear(today.getFullYear() - 1);
                    const limitStr = limitDate.toLocaleDateString('sv-SE');
                    filteredSales = sales.filter(s => s.date >= limitStr && s.date <= todayStr);
                  } else {
                    filteredSales = sales.filter(s => s.date === historyDateFilter);
                  }

                  const totalDailyAmount = filteredSales.reduce((sum, s) => sum + s.total_amount, 0);
                  const totalDailySalesCount = filteredSales.length;

                  const rangeLabel = (() => {
                    if (historyRangeFilter === 'today') return `Bugün (${todayStr})`;
                    if (historyRangeFilter === 'tomorrow') {
                      const tomorrow = new Date();
                      tomorrow.setDate(today.getDate() + 1);
                      return `Yarın (${tomorrow.toLocaleDateString('sv-SE')})`;
                    }
                    if (historyRangeFilter === '7days') return 'Son 7 Gün';
                    if (historyRangeFilter === 'month') return 'Son Ay';
                    if (historyRangeFilter === '3months') return 'Son 3 Ay';
                    if (historyRangeFilter === '6months') return 'Son 6 Ay';
                    if (historyRangeFilter === 'year') return 'Son 1 Yıl';
                    return historyDateFilter;
                  })();

                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                        <div className="glass-panel p-5 bg-gradient-to-r from-indigo-950/20 to-indigo-900/10">
                          <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Seçilen Dönem Cirosu</span>
                          <h3 className="text-xl font-extrabold text-white mt-1">{totalDailyAmount.toLocaleString('tr-TR')} TL</h3>
                          <span className="text-[10px] text-indigo-400 font-mono">{rangeLabel}</span>
                        </div>
                        <div className="glass-panel p-5">
                          <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Yapılan İşlem Sayısı</span>
                          <h3 className="text-xl font-extrabold text-white mt-1">{totalDailySalesCount} Satış</h3>
                          <span className="text-[10px] text-secondary">Seçilen dönem</span>
                        </div>
                        <div className="glass-panel p-5">
                          <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Ödeme Yöntemi Dağılımı</span>
                          <div className="flex flex-col gap-1 mt-2 text-[10px] font-semibold text-secondary">
                            <div className="flex justify-between">Nakit: <span className="text-white font-bold font-mono">{filteredSales.filter(s => s.payment_method === 'Nakit').reduce((sum, s) => sum + s.total_amount, 0).toLocaleString('tr-TR')} TL</span></div>
                            <div className="flex justify-between">Kart: <span className="text-white font-bold font-mono">{filteredSales.filter(s => s.payment_method === 'Kredi Kartı').reduce((sum, s) => sum + s.total_amount, 0).toLocaleString('tr-TR')} TL</span></div>
                            <div className="flex justify-between">Veresiye (Cari): <span className="text-white font-bold font-mono">{filteredSales.filter(s => s.payment_method === 'Cari (Borç)').reduce((sum, s) => sum + s.total_amount, 0).toLocaleString('tr-TR')} TL</span></div>
                          </div>
                        </div>
                      </div>

                      {/* Sales List grouped by date */}
                      {filteredSales.length === 0 ? (
                        <div className="glass-panel p-8 text-center text-secondary text-xs">
                          Seçilen dönemde ({rangeLabel}) henüz yapılmış bir satış kaydı bulunmamaktadır.
                        </div>
                      ) : (() => {
                        const groupedSales = {};
                        filteredSales.forEach((sale) => {
                          const d = sale.date;
                          if (!groupedSales[d]) groupedSales[d] = [];
                          groupedSales[d].push(sale);
                        });

                        const sortedDates = Object.keys(groupedSales).sort((a, b) => b.localeCompare(a));
                        const paginatedDates = sortedDates.slice((pageHistory - 1) * 10, pageHistory * 10);

                        return (
                          <div className="flex flex-col gap-4">
                            {paginatedDates.map((dateStr, index) => {
                              const daySales = groupedSales[dateStr];
                              const dayTotal = daySales.reduce((sum, s) => sum + s.total_amount, 0);
                              const dayCount = daySales.length;

                              // Format date nicely
                              let formattedDate = dateStr;
                              try {
                                const dObj = new Date(dateStr + 'T00:00:00');
                                formattedDate = dObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
                              } catch(e) {}

                              const isExpanded = expandedDates[dateStr] !== undefined ? expandedDates[dateStr] : (index === 0);

                              return (
                                <div key={dateStr} className="glass-panel p-0 overflow-hidden border border-indigo-500/10 shadow-lg animate-fade-in">
                                  <button 
                                    onClick={() => {
                                      const isCurrentlyExpanded = expandedDates[dateStr] !== undefined ? expandedDates[dateStr] : (index === 0);
                                      setExpandedDates(prev => ({
                                        ...prev,
                                        [dateStr]: !isCurrentlyExpanded
                                      }));
                                    }}
                                    className="w-full flex items-center justify-between p-3.5 bg-indigo-950/15 hover:bg-indigo-900/20 transition-colors border-b border-white/5 cursor-pointer text-left"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 rounded bg-indigo-500/10 text-indigo-400">
                                        {isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
                                      </div>
                                      <div>
                                        <h3 className="font-bold text-white text-xs">{formattedDate}</h3>
                                        <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5 text-[10px] text-secondary font-sans">
                                          <span>{dayCount} Satış İşlemi</span>
                                          <span>•</span>
                                          <span className="font-semibold text-emerald-400 font-mono">Toplam Ciro: {dayTotal.toLocaleString('tr-TR')} TL</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-secondary">
                                      <div className="hidden lg:flex gap-3 text-[10px] text-muted font-mono mr-2">
                                        <span>Nakit: <strong className="text-white">{daySales.filter(s => s.payment_method === 'Nakit').reduce((sum, s) => sum + s.total_amount, 0).toLocaleString('tr-TR')} TL</strong></span>
                                        <span>Kart: <strong className="text-white">{daySales.filter(s => s.payment_method === 'Kredi Kartı').reduce((sum, s) => sum + s.total_amount, 0).toLocaleString('tr-TR')} TL</strong></span>
                                        <span>Cari: <strong className="text-white">{daySales.filter(s => s.payment_method === 'Cari (Borç)').reduce((sum, s) => sum + s.total_amount, 0).toLocaleString('tr-TR')} TL</strong></span>
                                      </div>
                                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </div>
                                  </button>

                                  {isExpanded && (
                                    <div className="divide-y divide-white/5 bg-black/10">
                                      {daySales.map((sale) => (
                                        <div key={sale.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs hover:bg-white/1 transition-colors">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                                              <span className="font-mono text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded text-[10px]">
                                                Fatura No: {sale.id}
                                              </span>
                                              <span className={`badge ${sale.payment_method === 'Cari (Borç)' ? 'badge-danger' : 'badge-success'} rounded px-2 py-0.5 text-[9px] font-bold`}>
                                                {sale.payment_method}
                                              </span>
                                              <span className="text-secondary font-mono text-[10px]">
                                                Müşteri: <strong className="text-white">{customers.find(c => c.id === sale.cari_id)?.name || 'Peşin Satış'}</strong>
                                              </span>
                                            </div>
                                            
                                            {/* Items list */}
                                            <div className="flex flex-col gap-2 mt-2 bg-black/15 p-3 rounded-lg border border-white/5 max-w-2xl font-sans">
                                              {sale.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-[11px] text-secondary border-b border-white/5 last:border-b-0 pb-1.5 last:pb-0">
                                                  <div className="flex flex-col gap-0.5 min-w-0 pr-4">
                                                    <span className="font-semibold text-white truncate max-w-[280px] sm:max-w-md">• {item.name}</span>
                                                    <span className="text-[10px] text-secondary font-mono">Birim: {item.price.toLocaleString('tr-TR')} TL x {item.quantity}</span>
                                                  </div>
                                                  <div className="flex items-center gap-3 shrink-0">
                                                    <span className="font-mono text-white font-bold">{(item.price * item.quantity).toLocaleString('tr-TR')} TL</span>
                                                    <div className="flex items-center gap-1.5 ml-2">
                                                      <button 
                                                        onClick={() => handleOpenEditSaleItem(sale.id, item)}
                                                        title="Ürünü Düzenle"
                                                        className="p-1 rounded hover:bg-indigo-500/10 text-secondary hover:text-indigo-400 cursor-pointer transition-colors"
                                                      >
                                                        <Edit2 size={12} />
                                                      </button>
                                                      <button 
                                                        onClick={() => handleDeleteSaleItem(sale.id, item)}
                                                        title="Ürünü Sil"
                                                        className="p-1 rounded hover:bg-red-500/10 text-secondary hover:text-red-400 cursor-pointer transition-colors"
                                                      >
                                                        <Trash2 size={12} />
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                            
                                            {sale.notes && (
                                              <div className="text-[10px] text-muted mt-2 block font-sans">
                                                Not: {sale.notes}
                                              </div>
                                            )}
                                          </div>

                                          <div className="flex items-end md:items-center gap-4 shrink-0 justify-between md:justify-end border-t border-white/5 md:border-t-0 pt-3 md:pt-0">
                                            <div className="text-right">
                                              <span className="text-[10px] text-muted block font-sans">Toplam Tutar</span>
                                              <span className="text-sm font-extrabold text-white font-mono">{sale.total_amount.toLocaleString('tr-TR')} TL</span>
                                            </div>

                                            <button 
                                              onClick={() => handleDeleteSale(sale.id)}
                                              className="px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-[11px] text-red-400 flex items-center justify-center gap-1 border border-red-500/20 font-semibold cursor-pointer transition-colors"
                                            >
                                              <Trash2 size={13} />
                                              <span>Satışı İptal Et</span>
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {renderPagination(pageHistory, sortedDates.length, setPageHistory)}
                          </div>
                        );
                      })()}
                    </>
                  );
                })()}
              </div>
            )}

            {/* ==================================================== */}
            {/* TAB: STOK KARTLARI (INVENTORY) */}
            {/* ==================================================== */}
            {activeTab === 'products' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-white mb-0.5">Stok ve Envanter Yönetimi</h2>
                    <p className="text-secondary text-xs">Mağazanızdaki kayıtlı ürünleri ve stok miktarlarını yönetin.</p>
                  </div>
                  <button 
                    onClick={() => setShowAddProduct(true)} 
                    className="btn-primary self-start sm:self-center"
                  >
                    <Plus size={16} />
                    <span>Yeni Ürün Ekle</span>
                  </button>
                </div>

                {/* Search / Filter */}
                <div className="glass-panel p-4 mb-5">
                  <div className="relative w-full sm:max-w-md">
                    <span className="pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center text-[var(--text-muted)]">
                      <Search size={16} />
                    </span>
                    <input 
                      type="text" 
                      placeholder="Ürün adı veya barkoduna göre ara..." 
                      className="custom-input !pl-10"
                      value={globalProductSearch}
                      onChange={(e) => setGlobalProductSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Summary Cards */}
                {(() => {
                  const devices = products.filter(p => p.type === 'Cihaz');
                  const totalDeviceStockCost = devices.reduce((sum, p) => sum + (p.purchase_price * (p.stock || 1)), 0);
                  const totalDeviceStockSale = devices.reduce((sum, p) => sum + (p.sale_price * (p.stock || 1)), 0);
                  const deviceCount = devices.reduce((sum, p) => sum + (p.stock || 1), 0);

                  const accessories = products.filter(p => p.type !== 'Cihaz');
                  const totalAccessoryStockCost = accessories.reduce((sum, p) => sum + (p.purchase_price * (p.stock || 0)), 0);

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                      <div className="glass-panel p-4 bg-gradient-to-r from-indigo-950/20 to-indigo-900/10 border border-indigo-500/10">
                        <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block font-bold text-indigo-300">Toplam Stok Tutarı (Cihaz Alış)</span>
                        <h3 className="text-xl font-extrabold text-white mt-1">{totalDeviceStockCost.toLocaleString('tr-TR')} TL</h3>
                        <span className="text-[10px] text-indigo-400 font-mono">{deviceCount} Adet cihaz envanteri</span>
                      </div>
                      <div className="glass-panel p-4 bg-gradient-to-r from-emerald-950/20 to-emerald-900/10 border border-emerald-500/10">
                        <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block font-bold text-emerald-300">Toplam Stok Satış Tutarı (Cihaz Satış)</span>
                        <h3 className="text-xl font-extrabold text-emerald-400 mt-1">{totalDeviceStockSale.toLocaleString('tr-TR')} TL</h3>
                        <span className="text-[10px] text-emerald-500/80 font-mono">Beklenen toplam ciro</span>
                      </div>
                      <div className="glass-panel p-4 bg-gradient-to-r from-slate-900/40 to-slate-800/20 border border-white/5">
                        <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Genel Envanter Stok Değeri (Alış)</span>
                        <h3 className="text-xl font-extrabold text-slate-300 mt-1">{(totalDeviceStockCost + totalAccessoryStockCost).toLocaleString('tr-TR')} TL</h3>
                        <span className="text-[10px] text-secondary">Cihazlar + Aksesuarlar</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Add Product Modal Overlay */}
                {showAddProduct && (
                  <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="glass-panel p-6 w-full max-w-md bg-slate-900 border border-white/10 animate-fade-in text-xs">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-white">Yeni Stok Girişi</h3>
                        <button onClick={() => setShowAddProduct(false)} className="text-secondary hover:text-white">
                          <X size={16} />
                        </button>
                      </div>
                      <form onSubmit={handleCreateProduct} className="flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-secondary block mb-1">Stok Tipi*</label>
                            <select 
                              className="custom-input"
                              value={newProduct.type}
                              onChange={(e) => {
                                const val = e.target.value;
                                setNewProduct({ 
                                  ...newProduct, 
                                  type: val,
                                  category: val === 'Cihaz' ? 'Telefon' : val === 'Hizmet' ? 'Tamir & Teknik Servis' : 'Telefon Kılıfı',
                                  imei: '',
                                  barcode: '',
                                  stock: val === 'Cihaz' ? '1' : val === 'Hizmet' ? '0' : ''
                                });
                              }}
                            >
                              <option value="Diğer">Diğer (Aksesuar/Stok)</option>
                              <option value="Cihaz">Cihaz (Telefon / Tablet)</option>
                              <option value="Hizmet">Hizmet (Tamir / Teknik Servis)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-secondary block mb-1">Kategori*</label>
                            {newProduct.type === 'Cihaz' ? (
                              <select 
                                className="custom-input"
                                value={newProduct.category}
                                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                              >
                                <option value="Telefon">Telefon</option>
                                <option value="Tablet">Tablet</option>
                              </select>
                            ) : newProduct.type === 'Hizmet' ? (
                              <select 
                                className="custom-input"
                                value={newProduct.category}
                                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                              >
                                <option value="Tamir & Teknik Servis">Tamir & Teknik Servis</option>
                              </select>
                            ) : (
                              <select 
                                className="custom-input"
                                value={newProduct.category}
                                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                              >
                                <option value="Telefon Kılıfı">Telefon Kılıfı</option>
                                <option value="Telefon Kırılmaz Camı">Telefon Kırılmaz Camı</option>
                                <option value="Şarj Cihazı">Şarj Cihazı</option>
                                <option value="Şarj Kablosu">Şarj Kablosu</option>
                                <option value="Bluetooth Kulaklık">Bluetooth Kulaklık</option>
                                <option value="Hazır Kart">Hazır Kart</option>
                                <option value="Tamir & Teknik Servis">Tamir & Teknik Servis</option>
                                <option value="Diğer">Diğer</option>
                              </select>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-secondary block mb-1">
                            {newProduct.type === 'Cihaz' ? 'Telefon İsmi (Marka / Model)*' : 'Ürün / Hizmet Adı*'}
                          </label>
                          <input 
                            type="text" 
                            required 
                            placeholder={newProduct.type === 'Cihaz' ? 'Örn: Apple iPhone 14 Pro Max 256GB' : 'Ürün adını yazın...'} 
                            className="custom-input"
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                          />
                        </div>

                        {newProduct.type === 'Cihaz' && (
                          <div>
                            <label className="text-[10px] text-secondary block mb-1">IMEI Numarası (15 Haneli)</label>
                            <input 
                              type="text" 
                              maxLength={15}
                              placeholder="IMEI kodunu yazın..." 
                              className="custom-input font-mono"
                              value={newProduct.imei || ''}
                              onChange={(e) => setNewProduct({ ...newProduct, imei: e.target.value.replace(/\D/g, '') })}
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-secondary block mb-1">Adet / Stok</label>
                            <input 
                              type="number" 
                              placeholder="0" 
                              disabled={newProduct.type === 'Cihaz' || newProduct.type === 'Hizmet'}
                              className="custom-input"
                              value={newProduct.type === 'Cihaz' ? '1' : newProduct.type === 'Hizmet' ? '0' : newProduct.stock}
                              onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-secondary block mb-1">KDV Oranı (%)</label>
                            <select 
                              className="custom-input bg-slate-800"
                              value={newProduct.kdv_ratio}
                              onChange={(e) => {
                                const ratio = parseInt(e.target.value) || 0;
                                const purchaseExcl = toNum(newProduct.purchase_price) / (1 + toInt(newProduct.kdv_ratio, 20) / 100);
                                const saleExcl = toNum(newProduct.sale_price) / (1 + toInt(newProduct.kdv_ratio, 20) / 100);
                                setNewProduct({ 
                                  ...newProduct, 
                                  kdv_ratio: ratio.toString(),
                                  purchase_price: purchaseExcl ? (purchaseExcl * (1 + ratio / 100)).toFixed(2) : newProduct.purchase_price,
                                  sale_price: saleExcl ? (saleExcl * (1 + ratio / 100)).toFixed(2) : newProduct.sale_price
                                });
                              }}
                            >
                              <option value="20">%20 (Genel)</option>
                              <option value="10">%10 (Gıda/Tıbbi)</option>
                              <option value="1">%1 (Temel)</option>
                              <option value="0">%0 (KDV Muaf)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-secondary block mb-1">Alış Fiyatı (KDV Hariç - TL)</label>
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00" 
                              className="custom-input"
                              onBlur={(e) => {
                                const excl = toNum(e.target.value);
                                if (isNaN(excl)) return;
                                const ratio = toInt(newProduct.kdv_ratio, 20);
                                const incl = excl * (1 + ratio / 100);
                                setNewProduct({ ...newProduct, purchase_price: incl.toFixed(2) });
                              }}
                              defaultValue={newProduct.purchase_price ? (toNum(newProduct.purchase_price) / (1 + toInt(newProduct.kdv_ratio, 20) / 100)).toFixed(2) : ''}
                              key={'np-prod-pur-excl-' + (newProduct.kdv_ratio ?? '20')}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-secondary block mb-1">Alış Fiyatı (KDV Dahil - TL)</label>
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00" 
                              className="custom-input font-bold text-white"
                              value={newProduct.purchase_price}
                              onChange={(e) => setNewProduct({ ...newProduct, purchase_price: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-secondary block mb-1">Satış Fiyatı (KDV Hariç - TL)</label>
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00" 
                              className="custom-input"
                              onBlur={(e) => {
                                const excl = toNum(e.target.value);
                                if (isNaN(excl)) return;
                                const ratio = toInt(newProduct.kdv_ratio, 20);
                                const incl = excl * (1 + ratio / 100);
                                setNewProduct({ ...newProduct, sale_price: incl.toFixed(2) });
                              }}
                              defaultValue={newProduct.sale_price ? (toNum(newProduct.sale_price) / (1 + toInt(newProduct.kdv_ratio, 20) / 100)).toFixed(2) : ''}
                              key={'np-prod-sale-excl-' + (newProduct.kdv_ratio ?? '20')}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-secondary block mb-1">Satış Fiyatı (KDV Dahil - TL)</label>
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00" 
                              className="custom-input font-bold text-emerald-400"
                              value={newProduct.sale_price}
                              onChange={(e) => setNewProduct({ ...newProduct, sale_price: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                          <button 
                            type="button" 
                            onClick={() => setShowAddProduct(false)}
                            className="px-4 py-2 rounded-lg text-secondary border border-white/5 hover:bg-white/5"
                          >
                            İptal
                          </button>
                          <button type="submit" className="btn-primary py-2 px-4">
                            Kaydet
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Per-category collapsible folders */}
                {(() => {
                  // --- Category groupings ---
                  const deviceProducts   = filteredProducts.filter(p => p.type === 'Cihaz' || p.category === 'Tablet' || p.category === 'Telefon');
                  const kiliffProducts   = filteredProducts.filter(p => p.category === 'Telefon Kılıfı');
                  const camProducts      = filteredProducts.filter(p => p.category === 'Telefon Kırılmaz Camı');
                  const sarjProducts     = filteredProducts.filter(p => p.category === 'Şarj Cihazı' || p.category === 'Şarj Kablosu');
                  const kulaklikProducts = filteredProducts.filter(p => p.category === 'Bluetooth Kulaklık');
                  const digerProducts    = filteredProducts.filter(p =>
                    p.type !== 'Cihaz' &&
                    !['Tablet','Telefon','Telefon Kılıfı','Telefon Kırılmaz Camı','Şarj Cihazı','Şarj Kablosu','Bluetooth Kulaklık'].includes(p.category)
                  );

                  // --- Reusable table renderer ---
                  const renderRow = (prod) => (
                    <tr key={prod.id} className="hover:bg-white/1 transition-colors">
                      <td className="p-3 whitespace-nowrap">
                        <span className="badge badge-success text-[9px] px-1.5 py-0.5">{prod.category}</span>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-white text-xs leading-tight">{prod.name}</div>
                        {prod.type === 'Cihaz' && prod.imei && (
                          <div className="text-[10px] font-mono text-indigo-400 mt-0.5">IMEI: {prod.imei}</div>
                        )}
                        {prod.barcode && (
                          <div className="text-[10px] font-mono text-secondary mt-0.5">Barkod: {prod.barcode}</div>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`font-bold text-xs ${
                          prod.type === 'Cihaz' ? 'text-indigo-400' : prod.stock < 5 ? 'text-red-400' : 'text-emerald-400'
                        }`}>
                          {prod.type === 'Cihaz' ? '1' : prod.stock}
                        </span>
                        <span className="text-[10px] text-muted ml-1">adet</span>
                      </td>
                      <td className="p-3 text-right font-mono text-slate-300 whitespace-nowrap text-xs">
                        {(prod.purchase_price || 0).toLocaleString('tr-TR')} TL
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-emerald-400 whitespace-nowrap text-xs">
                        {(prod.sale_price || 0).toLocaleString('tr-TR')} TL
                      </td>
                      <td className="p-3 text-center text-xs">
                        <span className="text-secondary font-mono">{prod.kdv_ratio ?? 20}%</span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handlePrintBarcode(prod)}
                            className="px-2 py-1 rounded bg-white/2 hover:bg-white/5 text-[10px] text-white border border-white/5 font-semibold cursor-pointer flex items-center gap-1"
                          >
                            <Barcode size={11} />
                            <span>Barkod</span>
                          </button>
                          <button
                            onClick={() => { setEditProductData(prod); setShowEditProduct(true); }}
                            className="px-2 py-1 rounded bg-white/2 hover:bg-white/5 text-[10px] text-white border border-white/5 font-semibold cursor-pointer"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-[10px] text-rose-400 border border-rose-500/20 font-semibold cursor-pointer"
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  );

                  const renderTableHeaders = () => (
                    <thead>
                      <tr className="border-b border-white/5 text-muted font-semibold bg-white/1">
                        <th className="p-3">Kategori</th>
                        <th className="p-3">Ürün Adı / Model</th>
                        <th className="p-3 text-center">Stok</th>
                        <th className="p-3 text-right">Alış Fiyatı</th>
                        <th className="p-3 text-right">Satış Fiyatı</th>
                        <th className="p-3 text-center">KDV</th>
                        <th className="p-3 text-right">İşlem</th>
                      </tr>
                    </thead>
                  );

                  const folderStyles = {
                    indigo: {
                      wrapper: 'glass-panel p-0 overflow-hidden border border-indigo-500/10 shadow-lg',
                      btn: 'w-full flex items-center justify-between p-3.5 bg-indigo-950/20 hover:bg-indigo-900/20 transition-colors border-b border-white/5 cursor-pointer',
                      icon: 'p-2 rounded bg-indigo-500/10 text-indigo-400',
                      count: 'text-[10px] text-indigo-300/80 font-semibold',
                    },
                    emerald: {
                      wrapper: 'glass-panel p-0 overflow-hidden border border-emerald-500/10 shadow-lg',
                      btn: 'w-full flex items-center justify-between p-3.5 bg-emerald-950/20 hover:bg-emerald-900/20 transition-colors border-b border-white/5 cursor-pointer',
                      icon: 'p-2 rounded bg-emerald-500/10 text-emerald-400',
                      count: 'text-[10px] text-emerald-300/80 font-semibold',
                    },
                    sky: {
                      wrapper: 'glass-panel p-0 overflow-hidden border border-sky-500/10 shadow-lg',
                      btn: 'w-full flex items-center justify-between p-3.5 bg-sky-950/20 hover:bg-sky-900/20 transition-colors border-b border-white/5 cursor-pointer',
                      icon: 'p-2 rounded bg-sky-500/10 text-sky-400',
                      count: 'text-[10px] text-sky-300/80 font-semibold',
                    },
                    amber: {
                      wrapper: 'glass-panel p-0 overflow-hidden border border-amber-500/10 shadow-lg',
                      btn: 'w-full flex items-center justify-between p-3.5 bg-amber-950/20 hover:bg-amber-900/20 transition-colors border-b border-white/5 cursor-pointer',
                      icon: 'p-2 rounded bg-amber-500/10 text-amber-400',
                      count: 'text-[10px] text-amber-300/80 font-semibold',
                    },
                    purple: {
                      wrapper: 'glass-panel p-0 overflow-hidden border border-purple-500/10 shadow-lg',
                      btn: 'w-full flex items-center justify-between p-3.5 bg-purple-950/20 hover:bg-purple-900/20 transition-colors border-b border-white/5 cursor-pointer',
                      icon: 'p-2 rounded bg-purple-500/10 text-purple-400',
                      count: 'text-[10px] text-purple-300/80 font-semibold',
                    },
                    slate: {
                      wrapper: 'glass-panel p-0 overflow-hidden border border-slate-500/10 shadow-lg',
                      btn: 'w-full flex items-center justify-between p-3.5 bg-slate-800/30 hover:bg-slate-700/30 transition-colors border-b border-white/5 cursor-pointer',
                      icon: 'p-2 rounded bg-slate-500/10 text-slate-400',
                      count: 'text-[10px] text-slate-400/80 font-semibold',
                    },
                  };

                  const renderFolder = ({ title, products, isOpen, setOpen, color, emptyMsg, page, setPage }) => {
                    const s = folderStyles[color];
                    const slicedProducts = products.slice((page - 1) * 10, page * 10);
                    return (
                      <div className={s.wrapper}>
                        <button onClick={() => setOpen(!isOpen)} className={s.btn}>
                          <div className="flex items-center gap-3">
                            <div className={s.icon}>
                              {isOpen ? <FolderOpen size={16} /> : <Folder size={16} />}
                            </div>
                            <div className="text-left">
                              <h3 className="font-bold text-white text-xs">{title}</h3>
                              <span className={s.count}>{products.length} adet kayıtlı</span>
                            </div>
                          </div>
                          <div className="text-secondary">
                            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </div>
                        </button>
                        {isOpen && (
                          <div className="animate-fade-in overflow-x-auto">
                            {products.length === 0 ? (
                              <div className="text-center py-4 text-secondary text-xs">{emptyMsg}</div>
                            ) : (
                              <>
                                <table className="w-full text-left text-xs border-collapse">
                                  {renderTableHeaders()}
                                  <tbody className="divide-y divide-white/5">
                                    {slicedProducts.map(renderRow)}
                                  </tbody>
                                </table>
                                {renderPagination(page, products.length, setPage)}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  };

                  if (filteredProducts.length === 0) {
                    return (
                      <div className="glass-panel p-8 text-center text-secondary text-xs">
                        Envanterde aramanıza uygun ürün kartı bulunamadı.
                      </div>
                    );
                  }

                  return (
                    <div className="flex flex-col gap-4 w-full">
                      {renderFolder({
                        title: 'Cihazlar / Telefonlar / Tabletler',
                        products: deviceProducts,
                        isOpen: deviceFolderOpen,
                        setOpen: setDeviceFolderOpen,
                        color: 'indigo',
                        emptyMsg: 'Bu klasörde aramanıza uygun cihaz bulunmamaktadır.',
                        page: pageProdDevice,
                        setPage: setPageProdDevice
                      })}
                      {renderFolder({
                        title: 'Telefon Kılıfları',
                        products: kiliffProducts,
                        isOpen: kiliffFolderOpen,
                        setOpen: setKiliffFolderOpen,
                        color: 'emerald',
                        emptyMsg: 'Bu klasörde aramanıza uygun kılıf bulunmamaktadır.',
                        page: pageProdKilif,
                        setPage: setPageProdKilif
                      })}
                      {renderFolder({
                        title: 'Telefon Kırılmaz Camları',
                        products: camProducts,
                        isOpen: camFolderOpen,
                        setOpen: setCamFolderOpen,
                        color: 'sky',
                        emptyMsg: 'Bu klasörde aramanıza uygun cam bulunmamaktadır.',
                        page: pageProdCam,
                        setPage: setPageProdCam
                      })}
                      {renderFolder({
                        title: 'Şarj Cihazları ve Kablolar',
                        products: sarjProducts,
                        isOpen: sarjFolderOpen,
                        setOpen: setSarjFolderOpen,
                        color: 'amber',
                        emptyMsg: 'Bu klasörde aramanıza uygun şarj ürünü bulunmamaktadır.',
                        page: pageProdSarj,
                        setPage: setPageProdSarj
                      })}
                      {renderFolder({
                        title: 'Bluetooth Kulaklıklar',
                        products: kulaklikProducts,
                        isOpen: kulaklikFolderOpen,
                        setOpen: setKulaklikFolderOpen,
                        color: 'purple',
                        emptyMsg: 'Bu klasörde aramanıza uygun kulaklık bulunmamaktadır.',
                        page: pageProdKulaklik,
                        setPage: setPageProdKulaklik
                      })}
                      {renderFolder({
                        title: 'Diğer Ürünler',
                        products: digerProducts,
                        isOpen: digerFolderOpen,
                        setOpen: setDigerFolderOpen,
                        color: 'slate',
                        emptyMsg: 'Bu klasörde aramanıza uygun ürün bulunmamaktadır.',
                        page: pageProdDiger,
                        setPage: setPageProdDiger
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ==================================================== */}
            {/* TAB: TURKCELL CİHAZ STOK */}
            {/* ==================================================== */}
            {activeTab === 'turkcell_stock' && (
              <div className="animate-fade-in flex flex-col gap-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-white mb-0.5">Turkcell Cihaz Stok Takibi</h2>
                    <p className="text-secondary text-xs">Cihaz stoklarını ve IMEI numaralarını ana cari hesaplardan bağımsız olarak yönetin.</p>
                  </div>
                  <button 
                    onClick={() => setShowAddTcellDevice(true)} 
                    className="btn-primary self-start sm:self-center"
                  >
                    <Plus size={16} />
                    <span>Yeni Cihaz Ekle</span>
                  </button>
                </div>

                {/* Filter and Search */}
                <div className="glass-panel p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full sm:max-w-md">
                    <span className="pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center text-[var(--text-muted)]">
                      <Search size={16} />
                    </span>
                    <input 
                      type="text" 
                      placeholder="Cihaz adı, IMEI veya notlarda ara..." 
                      className="custom-input !pl-10"
                      value={tcellDeviceSearch}
                      onChange={(e) => setTcellDeviceSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs text-secondary whitespace-nowrap">Durum Filtresi:</span>
                    <select
                      className="custom-input bg-slate-800 text-xs py-1.5 px-3 rounded-lg border border-white/10"
                      value={tcellStatusFilter}
                      onChange={(e) => setTcellStatusFilter(e.target.value)}
                    >
                      <option value="Hepsi">Tümü</option>
                      <option value="Stokta">Stokta Olanlar</option>
                      <option value="Satıldı">Satılmış Olanlar</option>
                    </select>
                  </div>
                </div>

                {/* Summary Cards */}
                {(() => {
                  const filteredTcellStock = turkcellStockList.filter(device => {
                    const matchesSearch = !tcellDeviceSearch || 
                      normalizeString(device.device_name).includes(normalizeString(tcellDeviceSearch)) || 
                      (device.imei && normalizeString(device.imei).includes(normalizeString(tcellDeviceSearch))) ||
                      (device.notes && normalizeString(device.notes).includes(normalizeString(tcellDeviceSearch)));
                    
                    const matchesStatus = tcellStatusFilter === 'Hepsi' || device.status === tcellStatusFilter;
                    return matchesSearch && matchesStatus;
                  });

                  const totalCount = filteredTcellStock.length;
                  const inStockCount = filteredTcellStock.filter(d => d.status === 'Stokta').length;
                  const soldCount = filteredTcellStock.filter(d => d.status === 'Satıldı').length;
                  const totalInStockCost = filteredTcellStock
                    .filter(d => d.status === 'Stokta')
                    .reduce((sum, d) => sum + (d.purchase_price || 0), 0);

                  return (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="glass-panel p-4">
                          <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Toplam Cihaz</span>
                          <h3 className="text-xl font-extrabold text-white mt-1">{totalCount} Adet</h3>
                          <span className="text-[10px] text-secondary">Filtrelenmiş toplam kayıt</span>
                        </div>
                        <div className="glass-panel p-4 bg-gradient-to-r from-emerald-950/20 to-emerald-900/10 border border-emerald-500/10">
                          <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Stoktaki Cihazlar</span>
                          <h3 className="text-xl font-extrabold text-emerald-400 mt-1">{inStockCount} Adet</h3>
                          <span className="text-[10px] text-emerald-500/80 font-sans">Satışa hazır cihazlar</span>
                        </div>
                        <div className="glass-panel p-4 bg-gradient-to-r from-rose-950/20 to-rose-900/10 border border-rose-500/10">
                          <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Satılan Cihazlar</span>
                          <h3 className="text-xl font-extrabold text-rose-400 mt-1">{soldCount} Adet</h3>
                          <span className="text-[10px] text-rose-500/80 font-sans">Toplam satışı yapılmış</span>
                        </div>
                        <div className="glass-panel p-4 bg-gradient-to-r from-blue-950/20 to-blue-900/10 border border-blue-500/10">
                          <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Stok Maliyet Değeri</span>
                           <h3 className="text-xl font-extrabold text-blue-400 mt-1">{totalInStockCost.toLocaleString('tr-TR')} TL</h3>
                          <span className="text-[10px] text-blue-500/80 font-sans">Stoktaki cihazların toplam maliyeti</span>
                        </div>
                      </div>

                      {/* Device List Table */}
                      <div className="glass-panel p-0 overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-white/2 flex justify-between items-center">
                          <h4 className="font-bold text-white text-sm">Cihaz Envanter Listesi</h4>
                          <span className="text-xs text-secondary font-mono">{filteredTcellStock.length} cihaz listelendi</span>
                        </div>

                        {filteredTcellStock.length === 0 ? (
                          <div className="p-8 text-center text-secondary text-xs">
                            Kayıtlı cihaz bulunmamaktadır veya filtreleme kriterine uyan sonuç yok.
                          </div>
                        ) : (
                          <>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="border-b border-white/5 text-muted font-semibold bg-white/1">
                                    <th className="p-3">Ekleme Tarihi</th>
                                    <th className="p-3">Cihaz Adı / Model</th>
                                    <th className="p-3">IMEI Numarası</th>
                                    <th className="p-3 text-right">Alış Fiyatı</th>
                                    <th className="p-3 text-right">Satış Fiyatı</th>
                                    <th className="p-3 text-center">Durum</th>
                                    <th className="p-3">Notlar</th>
                                    <th className="p-3 text-right">İşlem</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                  {filteredTcellStock.slice((pageTcellStock - 1) * 10, pageTcellStock * 10).map((device) => (
                                    <tr key={device.id} className="hover:bg-white/1 transition-colors">
                                      <td className="p-3 font-mono text-indigo-400 whitespace-nowrap">{device.date_added}</td>
                                      <td className="p-3 font-semibold text-white">{device.device_name}</td>
                                      <td className="p-3 font-mono text-secondary">{device.imei || '-'}</td>
                                      <td className="p-3 text-right font-mono text-slate-300">{(device.purchase_price || 0).toLocaleString('tr-TR')} TL</td>
                                      <td className="p-3 text-right font-mono font-semibold text-emerald-400">{(device.sale_price || 0).toLocaleString('tr-TR')} TL</td>
                                      <td className="p-3 text-center whitespace-nowrap">
                                        <select
                                          value={device.status}
                                          onChange={(e) => handleToggleTcellDeviceStatus(device, e.target.value)}
                                          className={`bg-slate-900 border text-[11px] rounded px-2 py-1 font-bold cursor-pointer outline-none transition-colors ${
                                            device.status === 'Stokta' 
                                              ? 'border-emerald-500/30 text-emerald-400' 
                                              : 'border-rose-500/30 text-rose-400'
                                          }`}
                                        >
                                          <option value="Stokta" className="text-emerald-400 bg-slate-900">Stokta</option>
                                          <option value="Satıldı" className="text-rose-400 bg-slate-900">Satıldı</option>
                                        </select>
                                      </td>
                                      <td className="p-3 text-secondary truncate max-w-xs" title={device.notes}>{device.notes || '-'}</td>
                                      <td className="p-3 text-right whitespace-nowrap">
                                        <div className="flex justify-end gap-2">
                                          <button 
                                            onClick={() => {
                                              setEditTcellDeviceData(device);
                                              setShowEditTcellDevice(true);
                                            }}
                                            className="px-2 py-1 rounded bg-white/2 hover:bg-white/5 text-[10px] text-white border border-white/5 font-semibold cursor-pointer"
                                          >
                                            Düzenle
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteTcellDevice(device.id, device.device_name)}
                                            className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-[10px] text-rose-400 border border-rose-500/20 font-semibold cursor-pointer"
                                          >
                                            Sil
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            {renderPagination(pageTcellStock, filteredTcellStock.length, setPageTcellStock)}
                          </>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* ==================================================== */}
            {/* TAB: CARİ HESAPLAR */}
            {/* ==================================================== */}
            {activeTab === 'cariler' && (
              <div>
                {!showCariDetails ? (
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                      <div>
                        <h2 className="text-xl font-bold tracking-tight text-white mb-0.5">Cari Hesap ve Müşteri Takibi</h2>
                        <p className="text-secondary text-xs">Müşterilerinizin borç, alacak ve bakiye hareketlerini kontrol edin.</p>
                      </div>
                      <button 
                        onClick={() => setShowAddCari(true)} 
                        className="btn-primary self-start sm:self-center"
                      >
                        <Plus size={16} />
                        <span>Yeni Cari Hesap</span>
                      </button>
                    </div>

                    {/* Search Cari */}
                    <div className="glass-panel p-4 mb-5">
                      <div className="relative w-full sm:max-w-md">
                        <span className="pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center text-[var(--text-muted)]">
                          <Search size={16} />
                        </span>
                        <input 
                          type="text" 
                          placeholder="Cari ismi veya telefon ara..." 
                          className="custom-input !pl-10"
                          value={globalCariSearch}
                          onChange={(e) => setGlobalCariSearch(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Add Cari Modal Overlay */}
                    {showAddCari && (
                      <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm text-xs">
                        <div className="glass-panel p-6 w-full max-w-md bg-slate-900 border border-white/10 animate-fade-in">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-white">Yeni Cari Hesap Kartı</h3>
                            <button onClick={() => setShowAddCari(false)} className="text-secondary hover:text-white">
                              <X size={16} />
                            </button>
                          </div>
                          <form onSubmit={handleCreateCari} className="flex flex-col gap-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] text-secondary block mb-1">Cari Tipi*</label>
                                <select 
                                  className="custom-input"
                                  value={newCari.cari_type}
                                  onChange={(e) => setNewCari({ ...newCari, cari_type: e.target.value })}
                                >
                                  <option value="Bireysel">Bireysel (Şahıs)</option>
                                  <option value="Kurumsal">Kurumsal (Firma)</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] text-secondary block mb-1">Telefon Numarası</label>
                                <input 
                                  type="tel" 
                                  placeholder="+90 5xx..." 
                                  className="custom-input"
                                  value={newCari.phone}
                                  onChange={(e) => setNewCari({ ...newCari, phone: e.target.value })}
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] text-secondary block mb-1">
                                {newCari.cari_type === 'Kurumsal' ? 'Firma Resmi Ünvanı*' : 'Müşteri Adı Soyadı*'}
                              </label>
                              <input 
                                type="text" 
                                required 
                                placeholder={newCari.cari_type === 'Kurumsal' ? 'Örn: Genç Teknoloji Bilişim Hizmetleri Ltd.' : 'Müşteri adını yazın...'} 
                                className="custom-input"
                                value={newCari.name}
                                onChange={(e) => setNewCari({ ...newCari, name: e.target.value })}
                              />
                            </div>

                            {newCari.cari_type === 'Kurumsal' ? (
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[10px] text-secondary block mb-1">Vergi Dairesi*</label>
                                  <input 
                                    type="text" 
                                    required 
                                    placeholder="Örn: Kadıköy V.D." 
                                    className="custom-input"
                                    value={newCari.tax_office}
                                    onChange={(e) => setNewCari({ ...newCari, tax_office: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-secondary block mb-1">Vergi Numarası*</label>
                                  <input 
                                    type="text" 
                                    required 
                                    maxLength={10}
                                    placeholder="10 Haneli vergi no..." 
                                    className="custom-input font-mono"
                                    value={newCari.tax_number}
                                    onChange={(e) => setNewCari({ ...newCari, tax_number: e.target.value.replace(/\D/g, '') })}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div>
                                <label className="text-[10px] text-secondary block mb-1">T.C. Kimlik Numarası (Opsiyonel)</label>
                                <input 
                                  type="text" 
                                  maxLength={11}
                                  placeholder="11 Haneli TC no..." 
                                  className="custom-input font-mono"
                                  value={newCari.tc_number}
                                  onChange={(e) => setNewCari({ ...newCari, tc_number: e.target.value.replace(/\D/g, '') })}
                                />
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] text-secondary block mb-1">E-Posta Adresi</label>
                                <input 
                                  type="email" 
                                  placeholder="eposta@adres.com" 
                                  className="custom-input"
                                  value={newCari.email}
                                  onChange={(e) => setNewCari({ ...newCari, email: e.target.value })}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-secondary block mb-1">Açılış Bakiyesi (Borç)</label>
                                <input 
                                  type="number" 
                                  placeholder="0.00" 
                                  className="custom-input"
                                  value={newCari.balance}
                                  onChange={(e) => setNewCari({ ...newCari, balance: e.target.value })}
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] text-secondary block mb-1">Fatura Adresi</label>
                              <textarea 
                                rows={2} 
                                placeholder="Açık adres..." 
                                className="custom-input resize-none"
                                value={newCari.address}
                                onChange={(e) => setNewCari({ ...newCari, address: e.target.value })}
                              />
                            </div>

                            <div className="flex justify-end gap-2 mt-3">
                              <button 
                                type="button" 
                                onClick={() => setShowAddCari(false)}
                                className="px-4 py-2 rounded-lg text-secondary border border-white/5 hover:bg-white/5"
                              >
                                İptal
                              </button>
                              <button type="submit" className="btn-primary py-2 px-4">
                                Kaydet
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                        {/* Cariler List Table View (Row-by-Row) */}
                        <div className="glass-panel p-0 overflow-hidden border border-indigo-500/10 shadow-lg animate-fade-in text-xs">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-white/5 bg-white/2 text-[10px] text-secondary font-bold uppercase tracking-wider font-sans">
                                  <th className="p-3">Cari Adı / Firma Ünvanı</th>
                                  <th className="p-3">Cari Tipi</th>
                                  <th className="p-3">Telefon</th>
                                  <th className="p-3">Vergi / T.C. No</th>
                                  <th className="p-3">Adres</th>
                                  <th className="p-3 text-right">Güncel Bakiye</th>
                                  <th className="p-3 text-center">İşlemler</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredCariler.length === 0 ? (
                                  <tr>
                                    <td colSpan={7} className="p-8 text-center text-secondary text-xs">
                                      Kayıtlı cari hesap bulunamadı.
                                    </td>
                                  </tr>
                                ) : (
                                  filteredCariler.slice((pageCari - 1) * 10, pageCari * 10).map(cari => (
                                    <tr key={cari.id} className="hover:bg-white/1 border-b border-white/5 transition-colors">
                                      <td className="p-3 font-bold text-white text-xs">
                                        {cari.name}
                                      </td>
                                      <td className="p-3 whitespace-nowrap">
                                        <span className={`badge ${cari.cari_type === 'Kurumsal' ? 'badge-primary' : 'bg-slate-800 text-slate-300'} px-2 py-0.5 rounded text-[9px] font-bold`}>
                                          {cari.cari_type || 'Bireysel'}
                                        </span>
                                      </td>
                                      <td className="p-3 text-slate-300 font-mono whitespace-nowrap">
                                        {cari.phone || '-'}
                                      </td>
                                      <td className="p-3 text-secondary text-[11px] whitespace-nowrap">
                                        {cari.cari_type === 'Kurumsal' ? (
                                          <>
                                            {cari.tax_office && <div>{cari.tax_office} V.D.</div>}
                                            {cari.tax_number && <div className="font-mono text-[10px]">{cari.tax_number}</div>}
                                          </>
                                        ) : (
                                          cari.tc_number && <div className="font-mono text-[10px]">T.C.: {cari.tc_number}</div>
                                        )}
                                      </td>
                                      <td className="p-3 text-secondary truncate max-w-[150px]" title={cari.address}>
                                        {cari.address || '-'}
                                      </td>
                                      <td className="p-3 text-right font-semibold whitespace-nowrap font-sans">
                                        <span className={cari.balance > 0 ? 'text-red-400' : cari.balance < 0 ? 'text-emerald-400' : 'text-secondary'}>
                                          {cari.balance === 0 ? 'Dengede' : `${Math.abs(cari.balance).toLocaleString('tr-TR')} TL`}
                                        </span>
                                        {cari.balance > 0 && <span className="text-[9px] block text-red-500 font-normal">Bize Borçlu</span>}
                                        {cari.balance < 0 && <span className="text-[9px] block text-emerald-500 font-normal">Alacaklı</span>}
                                      </td>
                                      <td className="p-3 text-center whitespace-nowrap">
                                        <div className="flex justify-center gap-1.5">
                                          <button 
                                            onClick={async () => {
                                              setShowCariDetails(cari);
                                              const res = await fetch('/api/sales');
                                              const allSales = await res.json();
                                              setCariTransactions(allSales.filter(s => s.cari_id === cari.id));
                                            }}
                                            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-[10px] text-white flex items-center gap-1 border border-indigo-500/10 font-semibold cursor-pointer"
                                          >
                                            <span>İncele</span>
                                            <ChevronRight size={11} />
                                          </button>
                                          <button 
                                            onClick={() => {
                                              setEditCariData(cari);
                                              setShowEditCari(true);
                                            }}
                                            className="px-2.5 py-1 rounded bg-white/2 hover:bg-white/5 text-[10px] text-white flex items-center gap-1 border border-white/5 font-semibold cursor-pointer"
                                          >
                                            <span>Düzenle</span>
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteCari(cari.id, cari.name)}
                                            className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-[10px] text-rose-400 flex items-center gap-1 border border-rose-500/20 font-semibold cursor-pointer"
                                          >
                                            <Trash2 size={11} />
                                            <span>Sil</span>
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                          {renderPagination(pageCari, filteredCariler.length, setPageCari)}
                        </div>
                  </div>
                ) : (
                  // CARI DETAILS COMPONENT
                  <div>
                    <button 
                      onClick={() => setShowCariDetails(null)}
                      className="px-3 py-1.5 rounded-lg border border-white/5 bg-white/2 hover:bg-white/5 text-xs text-secondary mb-5 inline-flex items-center gap-1.5"
                    >
                      ← Cari Listesine Dön
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Left: Cari Account Card */}
                      <div className="flex flex-col gap-5">
                        <div className="glass-panel p-5">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-white text-md">Cari Bilgileri</h3>
                            <span className={`badge ${showCariDetails.cari_type === 'Kurumsal' ? 'badge-primary' : 'bg-slate-800 text-slate-300'} px-2 py-0.5 rounded text-[9px] font-bold`}>
                              {showCariDetails.cari_type || 'Bireysel'}
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-3 text-xs">
                            <div>
                              <span className="text-[9px] text-muted block">Müşteri Adı</span>
                              <span className="font-bold text-white text-sm">{showCariDetails.name}</span>
                            </div>
                            {showCariDetails.phone && (
                              <div>
                                <span className="text-[9px] text-muted block">Telefon</span>
                                <span className="text-secondary">{showCariDetails.phone}</span>
                              </div>
                            )}
                            {showCariDetails.email && (
                              <div>
                                <span className="text-[9px] text-muted block">E-Posta</span>
                                <span className="text-secondary">{showCariDetails.email}</span>
                              </div>
                            )}

                            {/* Invoicing details in detailed view */}
                            {showCariDetails.cari_type === 'Kurumsal' ? (
                              <>
                                <div>
                                  <span className="text-[9px] text-muted block">Vergi Dairesi</span>
                                  <span className="text-secondary">{showCariDetails.tax_office || '-'}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-muted block">Vergi Numarası</span>
                                  <span className="text-secondary font-mono">{showCariDetails.tax_number || '-'}</span>
                                </div>
                              </>
                            ) : (
                              showCariDetails.tc_number && (
                                <div>
                                  <span className="text-[9px] text-muted block">T.C. Kimlik No</span>
                                  <span className="text-secondary font-mono">{showCariDetails.tc_number}</span>
                                </div>
                              )
                            )}

                            {showCariDetails.address && (
                              <div>
                                <span className="text-[9px] text-muted block">Fatura Adresi</span>
                                <span className="text-secondary leading-normal block bg-black/10 p-2 rounded border border-white/5">{showCariDetails.address}</span>
                              </div>
                            )}

                            <div className="pt-3 border-t border-white/5 mt-2">
                              <span className="text-[9px] text-muted block">Hesap Bakiyesi</span>
                              <span className={`text-lg font-extrabold ${showCariDetails.balance > 0 ? 'text-red-400' : showCariDetails.balance < 0 ? 'text-emerald-400' : 'text-white'}`}>
                                {showCariDetails.balance.toLocaleString('tr-TR')} TL
                              </span>
                              <span className="text-[10px] text-secondary block mt-1">
                                {showCariDetails.balance > 0 ? 'Müşterinin bize borcu bulunuyor.' : showCariDetails.balance < 0 ? 'Müşterinin bizden alacağı bulunuyor.' : 'Hesap dengelenmiştir.'}
                              </span>
                            </div>

                            <div className="pt-3 border-t border-white/5 mt-2 flex gap-2">
                              <button 
                                onClick={() => {
                                  setEditCariData(showCariDetails);
                                  setShowEditCari(true);
                                }}
                                className="px-3 py-1.5 rounded bg-white/2 hover:bg-white/5 text-[11px] text-white flex items-center justify-center gap-1 border border-white/5 flex-1 font-semibold"
                              >
                                Düzenle
                              </button>
                              <button 
                                onClick={() => handleDeleteCari(showCariDetails.id, showCariDetails.name)}
                                className="px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-[11px] text-red-400 flex items-center justify-center gap-1 border border-red-500/20 font-semibold"
                              >
                                Cariyi Sil
                              </button>
                            </div>

                          </div>
                        </div>

                        {/* Add Tahsilat Form */}
                        <div className="glass-panel p-5">
                          <h4 className="font-bold text-white text-sm mb-3">Tahsilat / Ödeme Girişi</h4>
                          <form onSubmit={handleAddTahsilat} className="flex flex-col gap-3">
                            <div>
                              <label className="text-[10px] text-secondary block mb-1">Hareketi Seçin</label>
                              <div className="flex gap-2">
                                <span className="badge badge-success py-1.5 px-3">Tahsilat (Ödeme Aldım)</span>
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] text-secondary block mb-1">Tutar (TL)*</label>
                              <input 
                                type="number" 
                                required 
                                placeholder="0.00" 
                                className="custom-input text-xs"
                                value={tahsilatAmount}
                                onChange={(e) => setTahsilatAmount(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-secondary block mb-1">Açıklama</label>
                              <input 
                                type="text" 
                                placeholder="Örn: Banka havalesi, Nakit ödeme..." 
                                className="custom-input text-xs"
                                value={tahsilatDesc}
                                onChange={(e) => setTahsilatDesc(e.target.value)}
                              />
                            </div>
                            <button type="submit" className="btn-primary w-full justify-center py-2 text-xs mt-2 bg-gradient-to-r from-emerald-500 to-teal-600">
                              Tahsilat Kaydet
                            </button>
                          </form>
                        </div>
                      </div>

                      {/* Right: Cari History */}
                      <div className="lg:col-span-2 glass-panel p-5">
                        <h3 className="font-bold text-white text-sm mb-4">Hesap Satış Geçmişi</h3>
                        <div className="flex flex-col gap-3">
                          {cariTransactions.length === 0 ? (
                            <div className="text-center py-8 text-secondary text-xs">Bu cariye ait satış işlemi bulunamadı.</div>
                          ) : (
                            <>
                              <div className="flex flex-col gap-3">
                                {cariTransactions.slice((pageCariTx - 1) * 10, pageCariTx * 10).map((tx) => (
                                  <div key={tx.id} className="p-3 rounded-lg border border-white/5 bg-white/2 flex justify-between items-center text-xs">
                                    <div>
                                      <span className="text-[9px] text-indigo-400 font-bold block">{tx.date}</span>
                                      <h5 className="font-semibold text-white mt-0.5">
                                        {tx.items?.map(i => `${i.name} x${i.quantity}`).join(', ') ?? tx.description}
                                      </h5>
                                      <span className="text-[10px] text-secondary mt-1 block">Fatura No: {tx.id} ({tx.payment_method})</span>
                                    </div>
                                    <span className="font-bold text-white shrink-0">
                                      {(tx.total_amount ?? tx.amount).toLocaleString('tr-TR')} TL
                                    </span>
                                  </div>
                                ))}
                              </div>
                              {renderPagination(pageCariTx, cariTransactions.length, setPageCariTx)}
                            </>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'debt' && (
              <div className="animate-fade-in flex flex-col gap-5">
                <div className="mb-5">
                  <h2 className="text-xl font-bold tracking-tight text-white mb-0.5">Müşteri Borç Takibi</h2>
                  <p className="text-secondary text-xs">Müşterilerin güncel borç durumlarını, aldıkları ürünleri ve yaptıkları ödemeleri takip edin.</p>
                </div>
                
                {/* Arama ve Genel Düzen Izgarası */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Sol Sütun: Borçlu Müşteri Listesi */}
                  <div className="flex flex-col gap-4">
                    {/* Toplam Alacak Özet Kartı */}
                    <div className="glass-panel p-4 bg-gradient-to-r from-red-950/20 to-indigo-950/25 border border-red-500/10 flex justify-between items-center mb-1">
                      <div>
                        <span className="text-[10px] text-muted uppercase font-bold tracking-wider block">Toplam Borç Alacağı</span>
                        <h3 className="text-lg font-extrabold text-red-400 font-mono mt-0.5">
                          {customers.filter(c => c.balance > 0).reduce((sum, c) => sum + c.balance, 0).toLocaleString('tr-TR')} TL
                        </h3>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
                        <TrendingUp size={16} />
                      </div>
                    </div>

                    <div className="glass-panel p-4 flex gap-2">
                      <div className="relative flex-1">
                        <span className="pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center text-[var(--text-muted)]">
                          <Search size={16} />
                        </span>
                        <input 
                          type="text" 
                          placeholder="Müşteri ara..." 
                          className="custom-input !pl-10 text-xs"
                          value={debtSearch}
                          onChange={(e) => setDebtSearch(e.target.value)}
                        />
                      </div>
                      <button 
                        onClick={() => setShowAddCari(true)} 
                        className="btn-primary text-xs shrink-0 py-1.5 px-3 flex items-center gap-1 font-semibold"
                      >
                        <Plus size={14} />
                        <span>Müşteri Ekle</span>
                      </button>
                    </div>
                    
                    {/* Borçlu Müşterilerin Listesi */}
                    <div className="flex flex-col gap-3 overflow-y-auto max-h-[60vh]">
                      {(() => {
                        const debtors = customers
                          .filter(c => c.balance > 0)
                          .filter(c => !debtSearch || normalizeString(c.name).includes(normalizeString(debtSearch)));
                          
                        if (debtors.length === 0) {
                          return (
                            <div className="glass-panel p-6 text-center text-secondary text-xs">
                              Aktif borcu olan müşteri bulunamadı.
                            </div>
                          );
                        }
                        
                        const paginatedDebtors = debtors.slice((pageDebt - 1) * 10, pageDebt * 10);
                        
                        return (
                          <>
                            {paginatedDebtors.map(cari => {
                              const isSelected = selectedDebtCariId === cari.id;
                              return (
                                <button
                                  key={cari.id}
                                  onClick={async () => {
                                    setSelectedDebtCariId(cari.id);
                                    setEditingTxId(null); // Düzenleme modunu kapat
                                    try {
                                      const txs = await dbService.getCariTransactions(cari.id);
                                      setSelectedCariTxList(txs);
                                    } catch (e: unknown) {
                                      console.error(e);
                                    }
                                  }}
                                  className={`glass-panel p-4 text-left transition-all duration-200 border cursor-pointer ${
                                    isSelected 
                                      ? 'border-indigo-500 bg-indigo-950/20 shadow-indigo-500/10 shadow-lg' 
                                      : 'border-white/5 hover:border-white/10 hover:bg-white/2'
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <span className={`badge ${cari.cari_type === 'Kurumsal' ? 'badge-primary' : 'bg-slate-800 text-slate-300'} px-1.5 py-0.2 rounded text-[8px] font-bold`}>
                                      {cari.cari_type || 'Bireysel'}
                                    </span>
                                    <span className="font-bold text-red-400 text-xs font-mono">{cari.balance.toLocaleString('tr-TR')} TL</span>
                                  </div>
                                  <h4 className="font-bold text-white text-xs leading-snug">{cari.name}</h4>
                                  {cari.phone && <span className="text-[10px] text-secondary font-sans block mt-1">Tel: {cari.phone}</span>}
                                </button>
                              );
                            })}
                            {renderPagination(pageDebt, debtors.length, setPageDebt)}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  
                  {/* Sağ Sütun: Müşteri Borç Detayları */}
                  <div className="lg:col-span-2 flex flex-col gap-5">
                    {(() => {
                      const selectedCari = customers.find(c => c.id === selectedDebtCariId);
                      if (!selectedCari) {
                        return (
                          <div className="glass-panel p-8 text-center text-secondary text-xs flex flex-col items-center justify-center min-h-[40vh]">
                            <UserCheck size={36} className="text-muted mb-3 opacity-40" />
                            <span>Borç detaylarını, satın alınan ürünleri ve ödeme geçmişini görüntülemek için sol taraftan bir müşteri seçin.</span>
                          </div>
                        );
                      }
                      
                      const purchases = selectedCariTxList.filter(tx => tx.type === 'Satış' || tx.type === 'Devir Borç' || tx.type === 'Borç');
                      const payments = selectedCariTxList.filter(tx => tx.type === 'Tahsilat' || tx.type === 'Ödeme' || tx.type === 'Devir Alacak');
                      
                      return (
                        <div className="flex flex-col gap-5 animate-fade-in">
                          {/* Genel Durum Kartı */}
                          <div className="glass-panel p-5 bg-gradient-to-b from-slate-900 to-indigo-950/20">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="font-bold text-white text-sm leading-snug">{selectedCari.name}</h3>
                                {selectedCari.phone && <span className="text-xs text-secondary mt-1 block">Tel: {selectedCari.phone}</span>}
                                {selectedCari.email && <span className="text-xs text-secondary block">E-Posta: {selectedCari.email}</span>}
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-muted block uppercase font-bold tracking-wider">Toplam Kalan Borç</span>
                                <span className="text-xl font-extrabold text-red-400 font-mono mt-1 block">{selectedCari.balance.toLocaleString('tr-TR')} TL</span>
                              </div>
                            </div>
                            
                            {/* Vergi/Adres Bilgileri */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5 text-[11px] text-secondary">
                              <div>
                                {selectedCari.cari_type === 'Kurumsal' ? (
                                  <>
                                    <div><strong>Vergi Dairesi:</strong> {selectedCari.tax_office || '-'}</div>
                                    <div><strong>Vergi Numarası:</strong> {selectedCari.tax_number || '-'}</div>
                                  </>
                                ) : (
                                  selectedCari.tc_number && <div><strong>T.C. Kimlik No:</strong> {selectedCari.tc_number}</div>
                                )}
                              </div>
                              <div>
                                {selectedCari.address && <div className="truncate"><strong>Fatura Adresi:</strong> {selectedCari.address}</div>}
                              </div>
                            </div>
                          </div>

                          {/* Parça Parça Ödeme ve Borç Girişi Formu */}
                          <div className={`glass-panel p-4 bg-slate-900/40 border transition-all duration-300 ${
                            debtActionType === 'tahsilat' ? 'border-emerald-500/15' : 'border-indigo-500/15'
                          }`}>
                            <div className={`flex items-center gap-2 mb-3 pb-1.5 border-b border-white/5 ${
                              debtActionType === 'tahsilat' ? 'text-emerald-400' : 'text-indigo-400'
                            }`}>
                              <Coins size={14} />
                              <h4 className="font-bold text-xs text-white">
                                {debtActionType === 'tahsilat' ? 'Parça Ödeme Girişi (Tahsilat)' : 'Müşteri Borç Ekleme (Borç Yaz)'}
                              </h4>
                            </div>
                            <form onSubmit={handleDebtTahsilat} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end text-xs">
                              <div className="md:col-span-3">
                                <label className="text-[10px] text-secondary block mb-1">İşlem Tipi*</label>
                                <select 
                                  className="custom-input text-xs font-semibold"
                                  value={debtActionType}
                                  onChange={(e) => {
                                    setDebtActionType(e.target.value);
                                    setTahsilatAmount('');
                                    setTahsilatDesc('');
                                  }}
                                >
                                  <option value="tahsilat">Tahsilat (Ödeme Alındı)</option>
                                  <option value="borc_ekle">Borç Girişi (Borç Ekle)</option>
                                </select>
                              </div>
                              <div className="md:col-span-2">
                                <label className="text-[10px] text-secondary block mb-1">
                                  {debtActionType === 'tahsilat' ? 'Ödeme Tutarı (TL)*' : 'Borç Tutarı (TL)*'}
                                </label>
                                <input 
                                  type="number" 
                                  required 
                                  placeholder="0.00" 
                                  className="custom-input text-xs font-mono" 
                                  value={tahsilatAmount}
                                  onChange={(e) => setTahsilatAmount(e.target.value)}
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="text-[10px] text-secondary block mb-1">İşlem Tarihi*</label>
                                <input 
                                  type="date" 
                                  required 
                                  className="custom-input text-xs font-mono" 
                                  value={tahsilatDate}
                                  onChange={(e) => setTahsilatDate(e.target.value)}
                                />
                              </div>
                              <div className="md:col-span-5">
                                <label className="text-[10px] text-secondary block mb-1">Açıklama</label>
                                <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    placeholder={debtActionType === 'tahsilat' ? 'Örn: Nakit ödeme, havale...' : 'Örn: Servis ücreti, elden borç...'} 
                                    className="custom-input text-xs" 
                                    value={tahsilatDesc}
                                    onChange={(e) => setTahsilatDesc(e.target.value)}
                                  />
                                  <button 
                                    type="submit" 
                                    className={`btn-primary shrink-0 py-1 px-4 h-[41px] text-xs cursor-pointer border font-bold transition-all duration-300 ${
                                      debtActionType === 'tahsilat' 
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 border-emerald-500/10' 
                                        : 'bg-gradient-to-r from-indigo-500 to-violet-600 border-indigo-500/10'
                                    }`}
                                  >
                                    Kaydet
                                  </button>
                                </div>
                              </div>
                            </form>
                          </div>
                          
                          {/* Detay Listeleri (Satışlar vs Tahsilatlar) */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            
                            {/* Satış Geçmişi (Aldığı Ürünler) */}
                            <div className="glass-panel p-4 flex flex-col gap-3">
                              <h4 className="font-bold text-white text-xs border-b border-white/5 pb-2 flex justify-between items-center">
                                <span>Aldığı Ürünler (Satışlar)</span>
                                <span className="badge badge-primary font-mono text-[9px]">{purchases.length} Adet</span>
                              </h4>
                              
                              <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[300px] pr-1">
                                {purchases.length === 0 ? (
                                  <div className="text-center py-6 text-muted text-[11px]">Satın alım kaydı bulunmamaktadır.</div>
                                ) : (
                                  purchases.map(tx => (
                                    <div key={tx.id} className="p-2.5 rounded bg-white/2 border border-white/5 text-[11px] hover:bg-white/5 transition-colors group">
                                      {editingTxId === tx.id ? (
                                        /* Düzenleme Modu */
                                        <div className="w-full flex flex-col gap-2">
                                          <div className="grid grid-cols-2 gap-2">
                                            <div>
                                              <label className="text-[9px] text-secondary block mb-0.5">Tarih</label>
                                              <input 
                                                type="date" 
                                                className="custom-input py-1 text-[11px] h-7 font-mono" 
                                                value={editTxDate}
                                                onChange={(e) => setEditTxDate(e.target.value)}
                                              />
                                            </div>
                                            <div>
                                              <label className="text-[9px] text-secondary block mb-0.5">Tutar (TL)</label>
                                              <input 
                                                type="number" 
                                                className="custom-input py-1 text-[11px] h-7 font-mono" 
                                                value={editTxAmount}
                                                onChange={(e) => setEditTxAmount(e.target.value)}
                                              />
                                            </div>
                                          </div>
                                          <div>
                                            <label className="text-[9px] text-secondary block mb-0.5">Açıklama</label>
                                            <input 
                                              type="text" 
                                              className="custom-input py-1 text-[11px] h-7" 
                                              value={editTxDesc}
                                              onChange={(e) => setEditTxDesc(e.target.value)}
                                            />
                                          </div>
                                          <div className="flex justify-end gap-1.5 mt-1">
                                            <button 
                                              onClick={() => setEditingTxId(null)}
                                              className="px-2 py-0.5 rounded text-[10px] text-secondary border border-white/5 hover:bg-white/5"
                                            >
                                              İptal
                                            </button>
                                            <button 
                                              onClick={() => handleSaveTxEdit(tx.id)}
                                              className="px-2.5 py-0.5 rounded text-[10px] text-white bg-indigo-600 hover:bg-indigo-500 font-semibold"
                                            >
                                              Kaydet
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        /* Normal Görünüm */
                                        <div className="flex justify-between items-start w-full">
                                          <div className="min-w-0 pr-2">
                                            <span className="font-mono text-[9px] text-indigo-400 block">{tx.date}</span>
                                            <h5 className="font-semibold text-white mt-1 leading-snug break-words">{tx.description}</h5>
                                          </div>
                                          <div className="flex items-center gap-2 shrink-0 ml-2">
                                            <span className="font-bold text-white font-mono">{tx.amount.toLocaleString('tr-TR')} TL</span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button 
                                                onClick={() => {
                                                  setEditingTxId(tx.id);
                                                  setEditTxAmount(tx.amount.toString());
                                                  setEditTxDesc(tx.description);
                                                  setEditTxDate(tx.date);
                                                }}
                                                className="text-indigo-400 hover:text-indigo-300 font-medium text-[9px] px-1 py-0.5 rounded hover:bg-white/5"
                                                title="Düzenle"
                                              >
                                                Düzenle
                                              </button>
                                              <button 
                                                onClick={() => handleDeleteTransaction(tx.id, tx.description)}
                                                className="text-red-400 hover:text-red-300 p-0.5"
                                                title="Sil"
                                              >
                                                <Trash2 size={11} />
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                            
                            {/* Ödeme Geçmişi (Tahsilatlar) */}
                            <div className="glass-panel p-4 flex flex-col gap-3">
                              <h4 className="font-bold text-white text-xs border-b border-white/5 pb-2 flex justify-between items-center">
                                <span>Ödeme Geçmişi (Tahsilatlar)</span>
                                <span className="badge badge-success font-mono text-[9px]">{payments.length} Adet</span>
                              </h4>
                              
                              <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[300px] pr-1">
                                {payments.length === 0 ? (
                                  <div className="text-center py-6 text-muted text-[11px]">Ödeme kaydı bulunmamaktadır.</div>
                                ) : (
                                  payments.map(tx => (
                                    <div key={tx.id} className="p-2.5 rounded bg-white/2 border border-white/5 text-[11px] hover:bg-white/5 transition-colors group">
                                      {editingTxId === tx.id ? (
                                        /* Düzenleme Modu */
                                        <div className="w-full flex flex-col gap-2">
                                          <div className="grid grid-cols-2 gap-2">
                                            <div>
                                              <label className="text-[9px] text-secondary block mb-0.5">Tarih</label>
                                              <input 
                                                type="date" 
                                                className="custom-input py-1 text-[11px] h-7 font-mono" 
                                                value={editTxDate}
                                                onChange={(e) => setEditTxDate(e.target.value)}
                                              />
                                            </div>
                                            <div>
                                              <label className="text-[9px] text-secondary block mb-0.5">Tutar (TL)</label>
                                              <input 
                                                type="number" 
                                                className="custom-input py-1 text-[11px] h-7 font-mono" 
                                                value={editTxAmount}
                                                onChange={(e) => setEditTxAmount(e.target.value)}
                                              />
                                            </div>
                                          </div>
                                          <div>
                                            <label className="text-[9px] text-secondary block mb-0.5">Açıklama</label>
                                            <input 
                                              type="text" 
                                              className="custom-input py-1 text-[11px] h-7" 
                                              value={editTxDesc}
                                              onChange={(e) => setEditTxDesc(e.target.value)}
                                            />
                                          </div>
                                          <div className="flex justify-end gap-1.5 mt-1">
                                            <button 
                                              onClick={() => setEditingTxId(null)}
                                              className="px-2 py-0.5 rounded text-[10px] text-secondary border border-white/5 hover:bg-white/5"
                                            >
                                              İptal
                                            </button>
                                            <button 
                                              onClick={() => handleSaveTxEdit(tx.id)}
                                              className="px-2.5 py-0.5 rounded text-[10px] text-white bg-indigo-600 hover:bg-indigo-500 font-semibold"
                                            >
                                              Kaydet
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        /* Normal Görünüm */
                                        <div className="flex justify-between items-start w-full">
                                          <div className="min-w-0 pr-2">
                                            <span className="font-mono text-[9px] text-emerald-400 block">{tx.date}</span>
                                            <h5 className="font-semibold text-white mt-1 leading-snug break-words">{tx.description}</h5>
                                          </div>
                                          <div className="flex items-center gap-2 shrink-0 ml-2">
                                            <span className="font-bold text-emerald-400 font-mono">-{tx.amount.toLocaleString('tr-TR')} TL</span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button 
                                                onClick={() => {
                                                  setEditingTxId(tx.id);
                                                  setEditTxAmount(tx.amount.toString());
                                                  setEditTxDesc(tx.description);
                                                  setEditTxDate(tx.date);
                                                }}
                                                className="text-indigo-400 hover:text-indigo-300 font-medium text-[9px] px-1 py-0.5 rounded hover:bg-white/5"
                                                title="Düzenle"
                                              >
                                                Düzenle
                                              </button>
                                              <button 
                                                onClick={() => handleDeleteTransaction(tx.id, tx.description)}
                                                className="text-red-400 hover:text-red-300 p-0.5"
                                                title="Sil"
                                              >
                                                <Trash2 size={11} />
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                            
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

                        {activeTab === 'reports' && (
              <div className="animate-fade-in flex flex-col gap-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-3">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-white mb-0.5 font-sans">Satış Analizi</h2>
                    <p className="text-secondary text-xs">Ciro, kârlılık oranları, haftalık/aylık grafik analizleri ve detaylı ürün raporları.</p>
                  </div>
                  
                  {/* Sub-tab selection */}
                  <div className="flex bg-white/5 border border-white/10 p-0.5 rounded-lg text-xs self-start sm:self-center">
                    <button 
                      onClick={() => setReportSubTab('analiz')}
                      className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${reportSubTab === 'analiz' ? 'bg-indigo-600 text-white' : 'text-secondary hover:text-white'}`}
                    >
                      Analiz & Grafikler
                    </button>
                    <button 
                      onClick={() => setReportSubTab('detay')}
                      className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${reportSubTab === 'detay' ? 'bg-indigo-600 text-white' : 'text-secondary hover:text-white'}`}
                    >
                      Detaylı Ürün Raporları
                    </button>
                  </div>
                </div>

                {reportSubTab === 'analiz' ? (
                  <div className="animate-fade-in flex flex-col gap-5">
                    {/* Metrics Cards */}
                    <section className="metrics-grid">
                      <div className="glass-panel metric-card">
                        <div>
                          <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Bugünkü Satış</span>
                          <h3 className="text-xl font-extrabold text-white mt-1 font-mono">{metrics.todaySales.toLocaleString('tr-TR')} TL</h3>
                          <span className="text-[10px] text-indigo-400">Aktif ciro</span>
                        </div>
                        <div className="metric-icon bg-indigo-500/10 text-indigo-400">
                          <Coins size={20} />
                        </div>
                      </div>

                      <div className="glass-panel metric-card">
                        <div>
                          <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Bu Haftaki Satış</span>
                          <h3 className="text-xl font-extrabold text-white mt-1 font-mono">{metrics.weekSales.toLocaleString('tr-TR')} TL</h3>
                          <span className="text-[10px] text-success">Son 7 gün</span>
                        </div>
                        <div className="metric-icon bg-success-glow text-success">
                          <TrendingUp size={20} />
                        </div>
                      </div>

                      <div className="glass-panel metric-card">
                        <div>
                          <span className="text-[10px] font-semibold text-muted uppercase tracking-wider font-bold">Bu Ayki Toplam</span>
                          <h3 className="text-xl font-extrabold text-white mt-1 font-mono">{metrics.monthSales.toLocaleString('tr-TR')} TL</h3>
                          <span className="text-[10px] text-sky-400">Son 30 gün</span>
                        </div>
                        <div className="metric-icon bg-sky-500/10 text-sky-400">
                          <Coins size={20} />
                        </div>
                      </div>

                      <div className="glass-panel metric-card">
                        <div>
                          <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Toplam Gider</span>
                          <h3 className="text-xl font-extrabold text-red-400 mt-1 font-mono">{metrics.totalExpenses ? metrics.totalExpenses.toLocaleString('tr-TR') : 0} TL</h3>
                          <span className="text-[10px] text-red-400/80">Kayıtlı tüm gider kalemleri</span>
                        </div>
                        <div className="metric-icon bg-red-500/10 text-red-400">
                          <ArrowDownLeft size={20} />
                        </div>
                      </div>

                      <div className="glass-panel metric-card bg-gradient-to-br from-emerald-950/20 to-emerald-900/10 border border-emerald-500/15">
                        <div>
                          <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block text-emerald-400 font-bold">Net İşletme Kârı</span>
                          <h3 className="text-xl font-extrabold text-emerald-400 mt-1 font-mono">{(metrics.totalCihazProfit + metrics.totalAksesuarProfit - metrics.totalExpenses).toLocaleString('tr-TR')} TL</h3>
                          <div className="flex flex-col gap-0.5 mt-1">
                            <span className="text-[10px] text-emerald-500/80">Cihaz: {metrics.totalCihazProfit.toLocaleString('tr-TR')} TL</span>
                            <span className="text-[10px] text-emerald-500/80">Aksesuar: {metrics.totalAksesuarProfit.toLocaleString('tr-TR')} TL − Giderler</span>
                          </div>
                        </div>
                        <div className="metric-icon bg-emerald-500/15 text-emerald-400 border border-emerald-500/10">
                          <ArrowUpRight size={20} />
                        </div>
                      </div>
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Weekly & Monthly Charts */}
                      <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Weekly sales chart */}
                        <div className="glass-panel p-5">
                          <h4 className="font-bold text-white text-sm mb-4">Haftalık Satış Analizi (Son 7 Gün)</h4>
                          {renderLineChart(weeklyChart, 'weekly')}
                        </div>

                        {/* Monthly chart */}
                        <div className="glass-panel p-5">
                          <h4 className="font-bold text-white text-sm mb-4">Aylık Satış Analizi (Son Ay)</h4>
                          {renderLineChart(monthlyChart, 'monthly')}
                        </div>
                      </div>

                      {/* Sidebar stats & Critical Stock */}
                      <div className="flex flex-col gap-6">
                        {/* Son Gider Kayıtları */}
                        <div className="glass-panel p-5">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-white text-sm">Son Gider Kayıtları</h4>
                            <span className="badge badge-danger">Giderler</span>
                          </div>

                          <div className="flex flex-col gap-3">
                            {expensesList.length === 0 ? (
                              <div className="text-center py-4 text-secondary text-xs">Kayıtlı gider bulunmamaktadır.</div>
                            ) : (
                              expensesList.slice(0, 5).map(exp => (
                                <div key={exp.id} className="p-3 rounded-lg bg-red-500/5 border border-red-500/10 flex justify-between items-center text-xs">
                                  <div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <h5 className="font-semibold text-white truncate max-w-[120px]">{exp.description}</h5>
                                      <span className={`text-[7px] px-1 py-0.2 rounded font-bold font-mono ${
                                        exp.category === 'Kargo' ? 'bg-orange-500/25 text-orange-400 border border-orange-500/10' :
                                        exp.category === 'Emanet' ? 'bg-blue-500/25 text-blue-400 border border-blue-500/10' :
                                        exp.category === 'Teknik Servis' ? 'bg-purple-500/25 text-purple-400 border border-purple-500/10' :
                                        'bg-emerald-500/25 text-emerald-400 border border-emerald-500/10'
                                      }`}>
                                        {exp.category || 'Genel Gider'}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-muted block mt-0.5">{exp.date}</span>
                                  </div>
                                  <span className="text-red-400 font-bold bg-red-500/15 px-2 py-0.5 rounded font-mono shrink-0">
                                    -{exp.amount.toLocaleString('tr-TR')} TL
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Recent Transactions list */}
                        <div className="glass-panel p-5">
                          <h4 className="font-bold text-white text-sm mb-4">Son Satış İşlemleri</h4>
                          <div className="flex flex-col gap-3">
                            {sales.slice(0, 5).map((sale) => (
                              <div key={sale.id} className="p-3 rounded-lg border border-white/5 bg-white/2 flex justify-between items-center text-xs">
                                <div className="min-w-0 pr-2">
                                  <h5 className="font-semibold text-white truncate">
                                    {sale.items.map(item => item.name).join(', ')}
                                  </h5>
                                  <div className="flex items-center gap-1.5 text-[10px] text-secondary mt-0.5">
                                    <span>{sale.date}</span>
                                    <span>•</span>
                                    <span>{customers.find(c => c.id === sale.cari_id)?.name || 'Peşin Satış'}</span>
                                  </div>
                                </div>
                                <span className="font-bold text-white shrink-0 font-mono">
                                  {sale.total_amount.toLocaleString('tr-TR')} TL
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="animate-fade-in flex flex-col gap-5">
                    {/* Report Filters */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 glass-panel px-3 py-1.5 border border-white/5">
                        <span className="text-xs text-secondary font-medium">Dönem:</span>
                        <select 
                          value={reportRangeFilter}
                          onChange={(e) => setReportRangeFilter(e.target.value)}
                          className="bg-transparent border-0 text-white font-semibold text-xs focus:ring-0 cursor-pointer outline-none font-sans mr-2"
                          style={{ colorScheme: 'dark' }}
                        >
                          <option value="today" className="bg-neutral-900 text-white">Bugün</option>
                          <option value="7days" className="bg-neutral-900 text-white">Son 7 Gün</option>
                          <option value="month" className="bg-neutral-900 text-white">Son Ay</option>
                          <option value="3months" className="bg-neutral-900 text-white">Son 3 Ay</option>
                          <option value="all" className="bg-neutral-900 text-white">Tüm Zamanlar</option>
                          <option value="custom" className="bg-neutral-900 text-white">Özel Tarih</option>
                        </select>
                      </div>

                      {reportRangeFilter === 'custom' && (
                        <div className="flex items-center gap-2 glass-panel px-3.5 py-1.5 border border-white/5 animate-fade-in">
                          <span className="text-xs text-secondary font-medium">Tarih:</span>
                          <input 
                            type="date" 
                            className="bg-transparent border-0 text-white font-semibold text-xs focus:ring-0 cursor-pointer outline-none font-mono"
                            value={reportDateFilter}
                            onChange={(e) => setReportDateFilter(e.target.value)}
                          />
                        </div>
                      )}

                      <div className="relative w-full sm:max-w-md">
                        <span className="pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center text-[var(--text-muted)]">
                          <Search size={16} />
                        </span>
                        <input 
                          type="text" 
                          placeholder="Raporda ürün adı veya barkod ara..." 
                          className="custom-input !pl-10 text-xs w-full font-sans"
                          value={reportSearch}
                          onChange={(e) => setReportSearch(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Compile data */}
                    {(() => {
                      const today = new Date();
                      const todayStr = today.toLocaleDateString('sv-SE');
                      
                      let salesForReport = [];
                      let expensesForReport = [];
                      const isGenel = (e) => !e.category || e.category === 'Genel Gider';
                      if (reportRangeFilter === 'today') {
                        salesForReport = sales.filter(s => s.date === todayStr);
                        expensesForReport = expensesList.filter(e => e.date === todayStr && isGenel(e));
                      } else if (reportRangeFilter === '7days') {
                        const limitDate = new Date();
                        limitDate.setDate(today.getDate() - 7);
                        const limitStr = limitDate.toLocaleDateString('sv-SE');
                        salesForReport = sales.filter(s => s.date >= limitStr && s.date <= todayStr);
                        expensesForReport = expensesList.filter(e => e.date >= limitStr && e.date <= todayStr && isGenel(e));
                      } else if (reportRangeFilter === 'month') {
                        const limitDate = new Date();
                        limitDate.setMonth(today.getMonth() - 1);
                        const limitStr = limitDate.toLocaleDateString('sv-SE');
                        salesForReport = sales.filter(s => s.date >= limitStr && s.date <= todayStr);
                        expensesForReport = expensesList.filter(e => e.date >= limitStr && e.date <= todayStr && isGenel(e));
                      } else if (reportRangeFilter === '3months') {
                        const limitDate = new Date();
                        limitDate.setMonth(today.getMonth() - 3);
                        const limitStr = limitDate.toLocaleDateString('sv-SE');
                        salesForReport = sales.filter(s => s.date >= limitStr && s.date <= todayStr);
                        expensesForReport = expensesList.filter(e => e.date >= limitStr && e.date <= todayStr && isGenel(e));
                      } else if (reportRangeFilter === 'all') {
                        salesForReport = sales;
                        expensesForReport = expensesList.filter(e => isGenel(e));
                      } else {
                        salesForReport = sales.filter(s => s.date === reportDateFilter);
                        expensesForReport = expensesList.filter(e => e.date === reportDateFilter && isGenel(e));
                      }

                      const totalExpensesForReport = expensesForReport.reduce((sum, e) => sum + e.amount, 0);

                      // Aggregate product sales
                      const productAgg: Record<string, any> = {};
                      
                      salesForReport.forEach(sale => {
                        sale.items.forEach(item => {
                          const prodInfo = products.find(p => p.id === item.product_id);
                          
                          const productId = item.product_id;
                          const type = prodInfo ? prodInfo.type : 'Diğer';
                          const category = prodInfo ? prodInfo.category : 'Diğer';
                          const purchasePrice = prodInfo ? (prodInfo.purchase_price || 0) : 0;
                          
                          if (!productAgg[productId]) {
                            productAgg[productId] = {
                              id: productId,
                              name: item.name,
                              barcode: prodInfo ? prodInfo.barcode : '-',
                              imei: prodInfo ? prodInfo.imei : '-',
                              category: category,
                              type: type,
                              quantity: 0,
                              totalRevenue: 0,
                              purchasePrice: purchasePrice
                            };
                          }
                          
                          productAgg[productId].quantity += item.quantity;
                          productAgg[productId].totalRevenue += item.quantity * item.price;
                        });
                      });

                      // Convert to array and filter by search query
                      const allAggregatedItems = Object.values(productAgg).filter(item => 
                        !reportSearch || 
                        normalizeString(item.name).includes(normalizeString(reportSearch)) || 
                        (item.barcode && normalizeString(item.barcode).includes(normalizeString(reportSearch))) || 
                        (item.imei && normalizeString(item.imei).includes(normalizeString(reportSearch)))
                      );

                      // Separate into Devices and Accessories/Others
                      const deviceReportItems = allAggregatedItems.filter(item => item.type === 'Cihaz');
                      const otherReportItems = allAggregatedItems.filter(item => item.type !== 'Cihaz');

                      // Helper: tamir stok kartı mı? (type=Hizmet veya adı 'tamir'/'tamır' olan ürünler)
                      // Bu ürünler sadece kasaya işlenir, kâr hesabına DAHIL EDİLMEZ
                      const isRepairItem = (item: any) => {
                        const name = (item.name || '').toLowerCase().trim();
                        return item.type === 'Hizmet' || name === 'tamir' || name === 'tamır';
                      };

                      // Calculations
                      const totalRevenue = allAggregatedItems.reduce((sum, item) => sum + item.totalRevenue, 0);
                      const totalSoldQty = allAggregatedItems.reduce((sum, item) => sum + item.quantity, 0);
                      
                      // Device profitability calculations
                      const totalDevicePurchaseCost = deviceReportItems.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0);
                      const totalDeviceSalesRevenue = deviceReportItems.reduce((sum, item) => sum + item.totalRevenue, 0);
                      const totalDeviceProfit = totalDeviceSalesRevenue - totalDevicePurchaseCost;

                      // Accessory profitability calculations
                      // Tamir ürünleri kâr hesabına dahil edilmez, sadece ciro olarak işlenir
                      const nonRepairOtherItems = otherReportItems.filter(item => !isRepairItem(item));
                      const totalOtherPurchaseCost = nonRepairOtherItems.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0);
                      const totalOtherSalesRevenue = nonRepairOtherItems.reduce((sum, item) => sum + item.totalRevenue, 0);
                      const totalOtherProfit = totalOtherSalesRevenue - totalOtherPurchaseCost;

                      return (
                        <>
                          {/* Summary Metrics (4 Cards) */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans mb-2">
                            <div className="glass-panel p-4 bg-gradient-to-r from-emerald-950/10 to-emerald-900/5 border border-white/5">
                              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Cihaz Satış Kârı</span>
                              <h3 className="text-lg font-extrabold text-emerald-400 mt-1 font-mono">{totalDeviceProfit.toLocaleString('tr-TR')} TL</h3>
                              <span className="text-[9px] text-secondary">Satılan cihaz net karı</span>
                            </div>
                            <div className="glass-panel p-4 bg-gradient-to-r from-emerald-950/10 to-emerald-900/5 border border-white/5">
                              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Aksesuar Satış Kârı</span>
                              <h3 className="text-lg font-extrabold text-emerald-400 mt-1 font-mono">{totalOtherProfit.toLocaleString('tr-TR')} TL</h3>
                              <span className="text-[9px] text-secondary">Aksesuar & diğer net karı</span>
                            </div>
                            <div className="glass-panel p-4 bg-gradient-to-r from-red-950/20 to-red-900/10 border border-red-500/10">
                              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block text-red-400">Dönem Giderleri</span>
                              <h3 className="text-lg font-extrabold text-red-400 mt-1 font-mono">-{totalExpensesForReport.toLocaleString('tr-TR')} TL</h3>
                              <span className="text-[9px] text-red-400/80">Dönem içi gider toplamı</span>
                            </div>
                            <div className="glass-panel p-4">
                              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Rapor Hasılatı</span>
                              <h3 className="text-lg font-extrabold text-white mt-1 font-mono">{totalRevenue.toLocaleString('tr-TR')} TL</h3>
                              <span className="text-[9px] text-secondary">Toplam satış cirosu ({totalSoldQty} adet ürün)</span>
                            </div>
                          </div>

                          {/* SECTION 1: CİHAZ SATIŞ VE KÂRLILIK RAPORU */}
                          <div className="glass-panel p-0 overflow-hidden border border-emerald-500/10 shadow-lg mt-4">
                            <div className="p-4 border-b border-emerald-500/10 bg-emerald-950/5 flex justify-between items-center">
                              <div className="flex items-center gap-2 text-emerald-400">
                                <Tablet size={16} />
                                <h4 className="font-bold text-sm">Cihaz Satış & Kârlılık Raporu</h4>
                              </div>
                              <span className="text-[10px] text-emerald-400 font-semibold font-mono">{deviceReportItems.length} cihaz listelendi</span>
                            </div>

                            {deviceReportItems.length === 0 ? (
                              <div className="p-8 text-center text-secondary text-xs">
                                Seçilen dönemde satış yapılmış cihaz kaydı bulunmamaktadır.
                              </div>
                            ) : (
                              <>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr className="border-b border-white/5 text-muted font-semibold bg-white/1">
                                        <th className="p-3 pl-4">Ürün Adı</th>
                                        <th className="p-3">IMEI</th>
                                        <th className="p-3 text-right">Adet</th>
                                        <th className="p-3 text-right">Birim Alış (Maliyet)</th>
                                        <th className="p-3 text-right">Toplam Alış</th>
                                        <th className="p-3 text-right">Toplam Satış (Ciro)</th>
                                        <th className="p-3 text-right text-emerald-400">Net Kâr</th>
                                        <th className="p-3 text-right pr-4 w-12">İşlem</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 font-sans">
                                      {deviceReportItems.slice((pageReportDevice - 1) * 10, pageReportDevice * 10).map((item) => {
                                        const totalPurchase = item.purchasePrice * item.quantity;
                                        const profit = item.totalRevenue - totalPurchase;

                                        return (
                                          <tr key={item.id} className="hover:bg-white/1 transition-colors">
                                            <td className="p-3 pl-4 font-semibold text-white">{item.name}</td>
                                            <td className="p-3 font-mono font-bold text-indigo-400">{item.imei || '-'}</td>
                                            <td className="p-3 text-right font-mono font-bold text-white">{item.quantity}</td>
                                            <td className="p-3 text-right font-mono text-secondary">{item.purchasePrice.toLocaleString('tr-TR')} TL</td>
                                            <td className="p-3 text-right font-mono text-secondary">{totalPurchase.toLocaleString('tr-TR')} TL</td>
                                            <td className="p-3 text-right font-mono text-white font-bold">{item.totalRevenue.toLocaleString('tr-TR')} TL</td>
                                            <td className={`p-3 text-right font-mono font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                              {profit >= 0 ? '+' : ''}{profit.toLocaleString('tr-TR')} TL
                                            </td>
                                            <td className="p-3 text-right pr-4">
                                              {item.id !== 'manual' && (
                                                <button
                                                  onClick={() => handleOpenEditProductFromReport(item.id)}
                                                  title="Stok Kartını Düzenle"
                                                  className="p-1 rounded hover:bg-indigo-500/10 text-indigo-400 hover:text-white cursor-pointer transition-colors"
                                                >
                                                  <Edit2 size={12} />
                                                </button>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                      {/* Table summary row */}
                                      <tr className="bg-white/2 font-bold border-t border-white/10 text-white">
                                        <td className="p-3 pl-4" colSpan={2}>TOPLAM CİHAZ GRUBU HESABI</td>
                                        <td className="p-3 text-right font-mono">{deviceReportItems.reduce((sum, item) => sum + item.quantity, 0)}</td>
                                        <td className="p-3 text-right">-</td>
                                        <td className="p-3 text-right font-mono text-secondary">{totalDevicePurchaseCost.toLocaleString('tr-TR')} TL</td>
                                        <td className="p-3 text-right font-mono">{totalDeviceSalesRevenue.toLocaleString('tr-TR')} TL</td>
                                        <td className="p-3 text-right font-mono text-emerald-400">{totalDeviceProfit.toLocaleString('tr-TR')} TL</td>
                                        <td className="p-3 text-right pr-4">-</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                                {renderPagination(pageReportDevice, deviceReportItems.length, setPageReportDevice)}
                              </>
                            )}
                          </div>

                          {/* SECTION 2: AKSESUAR VE DİĞER ÜRÜNLER SATIŞ RAPORU */}
                          <div className="glass-panel p-0 overflow-hidden border border-white/5 shadow-lg mt-6">
                            <div className="p-4 border-b border-white/5 bg-white/2 flex justify-between items-center">
                              <div className="flex items-center gap-2 text-indigo-400">
                                <Package size={16} />
                                <h4 className="font-bold text-sm">Aksesuar & Diğer Ürün Satış Raporu</h4>
                              </div>
                              <span className="text-[10px] text-indigo-400 font-semibold font-mono">{otherReportItems.length} çeşit ürün listelendi</span>
                            </div>

                            {otherReportItems.length === 0 ? (
                              <div className="p-8 text-center text-secondary text-xs">
                                Seçilen dönemde satış yapılmış aksesuar/diğer ürün kaydı bulunmamaktadır.
                              </div>
                            ) : (
                              <>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr className="border-b border-white/5 text-muted font-semibold bg-white/1">
                                        <th className="p-3 pl-4">Ürün Adı</th>
                                        <th className="p-3">Kategori</th>
                                        <th className="p-3 text-right">Adet</th>
                                        <th className="p-3 text-right">Maliyet (Alış)</th>
                                        <th className="p-3 text-right">Toplam Alış</th>
                                        <th className="p-3 text-right">Toplam Satış (Ciro)</th>
                                        <th className="p-3 text-right text-emerald-400">Net Kâr</th>
                                        <th className="p-3 text-right pr-4 w-12">İşlem</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 font-sans">
                                      {otherReportItems.slice((pageReportOther - 1) * 10, pageReportOther * 10).map((item) => {
                                        const isRepair = isRepairItem(item);
                                        const totalPurchase = isRepair ? 0 : item.purchasePrice * item.quantity;
                                        const profit = isRepair ? null : (item.totalRevenue - totalPurchase);

                                        return (
                                          <tr key={item.id} className={`hover:bg-white/1 transition-colors ${isRepair ? 'opacity-80' : ''}`}>
                                            <td className="p-3 pl-4 font-semibold text-white">
                                              {item.name}
                                              {isRepair && <span className="ml-1 text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded px-1 py-0.5 align-middle">Sadece Kasa</span>}
                                            </td>
                                            <td className="p-3 text-secondary">{item.category}</td>
                                            <td className="p-3 text-right font-mono font-bold text-white">{item.quantity}</td>
                                            <td className="p-3 text-right font-mono text-secondary">{isRepair ? '-' : (item.purchasePrice || 0).toLocaleString('tr-TR') + ' TL'}</td>
                                            <td className="p-3 text-right font-mono text-secondary">{isRepair ? '-' : totalPurchase.toLocaleString('tr-TR') + ' TL'}</td>
                                            <td className="p-3 text-right font-mono text-white font-bold">{item.totalRevenue.toLocaleString('tr-TR')} TL</td>
                                            <td className={`p-3 text-right font-mono font-bold ${profit === null ? 'text-amber-400' : profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                              {profit === null ? '— Kasa Geliri' : (profit >= 0 ? '+' : '') + profit.toLocaleString('tr-TR') + ' TL'}
                                            </td>
                                            <td className="p-3 text-right pr-4">
                                              {item.id !== 'manual' && (
                                                <button
                                                  onClick={() => handleOpenEditProductFromReport(item.id)}
                                                  title="Stok Kartını Düzenle"
                                                  className="p-1 rounded hover:bg-indigo-500/10 text-indigo-400 hover:text-white cursor-pointer transition-colors"
                                                >
                                                  <Edit2 size={12} />
                                                </button>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                      {/* Table summary row */}
                                      <tr className="bg-white/2 font-bold border-t border-white/10 text-white">
                                        <td className="p-3 pl-4" colSpan={2}>TOPLAM AKSESUAR VE DİĞER</td>
                                        <td className="p-3 text-right font-mono">{otherReportItems.reduce((sum, item) => sum + item.quantity, 0)}</td>
                                        <td className="p-3 text-right">-</td>
                                        <td className="p-3 text-right font-mono text-secondary">{totalOtherPurchaseCost.toLocaleString('tr-TR')} TL</td>
                                        <td className="p-3 text-right font-mono">{otherReportItems.reduce((sum, item) => sum + item.totalRevenue, 0).toLocaleString('tr-TR')} TL</td>
                                        <td className="p-3 text-right font-mono text-emerald-400">{totalOtherProfit.toLocaleString('tr-TR')} TL <span className="text-[9px] text-amber-400/80 font-normal">(tamir hariç)</span></td>
                                        <td className="p-3 text-right pr-4">-</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                                {renderPagination(pageReportOther, otherReportItems.length, setPageReportOther)}
                              </>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}


            {activeTab === 'turkcell' && (
              <div className="animate-fade-in flex flex-col gap-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-white mb-0.5">Turkcell Prim Gelirleri</h2>
                    <p className="text-secondary text-xs">Turkcell'den gelen prim ve ek hak edişleri kar olarak sisteme işleyin.</p>
                  </div>
                  <button 
                    onClick={() => setShowAddTurkcell(true)} 
                    className="btn-primary self-start sm:self-center"
                  >
                    <Plus size={16} />
                    <span>Yeni Prim Girişi</span>
                  </button>
                </div>

                {/* Filter and Search */}
                <div className="glass-panel p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full sm:max-w-md">
                    <span className="pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center text-[var(--text-muted)]">
                      <Search size={16} />
                    </span>
                    <input 
                      type="text" 
                      placeholder="Açıklama veya notlarda ara..." 
                      className="custom-input !pl-10"
                      value={turkcellSearch}
                      onChange={(e) => setTurkcellSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Summary Cards */}
                {(() => {
                  const filteredTcell = turkcellPremiums.filter(p => 
                    !turkcellSearch || 
                    normalizeString(p.description).includes(normalizeString(turkcellSearch)) || 
                    (p.notes && normalizeString(p.notes).includes(normalizeString(turkcellSearch)))
                  );

                  const totalAmount = filteredTcell.reduce((sum, p) => sum + p.amount, 0);
                  const count = filteredTcell.length;

                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="glass-panel p-5 bg-gradient-to-r from-amber-950/20 to-amber-900/10 border border-amber-500/10">
                          <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Toplam Turkcell Prim Karı</span>
                          <h3 className="text-xl font-extrabold text-white mt-1">{totalAmount.toLocaleString('tr-TR')} TL</h3>
                          <span className="text-[10px] text-amber-400 font-sans">Kayıtlı toplam net kar</span>
                        </div>
                        <div className="glass-panel p-5">
                          <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Toplam İşlem Sayısı</span>
                          <h3 className="text-xl font-extrabold text-white mt-1">{count} Kayıt</h3>
                          <span className="text-[10px] text-secondary">Sisteme girilen prim işlemleri</span>
                        </div>
                      </div>

                      {/* Premiums List */}
                      <div className="glass-panel p-0 overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-white/2 flex justify-between items-center">
                          <h4 className="font-bold text-white text-sm">Prim Girişleri</h4>
                          <span className="text-xs text-secondary font-mono">{filteredTcell.length} kayıt listelendi</span>
                        </div>

                        {filteredTcell.length === 0 ? (
                          <div className="p-8 text-center text-secondary text-xs">
                            Kayıtlı prim girdisi bulunmamaktadır.
                          </div>
                        ) : (
                          <>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="border-b border-white/5 text-muted font-semibold bg-white/1">
                                    <th className="p-3">Tarih</th>
                                    <th className="p-3">Prim Açıklaması / Konu</th>
                                    <th className="p-3">Notlar</th>
                                    <th className="p-3 text-right">Net Kar Tutarı</th>
                                    <th className="p-3 text-right">İşlem</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                  {filteredTcell.slice((pagePremium - 1) * 10, pagePremium * 10).map((premium) => (
                                    <tr key={premium.id} className="hover:bg-white/1 transition-colors">
                                      <td className="p-3 font-mono text-indigo-400 whitespace-nowrap">{premium.date}</td>
                                      <td className="p-3 font-semibold text-white">{premium.description}</td>
                                      <td className="p-3 text-secondary">{premium.notes || '-'}</td>
                                      <td className="p-3 text-right font-bold text-emerald-400 font-mono whitespace-nowrap">{premium.amount.toLocaleString('tr-TR')} TL</td>
                                      <td className="p-3 text-right whitespace-nowrap">
                                        <div className="flex justify-end gap-2">
                                          <button 
                                            onClick={() => {
                                              setEditTurkcellData(premium);
                                              setShowEditTurkcell(true);
                                            }}
                                            className="px-2 py-1 rounded bg-white/2 hover:bg-white/5 text-[10px] text-white border border-white/5 font-semibold cursor-pointer"
                                          >
                                            Düzenle
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteTurkcell(premium.id, premium.description)}
                                            className="px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-[10px] text-red-400 border border-red-500/20 font-semibold cursor-pointer"
                                          >
                                            Sil
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            {renderPagination(pagePremium, filteredTcell.length, setPagePremium)}
                          </>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {activeTab === 'users' && currentUser?.role === 'Admin' && (
              <div className="animate-fade-in flex flex-col gap-5 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-white mb-0.5">Kullanıcı Yetki Yönetimi</h2>
                    <p className="text-secondary text-xs">Sistem kullanıcılarını ekleyin, rollerini ve erişebilecekleri ekranları düzenleyin.</p>
                  </div>
                  <button 
                    onClick={() => {
                      setNewUsername('');
                      setNewPassword('');
                      setNewUserRole('Staff');
                      setNewUserPermissions(['sales']);
                      setShowAddUser(true);
                    }} 
                    className="btn-primary self-start sm:self-center"
                  >
                    <Plus size={16} />
                    <span>Yeni Kullanıcı Ekle</span>
                  </button>
                </div>

                <div className="glass-panel p-4 overflow-x-auto border border-white/5">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-secondary text-[11px] font-semibold uppercase tracking-wider">
                        <th className="pb-3 pl-2">Kullanıcı Adı</th>
                        <th className="pb-3">Rol</th>
                        <th className="pb-3">Erişilebilir Sekmeler</th>
                        <th className="pb-3 text-right pr-2">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {usersList.slice((pageUsers - 1) * 10, pageUsers * 10).map(u => (
                        <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 pl-2 font-medium text-white">{u.username}</td>
                          <td className="py-3.5">
                            <span className={`badge px-2 py-0.5 rounded text-[10px] font-bold ${u.role === 'Admin' ? 'badge-primary' : 'bg-slate-800 text-slate-300'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3.5 max-w-xs sm:max-w-md truncate text-secondary">
                            {u.role === 'Admin' ? 'Tüm Sekmeler (Yönetici)' : (
                              u.permissions && u.permissions.length > 0 
                                ? u.permissions.map(p => ALL_TABS.find(t => t.key === p)?.label || p).join(', ')
                                : 'Sekme Yetkisi Yok'
                            )}
                          </td>
                          <td className="py-3.5 text-right pr-2">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => {
                                  setEditUserData({ ...u });
                                  setEditUserPassword('');
                                  setShowEditUser(true);
                                }}
                                className="px-2.5 py-1 rounded bg-white/2 hover:bg-white/5 text-[10px] text-white border border-white/5 font-semibold cursor-pointer"
                                title="Düzenle"
                              >
                                Düzenle
                              </button>
                              {u.username !== 'admin' && (
                                <button 
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-[10px] text-red-400 border border-red-500/20 font-semibold cursor-pointer"
                                  title="Sil"
                                >
                                  Sil
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {renderPagination(pageUsers, usersList.length, setPageUsers)}
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {/* ==================================================== */}
      {/* EDIT CARİ MODAL OVERLAY */}
      {/* ==================================================== */}
      {showEditCari && editCariData && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm text-xs">
          <div className="glass-panel p-6 w-full max-w-md bg-slate-900 border border-white/10 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">Cari Hesap Kartını Düzenle</h3>
              <button onClick={() => setShowEditCari(false)} className="text-secondary hover:text-white">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleUpdateCari} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-secondary block mb-1">Cari Tipi*</label>
                  <select 
                    className="custom-input"
                    value={editCariData.cari_type}
                    onChange={(e) => setEditCariData({ ...editCariData, cari_type: e.target.value })}
                  >
                    <option value="Bireysel">Bireysel (Şahıs)</option>
                    <option value="Kurumsal">Kurumsal (Firma)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-secondary block mb-1">Telefon Numarası</label>
                  <input 
                    type="tel" 
                    placeholder="+90 5xx..." 
                    className="custom-input"
                    value={editCariData.phone}
                    onChange={(e) => setEditCariData({ ...editCariData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-secondary block mb-1">
                  {editCariData.cari_type === 'Kurumsal' ? 'Firma Resmi Ünvanı*' : 'Müşteri Adı Soyadı*'}
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder={editCariData.cari_type === 'Kurumsal' ? 'Örn: Genç Teknoloji Bilişim Hizmetleri Ltd.' : 'Müşteri adını yazın...'} 
                  className="custom-input"
                  value={editCariData.name}
                  onChange={(e) => setEditCariData({ ...editCariData, name: e.target.value })}
                />
              </div>

              {editCariData.cari_type === 'Kurumsal' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-secondary block mb-1">Vergi Dairesi*</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Örn: Kadıköy V.D." 
                      className="custom-input"
                      value={editCariData.tax_office || ''}
                      onChange={(e) => setEditCariData({ ...editCariData, tax_office: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-secondary block mb-1">Vergi Numarası*</label>
                    <input 
                      type="text" 
                      required 
                      maxLength={10}
                      placeholder="10 Haneli vergi no..." 
                      className="custom-input font-mono"
                      value={editCariData.tax_number || ''}
                      onChange={(e) => setEditCariData({ ...editCariData, tax_number: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] text-secondary block mb-1">T.C. Kimlik Numarası (Opsiyonel)</label>
                  <input 
                    type="text" 
                    maxLength={11}
                    placeholder="11 Haneli TC no..." 
                    className="custom-input font-mono"
                    value={editCariData.tc_number || ''}
                    onChange={(e) => setEditCariData({ ...editCariData, tc_number: e.target.value.replace(/\D/g, '') })}
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] text-secondary block mb-1">E-Posta Adresi</label>
                <input 
                  type="email" 
                  placeholder="eposta@adres.com" 
                  className="custom-input"
                  value={editCariData.email}
                  onChange={(e) => setEditCariData({ ...editCariData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] text-secondary block mb-1">Fatura Adresi</label>
                <textarea 
                  rows={2} 
                  placeholder="Açık adres..." 
                  className="custom-input resize-none"
                  value={editCariData.address}
                  onChange={(e) => setEditCariData({ ...editCariData, address: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button 
                  type="button" 
                  onClick={() => setShowEditCari(false)}
                  className="px-4 py-2 rounded-lg text-secondary border border-white/5 hover:bg-white/5"
                >
                  İptal
                </button>
                <button type="submit" className="btn-primary py-2 px-4">
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* EDIT STOK (PRODUCT) MODAL OVERLAY */}
      {/* ==================================================== */}
      {showEditProduct && editProductData && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm text-xs">
          <div className="glass-panel p-6 w-full max-w-md bg-slate-900 border border-white/10 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">Stok Kartını Düzenle</h3>
              <button onClick={() => setShowEditProduct(false)} className="text-secondary hover:text-white">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleUpdateProduct} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-secondary block mb-1">Stok Tipi*</label>
                  <select 
                    className="custom-input"
                    value={editProductData.type}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditProductData({ 
                        ...editProductData, 
                        type: val,
                        category: val === 'Cihaz' ? 'Telefon' : val === 'Hizmet' ? 'Tamir & Teknik Servis' : 'Telefon Kılıfı',
                        imei: val !== 'Cihaz' ? null : editProductData.imei,
                        stock: val === 'Cihaz' ? 1 : val === 'Hizmet' ? 0 : editProductData.stock
                      });
                    }}
                  >
                    <option value="Diğer">Diğer (Aksesuar/Stok)</option>
                    <option value="Cihaz">Cihaz (Telefon / Tablet)</option>
                    <option value="Hizmet">Hizmet (Tamir / Teknik Servis)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-secondary block mb-1">Kategori*</label>
                  {editProductData.type === 'Cihaz' ? (
                    <select 
                      className="custom-input"
                      value={editProductData.category}
                      onChange={(e) => setEditProductData({ ...editProductData, category: e.target.value })}
                    >
                      <option value="Telefon">Telefon</option>
                      <option value="Tablet">Tablet</option>
                    </select>
                  ) : editProductData.type === 'Hizmet' ? (
                    <select 
                      className="custom-input"
                      value={editProductData.category}
                      onChange={(e) => setEditProductData({ ...editProductData, category: e.target.value })}
                    >
                      <option value="Tamir & Teknik Servis">Tamir & Teknik Servis</option>
                    </select>
                  ) : (
                    <select 
                      className="custom-input"
                      value={editProductData.category}
                      onChange={(e) => setEditProductData({ ...editProductData, category: e.target.value })}
                    >
                      <option value="Telefon Kılıfı">Telefon Kılıfı</option>
                      <option value="Telefon Kırılmaz Camı">Telefon Kırılmaz Camı</option>
                      <option value="Şarj Cihazı">Şarj Cihazı</option>
                      <option value="Şarj Kablosu">Şarj Kablosu</option>
                      <option value="Bluetooth Kulaklık">Bluetooth Kulaklık</option>
                      <option value="Hazır Kart">Hazır Kart</option>
                      <option value="Tamir & Teknik Servis">Tamir & Teknik Servis</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-secondary block mb-1">
                  {editProductData.type === 'Cihaz' ? 'Telefon İsmi (Marka / Model)*' : 'Ürün / Hizmet Adı*'}
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder={editProductData.type === 'Cihaz' ? 'Örn: Apple iPhone 14 Pro Max' : 'Ürün adını yazın...'} 
                  className="custom-input"
                  value={editProductData.name}
                  onChange={(e) => setEditProductData({ ...editProductData, name: e.target.value })}
                />
              </div>

              {editProductData.type === 'Cihaz' && (
                <div>
                  <label className="text-[10px] text-secondary block mb-1">IMEI Numarası (15 Haneli)</label>
                  <input 
                    type="text" 
                    maxLength={15}
                    placeholder="IMEI kodunu yazın..." 
                    className="custom-input font-mono"
                    value={editProductData.imei || ''}
                    onChange={(e) => setEditProductData({ ...editProductData, imei: e.target.value.replace(/\D/g, '') })}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-secondary block mb-1">Adet / Stok</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    disabled={editProductData.type === 'Cihaz' || editProductData.type === 'Hizmet'}
                    className="custom-input"
                    value={editProductData.type === 'Cihaz' ? 1 : editProductData.type === 'Hizmet' ? 0 : editProductData.stock}
                    onChange={(e) => setEditProductData({ ...editProductData, stock: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-secondary block mb-1">KDV Oranı (%)</label>
                  <select 
                    className="custom-input bg-slate-800"
                    value={editProductData.kdv_ratio}
                    onChange={(e) => {
                      const ratio = parseInt(e.target.value) || 0;
                      const purchaseExcl = toNum(editProductData.purchase_price) / (1 + toInt(editProductData.kdv_ratio, 20) / 100);
                      const saleExcl = toNum(editProductData.sale_price) / (1 + toInt(editProductData.kdv_ratio, 20) / 100);
                      setEditProductData({ 
                        ...editProductData, 
                        kdv_ratio: ratio.toString(),
                        purchase_price: purchaseExcl ? (purchaseExcl * (1 + ratio / 100)).toFixed(2) : editProductData.purchase_price,
                        sale_price: saleExcl ? (saleExcl * (1 + ratio / 100)).toFixed(2) : editProductData.sale_price
                      });
                    }}
                  >
                    <option value="20">%20 (Genel)</option>
                    <option value="10">%10 (Gıda/Tıbbi)</option>
                    <option value="1">%1 (Temel)</option>
                    <option value="0">%0 (KDV Muaf)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-secondary block mb-1">Alış Fiyatı (KDV Hariç - TL)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    className="custom-input"
                    onBlur={(e) => {
                      const excl = toNum(e.target.value);
                      if (isNaN(excl)) return;
                      const ratio = toInt(editProductData.kdv_ratio, 20);
                      const incl = excl * (1 + ratio / 100);
                      setEditProductData({ ...editProductData, purchase_price: incl.toFixed(2) });
                    }}
                    defaultValue={editProductData.purchase_price ? (toNum(editProductData.purchase_price) / (1 + toInt(editProductData.kdv_ratio, 20) / 100)).toFixed(2) : ''}
                    key={'ep-pur-excl-' + (editProductData.kdv_ratio ?? '20') + '-' + editProductData.id}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-secondary block mb-1">Alış Fiyatı (KDV Dahil - TL)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    className="custom-input font-bold text-white"
                    value={editProductData.purchase_price}
                    onChange={(e) => setEditProductData({ ...editProductData, purchase_price: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-secondary block mb-1">Satış Fiyatı (KDV Hariç - TL)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    className="custom-input"
                    onBlur={(e) => {
                      const excl = toNum(e.target.value);
                      if (isNaN(excl)) return;
                      const ratio = toInt(editProductData.kdv_ratio, 20);
                      const incl = excl * (1 + ratio / 100);
                      setEditProductData({ ...editProductData, sale_price: incl.toFixed(2) });
                    }}
                    defaultValue={editProductData.sale_price ? (toNum(editProductData.sale_price) / (1 + toInt(editProductData.kdv_ratio, 20) / 100)).toFixed(2) : ''}
                    key={'ep-sale-excl-' + (editProductData.kdv_ratio ?? '20') + '-' + editProductData.id}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-secondary block mb-1">Satış Fiyatı (KDV Dahil - TL)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    className="custom-input font-bold text-emerald-400"
                    value={editProductData.sale_price}
                    onChange={(e) => setEditProductData({ ...editProductData, sale_price: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button 
                  type="button" 
                  onClick={() => setShowEditProduct(false)}
                  className="px-4 py-2 rounded-lg text-secondary border border-white/5 hover:bg-white/5"
                >
                  İptal
                </button>
                <button type="submit" className="btn-primary py-2 px-4">
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* ADD TURKCELL PREMIUM MODAL OVERLAY */}
      {/* ==================================================== */}
      {showAddTurkcell && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm text-xs">
          <div className="glass-panel p-6 w-full max-w-md bg-slate-900 border border-white/10 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">Yeni Turkcell Prim Girişi</h3>
              <button onClick={() => setShowAddTurkcell(false)} className="text-secondary hover:text-white">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateTurkcell} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] text-secondary block mb-1">İşlem Tarihi*</label>
                <input 
                  type="date" 
                  required
                  className="custom-input"
                  value={newTurkcell.date}
                  onChange={(e) => setNewTurkcell({ ...newTurkcell, date: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] text-secondary block mb-1">Prim Açıklaması / Konu*</label>
                <input 
                  type="text" 
                  required
                  placeholder="Örn: Haziran 2026 Yeni Hat Aktivasyon Primi"
                  className="custom-input"
                  value={newTurkcell.description}
                  onChange={(e) => setNewTurkcell({ ...newTurkcell, description: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] text-secondary block mb-1">Net Kar Tutarı (TL)*</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="custom-input"
                  value={newTurkcell.amount}
                  onChange={(e) => setNewTurkcell({ ...newTurkcell, amount: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] text-secondary block mb-1">Ek Notlar</label>
                <textarea 
                  rows={2}
                  placeholder="İşlemle ilgili ek detaylar..."
                  className="custom-input resize-none"
                  value={newTurkcell.notes}
                  onChange={(e) => setNewTurkcell({ ...newTurkcell, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddTurkcell(false)}
                  className="px-4 py-2 rounded-lg text-secondary border border-white/5 hover:bg-white/5"
                >
                  İptal
                </button>
                <button type="submit" className="btn-primary py-2 px-4">
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* EDIT TURKCELL PREMIUM MODAL OVERLAY */}
      {/* ==================================================== */}
      {showEditTurkcell && editTurkcellData && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm text-xs">
          <div className="glass-panel p-6 w-full max-w-md bg-slate-900 border border-white/10 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">Prim Kaydını Düzenle</h3>
              <button onClick={() => setShowEditTurkcell(false)} className="text-secondary hover:text-white">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleUpdateTurkcell} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] text-secondary block mb-1">İşlem Tarihi*</label>
                <input 
                  type="date" 
                  required
                  className="custom-input"
                  value={editTurkcellData.date}
                  onChange={(e) => setEditTurkcellData({ ...editTurkcellData, date: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] text-secondary block mb-1">Prim Açıklaması / Konu*</label>
                <input 
                  type="text" 
                  required
                  placeholder="Prim açıklaması yazın..."
                  className="custom-input"
                  value={editTurkcellData.description}
                  onChange={(e) => setEditTurkcellData({ ...editTurkcellData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] text-secondary block mb-1">Net Kar Tutarı (TL)*</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="custom-input"
                  value={editTurkcellData.amount}
                  onChange={(e) => setEditTurkcellData({ ...editTurkcellData, amount: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] text-secondary block mb-1">Ek Notlar</label>
                <textarea 
                  rows={2}
                  placeholder="Ek detaylar..."
                  className="custom-input resize-none"
                  value={editTurkcellData.notes || ''}
                  onChange={(e) => setEditTurkcellData({ ...editTurkcellData, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button 
                  type="button" 
                  onClick={() => setShowEditTurkcell(false)}
                  className="px-4 py-2 rounded-lg text-secondary border border-white/5 hover:bg-white/5"
                >
                  İptal
                </button>
                <button type="submit" className="btn-primary py-2 px-4">
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* ADD TURKCELL DEVICE STOCK MODAL OVERLAY */}
      {/* ==================================================== */}
      {showAddTcellDevice && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm text-xs">
          <div className="glass-panel p-6 w-full max-w-md bg-slate-900 border border-white/10 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">Yeni Turkcell Cihaz Stok Kartı</h3>
              <button onClick={() => setShowAddTcellDevice(false)} className="text-secondary hover:text-white">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateTcellDevice} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] text-secondary block mb-1">Cihaz Adı / Model*</label>
                <input 
                  type="text" 
                  required
                  placeholder="Örn: iPhone 15 Pro Max 256GB"
                  className="custom-input"
                  value={newTcellDevice.device_name}
                  onChange={(e) => setNewTcellDevice({ ...newTcellDevice, device_name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] text-secondary block mb-1">IMEI Numarası</label>
                <input 
                  type="text" 
                  placeholder="15 haneli IMEI girin"
                  className="custom-input"
                  value={newTcellDevice.imei}
                  onChange={(e) => setNewTcellDevice({ ...newTcellDevice, imei: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] text-secondary block mb-1">KDV Oranı (%)</label>
                <select 
                  className="custom-input bg-slate-800"
                  value={newTcellDevice.kdv_ratio ?? '20'}
                  onChange={(e) => {
                    const newRatio = e.target.value;
                    const oldRatio = toInt(newTcellDevice.kdv_ratio, 20);
                    const ratio = parseInt(newRatio);
                    const purchaseExcl = newTcellDevice.purchase_price ? toNum(newTcellDevice.purchase_price) / (1 + oldRatio / 100) : 0;
                    const saleExcl = newTcellDevice.sale_price ? toNum(newTcellDevice.sale_price) / (1 + oldRatio / 100) : 0;
                    setNewTcellDevice({ 
                      ...newTcellDevice, 
                      kdv_ratio: newRatio,
                      purchase_price: purchaseExcl ? String((purchaseExcl * (1 + ratio / 100)).toFixed(2)) : newTcellDevice.purchase_price,
                      sale_price: saleExcl ? String((saleExcl * (1 + ratio / 100)).toFixed(2)) : newTcellDevice.sale_price
                    });
                  }}
                >
                  <option value="20">%20 (Genel)</option>
                  <option value="10">%10 (Gıda/Tıbbi)</option>
                  <option value="1">%1 (Temel)</option>
                  <option value="0">%0 (KDV Muaf)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-secondary block mb-1">Alış Fiyatı (KDV Hariç - TL)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    className="custom-input"
                    onBlur={(e) => {
                      const excl = toNum(e.target.value);
                      if (isNaN(excl)) return;
                      const ratio = toInt(newTcellDevice.kdv_ratio, 20);
                      const incl = excl * (1 + ratio / 100);
                      setNewTcellDevice({ ...newTcellDevice, purchase_price: incl.toFixed(2) });
                    }}
                    defaultValue={newTcellDevice.purchase_price ? (toNum(newTcellDevice.purchase_price) / (1 + toInt(newTcellDevice.kdv_ratio, 20) / 100)).toFixed(2) : ''}
                    key={'np-pur-excl-' + (newTcellDevice.kdv_ratio ?? '20')}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-secondary block mb-1">Alış Fiyatı (KDV Dahil - TL)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    className="custom-input font-bold text-white"
                    value={newTcellDevice.purchase_price}
                    onChange={(e) => setNewTcellDevice({ ...newTcellDevice, purchase_price: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-secondary block mb-1">Satış Fiyatı (KDV Hariç - TL)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    className="custom-input"
                    onBlur={(e) => {
                      const excl = toNum(e.target.value);
                      if (isNaN(excl)) return;
                      const ratio = toInt(newTcellDevice.kdv_ratio, 20);
                      const incl = excl * (1 + ratio / 100);
                      setNewTcellDevice({ ...newTcellDevice, sale_price: incl.toFixed(2) });
                    }}
                    defaultValue={newTcellDevice.sale_price ? (toNum(newTcellDevice.sale_price) / (1 + toInt(newTcellDevice.kdv_ratio, 20) / 100)).toFixed(2) : ''}
                    key={'np-sale-excl-' + (newTcellDevice.kdv_ratio ?? '20')}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-secondary block mb-1">Satış Fiyatı (KDV Dahil - TL)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    className="custom-input font-bold text-emerald-400"
                    value={newTcellDevice.sale_price}
                    onChange={(e) => setNewTcellDevice({ ...newTcellDevice, sale_price: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-secondary block mb-1">Stok Durumu</label>
                <select 
                  className="custom-input bg-slate-800"
                  value={newTcellDevice.status}
                  onChange={(e) => setNewTcellDevice({ ...newTcellDevice, status: e.target.value })}
                >
                  <option value="Stokta">Stokta</option>
                  <option value="Satıldı">Satıldı</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-secondary block mb-1">Ek Notlar</label>
                <textarea 
                  rows={2}
                  placeholder="Cihazın kondisyonu, garanti durumu vb. notlar..."
                  className="custom-input resize-none"
                  value={newTcellDevice.notes}
                  onChange={(e) => setNewTcellDevice({ ...newTcellDevice, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddTcellDevice(false)}
                  className="px-4 py-2 rounded-lg text-secondary border border-white/5 hover:bg-white/5"
                >
                  İptal
                </button>
                <button type="submit" className="btn-primary py-2 px-4">
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* EDIT TURKCELL DEVICE STOCK MODAL OVERLAY */}
      {/* ==================================================== */}
      {showEditTcellDevice && editTcellDeviceData && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm text-xs">
          <div className="glass-panel p-6 w-full max-w-md bg-slate-900 border border-white/10 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">Turkcell Cihaz Stok Kartını Düzenle</h3>
              <button onClick={() => setShowEditTcellDevice(false)} className="text-secondary hover:text-white">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleUpdateTcellDevice} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] text-secondary block mb-1">Cihaz Adı / Model*</label>
                <input 
                  type="text" 
                  required
                  placeholder="Cihaz modelini girin..."
                  className="custom-input"
                  value={editTcellDeviceData.device_name}
                  onChange={(e) => setEditTcellDeviceData({ ...editTcellDeviceData, device_name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] text-secondary block mb-1">IMEI Numarası</label>
                <input 
                  type="text" 
                  placeholder="15 haneli IMEI girin"
                  className="custom-input"
                  value={editTcellDeviceData.imei || ''}
                  onChange={(e) => setEditTcellDeviceData({ ...editTcellDeviceData, imei: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] text-secondary block mb-1">KDV Oranı (%)</label>
                <select 
                  className="custom-input bg-slate-800"
                  value={editTcellDeviceData.kdv_ratio ?? '20'}
                  onChange={(e) => {
                    const newRatio = e.target.value;
                    const oldRatio = toInt(editTcellDeviceData.kdv_ratio, 20);
                    const ratio = parseInt(newRatio);
                    const purchaseExcl = editTcellDeviceData.purchase_price ? toNum(editTcellDeviceData.purchase_price) / (1 + oldRatio / 100) : 0;
                    const saleExcl = editTcellDeviceData.sale_price ? toNum(editTcellDeviceData.sale_price) / (1 + oldRatio / 100) : 0;
                    setEditTcellDeviceData({ 
                      ...editTcellDeviceData, 
                      kdv_ratio: newRatio,
                      purchase_price: purchaseExcl ? String((purchaseExcl * (1 + ratio / 100)).toFixed(2)) : editTcellDeviceData.purchase_price,
                      sale_price: saleExcl ? String((saleExcl * (1 + ratio / 100)).toFixed(2)) : editTcellDeviceData.sale_price
                    });
                  }}
                >
                  <option value="20">%20 (Genel)</option>
                  <option value="10">%10 (Gıda/Tıbbi)</option>
                  <option value="1">%1 (Temel)</option>
                  <option value="0">%0 (KDV Muaf)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-secondary block mb-1">Alış Fiyatı (KDV Hariç - TL)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    className="custom-input"
                    onBlur={(e) => {
                      const excl = toNum(e.target.value);
                      if (isNaN(excl)) return;
                      const ratio = toInt(editTcellDeviceData.kdv_ratio, 20);
                      const incl = excl * (1 + ratio / 100);
                      setEditTcellDeviceData({ ...editTcellDeviceData, purchase_price: incl.toFixed(2) });
                    }}
                    defaultValue={editTcellDeviceData.purchase_price ? (toNum(editTcellDeviceData.purchase_price) / (1 + toInt(editTcellDeviceData.kdv_ratio, 20) / 100)).toFixed(2) : ''}
                    key={'et-pur-excl-' + (editTcellDeviceData.kdv_ratio ?? '20') + '-' + editTcellDeviceData.id}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-secondary block mb-1">Alış Fiyatı (KDV Dahil - TL)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    className="custom-input font-bold text-white"
                    value={editTcellDeviceData.purchase_price}
                    onChange={(e) => setEditTcellDeviceData({ ...editTcellDeviceData, purchase_price: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-secondary block mb-1">Satış Fiyatı (KDV Hariç - TL)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    className="custom-input"
                    onBlur={(e) => {
                      const excl = toNum(e.target.value);
                      if (isNaN(excl)) return;
                      const ratio = toInt(editTcellDeviceData.kdv_ratio, 20);
                      const incl = excl * (1 + ratio / 100);
                      setEditTcellDeviceData({ ...editTcellDeviceData, sale_price: incl.toFixed(2) });
                    }}
                    defaultValue={editTcellDeviceData.sale_price ? (toNum(editTcellDeviceData.sale_price) / (1 + toInt(editTcellDeviceData.kdv_ratio, 20) / 100)).toFixed(2) : ''}
                    key={'et-sale-excl-' + (editTcellDeviceData.kdv_ratio ?? '20') + '-' + editTcellDeviceData.id}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-secondary block mb-1">Satış Fiyatı (KDV Dahil - TL)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    className="custom-input font-bold text-emerald-400"
                    value={editTcellDeviceData.sale_price}
                    onChange={(e) => setEditTcellDeviceData({ ...editTcellDeviceData, sale_price: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-secondary block mb-1">Stok Durumu</label>
                <select 
                  className="custom-input bg-slate-800"
                  value={editTcellDeviceData.status}
                  onChange={(e) => setEditTcellDeviceData({ ...editTcellDeviceData, status: e.target.value })}
                >
                  <option value="Stokta">Stokta</option>
                  <option value="Satıldı">Satıldı</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-secondary block mb-1">Ek Notlar</label>
                <textarea 
                  rows={2}
                  placeholder="Cihazla ilgili notlar..."
                  className="custom-input resize-none"
                  value={editTcellDeviceData.notes || ''}
                  onChange={(e) => setEditTcellDeviceData({ ...editTcellDeviceData, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button 
                  type="button" 
                  onClick={() => setShowEditTcellDevice(false)}
                  className="px-4 py-2 rounded-lg text-secondary border border-white/5 hover:bg-white/5"
                >
                  İptal
                </button>
                <button type="submit" className="btn-primary py-2 px-4">
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm text-xs">
          <div className="glass-panel p-6 w-full max-w-md bg-slate-900 border border-white/10 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">Yeni Kullanıcı Hesabı</h3>
              <button onClick={() => setShowAddUser(false)} className="text-secondary hover:text-white">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] text-secondary block mb-1 font-semibold uppercase tracking-wider">Kullanıcı Adı*</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Kullanıcı adı..." 
                  className="custom-input"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] text-secondary block mb-1 font-semibold uppercase tracking-wider">Şifre*</label>
                <input 
                  type="password" 
                  required 
                  placeholder="Şifre..." 
                  className="custom-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] text-secondary block mb-1 font-semibold uppercase tracking-wider">Rol*</label>
                <select 
                  className="custom-input"
                  value={newUserRole}
                  onChange={(e) => {
                    const role = e.target.value;
                    setNewUserRole(role);
                    if (role === 'Admin') {
                      setNewUserPermissions(ALL_TABS.map(t => t.key));
                    }
                  }}
                >
                  <option value="Staff">Çalışan (Staff)</option>
                  <option value="Admin">Yönetici (Admin)</option>
                </select>
              </div>

              {newUserRole === 'Staff' && (
                <div>
                  <label className="text-[10px] text-secondary block mb-2 font-semibold uppercase tracking-wider">Erişebileceği Ekranlar</label>
                  <div className="grid grid-cols-2 gap-2 bg-white/5 p-3 rounded-lg border border-white/5">
                    {ALL_TABS.map(tab => (
                      <label key={tab.key} className="flex items-center gap-2 text-[11px] text-white cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={newUserPermissions.includes(tab.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewUserPermissions([...newUserPermissions, tab.key]);
                            } else {
                              setNewUserPermissions(newUserPermissions.filter(p => p !== tab.key));
                            }
                          }}
                          className="rounded border-white/10 bg-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                        <span>{tab.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 rounded-lg text-secondary border border-white/5 hover:bg-white/5 cursor-pointer"
                >
                  İptal
                </button>
                <button type="submit" className="btn-primary py-2 px-4 cursor-pointer">
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditUser && editUserData && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm text-xs">
          <div className="glass-panel p-6 w-full max-w-md bg-slate-900 border border-white/10 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">Kullanıcı Düzenle</h3>
              <button onClick={() => setShowEditUser(false)} className="text-secondary hover:text-white">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] text-secondary block mb-1 font-semibold uppercase tracking-wider">Kullanıcı Adı*</label>
                <input 
                  type="text" 
                  required 
                  disabled={editUserData.username === 'admin'}
                  placeholder="Kullanıcı adı..." 
                  className="custom-input disabled:opacity-50"
                  value={editUserData.username}
                  onChange={(e) => setEditUserData({ ...editUserData, username: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] text-secondary block mb-1 font-semibold uppercase tracking-wider">Yeni Şifre (Değiştirmek istemiyorsanız boş bırakın)</label>
                <input 
                  type="password" 
                  placeholder="Yeni şifre..." 
                  className="custom-input"
                  value={editUserPassword}
                  onChange={(e) => setEditUserPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] text-secondary block mb-1 font-semibold uppercase tracking-wider">Rol*</label>
                <select 
                  className="custom-input disabled:opacity-50"
                  disabled={editUserData.username === 'admin'}
                  value={editUserData.role}
                  onChange={(e) => {
                    const role = e.target.value;
                    let perms = editUserData.permissions || [];
                    if (role === 'Admin') {
                      perms = ALL_TABS.map(t => t.key);
                    }
                    setEditUserData({ ...editUserData, role: role, permissions: perms });
                  }}
                >
                  <option value="Staff">Çalışan (Staff)</option>
                  <option value="Admin">Yönetici (Admin)</option>
                </select>
              </div>

              {editUserData.role === 'Staff' && editUserData.username !== 'admin' && (
                <div>
                  <label className="text-[10px] text-secondary block mb-2 font-semibold uppercase tracking-wider">Erişebileceği Ekranlar</label>
                  <div className="grid grid-cols-2 gap-2 bg-white/5 p-3 rounded-lg border border-white/5">
                    {ALL_TABS.map(tab => (
                      <label key={tab.key} className="flex items-center gap-2 text-[11px] text-white cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={(editUserData.permissions || []).includes(tab.key)}
                          onChange={(e) => {
                            let perms = editUserData.permissions || [];
                            if (e.target.checked) {
                              perms = [...perms, tab.key];
                            } else {
                              perms = perms.filter(p => p !== tab.key);
                            }
                            setEditUserData({ ...editUserData, permissions: perms });
                          }}
                          className="rounded border-white/10 bg-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                        <span>{tab.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-3">
                <button 
                  type="button" 
                  onClick={() => setShowEditUser(false)}
                  className="px-4 py-2 rounded-lg text-secondary border border-white/5 hover:bg-white/5 cursor-pointer"
                >
                  İptal
                </button>
                <button type="submit" className="btn-primary py-2 px-4 cursor-pointer">
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sleek Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in text-xs">
          <div className="glass-panel p-6 w-full max-w-sm bg-slate-950 border border-white/10 shadow-2xl relative">
            <div className="flex flex-col gap-4 items-center text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${confirmModal.isDanger ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">{confirmModal.title}</h3>
                <p className="text-secondary text-[11px] mt-2 leading-relaxed">{confirmModal.message}</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2.5 mt-6 border-t border-white/5 pt-4">
              <button 
                type="button" 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-lg text-secondary border border-white/5 hover:bg-white/5 transition-colors cursor-pointer text-[11px]"
              >
                Vazgeç
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className={`py-2 px-4 rounded-lg font-bold text-white transition-colors cursor-pointer text-[11px] ${confirmModal.isDanger ? 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20' : 'bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-600/20'}`}
              >
                Onayla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* HIDDEN BARKOD PRINT PREVIEW ZONE (For barcode label printers) */}
      {/* ==================================================== */}
      {/* Edit Gün Sonu Raporu Modal */}
      {showEditClosingModal && editingClosing && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm text-xs">
          <div className="glass-panel p-6 w-full max-w-md bg-slate-900 border border-white/10 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">Gün Sonu Raporu Düzenle ({editingClosing.date})</h3>
              <button 
                onClick={() => { setShowEditClosingModal(false); setEditingClosing(null); }} 
                className="text-secondary hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSaveEditClosing} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-secondary block mb-1 font-semibold uppercase tracking-wider">Eldeki Nakit Miktar (TL)</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="Eldeki nakit..." 
                    className="custom-input"
                    value={editPhysicalCash}
                    onChange={(e) => setEditPhysicalCash(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-secondary block mb-1 font-semibold uppercase tracking-wider">POS / Kart Toplamı (TL)</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="POS toplamı..." 
                    className="custom-input"
                    value={editPhysicalCard}
                    onChange={(e) => setEditPhysicalCard(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-secondary block mb-1 font-semibold uppercase tracking-wider">Kontör Satış Miktarı (TL)</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="Kontör satışı..." 
                    className="custom-input"
                    value={editKontorSales}
                    onChange={(e) => setEditKontorSales(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-secondary block mb-1 font-semibold uppercase tracking-wider">Fatura Ödeme Miktarı (TL)</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="Fatura ödemeleri..." 
                    className="custom-input"
                    value={editFaturaPayments}
                    onChange={(e) => setEditFaturaPayments(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-3 p-3 bg-white/5 border border-white/5 rounded-lg flex flex-col gap-1 text-[10px] text-secondary font-mono leading-relaxed">
                <span className="font-bold text-white border-b border-white/5 pb-1 mb-1 font-sans">O Günün Sistem Özetleri:</span>
                <span>Nakit Satışlar: {(toNum(editingClosing.cash_revenue) || 0).toLocaleString('tr-TR')} TL</span>
                <span>Kart Satışları (POS): {(toNum(editingClosing.card_revenue) || 0).toLocaleString('tr-TR')} TL</span>
                <span>Ödenen Kasa Giderleri: {(toNum(editingClosing.today_expenses) || 0).toLocaleString('tr-TR')} TL</span>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowEditClosingModal(false); setEditingClosing(null); }}
                  className="px-4 py-2 rounded-lg text-secondary border border-white/5 hover:bg-white/5 cursor-pointer text-[11px]"
                >
                  İptal
                </button>
                <button type="submit" className="btn-primary py-2 px-4 cursor-pointer text-[11px]">
                  Raporu Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Satış Kalemi Modal */}
      {showEditSaleItemModal && editingSaleItem && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm text-xs">
          <div className="glass-panel p-6 w-full max-w-md bg-slate-900 border border-white/10 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">Satış Kalemi Düzenle</h3>
              <button 
                onClick={() => { setShowEditSaleItemModal(false); setEditingSaleItem(null); }} 
                className="text-secondary hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSaveEditSaleItem} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] text-secondary block mb-1 font-semibold uppercase tracking-wider">Ürün Adı</label>
                <input 
                  type="text" 
                  disabled
                  className="custom-input bg-white/5 opacity-65 cursor-not-allowed"
                  value={editingSaleItem.item.name}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-secondary block mb-1 font-semibold uppercase tracking-wider">Adet</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    placeholder="Adet..." 
                    className="custom-input font-mono"
                    value={editSaleItemQuantity}
                    onChange={(e) => setEditSaleItemQuantity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-secondary block mb-1 font-semibold uppercase tracking-wider">Birim Satış Fiyatı (TL)</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    placeholder="Fiyat..." 
                    className="custom-input font-mono"
                    value={editSaleItemPrice}
                    onChange={(e) => setEditSaleItemPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowEditSaleItemModal(false); setEditingSaleItem(null); }}
                  className="px-4 py-2 rounded-lg text-secondary border border-white/5 hover:bg-white/5 cursor-pointer text-[11px]"
                >
                  İptal
                </button>
                <button type="submit" className="btn-primary py-2 px-4 cursor-pointer text-[11px]">
                  Kaydet ve Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedProductForBarcode && (
        <div className="hidden">
          <div className="printable-barcode">
            <span className="print-title">{selectedProductForBarcode.name}</span>
            <BarcodeSVG value={selectedProductForBarcode.barcode} />
            <span className="print-price">{selectedProductForBarcode.sale_price.toLocaleString('tr-TR')} TL</span>
          </div>
        </div>
      )}

      {/* Toast Notification Popup */}
      {toast.show && (
        <div 
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
            transition: 'all 0.3s ease',
            animation: 'toastSlideIn 0.3s ease forwards'
          }}
          className={`${
            toast.type === 'danger' 
              ? 'bg-red-950/95 text-red-200 border-red-500/30' 
              : toast.type === 'warning'
              ? 'bg-amber-950/95 text-amber-200 border-amber-500/30'
              : 'bg-emerald-950/95 text-emerald-200 border-emerald-500/30'
          }`}
        >
          <style>{`
            @keyframes toastSlideIn {
              from { opacity: 0; transform: translateX(50px); }
              to { opacity: 1; transform: translateX(0); }
            }
          `}</style>
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              {toast.type === 'danger' ? 'Hata' : toast.type === 'warning' ? 'Uyarı' : 'Başarılı'}
            </span>
            <span className="text-xs font-semibold text-white">{toast.message}</span>
          </div>
          <button 
            type="button"
            onClick={() => setToast(prev => ({ ...prev, show: false }))}
            className="ml-4 text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
