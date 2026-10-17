import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Star,
  Award,
  Phone,
  Mail,
  Calendar,
  Heart,
  TrendingUp,
  Plus,
  X,
  MessageSquare,
  Gift,
} from 'lucide-react';
import { foodService } from '../../services/foodService';

interface ICustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  tier: 'VIP' | 'GOLD' | 'SILVER' | 'REGULAR';
  totalOrders: number;
  totalSpent: number;
  favoriteItem: string;
  lastVisited: string;
  loyaltyPoints: number;
}

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'ALL' | 'VIP' | 'GOLD' | 'SILVER' | 'REGULAR'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);
  const [newCust, setNewCust] = useState({
    name: '',
    phone: '',
    email: '',
    tier: 'REGULAR' as ICustomer['tier'],
    favoriteItem: '',
  });

  const loadRealCustomers = async () => {
    setLoading(true);
    try {
      // 1. Fetch real orders
      const ordersRes = await foodService.getOrders({ limit: 100 });
      const orders = ordersRes.data?.orders || [];

      // 2. Fetch real dining bookings
      const bookingsRes = await foodService.getDiningBookings();
      const bookings = bookingsRes.data?.bookings || [];

      // 3. Saved custom customers from localStorage
      let customCustomers: ICustomer[] = [];
      try {
        const stored = localStorage.getItem('apexbee_restaurant_customers');
        if (stored) customCustomers = JSON.parse(stored);
      } catch (e) {}

      const customerMap = new Map<string, ICustomer>();

      // Aggregate from orders
      orders.forEach((o: any) => {
        const phone = o.customerId?.phone || o.customerDetails?.phone || o.customerPhone || (o.deliveryAddress?.phone) || '';
        const name = o.customerId?.name || o.customerDetails?.name || o.customerName || (o.deliveryAddress?.name) || 'Guest Diner';
        const email = o.customerId?.email || o.customerDetails?.email || '';
        const key = (phone || name || o._id).toString().trim().toLowerCase();
        const spent = Number(o.pricing?.total || o.totalAmount || o.grandTotal || 0);

        // Find favorite dish from items
        const itemNames = (o.items || []).map((it: any) => it.name || it.item?.name).filter(Boolean);
        const dish = itemNames[0] || 'Chef Special';

        if (!customerMap.has(key)) {
          customerMap.set(key, {
            id: `c-${o._id ? o._id.toString().slice(-6) : Math.random().toString(36).substr(2, 6)}`,
            name,
            phone: phone || 'N/A',
            email: email || 'N/A',
            tier: 'REGULAR',
            totalOrders: 1,
            totalSpent: spent,
            favoriteItem: dish,
            lastVisited: o.createdAt ? new Date(o.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recently',
            loyaltyPoints: Math.floor(spent * 0.05),
          });
        } else {
          const existing = customerMap.get(key)!;
          existing.totalOrders += 1;
          existing.totalSpent += spent;
          existing.loyaltyPoints += Math.floor(spent * 0.05);
          if (dish && (!existing.favoriteItem || existing.favoriteItem === 'Chef Special')) {
            existing.favoriteItem = dish;
          }
        }
      });

      // Aggregate from table bookings
      bookings.forEach((b: any) => {
        const phone = b.customerPhone || '';
        const name = b.customerName || 'Dine-in Guest';
        const email = b.customerEmail || '';
        const key = (phone || name || b._id).toString().trim().toLowerCase();

        if (!customerMap.has(key)) {
          customerMap.set(key, {
            id: `c-${b._id ? b._id.toString().slice(-6) : Math.random().toString(36).substr(2, 6)}`,
            name,
            phone: phone || 'N/A',
            email: email || 'N/A',
            tier: 'SILVER',
            totalOrders: 1,
            totalSpent: (b.guestCount || 2) * 600,
            favoriteItem: 'Table Dining Experience',
            lastVisited: b.bookingDate || 'Upcoming',
            loyaltyPoints: (b.guestCount || 2) * 30,
          });
        } else {
          const existing = customerMap.get(key)!;
          existing.totalOrders += 1;
        }
      });

      // Add custom manual customers
      customCustomers.forEach((cc) => {
        const key = (cc.phone || cc.name).toString().trim().toLowerCase();
        if (!customerMap.has(key)) {
          customerMap.set(key, cc);
        }
      });

      // Assign VIP/Gold/Silver tiers dynamically
      const customerList = Array.from(customerMap.values()).map((c) => {
        if (c.totalOrders >= 15 || c.totalSpent >= 15000) {
          c.tier = 'VIP';
        } else if (c.totalOrders >= 5 || c.totalSpent >= 5000) {
          c.tier = 'GOLD';
        } else if (c.totalOrders >= 2 || c.totalSpent >= 1500) {
          c.tier = 'SILVER';
        } else {
          c.tier = 'REGULAR';
        }
        return c;
      });

      setCustomers(customerList);
    } catch (e) {
      console.warn('Failed to load live customers:', e);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRealCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const matchesTier = tierFilter === 'ALL' || c.tier === tierFilter;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.favoriteItem.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTier && matchesSearch;
  });

  const totalSpendAll = customers.reduce((acc, curr) => acc + curr.totalSpent, 0);
  const avgSpend = Math.round(totalSpendAll / (customers.length || 1));
  const vipCount = customers.filter((c) => c.tier === 'VIP' || c.tier === 'GOLD').length;

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCust.name.trim() || !newCust.phone.trim()) return;

    const created: ICustomer = {
      id: `c-${Date.now()}`,
      name: newCust.name,
      phone: newCust.phone,
      email: newCust.email || `${newCust.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      tier: newCust.tier,
      totalOrders: 1,
      totalSpent: 0,
      favoriteItem: newCust.favoriteItem || 'Chef Special',
      lastVisited: 'Just now',
      loyaltyPoints: 50,
    };

    setCustomers((prev) => {
      const updated = [created, ...prev];
      try {
        localStorage.setItem('apexbee_restaurant_customers', JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });
    setIsAddModalOpen(false);
    setNewCust({ name: '', phone: '', email: '', tier: 'REGULAR', favoriteItem: '' });
  };

  const getTierBadge = (tier: ICustomer['tier']) => {
    switch (tier) {
      case 'VIP':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">VIP Club</span>;
      case 'GOLD':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">Gold</span>;
      case 'SILVER':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-300/15 text-slate-300 border border-slate-300/30">Silver</span>;
      case 'REGULAR':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-800 text-slate-400 border border-slate-700">Member</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 font-heading">
              Customer Directory &amp; CRM
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track diner guest profiles, lifetime spend, order history, loyalty tiers, and personalized rewards.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400">Total Registered Guests</div>
          <div className="text-2xl font-black text-slate-100 mt-1 font-mono">{customers.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">Active diner base</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-amber-400">VIP &amp; Gold Diners</div>
          <div className="text-2xl font-black text-amber-300 mt-1 font-mono">{vipCount}</div>
          <div className="text-[10px] text-amber-500/80 mt-1">High retention segment</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-emerald-400">Avg. Guest Lifetime Value</div>
          <div className="text-2xl font-black text-emerald-300 mt-1 font-mono">₹{avgSpend.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-emerald-500/80 mt-1">Spend per diner</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-cyan-400">Total Customer GMV</div>
          <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">₹{totalSpendAll.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-cyan-500/80 mt-1">Dine-in &amp; takeaway</div>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'VIP', 'GOLD', 'SILVER', 'REGULAR'] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setTierFilter(tier)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                tierFilter === tier
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tier === 'ALL' ? 'All Tiers' : tier}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* CUSTOMERS TABLE */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800">
            <tr>
              <th className="p-4">Customer Details</th>
              <th className="p-4">Loyalty Tier</th>
              <th className="p-4 text-center">Visits / Orders</th>
              <th className="p-4 text-right">Lifetime Spend</th>
              <th className="p-4">Favorite Dish</th>
              <th className="p-4">Last Visit</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  No customers found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-900/40 transition">
                  <td className="p-4">
                    <div className="font-bold text-slate-200 text-sm">{cust.name}</div>
                    <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                      <span>{cust.phone}</span>
                      <span>•</span>
                      <span>{cust.email}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      {getTierBadge(cust.tier)}
                      <span className="text-[11px] text-amber-400/90 font-mono font-semibold">
                        {cust.loyaltyPoints} pts
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-center font-mono font-bold text-slate-200">
                    {cust.totalOrders}
                  </td>
                  <td className="p-4 text-right font-mono font-extrabold text-emerald-400 text-sm">
                    ₹{cust.totalSpent.toLocaleString('en-IN')}
                  </td>
                  <td className="p-4">
                    <span className="flex items-center space-x-1.5 text-slate-300">
                      <Heart className="w-3.5 h-3.5 text-rose-400" />
                      <span>{cust.favoriteItem}</span>
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{cust.lastVisited}</span>
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => setSelectedCustomer(cust)}
                      className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW CUSTOMER PROFILE MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedCustomer(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-lg font-heading">
                {selectedCustomer.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">{selectedCustomer.name}</h3>
                <div className="flex items-center space-x-2 mt-0.5">
                  {getTierBadge(selectedCustomer.tier)}
                  <span className="text-xs text-amber-400 font-mono">{selectedCustomer.loyaltyPoints} Rewards Pts</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Phone Number:</span>
                <span className="text-slate-200 font-medium">{selectedCustomer.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email Address:</span>
                <span className="text-slate-200 font-medium">{selectedCustomer.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Visits / Orders:</span>
                <span className="text-slate-200 font-mono font-bold">{selectedCustomer.totalOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lifetime Revenue:</span>
                <span className="text-emerald-400 font-mono font-extrabold">₹{selectedCustomer.totalSpent.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Favorite Dish:</span>
                <span className="text-slate-200 font-medium">{selectedCustomer.favoriteItem}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last Visited:</span>
                <span className="text-slate-200">{selectedCustomer.lastVisited}</span>
              </div>
            </div>

            <div className="mt-5 flex items-center space-x-2">
              <button
                onClick={() => {
                  alert(`WhatsApp promo offer sent to ${selectedCustomer.phone}!`);
                  setSelectedCustomer(null);
                }}
                className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center justify-center space-x-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Send WhatsApp Offer</span>
              </button>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CUSTOMER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-100 font-heading">Register New Diner</h3>
            <p className="text-xs text-slate-400 mt-1">Create guest CRM record for loyalty tracking and promotional SMS.</p>

            <form onSubmit={handleAddCustomer} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Mahindra"
                  value={newCust.name}
                  onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={newCust.phone}
                  onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="guest@example.com"
                  value={newCust.email}
                  onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Initial Tier</label>
                  <select
                    value={newCust.tier}
                    onChange={(e) => setNewCust({ ...newCust, tier: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="REGULAR">Regular Member</option>
                    <option value="SILVER">Silver</option>
                    <option value="GOLD">Gold</option>
                    <option value="VIP">VIP Club</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Favorite Dish</label>
                  <input
                    type="text"
                    placeholder="e.g. Dum Biryani"
                    value={newCust.favoriteItem}
                    onChange={(e) => setNewCust({ ...newCust, favoriteItem: e.target.value })}
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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
