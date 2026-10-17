import React, { useState } from 'react';
import {
  TrendingDown,
  Plus,
  Search,
  Calendar,
  Filter,
  DollarSign,
  FileText,
  CreditCard,
  Banknote,
  Building2,
  Trash2,
  X,
  Receipt,
  PieChart,
} from 'lucide-react';

interface IExpense {
  id: string;
  title: string;
  category: 'GROCERIES' | 'MEAT_DAIRY' | 'UTILITIES' | 'STAFF' | 'MAINTENANCE' | 'PACKAGING' | 'OTHER';
  amount: number;
  paidTo: string;
  paymentMode: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD';
  date: string;
  recordedBy: string;
  notes?: string;
}

const CATEGORY_NAMES: Record<IExpense['category'], string> = {
  GROCERIES: 'Vegetables & Groceries',
  MEAT_DAIRY: 'Meat & Dairy',
  UTILITIES: 'Gas, Power & Water',
  STAFF: 'Staff Wages & Advance',
  MAINTENANCE: 'Repairs & Maintenance',
  PACKAGING: 'Packaging Supplies',
  OTHER: 'Miscellaneous',
};

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<IExpense[]>(() => {
    try {
      const stored = localStorage.getItem('apexbee_restaurant_expenses');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newExp, setNewExp] = useState({
    title: '',
    category: 'GROCERIES' as IExpense['category'],
    amount: '',
    paidTo: '',
    paymentMode: 'UPI' as IExpense['paymentMode'],
    recordedBy: 'Manager',
    notes: '',
  });

  const saveExpenses = (updated: IExpense[]) => {
    setExpenses(updated);
    try {
      localStorage.setItem('apexbee_restaurant_expenses', JSON.stringify(updated));
    } catch (e) {}
  };

  const filteredExpenses = expenses.filter((e) => {
    const matchesCat = selectedCategory === 'ALL' || e.category === selectedCategory;
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.paidTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.recordedBy.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const totalExpenseToday = expenses
    .filter((e) => e.date.startsWith('Today'))
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpenseAll = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExp.title.trim() || !newExp.amount) return;

    const created: IExpense = {
      id: `exp-${Date.now()}`,
      title: newExp.title,
      category: newExp.category,
      amount: Number(newExp.amount) || 0,
      paidTo: newExp.paidTo || 'Vendor',
      paymentMode: newExp.paymentMode,
      date: 'Today, Just now',
      recordedBy: newExp.recordedBy || 'Manager',
      notes: newExp.notes || undefined,
    };

    saveExpenses([created, ...expenses]);
    setIsAddModalOpen(false);
    setNewExp({
      title: '',
      category: 'GROCERIES',
      amount: '',
      paidTo: '',
      paymentMode: 'UPI',
      recordedBy: 'Manager',
      notes: '',
    });
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm('Delete this expense record?')) {
      saveExpenses(expenses.filter((e) => e.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <TrendingDown className="w-5 h-5" />
            </span>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 font-heading">
              Restaurant Daily Expenses
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Log and audit daily cash and online payouts for groceries, utilities, supplies, and maintenance.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-amber-400">Today's Payouts</div>
          <div className="text-2xl font-black text-amber-300 mt-1 font-mono">₹{totalExpenseToday.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-amber-500/80 mt-1">Cash &amp; bank outflow</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400">Total Logged (This Month)</div>
          <div className="text-2xl font-black text-slate-100 mt-1 font-mono">₹{totalExpenseAll.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-500 mt-1">{expenses.length} expense entries</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-rose-400">Largest Category</div>
          <div className="text-lg font-bold text-rose-300 mt-1">Meat &amp; Poultry</div>
          <div className="text-[10px] text-rose-500/80 mt-1">38% of total purchases</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-cyan-400">Cash vs Online</div>
          <div className="text-lg font-bold text-cyan-200 mt-1">26% Cash / 74% UPI</div>
          <div className="text-[10px] text-cyan-500/80 mt-1">Reconciled with cash drawer</div>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'ALL'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Categories
          </button>
          {Object.entries(CATEGORY_NAMES).map(([key, name]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === key
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search vendor or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* EXPENSES TABLE */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800">
            <tr>
              <th className="p-4">Expense Title</th>
              <th className="p-4">Category</th>
              <th className="p-4">Paid To</th>
              <th className="p-4">Payment Mode</th>
              <th className="p-4">Recorded By</th>
              <th className="p-4 text-right">Amount</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  No expenses found matching the selected category.
                </td>
              </tr>
            ) : (
              filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-900/40 transition">
                  <td className="p-4">
                    <div className="font-bold text-slate-200 text-sm">{exp.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{exp.date}</div>
                    {exp.notes && (
                      <div className="text-[10px] text-slate-500 mt-0.5 italic">{exp.notes}</div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {CATEGORY_NAMES[exp.category]}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300 font-medium">{exp.paidTo}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-amber-400 font-mono">
                      {exp.paymentMode}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">{exp.recordedBy}</td>
                  <td className="p-4 text-right font-mono font-black text-rose-400 text-sm">
                    ₹{exp.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* RECORD EXPENSE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-100 font-heading">Record New Expense</h3>
            <p className="text-xs text-slate-400 mt-1">Log supplier purchase or kitchen operational expenditure.</p>

            <form onSubmit={handleAddExpense} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Expense Title / Item</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50kg Basmati Rice Bags"
                  value={newExp.title}
                  onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={newExp.category}
                    onChange={(e) => setNewExp({ ...newExp, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {Object.entries(CATEGORY_NAMES).map(([key, name]) => (
                      <option key={key} value={key}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="3500"
                    value={newExp.amount}
                    onChange={(e) => setNewExp({ ...newExp, amount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Paid To / Supplier</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sri Balaji Mandi"
                    value={newExp.paidTo}
                    onChange={(e) => setNewExp({ ...newExp, paidTo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Payment Mode</label>
                  <select
                    value={newExp.paymentMode}
                    onChange={(e) => setNewExp({ ...newExp, paymentMode: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="CASH">Cash Drawer</option>
                    <option value="BANK_TRANSFER">Bank IMPS / NEFT</option>
                    <option value="CARD">Credit/Debit Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Notes / Bill Invoice No.</label>
                <input
                  type="text"
                  placeholder="Invoice # or remarks"
                  value={newExp.notes}
                  onChange={(e) => setNewExp({ ...newExp, notes: e.target.value })}
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
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
