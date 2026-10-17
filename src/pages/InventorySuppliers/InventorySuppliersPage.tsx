import React, { useState } from 'react';
import {
  Boxes,
  Truck,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Mail,
  Building2,
  FileText,
  RotateCw,
  X,
  PackageCheck,
  TrendingDown,
} from 'lucide-react';

interface IStockItem {
  id: string;
  name: string;
  category: 'GRAINS' | 'DAIRY' | 'MEAT' | 'VEGGIES' | 'SPICES' | 'PACKAGING';
  currentStock: number;
  unit: string;
  threshold: number;
  supplier: string;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

interface ISupplier {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  pendingBalance: number;
}

export const InventorySuppliersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'STOCK' | 'SUPPLIERS'>('STOCK');
  const [stockItems, setStockItems] = useState<IStockItem[]>(() => {
    try {
      const stored = localStorage.getItem('apexbee_restaurant_stock');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  });
  const [suppliers, setSuppliers] = useState<ISupplier[]>(() => {
    try {
      const stored = localStorage.getItem('apexbee_restaurant_suppliers');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);

  const saveStock = (updated: IStockItem[]) => {
    setStockItems(updated);
    try {
      localStorage.setItem('apexbee_restaurant_stock', JSON.stringify(updated));
    } catch (e) {}
  };

  const saveSuppliers = (updated: ISupplier[]) => {
    setSuppliers(updated);
    try {
      localStorage.setItem('apexbee_restaurant_suppliers', JSON.stringify(updated));
    } catch (e) {}
  };

  const [newStock, setNewStock] = useState({
    name: '',
    category: 'GRAINS' as IStockItem['category'],
    currentStock: 10,
    unit: 'Kg',
    threshold: 5,
    supplier: '',
  });

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    category: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
  });

  const lowStockCount = stockItems.filter((i) => i.status === 'LOW_STOCK' || i.status === 'OUT_OF_STOCK').length;
  const totalPayables = suppliers.reduce((acc, curr) => acc + curr.pendingBalance, 0);

  const handleRestock = (id: string) => {
    const updated = stockItems.map((item) => {
      if (item.id === id) {
        const added = (item.threshold || 5) * 2;
        return {
          ...item,
          currentStock: item.currentStock + added,
          status: 'IN_STOCK' as const,
        };
      }
      return item;
    });
    saveStock(updated);
    alert('Stock restocked successfully!');
  };

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStock.name.trim()) return;

    const created: IStockItem = {
      id: `stk-${Date.now()}`,
      name: newStock.name,
      category: newStock.category,
      currentStock: Number(newStock.currentStock) || 0,
      unit: newStock.unit,
      threshold: Number(newStock.threshold) || 5,
      supplier: newStock.supplier,
      status: Number(newStock.currentStock) <= Number(newStock.threshold) ? 'LOW_STOCK' : 'IN_STOCK',
    };

    saveStock([created, ...stockItems]);
    setIsAddStockModalOpen(false);
    setNewStock({
      name: '',
      category: 'GRAINS',
      currentStock: 10,
      unit: 'Kg',
      threshold: 5,
      supplier: suppliers[0]?.name || '',
    });
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name.trim() || !newSupplier.phone.trim()) return;

    const created: ISupplier = {
      id: `sup-${Date.now()}`,
      name: newSupplier.name,
      category: newSupplier.category || 'Kitchen Supplies',
      contactPerson: newSupplier.contactPerson || 'Proprietor',
      phone: newSupplier.phone,
      email: newSupplier.email || 'vendor@example.com',
      address: newSupplier.address || 'Local Supplier Market',
      gstin: newSupplier.gstin || '36XXXXX0000X1ZX',
      pendingBalance: 0,
    };

    saveSuppliers([created, ...suppliers]);
    setIsAddSupplierModalOpen(false);
    setNewSupplier({
      name: '',
      category: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      gstin: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Boxes className="w-5 h-5" />
            </span>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 font-heading">
              Inventory &amp; My Suppliers
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Raw material stock tracking, reorder alert thresholds, verified food vendors, and procurement ledgers.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'STOCK' ? (
            <button
              onClick={() => setIsAddStockModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Stock Item</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAddSupplierModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Supplier</span>
            </button>
          )}
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400">Total Tracked Items</div>
          <div className="text-2xl font-black text-slate-100 mt-1 font-mono">{stockItems.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">Kitchen pantry &amp; store</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-rose-500/20">
          <div className="text-[11px] font-medium text-rose-400">Low Stock Warnings</div>
          <div className="text-2xl font-black text-rose-300 mt-1 font-mono">{lowStockCount}</div>
          <div className="text-[10px] text-rose-500/80 mt-1">Below safety threshold</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-cyan-400">Active Suppliers</div>
          <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">{suppliers.length}</div>
          <div className="text-[10px] text-cyan-500/80 mt-1">Contracted Mandi vendors</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-amber-400">Supplier Payables</div>
          <div className="text-2xl font-black text-amber-300 mt-1 font-mono">₹{totalPayables.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-amber-500/80 mt-1">Outstanding procurement balance</div>
        </div>
      </div>

      {/* TAB SELECTOR & SEARCH */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('STOCK')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === 'STOCK'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Raw Material Stock</span>
          </button>
          <button
            onClick={() => setActiveTab('SUPPLIERS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === 'SUPPLIERS'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>My Suppliers</span>
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === 'STOCK' ? 'Search inventory item...' : 'Search supplier name...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* TAB 1: STOCK ITEMS */}
      {activeTab === 'STOCK' && (
        <div className="space-y-4">
          {/* LOW STOCK BANNER */}
          {lowStockCount > 0 && (
            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3 text-rose-300">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>
                  <strong className="font-bold">{lowStockCount} items</strong> have fallen below safe kitchen reorder threshold. Replenish immediately to avoid order cancellations.
                </span>
              </div>
            </div>
          )}

          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">Raw Material Item</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-right">In Stock</th>
                  <th className="p-4 text-right">Min Threshold</th>
                  <th className="p-4">Assigned Supplier</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stockItems
                  .filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition">
                      <td className="p-4 font-bold text-slate-200 text-sm">{item.name}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-black text-slate-100 text-sm">
                        {item.currentStock} {item.unit}
                      </td>
                      <td className="p-4 text-right font-mono text-slate-400">
                        {item.threshold} {item.unit}
                      </td>
                      <td className="p-4 text-slate-300 font-medium">{item.supplier}</td>
                      <td className="p-4 text-center">
                        {item.status === 'IN_STOCK' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Adequate
                          </span>
                        ) : item.status === 'LOW_STOCK' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            Out of Stock
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleRestock(item.id)}
                          className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px] font-bold transition"
                        >
                          + Restock
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MY SUPPLIERS */}
      {activeTab === 'SUPPLIERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers
            .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((sup) => (
              <div
                key={sup.id}
                className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm font-heading">{sup.name}</h3>
                      <div className="text-xs text-amber-400 font-medium mt-0.5">{sup.category}</div>
                    </div>
                    {sup.pendingBalance > 0 ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        ₹{sup.pendingBalance.toLocaleString('en-IN')} Due
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        All Paid
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Contact Person:</span>
                      <span className="font-semibold">{sup.contactPerson}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Phone:</span>
                      <span className="font-mono">{sup.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span>{sup.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">GSTIN:</span>
                      <span className="font-mono text-slate-400">{sup.gstin}</span>
                    </div>
                    <div className="pt-1 border-t border-slate-800/80 text-[11px] text-slate-400 truncate">
                      {sup.address}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center space-x-2">
                  <button
                    onClick={() => alert(`Purchase Order initiated for ${sup.name}!`)}
                    className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                  >
                    Create PO
                  </button>
                  <a
                    href={`tel:${sup.phone}`}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Call Supplier"
                  >
                    <Phone className="w-4 h-4 text-emerald-400" />
                  </a>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ADD STOCK MODAL */}
      {isAddStockModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddStockModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-100 font-heading">Add Raw Material Stock</h3>
            <p className="text-xs text-slate-400 mt-1">Configure item inventory name, category, and minimum reorder alert.</p>

            <form onSubmit={handleAddStock} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Item Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sona Masoori Rice (25kg)"
                  value={newStock.name}
                  onChange={(e) => setNewStock({ ...newStock, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={newStock.category}
                    onChange={(e) => setNewStock({ ...newStock, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="GRAINS">Grains &amp; Flours</option>
                    <option value="MEAT">Meat &amp; Seafood</option>
                    <option value="DAIRY">Dairy &amp; Fats</option>
                    <option value="VEGGIES">Vegetables &amp; Herbs</option>
                    <option value="SPICES">Spices &amp; Seasoning</option>
                    <option value="PACKAGING">Packaging Disposables</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    required
                    placeholder="Kg / Bags / Tins"
                    value={newStock.unit}
                    onChange={(e) => setNewStock({ ...newStock, unit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Current Stock Qty</label>
                  <input
                    type="number"
                    min={0}
                    value={newStock.currentStock}
                    onChange={(e) => setNewStock({ ...newStock, currentStock: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Reorder Alert Level</label>
                  <input
                    type="number"
                    min={1}
                    value={newStock.threshold}
                    onChange={(e) => setNewStock({ ...newStock, threshold: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Default Supplier</label>
                <select
                  value={newStock.supplier}
                  onChange={(e) => setNewStock({ ...newStock, supplier: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddStockModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Save Stock Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SUPPLIER MODAL */}
      {isAddSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddSupplierModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-100 font-heading">Register Verified Supplier</h3>
            <p className="text-xs text-slate-400 mt-1">Add vendor profile for purchase order routing and payment ledgers.</p>

            <form onSubmit={handleAddSupplier} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Supplier Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deccan Spices &amp; Mandi"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Supplied Category</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dairy / Meat / Spices"
                    value={newSupplier.category}
                    onChange={(e) => setNewSupplier({ ...newSupplier, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Contact Person</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ravi Kumar"
                    value={newSupplier.contactPerson}
                    onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="36XXXXX0000X1ZX"
                    value={newSupplier.gstin}
                    onChange={(e) => setNewSupplier({ ...newSupplier, gstin: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Address / Mandi Location</label>
                <input
                  type="text"
                  placeholder="Market yard address"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
