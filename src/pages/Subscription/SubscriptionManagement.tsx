import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Zap,
  Award,
  Sparkles,
  CreditCard,
  AlertCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Receipt,
  ArrowUpRight,
  FileText,
} from 'lucide-react';
import { foodService } from '../../services/foodService';
import { openRazorpayModal } from '../../utils/razorpay';
import { useFoodAuthStore } from '../../store/useFoodAuthStore';

interface FeeInvoice {
  _id: string;
  invoiceNumber: string;
  title: string;
  description?: string;
  recipientName?: string;
  recipientBusinessName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  baseAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'paid' | 'cancelled' | 'expired' | 'failed';
  paymentLinkToken: string;
  shortPaymentUrl?: string;
  paidAt?: string;
  dueDate?: string;
  notes?: string;
  paymentMethod?: string;
  paymentId?: string;
  commissionSettled?: boolean;
  createdAt: string;
}

export const SubscriptionManagement: React.FC = () => {
  const { restaurant } = useFoodAuthStore();
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await foodService.getMyInvoices();
      if (res.data?.success && Array.isArray(res.data.data)) {
        setInvoices(res.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load food partner invoices:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleCopyLink = (token: string, id: string) => {
    const url = `https://apexbee.in/pay/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    showToast('Payment link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handlePayInvoice = async (invoice: FeeInvoice) => {
    try {
      setPayingId(invoice._id);

      // 1. Create Razorpay Order on Backend
      const orderRes = await foodService.createInvoiceRazorpayOrder({
        invoiceId: invoice._id,
        token: invoice.paymentLinkToken,
      });

      const orderData = orderRes.data;
      if (!orderData || !orderData.orderId) {
        throw new Error(orderData?.message || 'Failed to initialize payment gateway order');
      }

      // 2. Open Razorpay Checkout modal
      const paymentResponse = await openRazorpayModal({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'ApexBee Food Network',
        description: `Payment for ${invoice.title} (#${invoice.invoiceNumber})`,
        order_id: orderData.orderId,
        prefill: {
          name: restaurant?.restaurantName || invoice.recipientName || 'Food Partner',
          email: restaurant?.email || invoice.recipientEmail || '',
          contact: restaurant?.phone || invoice.recipientPhone || '',
        },
        theme: {
          color: '#F59E0B',
        },
      });

      // 3. Confirm payment with backend & trigger settlement
      const confirmRes = await foodService.payInvoice({
        invoiceId: invoice._id,
        token: invoice.paymentLinkToken,
        paymentMethod: 'Razorpay',
        paymentGatewayOrderId: paymentResponse.razorpay_order_id,
        paymentId: paymentResponse.razorpay_payment_id,
        signature: paymentResponse.razorpay_signature,
      });

      if (confirmRes.data?.success) {
        showToast('✅ Payment successful! Your food partner license & account are active.', 'success');
        fetchInvoices();
      } else {
        showToast(confirmRes.data?.message || 'Payment confirmation failed', 'error');
      }
    } catch (err: any) {
      console.error('Invoice payment error:', err);
      showToast(err.message || 'Payment failed or was cancelled.', 'error');
    } finally {
      setPayingId(null);
    }
  };

  const pendingInvoices = invoices.filter((inv) => inv.status === 'pending');
  const paidInvoices = invoices.filter((inv) => inv.status === 'paid');

  return (
    <div className="space-y-8 font-['Plus_Jakarta_Sans',sans-serif] pb-10">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 text-sm font-semibold transition-all transform animate-in slide-in-from-bottom duration-200 border ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40 shadow-emerald-500/10'
              : 'bg-rose-950/90 text-rose-200 border-rose-500/40 shadow-rose-500/10'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-heading text-slate-100 flex items-center space-x-3">
            <Receipt className="w-7 h-7 text-amber-400" />
            <span>Invoices & Payment Links</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            View admin-issued fee invoices, complete payments for restaurant licenses, and view settled receipts.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-amber-500/50 text-slate-300 hover:text-white text-xs font-bold transition flex items-center space-x-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Direct Razorpay Gateway</span>
          </div>
        </div>
      </div>

      {/* PENDING ADMIN INVOICES & PAYMENT LINKS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-100 font-heading">Admin Payment Links & Requests</h2>
            {pendingInvoices.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950 uppercase">
                {pendingInvoices.length} Pending
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex items-center justify-center space-x-3 text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
            <span className="text-sm">Checking for admin payment links...</span>
          </div>
        ) : pendingInvoices.length === 0 ? (
          <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-200">No Pending Payment Requests</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              You are all caught up! When the ApexBee admin issues a fee invoice or payment link for your restaurant, it will appear here immediately with direct online payment options.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingInvoices.map((inv) => {
              const paymentUrl = inv.shortPaymentUrl || `https://apexbee.in/pay/${inv.paymentLinkToken}`;
              const isPaying = payingId === inv._id;
              const isCopied = copiedId === inv._id;

              return (
                <div
                  key={inv._id}
                  className="glass-panel p-6 rounded-3xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 shadow-xl shadow-amber-500/5 space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">
                          {inv.invoiceNumber}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>PAYMENT ACTION REQUIRED</span>
                        </span>
                      </div>
                      <h3 className="text-xl font-extrabold text-slate-100 font-heading pt-1">{inv.title}</h3>
                      {inv.description && <p className="text-xs text-slate-400">{inv.description}</p>}
                    </div>

                    <div className="sm:text-right shrink-0">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Payable</div>
                      <div className="text-3xl font-black text-amber-400 font-mono">
                        ₹{inv.totalAmount?.toLocaleString('en-IN') || 0}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Base: ₹{inv.baseAmount} + GST (18%): ₹{inv.taxAmount}
                      </div>
                    </div>
                  </div>

                  {inv.notes && (
                    <div className="p-3 bg-slate-950/60 border border-amber-500/20 rounded-xl text-xs text-amber-200/90 flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Admin Note: </span>
                        <span>{inv.notes}</span>
                      </div>
                    </div>
                  )}

                  {/* PAYMENT ACTIONS BAR */}
                  <div className="pt-4 border-t border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    <div className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 truncate">
                      <span className="text-slate-400 font-medium shrink-0">Payment Link:</span>
                      <code className="text-amber-400 font-mono truncate">{paymentUrl}</code>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCopyLink(inv.paymentLinkToken, inv._id)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1.5"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copied' : 'Copy Link'}</span>
                      </button>

                      <a
                        href={paymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Page</span>
                      </a>

                      <button
                        onClick={() => handlePayInvoice(inv)}
                        disabled={isPaying}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black transition shadow-lg shadow-amber-500/20 flex items-center space-x-2 disabled:opacity-50"
                      >
                        {isPaying ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                        ) : (
                          <CreditCard className="w-4 h-4 text-slate-950" />
                        )}
                        <span>{isPaying ? 'Processing...' : `Pay ₹${inv.totalAmount} Now`}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PAID INVOICES SETTLEMENT HISTORY */}
      {paidInvoices.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-100 font-heading">Payment History & Settled Invoices</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
              {paidInvoices.length} Settled
            </span>
          </div>

          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Invoice #</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Paid Date</th>
                    <th className="p-4">Payment Method</th>
                    <th className="p-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {paidInvoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-900/40 transition">
                      <td className="p-4 font-mono font-bold text-amber-400">{inv.invoiceNumber}</td>
                      <td className="p-4 font-semibold text-slate-100">{inv.title}</td>
                      <td className="p-4 font-mono font-bold text-slate-100">₹{inv.totalAmount?.toLocaleString('en-IN')}</td>
                      <td className="p-4 text-slate-400">
                        {inv.paidAt
                          ? new Date(inv.paidAt).toLocaleDateString([], {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Paid'}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 font-medium text-slate-300 text-[11px]">
                          {inv.paymentMethod || 'Razorpay Online'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Paid & Verified</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE RESTAURANT COMMISSION & PLATFORM PLAN */}
      <div className="pt-6 border-t border-slate-800 space-y-6">
        <div>
          <h2 className="text-xl font-extrabold font-heading text-slate-100 flex items-center space-x-2">
            <Award className="w-6 h-6 text-amber-400" />
            <span>ApexBee Food Partner Plan & Commission Tier</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Your active restaurant platform plan, commission structure, and promotional visibility benefits
          </p>
        </div>

        {/* ACTIVE PLAN CARD */}
        <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl font-extrabold shadow-lg shadow-amber-500/20">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest block">Active Restaurant Plan</span>
                <h2 className="text-xl font-extrabold text-slate-100 font-heading">ApexBee Gold Food Partner</h2>
              </div>
            </div>

            <span className="px-3.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-bold text-xs">
              PROMOTED STATUS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Platform Commission</div>
              <div className="text-lg font-extrabold text-amber-400 font-mono">10% per order</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Delivery Logistics</div>
              <div className="text-lg font-extrabold text-emerald-400 font-mono">ApexBee Express</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Payout Settlement</div>
              <div className="text-lg font-extrabold text-slate-100 font-mono">T+1 Daily Auto-Settlement</div>
            </div>
          </div>
        </div>

        {/* PLAN COMPARISON TIERS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="font-extrabold text-base text-slate-200">Standard Partner</h3>
            <div className="text-2xl font-extrabold text-slate-100 font-mono">15% <span className="text-xs text-slate-400 font-normal">Commission</span></div>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> <span>Standard Search Listing</span></li>
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> <span>ApexBee Delivery Partner Network</span></li>
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> <span>Weekly Payouts</span></li>
            </ul>
          </div>

          <div className="glass-panel p-6 rounded-3xl border-2 border-amber-500 bg-slate-900/90 space-y-4 relative overflow-hidden">
            <div className="absolute top-3 right-3 bg-amber-500 text-slate-950 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
              CURRENT PLAN
            </div>
            <h3 className="font-extrabold text-base text-amber-400">ApexBee Gold</h3>
            <div className="text-2xl font-extrabold text-amber-400 font-mono">10% <span className="text-xs text-slate-400 font-normal">Commission</span></div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> <span>Priority Customer Listing</span></li>
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> <span>Daily Auto-Settlement (T+1)</span></li>
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> <span>Dedicated Account Manager</span></li>
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> <span>Custom Coupon Creation</span></li>
            </ul>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="font-extrabold text-base text-slate-200">Platinum Enterprise</h3>
            <div className="text-2xl font-extrabold text-slate-100 font-mono">8% <span className="text-xs text-slate-400 font-normal">Commission</span></div>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> <span>Featured Top Banner Slot</span></li>
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> <span>Multi-outlet Central Kitchen Access</span></li>
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> <span>Instant Wallet Payouts</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagement;
