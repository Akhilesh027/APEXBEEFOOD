import React, { useState } from 'react';
import {
  Bike,
  Search,
  Plus,
  Phone,
  MapPin,
  Clock,
  Star,
  CheckCircle2,
  Navigation,
  Banknote,
  AlertCircle,
  X,
  Truck,
} from 'lucide-react';

interface IDeliveryExecutive {
  id: string;
  name: string;
  phone: string;
  vehicleType: 'BIKE' | 'SCOOTER' | 'EV_BIKE';
  vehicleNumber: string;
  status: 'ON_DELIVERY' | 'IDLE' | 'OFFLINE';
  activeOrder?: {
    orderNumber: string;
    customerName: string;
    deliveryAddress: string;
    dispatchedAt: string;
    amount: number;
    paymentMode: 'PREPAID' | 'COD';
  };
  deliveriesToday: number;
  codInHand: number;
  rating: number;
}

export const DeliveryExecutivesPage: React.FC = () => {
  const [riders, setRiders] = useState<IDeliveryExecutive[]>(() => {
    try {
      const stored = localStorage.getItem('apexbee_restaurant_riders');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  });
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ON_DELIVERY' | 'IDLE' | 'OFFLINE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRider, setNewRider] = useState({
    name: '',
    phone: '',
    vehicleType: 'BIKE' as IDeliveryExecutive['vehicleType'],
    vehicleNumber: '',
  });

  const saveRidersToStorage = (updated: IDeliveryExecutive[]) => {
    setRiders(updated);
    try {
      localStorage.setItem('apexbee_restaurant_riders', JSON.stringify(updated));
    } catch (e) {}
  };

  const filteredRiders = riders.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery) ||
      r.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const activeOnDelivery = riders.filter((r) => r.status === 'ON_DELIVERY').length;
  const idleCount = riders.filter((r) => r.status === 'IDLE').length;
  const totalCompleted = riders.reduce((acc, curr) => acc + curr.deliveriesToday, 0);
  const totalCodInHand = riders.reduce((acc, curr) => acc + curr.codInHand, 0);

  const handleSettleCod = (id: string) => {
    const updated = riders.map((r) => (r.id === id ? { ...r, codInHand: 0 } : r));
    saveRidersToStorage(updated);
    alert('Rider cash collection settled successfully!');
  };

  const handleToggleDuty = (id: string) => {
    const updated: IDeliveryExecutive[] = riders.map((r) => {
      if (r.id === id) {
        const next: IDeliveryExecutive['status'] = r.status === 'OFFLINE' ? 'IDLE' : 'OFFLINE';
        return { ...r, status: next };
      }
      return r;
    });
    saveRidersToStorage(updated);
  };

  const handleAddRider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRider.name.trim() || !newRider.phone.trim()) return;

    const created: IDeliveryExecutive = {
      id: `r-${Date.now()}`,
      name: newRider.name,
      phone: newRider.phone,
      vehicleType: newRider.vehicleType,
      vehicleNumber: newRider.vehicleNumber || 'TS 09 XX 0000',
      status: 'IDLE',
      deliveriesToday: 0,
      codInHand: 0,
      rating: 5.0,
    };

    saveRidersToStorage([...riders, created]);
    setIsAddModalOpen(false);
    setNewRider({ name: '', phone: '', vehicleType: 'BIKE', vehicleNumber: '' });
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Bike className="w-5 h-5" />
            </span>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 font-heading">
              Delivery Fleet &amp; Rider Executives
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track in-house &amp; connected delivery partners, active drop routes, cash-on-delivery in hand, and shift statuses.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Delivery Executive</span>
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-amber-400">On Active Route</div>
          <div className="text-2xl font-black text-amber-300 mt-1 font-mono">{activeOnDelivery}</div>
          <div className="text-[10px] text-amber-500/80 mt-1">Delivering food orders</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-emerald-400">Idle / Ready</div>
          <div className="text-2xl font-black text-emerald-300 mt-1 font-mono">{idleCount}</div>
          <div className="text-[10px] text-emerald-500/80 mt-1">Available for new dispatch</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-cyan-400">Deliveries Completed</div>
          <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">{totalCompleted}</div>
          <div className="text-[10px] text-cyan-500/80 mt-1">Avg 21 mins per trip</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-purple-400">COD Cash in Hand</div>
          <div className="text-2xl font-black text-purple-200 mt-1 font-mono">₹{totalCodInHand.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-purple-400/80 mt-1">Pending drawer deposit</div>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center space-x-2">
          {(['ALL', 'ON_DELIVERY', 'IDLE', 'OFFLINE'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                statusFilter === status
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {status === 'ALL' ? 'All Fleet' : status.replace('_', ' ').toLowerCase()}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search rider name or vehicle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* RIDERS LIST */}
      {filteredRiders.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-400 space-y-3">
          <Bike className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="text-base font-bold text-slate-200">No Delivery Partners Added Yet</div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Register in-house delivery personnel or partner riders to dispatch food orders and track cash-on-delivery collections.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            + Add First Delivery Executive
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRiders.map((rider) => {
          const isOnDel = rider.status === 'ON_DELIVERY';
          const isIdle = rider.status === 'IDLE';

          return (
            <div
              key={rider.id}
              className={`p-5 rounded-3xl border transition ${
                isOnDel
                  ? 'bg-gradient-to-b from-amber-950/20 to-slate-900/90 border-amber-500/30'
                  : isIdle
                  ? 'bg-slate-900/70 border-emerald-500/20'
                  : 'bg-slate-950/60 border-slate-800 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-100 text-sm font-heading">{rider.name}</span>
                    <span className="flex items-center space-x-1 text-amber-400 text-xs font-bold">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{rider.rating}</span>
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center space-x-2">
                    <span className="text-slate-300">{rider.phone}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-400">{rider.vehicleNumber} ({rider.vehicleType})</span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    isOnDel
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                      : isIdle
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {rider.status.replace('_', ' ')}
                </span>
              </div>

              {/* ACTIVE ORDER TRIP */}
              {rider.activeOrder ? (
                <div className="mt-4 p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 font-mono">{rider.activeOrder.orderNumber}</span>
                    <span className="text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Dispatched {rider.activeOrder.dispatchedAt}</span>
                    </span>
                  </div>
                  <div className="flex items-start space-x-1.5 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{rider.activeOrder.deliveryAddress}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
                    <span className="text-slate-400">Customer: {rider.activeOrder.customerName}</span>
                    <span className="font-mono font-bold text-slate-200">
                      ₹{rider.activeOrder.amount} ({rider.activeOrder.paymentMode})
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-4 py-3 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                  {rider.status === 'OFFLINE' ? 'Executive is currently off-duty' : 'Ready and waiting at restaurant pickup counter'}
                </div>
              )}

              {/* METRICS & COD */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Deliveries Today: </span>
                  <span className="font-bold text-slate-200 font-mono">{rider.deliveriesToday}</span>
                </div>
                <div>
                  <span className="text-slate-400">COD in Hand: </span>
                  <span className="font-bold text-emerald-400 font-mono">₹{rider.codInHand}</span>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="mt-4 flex items-center space-x-2">
                {rider.codInHand > 0 && (
                  <button
                    onClick={() => handleSettleCod(rider.id)}
                    className="flex-1 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/30 transition flex items-center justify-center space-x-1"
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Settle Cash (₹{rider.codInHand})</span>
                  </button>
                )}

                <button
                  onClick={() => handleToggleDuty(rider.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  {rider.status === 'OFFLINE' ? 'Set On Duty' : 'Set Offline'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    )}

      {/* ADD RIDER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-100 font-heading">Add Delivery Executive</h3>
            <p className="text-xs text-slate-400 mt-1">Register new rider fleet partner for food delivery dispatch.</p>

            <form onSubmit={handleAddRider} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Rider Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Babu"
                  value={newRider.name}
                  onChange={(e) => setNewRider({ ...newRider, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Mobile Contact</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={newRider.phone}
                  onChange={(e) => setNewRider({ ...newRider, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Vehicle Type</label>
                  <select
                    value={newRider.vehicleType}
                    onChange={(e) => setNewRider({ ...newRider, vehicleType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="BIKE">Motorcycle / Bike</option>
                    <option value="EV_BIKE">Electric Bike (EV)</option>
                    <option value="SCOOTER">Scooter</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Vehicle Plate Number</label>
                  <input
                    type="text"
                    required
                    placeholder="TS 09 EQ 1234"
                    value={newRider.vehicleNumber}
                    onChange={(e) => setNewRider({ ...newRider, vehicleNumber: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
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
                  Add Rider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
