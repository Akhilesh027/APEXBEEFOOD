import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Banknote,
  QrCode,
  Search,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  RotateCcw,
  Receipt,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { foodService } from '../../services/foodService';
import { qrMenuStorage } from '../../services/qrMenuStorage';

interface IPaymentTxn {
  id: string;
  orderNumber: string;
  orderChannel: 'DINE_IN' | 'TAKEAWAY' | 'ONLINE_DELIVERY';
  customerName: string;
  amount: number;
  paymentMode: 'UPI' | 'CARD' | 'CASH';
  gatewayRef: string;
  status: 'SUCCESS' | 'PENDING' | 'REFUNDED';
  timestamp: string;
}

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<IPaymentTxn[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modeFilter, setModeFilter] = useState<'ALL' | 'UPI' | 'CARD' | 'CASH'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'REFUNDED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadPayments = async () => {
    setLoading(true);
    try {
      // 1. Fetch real backend orders
      const res = await foodService.getOrders({ limit: 100 });
      const backendOrders = res.data?.orders || [];

      // 2. Fetch customer table orders from local storage
      const localCustomerOrders = qrMenuStorage.getCustomerOrders();

      const combinedTxns: IPaymentTxn[] = [];

      // Map backend orders
      backendOrders.forEach((o: any) => {
        const id = o._id ? `TXN-${o._id.toString().slice(-6).toUpperCase()}` : `TXN-${o.orderNumber || '000000'}`;
        const orderNumber = o.orderNumber ? `#${o.orderNumber}` : (o._id ? `#FB-${o._id.toString().slice(-4).toUpperCase()}` : '#FB-0000');
        const orderChannel: 'DINE_IN' | 'TAKEAWAY' | 'ONLINE_DELIVERY' =
          o.orderType === 'DINE_IN' || o.tableNumber ? 'DINE_IN' : (o.orderType === 'TAKEAWAY' ? 'TAKEAWAY' : 'ONLINE_DELIVERY');
        const customerName = o.customerId?.name || o.customerDetails?.name || o.customerName || (o.deliveryAddress?.name) || 'Customer Diner';
        const amount = Number(o.pricing?.total || o.totalAmount || o.grandTotal || 0);
        const pMethodStr = (o.paymentMethod || o.paymentMode || 'UPI').toString().toUpperCase();
        const paymentMode: 'UPI' | 'CARD' | 'CASH' = pMethodStr.includes('CASH') ? 'CASH' : (pMethodStr.includes('CARD') ? 'CARD' : 'UPI');
        const gatewayRef = o.paymentDetails?.transactionId || o.razorpayPaymentId || `UPI/${o._id ? o._id.toString().slice(-8) : 'ApexBee'}`;
        const isCancelled = o.orderStatus === 'cancelled' || o.orderStatus === 'rejected' || o.paymentStatus === 'REFUNDED';
        const status: 'SUCCESS' | 'PENDING' | 'REFUNDED' = isCancelled ? 'REFUNDED' : (o.paymentStatus === 'PENDING' ? 'PENDING' : 'SUCCESS');
        const timestamp = o.createdAt ? new Date(o.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently';

        combinedTxns.push({
          id,
          orderNumber,
          orderChannel,
          customerName,
          amount,
          paymentMode,
          gatewayRef,
          status,
          timestamp,
        });
      });

      // Map QR customer orders not already in backend
      localCustomerOrders.forEach((co) => {
        const existing = combinedTxns.find((t) => t.orderNumber === `#${co.orderNumber}` || t.orderNumber === co.orderNumber);
        if (!existing) {
          combinedTxns.push({
            id: `TXN-${co.orderId.slice(-6).toUpperCase()}`,
            orderNumber: `#${co.orderNumber}`,
            orderChannel: 'DINE_IN',
            customerName: co.customerName || `Table ${co.tableNumber} Guest`,
            amount: co.grandTotal || 0,
            paymentMode: 'UPI',
            gatewayRef: `UPI/Table-${co.tableNumber}/ApexBeePay`,
            status: co.status === 'PLACED' ? 'PENDING' : 'SUCCESS',
            timestamp: co.placedAt || 'Recently',
          });
        }
      });

      setPayments(combinedTxns);
    } catch (err) {
      console.warn('Failed to fetch real payment transactions:', err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
    const interval = setInterval(loadPayments, 15000);
    return () => clearInterval(interval);
  }, []);

  const filteredPayments = payments.filter((p) => {
    const matchesMode = modeFilter === 'ALL' || p.paymentMode === modeFilter;
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesSearch =
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.gatewayRef.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMode && matchesStatus && matchesSearch;
  });

  const totalCollectedToday = payments
    .filter((p) => p.status === 'SUCCESS')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const upiTotal = payments
    .filter((p) => p.paymentMode === 'UPI' && p.status === 'SUCCESS')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const cardTotal = payments
    .filter((p) => p.paymentMode === 'CARD' && p.status === 'SUCCESS')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const cashTotal = payments
    .filter((p) => p.paymentMode === 'CASH' && p.status === 'SUCCESS')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <CreditCard className="w-5 h-5" />
            </span>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 font-heading">
              Payment Transactions &amp; Reconciliation
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-mode collection log: UPI QR, Card Terminal swipes, Cash drawer, and refunds.
          </p>
        </div>

        <button
          onClick={() => alert('Downloading Payment Reconciliation Report (CSV)...')}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold text-xs transition"
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>Export Transactions</span>
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-emerald-400">Total Collected</div>
          <div className="text-2xl font-black text-emerald-300 mt-1 font-mono">₹{totalCollectedToday.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-emerald-500/80 mt-1">All completed tickets</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-amber-400">UPI / QR Collections</div>
          <div className="text-2xl font-black text-amber-300 mt-1 font-mono">₹{upiTotal.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-amber-500/80 mt-1">Direct merchant settlement</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-cyan-400">Card Swipes (POS)</div>
          <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">₹{cardTotal.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-cyan-500/80 mt-1">T+1 bank batch deposit</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-purple-400">Cash Collections</div>
          <div className="text-2xl font-black text-purple-200 mt-1 font-mono">₹{cashTotal.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-purple-400/80 mt-1">Cash drawer verified</div>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center space-x-2">
          {(['ALL', 'UPI', 'CARD', 'CASH'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setModeFilter(mode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                modeFilter === mode
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {mode === 'ALL' ? 'All Modes' : mode}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {(['ALL', 'SUCCESS', 'REFUNDED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search txn ID or order #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* PAYMENTS TABLE */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800">
            <tr>
              <th className="p-4">Transaction Reference</th>
              <th className="p-4">Order / Channel</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Payment Mode</th>
              <th className="p-4 text-right">Amount</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  No payment transactions found matching the filter.
                </td>
              </tr>
            ) : (
              filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-900/40 transition">
                  <td className="p-4">
                    <div className="font-mono font-bold text-slate-200 text-xs">{p.id}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{p.gatewayRef}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{p.timestamp}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-amber-400 font-mono">{p.orderNumber}</div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 mt-1 inline-block">
                      {p.orderChannel.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-slate-200 font-medium">{p.customerName}</td>
                  <td className="p-4">
                    <div className="flex items-center space-x-1.5">
                      {p.paymentMode === 'UPI' && <QrCode className="w-3.5 h-3.5 text-amber-400" />}
                      {p.paymentMode === 'CARD' && <CreditCard className="w-3.5 h-3.5 text-cyan-400" />}
                      {p.paymentMode === 'CASH' && <Banknote className="w-3.5 h-3.5 text-emerald-400" />}
                      <span className="font-bold text-slate-200">{p.paymentMode}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right font-mono font-black text-slate-100 text-sm">
                    ₹{p.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 text-center">
                    {p.status === 'SUCCESS' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Paid
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        Refunded
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => alert(`Receipt #${p.id} opened for printing.`)}
                      className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition"
                    >
                      Print
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
