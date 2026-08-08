import React, { useState, useEffect } from 'react';
import { Settings, Bell, Printer, Volume2, ShieldCheck, Save, Smartphone } from 'lucide-react';
import { foodService } from '../../services/foodService';

export const RestaurantSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [settings, setSettings] = useState({
    orderAutoAccept: false,
    soundAlertsEnabled: true,
    kitchenPrinterAutoPrint: true,
    whatsappAlertsEnabled: true,
    preparationBufferMinutes: 5,
    maxConcurrentOrders: 15,
  });

  const handleSaveSettings = async () => {
    setSaving(true);
    setMsg('');
    try {
      await foodService.updateSettings(settings);
      setMsg('✅ Restaurant operational settings saved successfully!');
    } catch (err) {
      setMsg('❌ Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-slate-100 flex items-center space-x-2">
            <Settings className="w-6 h-6 text-amber-400" />
            <span>Kitchen Operating & Notification Settings</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure order auto-acceptance, kitchen chime notifications, thermal printer links, and order concurrency limits
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-amber-500/20 flex items-center space-x-2 cursor-pointer self-start md:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {msg && (
        <div className="p-3 bg-slate-900 border border-slate-800 text-xs font-semibold text-amber-400 rounded-xl">
          {msg}
        </div>
      )}

      {/* SETTINGS SECTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* KITCHEN AUDIO & PRINTER ALERTS */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800">
            <Volume2 className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-sm text-slate-100 font-heading">Audio & Order Chime Alerts</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-slate-200">Loud Kitchen Order Chime</div>
                <div className="text-[11px] text-slate-400">Play repeating chime sound when new order arrives</div>
              </div>
              <input
                type="checkbox"
                checked={settings.soundAlertsEnabled}
                onChange={(e) => setSettings({ ...settings, soundAlertsEnabled: e.target.checked })}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
              <div>
                <div className="font-bold text-xs text-slate-200">WhatsApp Order Notifications</div>
                <div className="text-[11px] text-slate-400">Receive instant order summary on registered WhatsApp</div>
              </div>
              <input
                type="checkbox"
                checked={settings.whatsappAlertsEnabled}
                onChange={(e) => setSettings({ ...settings, whatsappAlertsEnabled: e.target.checked })}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* ORDER DISPATCH & CONCURRENCY */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800">
            <Printer className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-sm text-slate-100 font-heading">Auto Accept & Thermal Printer</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-slate-200">Auto-Accept Incoming Orders</div>
                <div className="text-[11px] text-slate-400">Automatically accept orders without manual kitchen click</div>
              </div>
              <input
                type="checkbox"
                checked={settings.orderAutoAccept}
                onChange={(e) => setSettings({ ...settings, orderAutoAccept: e.target.checked })}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
              <div>
                <div className="font-bold text-xs text-slate-200">Thermal Kitchen Printer Auto-Print</div>
                <div className="text-[11px] text-slate-400">Send KOT receipts directly to thermal USB/Bluetooth printer</div>
              </div>
              <input
                type="checkbox"
                checked={settings.kitchenPrinterAutoPrint}
                onChange={(e) => setSettings({ ...settings, kitchenPrinterAutoPrint: e.target.checked })}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
