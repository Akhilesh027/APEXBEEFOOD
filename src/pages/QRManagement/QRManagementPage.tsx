import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCode,
  Plus,
  Search,
  LayoutGrid,
  Filter,
  Download,
  Printer,
  Smartphone,
  Sparkles,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Trash2,
  Edit,
  ExternalLink,
} from 'lucide-react';
import {
  qrMenuStorage,
  IQRRecord,
  ICustomerPlacedOrder,
} from '../../services/qrMenuStorage';
import { QRCodeCard } from '../../components/common/QRCodeCard';
import { GenerateQRModal } from '../../components/common/GenerateQRModal';

const SECTIONS = ['All Sections', 'Main Dining Hall', 'AC Family Lounge', 'Rooftop Terrace', 'Outdoor Patio', 'Billing Counter'];

export const QRManagementPage: React.FC = () => {
  const navigate = useNavigate();

  const [qrs, setQrs] = useState<IQRRecord[]>([]);
  const [selectedSection, setSelectedSection] = useState('All Sections');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  // Live customer orders placed from QR
  const [customerOrders, setCustomerOrders] = useState<ICustomerPlacedOrder[]>([]);

  // Mobile Scan Host Configuration (for real smartphone Wi-Fi scanning)
  const [hostOverride, setHostOverride] = useState(() => localStorage.getItem('apexbee_qr_host_override') || '');
  const [hostSaved, setHostSaved] = useState(false);

  const handleSaveHost = (newVal: string) => {
    const trimmed = newVal.trim();
    if (trimmed) {
      localStorage.setItem('apexbee_qr_host_override', trimmed);
      setHostOverride(trimmed);
    } else {
      localStorage.removeItem('apexbee_qr_host_override');
      setHostOverride('');
    }
    setHostSaved(true);
    setTimeout(() => setHostSaved(false), 2500);
    loadData();
  };

  const loadData = async () => {
    try {
      const tables = await qrMenuStorage.loadTablesFromBackend();
      if (tables && tables.length > 0) {
        setQrs(tables);
      } else {
        setQrs(qrMenuStorage.getQRs());
      }
      await qrMenuStorage.loadRealMenuItems();
    } catch (e) {
      setQrs(qrMenuStorage.getQRs());
    }
    const orders = qrMenuStorage.getCustomerOrders();
    setCustomerOrders(orders);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredQRs = qrs.filter((qr) => {
    const matchSection = selectedSection === 'All Sections' || qr.section === selectedSection;
    const matchSearch =
      qr.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      qr.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      qr.section.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSection && matchSearch;
  });

  const totalScans = qrs.reduce((acc, q) => acc + (q.scanCount || 0), 0);
  const totalCurated = qrs.filter((q) => q.menuMode === 'CUSTOM_SELECTION').length;

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this QR code?')) {
      const updated = qrMenuStorage.deleteQR(id);
      setQrs(updated);
    }
  };

  const handleSimulateScan = (url: string) => {
    window.open(url, '_blank');
  };

  const currentEffectiveOrigin = hostOverride.trim()
    ? (hostOverride.startsWith('http') ? hostOverride : `http://${hostOverride}`)
    : window.location.origin;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <QrCode className="w-5 h-5" />
            </span>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 font-heading">
              QR Code Generation &amp; Digital Menus
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Generate printable scannable QR standees for dining tables and counters with customized menu offerings.
          </p>
        </div>

        <button
          onClick={() => setIsGenerateModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New QR Code</span>
        </button>
      </div>

      {/* MOBILE SCANNING IP / NETWORK SETUP TOOLBAR */}
      <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-4 md:p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded-lg bg-amber-500/20 text-amber-300">
                <Smartphone className="w-4 h-4" />
              </span>
              <h3 className="font-extrabold text-slate-100 text-sm font-heading">
                Mobile Camera Scanning Network Host
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Port 5179 Open
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              When scanning from a physical smartphone camera on the same Wi-Fi, the QR needs your Computer's LAN IP (e.g.{' '}
              <span className="text-amber-300 font-mono">192.168.x.x:5179</span>) or live domain instead of{' '}
              <span className="text-rose-400 font-mono">localhost</span> (which refers to the phone itself).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={hostOverride}
                onChange={(e) => setHostOverride(e.target.value)}
                placeholder="e.g. 192.168.1.15:5179 or live domain"
                className="w-full sm:w-64 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 font-mono outline-none"
              />
            </div>

            <button
              onClick={() => handleSaveHost(hostOverride)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition whitespace-nowrap"
            >
              {hostSaved ? '✓ Applied!' : 'Apply to All QRs'}
            </button>

            {hostOverride && (
              <button
                onClick={() => handleSaveHost('')}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs transition whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500">Active QR Target Base:</span>
            <span className="font-mono text-amber-400 font-bold">{currentEffectiveOrigin}</span>
          </div>
          <span className="text-slate-500 hidden sm:inline">Clean 320px high-contrast QR enabled for camera focus</span>
        </div>
      </div>

      {/* METRIC STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400">Active QR Standees</div>
          <div className="text-2xl font-black text-slate-100 mt-1 font-mono">{qrs.length}</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">Tables &amp; counters ready</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-amber-400">Total Customer Scans</div>
          <div className="text-2xl font-black text-amber-300 mt-1 font-mono">{totalScans}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">All time menu visits</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-cyan-400">Curated Menu QRs</div>
          <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">{totalCurated}</div>
          <div className="text-[10px] text-cyan-500/80 mt-0.5">Custom items configured</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-purple-300">Live QR Orders</div>
          <div className="text-2xl font-black text-purple-200 mt-1 font-mono">{customerOrders.length}</div>
          <div className="text-[10px] text-purple-400/80 mt-0.5">Punched from guest phones</div>
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
            placeholder="Search table or label..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* QR CODES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredQRs.map((qr) => (
          <div key={qr.id} className="relative group">
            <QRCodeCard
              qrRecord={qr}
              onOpenCustomerView={handleSimulateScan}
            />

            {/* DELETE BUTTON */}
            <button
              onClick={() => handleDelete(qr.id)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-500/40 transition opacity-0 group-hover:opacity-100"
              title="Delete QR"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* RECENT SCAN ORDERS TABLE (IF ANY) */}
      {customerOrders.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h3 className="font-black text-slate-100 font-heading text-sm md:text-base">
                Recent Guest Orders from QR Scans
              </h3>
            </div>
            <span className="text-xs text-slate-400">{customerOrders.length} orders recorded</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] text-slate-400 uppercase bg-slate-950/60 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Table</th>
                  <th className="py-2.5 px-3">Guest</th>
                  <th className="py-2.5 px-3">Dishes</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {customerOrders.slice(0, 5).map((ord) => (
                  <tr key={ord.orderId} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">{ord.orderNumber}</td>
                    <td className="py-3 px-3 font-semibold text-slate-200">Table {ord.tableNumber}</td>
                    <td className="py-3 px-3 text-slate-300">{ord.customerName || 'Dine-In Guest'}</td>
                    <td className="py-3 px-3 text-slate-400">
                      {ord.items.map((i) => `${i.item.name} (${i.quantity})`).join(', ')}
                    </td>
                    <td className="py-3 px-3 font-mono font-extrabold text-slate-100">₹{ord.grandTotal}</td>
                    <td className="py-3 px-3 text-slate-400">{ord.placedAt}</td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GENERATE QR MODAL */}
      <GenerateQRModal
        isOpen={isGenerateModalOpen}
        onClose={() => {
          setIsGenerateModalOpen(false);
          loadData();
        }}
        onQRGenerated={(newQR) => {
          loadData();
        }}
        onSimulateCustomerScan={handleSimulateScan}
      />
    </div>
  );
};
