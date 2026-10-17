import React, { useState, useEffect, useRef } from 'react';
import {
  CalendarCheck,
  Calendar,
  Clock,
  Users,
  Search,
  Plus,
  Phone,
  CheckCircle2,
  XCircle,
  UserCheck,
  X,
  MapPin,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Bell,
} from 'lucide-react';
import { foodService } from '../../services/foodService';
import { announceReservationVoice } from '../../utils/orderSpeechAnnouncer';

interface IReservation {
  id: string;
  bookingNumber?: string;
  guestName: string;
  phone: string;
  email?: string;
  guestsCount: number;
  date: string;
  rawDate?: string;
  timeSlot: string;
  shift: 'LUNCH' | 'DINNER';
  tableNumber: string;
  tableType?: string;
  status: 'PENDING' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  occasion?: string;
}

const mapBackendBooking = (b: any): IReservation => {
  const timeUpper = (b.bookingTime || '').toUpperCase();
  const isLunch =
    timeUpper.includes('AM') ||
    timeUpper.includes('12:') ||
    timeUpper.includes('13:') ||
    timeUpper.includes('14:') ||
    timeUpper.includes('LUNCH');

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  let dateDisplay = b.bookingDate || 'Today';
  if (b.bookingDate === todayStr) dateDisplay = 'Today';
  else if (b.bookingDate === tomorrowStr) dateDisplay = 'Tomorrow';

  return {
    id: b._id || b.id,
    bookingNumber: b.bookingNumber || `TB-${Math.floor(100000 + Math.random() * 900000)}`,
    guestName: b.customerName || 'Guest Diner',
    phone: b.customerPhone || '',
    email: b.customerEmail || '',
    guestsCount: Number(b.guestCount || 2),
    date: dateDisplay,
    rawDate: b.bookingDate,
    timeSlot: b.bookingTime || '07:30 PM',
    shift: isLunch ? 'LUNCH' : 'DINNER',
    tableNumber: b.tableNumber || b.tableType || 'T-01',
    tableType: b.tableType || 'Standard Table',
    status: b.status || 'CONFIRMED',
    notes: b.specialRequests || '',
    occasion: b.occasion || '',
  };
};

export const ReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<IReservation[]>([]);
  const [diningEnabled, setDiningEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<'Today' | 'Tomorrow' | 'All'>('Today');
  const [shiftFilter, setShiftFilter] = useState<'ALL' | 'LUNCH' | 'DINNER'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRes, setNewRes] = useState({
    guestName: '',
    phone: '',
    guestsCount: 2,
    date: new Date().toISOString().split('T')[0],
    timeSlot: '08:00 PM',
    shift: 'DINNER' as 'LUNCH' | 'DINNER',
    tableNumber: 'T-01',
    tableType: 'Standard Table',
    notes: '',
    occasion: '',
  });

  const knownBookingIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);

  const fetchBookings = async () => {
    try {
      const res = await foodService.getDiningBookings();
      if (res.data?.success && Array.isArray(res.data.bookings)) {
        const mapped = res.data.bookings.map(mapBackendBooking);
        setReservations(mapped);

        if (res.data.diningEnabled !== undefined) {
          setDiningEnabled(res.data.diningEnabled);
        }

        // Voice alert if new reservation detected after initial load
        if (!initialLoadRef.current) {
          mapped.forEach((b: IReservation) => {
            if (!knownBookingIdsRef.current.has(b.id)) {
              knownBookingIdsRef.current.add(b.id);
              announceReservationVoice(b.guestName, b.guestsCount, b.timeSlot);
            }
          });
        } else {
          mapped.forEach((b: IReservation) => knownBookingIdsRef.current.add(b.id));
          initialLoadRef.current = false;
        }
      }
    } catch (err: any) {
      console.warn('Failed to load table bookings:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleDining = async () => {
    try {
      const newStatus = !diningEnabled;
      setDiningEnabled(newStatus);
      await foodService.updateDiningInfo({ diningEnabled: newStatus });
    } catch (e: any) {
      console.error('Failed to update dining status:', e);
      setDiningEnabled((prev) => !prev);
    }
  };

  const filteredReservations = reservations.filter((r) => {
    const matchesDate = selectedDate === 'All' || r.date === selectedDate;
    const matchesShift = shiftFilter === 'ALL' || r.shift === shiftFilter;
    const matchesSearch =
      r.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery) ||
      (r.bookingNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tableNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDate && matchesShift && matchesSearch;
  });

  const todayCount = reservations.filter((r) => r.date === 'Today').length;
  const confirmedCount = reservations.filter((r) => r.status === 'CONFIRMED').length;
  const seatedCount = reservations.filter((r) => r.status === 'SEATED').length;
  const totalGuests = reservations.filter((r) => r.date === 'Today').reduce((acc, curr) => acc + curr.guestsCount, 0);

  const handleStatusChange = async (id: string, newStatus: IReservation['status']) => {
    setUpdatingStatus(id);
    // Optimistic UI update
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    try {
      await foodService.updateDiningBookingStatus(id, { status: newStatus });
    } catch (err) {
      console.error('Failed to update booking status:', err);
      fetchBookings();
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRes.guestName.trim() || !newRes.phone.trim()) return;

    try {
      const payload = {
        customerName: newRes.guestName.trim(),
        customerPhone: newRes.phone.trim(),
        guestCount: Number(newRes.guestsCount) || 2,
        bookingDate: newRes.date || new Date().toISOString().split('T')[0],
        bookingTime: newRes.timeSlot || '08:00 PM',
        tableType: newRes.tableType || 'Standard Table',
        tableNumber: newRes.tableNumber || 'T-01',
        occasion: newRes.occasion || 'Casual Dining',
        specialRequests: newRes.notes || '',
      };

      await foodService.createDiningBooking(payload);
      await fetchBookings();
      setIsModalOpen(false);
      setNewRes({
        guestName: '',
        phone: '',
        guestsCount: 2,
        date: new Date().toISOString().split('T')[0],
        timeSlot: '08:00 PM',
        shift: 'DINNER',
        tableNumber: 'T-01',
        tableType: 'Standard Table',
        notes: '',
        occasion: '',
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create manual table reservation');
    }
  };

  const getStatusBadge = (status: IReservation['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Pending Approval
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Confirmed
          </span>
        );
      case 'SEATED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-500/15 text-blue-400 border border-blue-500/30">
            Seated
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-800 text-slate-400 border border-slate-700">
            Finished
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <CalendarCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 font-heading">
              Dining Reservations & Bookings
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Live table reservations from customer portal http://localhost:8080/food?sub=Dineout and manual bookings.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* DINING ENABLED TOGGLE */}
          <button
            onClick={handleToggleDining}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
              diningEnabled
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
            }`}
            title="Toggle customer dining reservations on the user portal"
          >
            {diningEnabled ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-rose-400" />}
            <span>Dining: {diningEnabled ? 'Active (Accepting)' : 'Disabled'}</span>
          </button>

          <button
            onClick={fetchBookings}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 transition"
            title="Refresh bookings"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Reservation</span>
          </button>
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400">Today's Bookings</div>
          <div className="text-2xl font-black text-slate-100 mt-1 font-mono">{todayCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">{totalGuests} expected diners</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-emerald-400">Confirmed Slots</div>
          <div className="text-2xl font-black text-emerald-300 mt-1 font-mono">{confirmedCount}</div>
          <div className="text-[10px] text-emerald-500/80 mt-1">Ready for check-in</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-blue-400">Currently Seated</div>
          <div className="text-2xl font-black text-blue-300 mt-1 font-mono">{seatedCount}</div>
          <div className="text-[10px] text-blue-500/80 mt-1">Dining at tables</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-purple-400">Shift Split</div>
          <div className="text-lg font-bold text-purple-200 mt-1">Lunch &amp; Dinner</div>
          <div className="text-[10px] text-purple-400/80 mt-1">Peak slot: 07:30 - 09:00 PM</div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center space-x-2">
          {(['Today', 'Tomorrow', 'All'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedDate === d
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {d}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {(['ALL', 'LUNCH', 'DINNER'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setShiftFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                shiftFilter === s
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search guest or table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* RESERVATIONS LIST */}
      <div className="space-y-3">
        {filteredReservations.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="font-bold text-slate-300 text-sm">No Reservations Found</h3>
            <p className="text-xs text-slate-500 mt-1">Try changing your filters or add a new reservation booking.</p>
          </div>
        ) : (
          filteredReservations.map((res) => (
            <div
              key={res.id}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-slate-100 text-sm">{res.guestName}</span>
                  {res.bookingNumber && (
                    <span className="font-mono text-[10px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded-md font-bold">
                      {res.bookingNumber}
                    </span>
                  )}
                  {getStatusBadge(res.status)}
                  {res.occasion && (
                    <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Sparkles className="w-3 h-3" />
                      <span>{res.occasion}</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center space-x-1 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{res.phone}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{res.guestsCount} Guests</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1 font-mono text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{res.date}, {res.timeSlot} ({res.shift})</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-slate-800 text-slate-200 font-mono font-bold">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>Table {res.tableNumber}</span>
                  </span>
                </div>

                {res.notes && (
                  <div className="text-xs text-slate-400 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                    <span className="text-amber-400/90 font-medium">Guest Notes:</span> {res.notes}
                  </div>
                )}
              </div>

              {/* ACTIONS */}
              <div className="flex items-center space-x-2 self-end md:self-center">
                {res.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(res.id, 'CONFIRMED')}
                      disabled={updatingStatus === res.id}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center space-x-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange(res.id, 'CANCELLED')}
                      disabled={updatingStatus === res.id}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-semibold transition cursor-pointer"
                    >
                      Decline
                    </button>
                  </>
                )}
                {res.status === 'CONFIRMED' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(res.id, 'SEATED')}
                      disabled={updatingStatus === res.id}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center space-x-1 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Seat Guest</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange(res.id, 'CANCELLED')}
                      disabled={updatingStatus === res.id}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-semibold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {res.status === 'SEATED' && (
                  <button
                    onClick={() => handleStatusChange(res.id, 'COMPLETED')}
                    disabled={updatingStatus === res.id}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center space-x-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Finished</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* NEW RESERVATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-100 font-heading">Book Table Reservation</h3>
            <p className="text-xs text-slate-400 mt-1">Add a new guest booking with table and time preference.</p>

            <form onSubmit={handleCreateReservation} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Guest Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Chandra"
                    value={newRes.guestName}
                    onChange={(e) => setNewRes({ ...newRes, guestName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={newRes.phone}
                    onChange={(e) => setNewRes({ ...newRes, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Party Size (Diners)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={newRes.guestsCount}
                    onChange={(e) => setNewRes({ ...newRes, guestsCount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Date</label>
                  <select
                    value={newRes.date}
                    onChange={(e) => setNewRes({ ...newRes, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Today">Today</option>
                    <option value="Tomorrow">Tomorrow</option>
                    <option value="This Weekend">This Weekend</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={newRes.timeSlot}
                    onChange={(e) => setNewRes({ ...newRes, timeSlot: e.target.value })}
                    placeholder="08:00 PM"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Allocated Table</label>
                  <input
                    type="text"
                    value={newRes.tableNumber}
                    onChange={(e) => setNewRes({ ...newRes, tableNumber: e.target.value })}
                    placeholder="T-01"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Occasion (Optional)</label>
                  <input
                    type="text"
                    value={newRes.occasion}
                    onChange={(e) => setNewRes({ ...newRes, occasion: e.target.value })}
                    placeholder="Birthday / Anniversary"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Special Notes / Dietary Requirements</label>
                <textarea
                  rows={2}
                  value={newRes.notes}
                  onChange={(e) => setNewRes({ ...newRes, notes: e.target.value })}
                  placeholder="e.g. Jain food required, high chair needed"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Save Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
