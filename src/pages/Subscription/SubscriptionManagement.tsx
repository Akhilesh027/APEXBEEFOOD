import React from 'react';
import { ShieldCheck, CheckCircle2, Zap, Award, Sparkles } from 'lucide-react';

export const SubscriptionManagement: React.FC = () => {
  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-extrabold font-heading text-slate-100 flex items-center space-x-2">
          <Award className="w-6 h-6 text-amber-400" />
          <span>ApexBee Food Partner Plan & Commission Tier</span>
        </h1>
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
            <li className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> <span>Featured Top Banner Banner Slot</span></li>
            <li className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> <span>Multi-outlet Central Kitchen Access</span></li>
            <li className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> <span>Instant Wallet Payouts</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
};
