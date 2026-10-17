import React, { useState } from 'react';
import {
  Coins,
  DollarSign,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  History,
  X,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

interface IShiftRecord {
  id: string;
  date: string;
  shiftName: string;
  openedBy: string;
  closedBy: string;
  openingFloat: number;
  cashSales: number;
  cashExpenses: number;
  expectedCash: number;
  actualCash: number;
  difference: number;
  status: 'CLOSED' | 'OPEN';
}

export const CashRegisterPage: React.FC = () => {
  const [pastShifts, setPastShifts] = useState<IShiftRecord[]>(() => {
    try {
      const stored = localStorage.getItem('apexbee_restaurant_cash_shifts');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  });
  const [openingFloat] = useState(3000);
  const [cashSales] = useState(0);
  const [cashExpenses] = useState(0);
  const [cashDropped, setCashDropped] = useState(0);
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [isCashDropModalOpen, setIsCashDropModalOpen] = useState(false);
  const [dropAmount, setDropAmount] = useState('');

  const saveShifts = (updated: IShiftRecord[]) => {
    setPastShifts(updated);
    try {
      localStorage.setItem('apexbee_restaurant_cash_shifts', JSON.stringify(updated));
    } catch (e) {}
  };

  // Currency Denominations State for Drawer Count
  const [denominations, setDenominations] = useState<{ [key: number]: number }>({
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
  });

  const expectedCashInDrawer = openingFloat + cashSales - cashExpenses - cashDropped;

  const actualCashCounted = Object.entries(denominations).reduce(
    (acc, [val, count]) => acc + Number(val) * (Number(count) || 0),
    0
  );

  const variance = actualCashCounted - expectedCashInDrawer;

  const handleDenominationChange = (value: number, count: string) => {
    setDenominations((prev) => ({
      ...prev,
      [value]: Math.max(0, parseInt(count, 10) || 0),
    }));
  };

  const handleCashDrop = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(dropAmount);
    if (val > 0 && val <= expectedCashInDrawer) {
      setCashDropped((prev) => prev + val);
      alert(`₹${val} successfully transferred to main restaurant safe!`);
      setIsCashDropModalOpen(false);
      setDropAmount('');
    } else {
      alert('Invalid drop amount');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Coins className="w-5 h-5" />
            </span>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 font-heading">
              Cash Register &amp; Shift Drawer
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time cash in drawer, shift reconciliation, denominations count, safe cash drops, and variance audit.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsCashDropModalOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold text-xs transition"
          >
            <ArrowDownRight className="w-4 h-4 text-cyan-400" />
            <span>Safe Cash Drop</span>
          </button>
          <button
            onClick={() => setIsReconcileModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Close Shift &amp; Balance</span>
          </button>
        </div>
      </div>

      {/* CURRENT SHIFT STATUS BANNER */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
          <div>
            <div className="font-bold text-slate-100 text-sm">Shift Active: Lunch &amp; Afternoon Register</div>
            <div className="text-xs text-slate-400 mt-0.5">
              Opened by <span className="text-amber-400 font-semibold">Manager Rajesh</span> at 10:00 AM today
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 self-end sm:self-center">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Expected Cash</div>
            <div className="text-xl font-mono font-black text-amber-400">₹{expectedCashInDrawer.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* CASH DRAWER BREAKDOWN FORMULA */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400">Opening Float</div>
          <div className="text-xl font-mono font-bold text-slate-100 mt-1">₹{openingFloat.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-500 mt-1">Starting change in drawer</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-emerald-500/20">
          <div className="text-[11px] font-medium text-emerald-400">(+) Cash Sales</div>
          <div className="text-xl font-mono font-bold text-emerald-300 mt-1">₹{cashSales.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-emerald-500/80 mt-1">Cash received from guests</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-rose-500/20">
          <div className="text-[11px] font-medium text-rose-400">(-) Cash Payouts</div>
          <div className="text-xl font-mono font-bold text-rose-300 mt-1">₹{cashExpenses.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-rose-500/80 mt-1">Mandi &amp; utility payments</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-cyan-500/20">
          <div className="text-[11px] font-medium text-cyan-400">(-) Safe Cash Drops</div>
          <div className="text-xl font-mono font-bold text-cyan-300 mt-1">₹{cashDropped.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-cyan-500/80 mt-1">Moved to back-office safe</div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/40">
          <div className="text-[11px] font-medium text-amber-300">(=) Drawer Balance</div>
          <div className="text-xl font-mono font-black text-amber-400 mt-1">₹{expectedCashInDrawer.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-amber-500/80 mt-1">Current expected cash</div>
        </div>
      </div>

      {/* SHIFT HISTORY AUDIT */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-100 text-sm font-heading">Previous Shift Settlement Records</h3>
            <p className="text-xs text-slate-400 mt-0.5">Audited end-of-day register closing ledgers</p>
          </div>
          <span className="flex items-center space-x-1 text-xs text-slate-400">
            <History className="w-3.5 h-3.5" />
            <span>Last 3 shifts</span>
          </span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800">
            <tr>
              <th className="p-4">Shift Details</th>
              <th className="p-4 text-right">Opening Float</th>
              <th className="p-4 text-right">Cash Inflow</th>
              <th className="p-4 text-right">Cash Outflow</th>
              <th className="p-4 text-right">Expected</th>
              <th className="p-4 text-right">Counted</th>
              <th className="p-4 text-center">Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {pastShifts.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  No shift reconciliation records yet. Reconciled shifts and drawer balance logs will appear here.
                </td>
              </tr>
            ) : (
              pastShifts.map((s) => (
                <tr key={s.id} className="hover:bg-slate-900/40 transition">
                  <td className="p-4">
                    <div className="font-bold text-slate-200">{s.shiftName}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{s.date} • by {s.closedBy}</div>
                  </td>
                  <td className="p-4 text-right font-mono text-slate-300">₹{s.openingFloat.toLocaleString('en-IN')}</td>
                  <td className="p-4 text-right font-mono text-emerald-400">+₹{s.cashSales.toLocaleString('en-IN')}</td>
                  <td className="p-4 text-right font-mono text-rose-400">-₹{s.cashExpenses.toLocaleString('en-IN')}</td>
                  <td className="p-4 text-right font-mono text-slate-200">₹{s.expectedCash.toLocaleString('en-IN')}</td>
                  <td className="p-4 text-right font-mono font-bold text-slate-100">₹{s.actualCash.toLocaleString('en-IN')}</td>
                  <td className="p-4 text-center">
                    {s.difference === 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Exact Match (₹0)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        Short (₹{Math.abs(s.difference)})
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* RECONCILE / CLOSE SHIFT MODAL */}
      {isReconcileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setIsReconcileModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-100 font-heading">Drawer Count &amp; Reconciliation</h3>
            <p className="text-xs text-slate-400 mt-1">Enter physical denomination count to verify with system expectation.</p>

            <div className="mt-4 grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400">System Expected:</span>
                <div className="text-lg font-mono font-bold text-amber-400">₹{expectedCashInDrawer.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <span className="text-slate-400">Counted Total:</span>
                <div className="text-lg font-mono font-bold text-slate-100">₹{actualCashCounted.toLocaleString('en-IN')}</div>
              </div>
            </div>

            {/* DENOMINATIONS INPUT */}
            <div className="mt-4 space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {[500, 200, 100, 50, 20, 10].map((denom) => (
                <div key={denom} className="flex items-center justify-between text-xs bg-slate-950/40 p-2 rounded-xl border border-slate-800/80">
                  <span className="font-bold text-slate-200 font-mono w-16">₹{denom} ×</span>
                  <input
                    type="number"
                    min={0}
                    value={denominations[denom] || 0}
                    onChange={(e) => handleDenominationChange(denom, e.target.value)}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <span className="font-mono text-slate-400 w-20 text-right">
                    = ₹{(denom * (denominations[denom] || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* VARIANCE DISPLAY */}
            <div className="mt-4 p-3 rounded-2xl border flex items-center justify-between text-xs bg-slate-950">
              <span className="text-slate-400">Drawer Variance:</span>
              <span
                className={`font-mono font-bold ${
                  variance === 0
                    ? 'text-emerald-400'
                    : variance > 0
                    ? 'text-cyan-400'
                    : 'text-rose-400'
                }`}
              >
                {variance === 0
                  ? 'Perfect Match (₹0)'
                  : variance > 0
                  ? `+₹${variance} (Surplus)`
                  : `-₹${Math.abs(variance)} (Shortage)`}
              </span>
            </div>

            <div className="mt-5 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsReconcileModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const newRecord: IShiftRecord = {
                    id: `shift-${Date.now()}`,
                    date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
                    shiftName: 'Active Shift',
                    openedBy: 'Manager',
                    closedBy: 'Manager',
                    openingFloat,
                    cashSales,
                    cashExpenses,
                    expectedCash: expectedCashInDrawer,
                    actualCash: actualCashCounted,
                    difference: variance,
                    status: 'CLOSED',
                  };
                  saveShifts([newRecord, ...pastShifts]);
                  alert('Shift successfully balanced and closed for today!');
                  setIsReconcileModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Confirm &amp; Close Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CASH DROP MODAL */}
      {isCashDropModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
            <button
              onClick={() => setIsCashDropModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-100 font-heading">Safe Cash Drop</h3>
            <p className="text-xs text-slate-400 mt-1">Move excessive cash from till to back-office safe.</p>

            <form onSubmit={handleCashDrop} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Drop Amount (₹)</label>
                <input
                  type="number"
                  required
                  min={100}
                  max={expectedCashInDrawer}
                  placeholder="e.g. 2000"
                  value={dropAmount}
                  onChange={(e) => setDropAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                />
                <div className="text-[10px] text-slate-500 mt-1">Max available: ₹{expectedCashInDrawer}</div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCashDropModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  Confirm Drop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
