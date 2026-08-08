import React, { useState } from 'react';
import { Users, UserPlus, Shield, CheckCircle2, Lock, Trash2, KeyRound } from 'lucide-react';

export const StaffManagement: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'KITCHEN_CHEF' | 'MANAGER' | 'BILLING'>('KITCHEN_CHEF');

  const [staffList, setStaffList] = useState([
    { id: 's-1', name: 'Chef Suresh Kumar', phone: '9876543210', role: 'KITCHEN_CHEF', permissions: ['Live Orders', 'Menu Sold-out Toggle'] },
    { id: 's-2', name: 'Anil Reddy (Manager)', phone: '9876543211', role: 'MANAGER', permissions: ['All Features', 'Finance', 'Menu Engine'] },
  ]);

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    setStaffList((prev) => [
      ...prev,
      {
        id: `s-${Date.now()}`,
        name,
        phone,
        role,
        permissions: role === 'MANAGER' ? ['All Features'] : ['Live Orders', 'Availability'],
      },
    ]);

    setShowModal(false);
    setName('');
    setPhone('');
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-slate-100 flex items-center space-x-2">
            <Users className="w-6 h-6 text-amber-400" />
            <span>Kitchen & Staff Role Permissions</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Add kitchen chefs, managers, or billing staff and delegate order processing permissions safely
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-amber-500/20 flex items-center space-x-2 cursor-pointer self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add Staff Member</span>
        </button>
      </div>

      {/* STAFF LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {staffList.map((staff) => (
          <div key={staff.id} className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 font-extrabold flex items-center justify-center font-mono border border-amber-500/20">
                    {staff.name[0]}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-100">{staff.name}</h3>
                    <div className="text-[11px] text-slate-400 font-mono">{staff.phone}</div>
                  </div>
                </div>

                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {staff.role}
                </span>
              </div>

              <div className="mt-4 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assigned Permissions</div>
                <div className="flex flex-wrap gap-1.5">
                  {staff.permissions.map((perm, i) => (
                    <span key={i} className="text-[11px] px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl font-medium">
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="text-emerald-400 font-bold text-[11px]">Active Access</span>
              <button
                onClick={() => setStaffList((prev) => prev.filter((s) => s.id !== staff.id))}
                className="text-rose-400 hover:text-rose-300 text-xs font-semibold bg-transparent border-none cursor-pointer flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Access</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ADD STAFF MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-slate-100 font-heading">Add Kitchen / Staff Member</h2>
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Staff Member Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Suresh Kumar"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Number *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Staff Role & Access Level</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="KITCHEN_CHEF">Kitchen Chef (Live Orders & Availability Only)</option>
                  <option value="MANAGER">Restaurant Manager (Full Access)</option>
                  <option value="BILLING">Billing Counter Staff</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-900 text-slate-400 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md">
                  Grant Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
