import React, { useState, useEffect } from 'react';
import { Clock, Calendar, CheckCircle2, Save, AlertCircle, Sparkles } from 'lucide-react';
import { foodService } from '../../services/foodService';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const OperatingHoursManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [weeklyHours, setWeeklyHours] = useState<Record<string, any>>({
    monday: { isOpen: true, openTime: '09:00', closeTime: '23:00' },
    tuesday: { isOpen: true, openTime: '09:00', closeTime: '23:00' },
    wednesday: { isOpen: true, openTime: '09:00', closeTime: '23:00' },
    thursday: { isOpen: true, openTime: '09:00', closeTime: '23:00' },
    friday: { isOpen: true, openTime: '09:00', closeTime: '23:30' },
    saturday: { isOpen: true, openTime: '09:00', closeTime: '23:30' },
    sunday: { isOpen: true, openTime: '09:00', closeTime: '23:00' },
  });

  useEffect(() => {
    const loadHours = async () => {
      setLoading(true);
      try {
        const res = await foodService.getProfile();
        if (res.data?.operatingHours?.weeklyHours) {
          setWeeklyHours(res.data.operatingHours.weeklyHours);
        }
      } catch (err) {
        console.error('Failed to load operating hours:', err);
      } finally {
        setLoading(false);
      }
    };
    loadHours();
  }, []);

  const handleToggleDay = (day: string) => {
    setWeeklyHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], isOpen: !prev[day]?.isOpen },
    }));
  };

  const handleTimeChange = (day: string, field: 'openTime' | 'closeTime', val: string) => {
    setWeeklyHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: val },
    }));
  };

  const handleSaveHours = async () => {
    setSaving(true);
    setMsg('');
    try {
      await foodService.updateHours({ weeklyHours });
      setMsg('✅ Restaurant operating hours updated successfully!');
    } catch (err: any) {
      setMsg('❌ Failed to update operating hours');
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
            <Clock className="w-6 h-6 text-amber-400" />
            <span>Restaurant Operating Hours & Schedule</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure weekly opening and closing schedules. Orders are accepted automatically during active hours.
          </p>
        </div>

        <button
          onClick={handleSaveHours}
          disabled={saving}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-amber-500/20 flex items-center space-x-2 cursor-pointer self-start md:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Changes...' : 'Save Schedule'}</span>
        </button>
      </div>

      {msg && (
        <div className="p-3 bg-slate-900 border border-slate-800 text-xs font-semibold text-amber-400 rounded-xl">
          {msg}
        </div>
      )}

      {/* WEEKLY SCHEDULE GRID */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs">Loading operating hours...</div>
      ) : (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Day of Week</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Store Status & Timings</span>
          </div>

          <div className="space-y-3">
            {DAYS.map((day) => {
              const info = weeklyHours[day] || { isOpen: true, openTime: '09:00', closeTime: '23:00' };

              return (
                <div
                  key={day}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/80 border border-slate-800/80 rounded-2xl gap-4"
                >
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => handleToggleDay(day)}
                      className={`w-10 h-6 rounded-full transition p-1 flex items-center cursor-pointer ${
                        info.isOpen ? 'bg-amber-500 justify-end' : 'bg-slate-800 justify-start'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-slate-950 shadow-md" />
                    </button>

                    <div>
                      <span className="capitalize font-bold text-sm text-slate-100">{day}</span>
                      <span className="text-[11px] block text-slate-500 font-semibold">
                        {info.isOpen ? 'Open for Online Orders' : 'Closed all day'}
                      </span>
                    </div>
                  </div>

                  {info.isOpen ? (
                    <div className="flex items-center space-x-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block font-semibold mb-0.5">OPEN TIME</span>
                        <input
                          type="time"
                          value={info.openTime || '09:00'}
                          onChange={(e) => handleTimeChange(day, 'openTime', e.target.value)}
                          className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <span className="text-slate-600 font-bold mt-4">to</span>

                      <div>
                        <span className="text-[10px] text-slate-500 block font-semibold mb-0.5">CLOSE TIME</span>
                        <input
                          type="time"
                          value={info.closeTime || '23:00'}
                          onChange={(e) => handleTimeChange(day, 'closeTime', e.target.value)}
                          className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                      CLOSED
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
