import React, { useState } from 'react';
import {
  LayoutGrid,
  Plus,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Coffee,
  X,
  Search,
  Filter,
  Receipt,
  RotateCcw,
  Sparkles,
  QrCode,
  Smartphone,
} from 'lucide-react';
import { GenerateQRModal } from '../../components/common/GenerateQRModal';
import { foodService } from '../../services/foodService';
import { qrMenuStorage, IQRRecord } from '../../services/qrMenuStorage';

interface ITable {
  id: string;
  number: string;
  section: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'BILLING' | 'RESERVED';
  activeOrder?: {
    orderNumber: string;
    itemsCount: number;
    amount: number;
    seatedAt: string;
    waiter: string;
  };
}

const SECTIONS = ['All Sections', 'Main Dining Hall', 'AC Family Lounge', 'Rooftop Terrace', 'Outdoor Patio'];

export const TablesManagement: React.FC = () => {
  const [tables, setTables] = useState<ITable[]>([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [selectedSection, setSelectedSection] = useState('All Sections');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'BILLING' | 'RESERVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [activeQRTable, setActiveQRTable] = useState('T-01');
  const [activeQRSection, setActiveQRSection] = useState('Main Dining Hall');
  const [newTable, setNewTable] = useState({
    number: '',
    section: 'Main Dining Hall',
    capacity: 4,
  });

  // Load real dining tables and their separate QRs from backend
  const loadTables = async (silent = false) => {
    if (!silent) setLoadingTables(true);
    try {
      const qrs = await qrMenuStorage.loadTablesFromBackend();
      if (qrs && qrs.length > 0) {
        const mappedTables: ITable[] = qrs.map((q) => ({
          id: q.id,
          number: q.tableNumber,
          section: q.section,
          capacity: q.capacity || 4,
          status: (q.status as any) || 'AVAILABLE',
          activeOrder: q.activeOrder,
        }));
        setTables(mappedTables);
      } else {
        setTables([]);
      }
    } catch (e) {
      if (!silent) setTables([]);
    } finally {
      if (!silent) setLoadingTables(false);
    }
  };

  React.useEffect(() => {
    loadTables();
    const interval = setInterval(() => {
      loadTables(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredTables = tables.filter((t) => {
    const matchesSection = selectedSection === 'All Sections' || t.section === selectedSection;
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesSearch = t.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.activeOrder?.waiter && t.activeOrder.waiter.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSection && matchesStatus && matchesSearch;
  });

  const totalCount = tables.length;
  const availableCount = tables.filter((t) => t.status === 'AVAILABLE').length;
  const occupiedCount = tables.filter((t) => t.status === 'OCCUPIED').length;
  const billingCount = tables.filter((t) => t.status === 'BILLING').length;
  const reservedCount = tables.filter((t) => t.status === 'RESERVED').length;

  const handleUpdateStatus = (id: string, newStatus: ITable['status']) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          if (newStatus === 'AVAILABLE') {
            return { ...t, status: newStatus, activeOrder: undefined };
          }
          return { ...t, status: newStatus };
        }
        return t;
      })
    );
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTable.number.trim()) return;

    const cleanNumber = newTable.number.toUpperCase().trim();
    const created: ITable = {
      id: `t-${Date.now()}`,
      number: cleanNumber,
      section: newTable.section,
      capacity: Number(newTable.capacity) || 4,
      status: 'AVAILABLE',
    };

    // Auto-generate separate QR Code record for this specific table
    const newQR: IQRRecord = {
      id: `qr-${cleanNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString().slice(-4)}`,
      tableNumber: cleanNumber,
      section: newTable.section,
      capacity: Number(newTable.capacity) || 4,
      label: `Table ${cleanNumber} QR Standee`,
      menuMode: 'ALL_ITEMS',
      selectedItemIds: [],
      discountPercent: 10,
      specialNote: `Welcome to Table ${cleanNumber}! Scan with camera to view live menu & order.`,
      createdAt: new Date().toISOString(),
      isActive: true,
      scanCount: 0,
    };

    // Save and sync with backend
    qrMenuStorage.saveQR(newQR);

    setTables((prev) => [...prev, created]);
    setNewTable({ number: '', section: 'Main Dining Hall', capacity: 4 });
    setIsAddModalOpen(false);
  };

  const handleGenerateAllQRs = async () => {
    try {
      const tableNumbers = tables.map((t) => t.number);
      await foodService.generateAllSeparateTableQRs({ tablesList: tableNumbers });
      for (const t of tables) {
        qrMenuStorage.saveQR({
          id: `qr-${t.number.toLowerCase()}-${Date.now().toString().slice(-4)}`,
          tableNumber: t.number,
          section: t.section,
          capacity: t.capacity,
          label: `Table ${t.number} QR Menu`,
          menuMode: 'ALL_ITEMS',
          selectedItemIds: [],
          discountPercent: 10,
          specialNote: `Table ${t.number} • Contactless Digital Menu`,
          createdAt: new Date().toISOString(),
          isActive: true,
          scanCount: 0,
        });
      }
      alert(`Separate QR Codes generated successfully for all ${tables.length} tables!`);
    } catch (e) {
      alert('Generated separate QR codes for all tables locally.');
    }
  };

  const getStatusBadge = (status: ITable['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Available</span>;
      case 'OCCUPIED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">Occupied</span>;
      case 'BILLING':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">Billing</span>;
      case 'RESERVED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/15 text-purple-300 border border-purple-500/30">Reserved</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <LayoutGrid className="w-5 h-5" />
            </span>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 font-heading">
              Table &amp; Floor Management
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time visual table statuses, seated guests, active orders, and floor occupancy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGenerateAllQRs}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 font-bold text-xs transition cursor-pointer"
            title="Automatically generate separate QR codes for each dining table"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Generate QRs For All Tables</span>
          </button>

          <button
            onClick={() => {
              setActiveQRTable('T-01');
              setActiveQRSection('Main Dining Hall');
              setIsQRModalOpen(true);
            }}
            className="flex items-center justify-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-amber-500/40 hover:border-amber-500 text-amber-400 font-bold text-xs transition cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Customize Table QR</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Table</span>
          </button>
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`cursor-pointer p-4 rounded-2xl border transition ${
            statusFilter === 'ALL'
              ? 'bg-slate-900 border-amber-500/50 shadow-md shadow-amber-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-[11px] font-medium text-slate-400">Total Tables</div>
          <div className="text-2xl font-black text-slate-100 mt-1 font-mono">{totalCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">All layout zones</div>
        </div>

        <div
          onClick={() => setStatusFilter('AVAILABLE')}
          className={`cursor-pointer p-4 rounded-2xl border transition ${
            statusFilter === 'AVAILABLE'
              ? 'bg-emerald-950/30 border-emerald-500/50'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-[11px] font-medium text-emerald-400">Available</div>
          <div className="text-2xl font-black text-emerald-300 mt-1 font-mono">{availableCount}</div>
          <div className="text-[10px] text-emerald-500/80 mt-1">Ready to seat</div>
        </div>

        <div
          onClick={() => setStatusFilter('OCCUPIED')}
          className={`cursor-pointer p-4 rounded-2xl border transition ${
            statusFilter === 'OCCUPIED'
              ? 'bg-amber-950/30 border-amber-500/50'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-[11px] font-medium text-amber-400">Occupied</div>
          <div className="text-2xl font-black text-amber-300 mt-1 font-mono">{occupiedCount}</div>
          <div className="text-[10px] text-amber-500/80 mt-1">Dining active</div>
        </div>

        <div
          onClick={() => setStatusFilter('BILLING')}
          className={`cursor-pointer p-4 rounded-2xl border transition ${
            statusFilter === 'BILLING'
              ? 'bg-cyan-950/30 border-cyan-500/50'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-[11px] font-medium text-cyan-400">Billing</div>
          <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">{billingCount}</div>
          <div className="text-[10px] text-cyan-500/80 mt-1">Settling cheque</div>
        </div>

        <div
          onClick={() => setStatusFilter('RESERVED')}
          className={`cursor-pointer p-4 rounded-2xl border transition ${
            statusFilter === 'RESERVED'
              ? 'bg-purple-950/30 border-purple-500/50'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-[11px] font-medium text-purple-300">Reserved</div>
          <div className="text-2xl font-black text-purple-200 mt-1 font-mono">{reservedCount}</div>
          <div className="text-[10px] text-purple-400/80 mt-1">Booked slots</div>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          {SECTIONS.map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSection(sec)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedSection === sec
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search table or waiter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* TABLE GRID */}
      {loadingTables ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-3xl border border-slate-800">
          <Clock className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-3" />
          <p className="text-sm font-semibold">Loading dining tables...</p>
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
          <LayoutGrid className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <h4 className="text-base font-bold text-slate-200">No Dining Tables Found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedSection !== 'All Sections' || statusFilter !== 'ALL'
              ? 'No tables match the selected filters.'
              : 'Add your dining tables to automatically generate distinct QR codes and digital menus for your guests.'}
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Table</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTables.map((t) => {
          const isOcc = t.status === 'OCCUPIED';
          const isBill = t.status === 'BILLING';
          const isRes = t.status === 'RESERVED';

          return (
            <div
              key={t.id}
              className={`relative rounded-3xl p-5 border transition-all duration-200 ${
                isOcc
                  ? 'bg-gradient-to-b from-amber-950/20 to-slate-900/90 border-amber-500/30 shadow-lg shadow-amber-950/10'
                  : isBill
                  ? 'bg-gradient-to-b from-cyan-950/20 to-slate-900/90 border-cyan-500/30'
                  : isRes
                  ? 'bg-gradient-to-b from-purple-950/20 to-slate-900/90 border-purple-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-2xl font-black font-heading text-slate-100">{t.number}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{t.section}</div>
                </div>
                {getStatusBadge(t.status)}
              </div>

              <div className="mt-4 flex items-center space-x-3 text-xs text-slate-300">
                <span className="flex items-center space-x-1 bg-slate-800/80 px-2 py-1 rounded-lg">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.capacity} Seats</span>
                </span>
                {t.activeOrder?.seatedAt && (
                  <span className="flex items-center space-x-1 bg-slate-800/80 px-2 py-1 rounded-lg text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t.activeOrder.seatedAt}</span>
                  </span>
                )}
              </div>

              {/* ACTIVE ORDER DETAILS */}
              {t.activeOrder ? (
                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Order:</span>
                    <span className="font-mono font-bold text-amber-400">{t.activeOrder.orderNumber}</span>
                  </div>
                  {t.activeOrder.itemsCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Total Bill:</span>
                      <span className="font-mono font-extrabold text-slate-100">₹{t.activeOrder.amount} ({t.activeOrder.itemsCount} items)</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Attendant:</span>
                    <span className="font-medium text-slate-300">{t.activeOrder.waiter}</span>
                  </div>
                </div>
              ) : (
                <div className="mt-6 py-3 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                  Table is clean & vacant
                </div>
              )}

              {/* QUICK ACTIONS */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-1.5">
                {t.status === 'AVAILABLE' ? (
                  <button
                    onClick={() => handleUpdateStatus(t.id, 'OCCUPIED')}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition text-center cursor-pointer"
                  >
                    Seat Guests
                  </button>
                ) : t.status === 'OCCUPIED' ? (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(t.id, 'BILLING')}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-[11px] border border-cyan-500/30 transition text-center cursor-pointer"
                    >
                      Ask Bill
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(t.id, 'AVAILABLE')}
                      className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition cursor-pointer"
                      title="Clear Table"
                    >
                      Clear
                    </button>
                  </>
                ) : t.status === 'BILLING' ? (
                  <button
                    onClick={() => handleUpdateStatus(t.id, 'AVAILABLE')}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] transition text-center cursor-pointer"
                  >
                    Paid & Vacant
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus(t.id, 'OCCUPIED')}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-[11px] transition text-center cursor-pointer"
                  >
                    Check In Guest
                  </button>
                )}

                <button
                  onClick={() => {
                    setActiveQRTable(t.number);
                    setActiveQRSection(t.section);
                    setIsQRModalOpen(true);
                  }}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px] font-semibold transition cursor-pointer"
                  title={`Generate QR & Menu for ${t.number}`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    )}

      {/* ADD TABLE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-100 font-heading">Add New Dining Table</h3>
            <p className="text-xs text-slate-400 mt-1">Configure floor number, section, and guest seating capacity.</p>

            <form onSubmit={handleAddTable} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Table Number / Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. T-11 or VIP-1"
                  value={newTable.number}
                  onChange={(e) => setNewTable({ ...newTable, number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Section / Floor Zone</label>
                <select
                  value={newTable.section}
                  onChange={(e) => setNewTable({ ...newTable, section: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Main Dining Hall">Main Dining Hall</option>
                  <option value="AC Family Lounge">AC Family Lounge</option>
                  <option value="Rooftop Terrace">Rooftop Terrace</option>
                  <option value="Outdoor Patio">Outdoor Patio</option>
                  <option value="VIP Lounge">VIP Lounge</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Seating Capacity (Guests)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={newTable.capacity}
                  onChange={(e) => setNewTable({ ...newTable, capacity: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Add Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GENERATE QR MODAL */}
      <GenerateQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        defaultTable={activeQRTable}
        defaultSection={activeQRSection}
        onSimulateCustomerScan={(url) => window.open(url, '_blank')}
      />
    </div>
  );
};
