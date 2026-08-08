import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Power,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Image as ImageIcon,
  Video,
  Trash2,
  ExternalLink,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Save,
  ChevronRight,
  ShieldCheck,
  Building2,
  Tv,
} from 'lucide-react';
import { useFoodAuthStore } from '../../store/useFoodAuthStore';
import { foodService } from '../../services/foodService';
import { ITableBooking } from '../../types/foodPartner';

export const DiningManagement: React.FC = () => {
  const { restaurant, setRestaurantData } = useFoodAuthStore();

  const [activeTab, setActiveTab] = useState<'bookings' | 'gallery' | 'info'>('bookings');
  const [loading, setLoading] = useState(false);
  const [updatingDining, setUpdatingDining] = useState(false);

  // Dining Status & Info State
  const [diningEnabled, setDiningEnabled] = useState(restaurant?.diningEnabled !== false);
  const [diningInfo, setDiningInfo] = useState<any>({
    totalTables: 16,
    seatingCapacity: 64,
    tableTypes: [
      { type: '2-Seater Couple Table', count: 4, capacity: 2 },
      { type: '4-Seater Family Table', count: 8, capacity: 4 },
      { type: '6-Seater Group Suite', count: 2, capacity: 6 },
      { type: 'VIP Private Booth', count: 2, capacity: 6 }
    ],
    amenities: [
      'Air Conditioned Hall ❄️',
      'Outdoor Rooftop Seating 🌃',
      'Live Acoustic Music 🎸',
      'Valet Parking Available 🚗',
      'Family & Kids Friendly 👨‍👩‍👧',
      'Bar & Cocktails Section 🍹',
      'High-Speed Guest Wi-Fi 📶'
    ],
    openingTime: '11:00 AM',
    closingTime: '11:00 PM',
    slotDurationMinutes: 60,
    advanceBookingDays: 7,
    description: 'Experience premium dining with authentic chef specials, vibrant rooftop ambience, and personalized table service.',
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&q=80&w=1000'
    ],
    videos: [
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    ],
    bookingNotice: 'Table reservations are held for 15 minutes past scheduled arrival time.'
  });

  // Bookings Data State
  const [bookings, setBookings] = useState<ITableBooking[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    seated: 0,
    completed: 0,
    cancelled: 0
  });

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals & Form States
  const [showAddBookingModal, setShowAddBookingModal] = useState(false);
  const [newBooking, setNewBooking] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    guestCount: 2,
    bookingDate: new Date().toISOString().split('T')[0],
    bookingTime: '08:00 PM',
    tableType: '4-Seater Family Table',
    occasion: 'Casual Dining',
    specialRequests: '',
    tableNumber: ''
  });

  const [newImageUrl, setNewImageUrl] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);

  // Fetch dining info & bookings on load
  const loadDiningData = async () => {
    setLoading(true);
    try {
      const [infoRes, bookingsRes] = await Promise.all([
        foodService.getDiningInfo(),
        foodService.getDiningBookings({ status: statusFilter, search: searchTerm })
      ]);

      if (infoRes.data) {
        setDiningEnabled(infoRes.data.diningEnabled !== false);
        if (infoRes.data.diningInfo) setDiningInfo(infoRes.data.diningInfo);
      }

      if (bookingsRes.data) {
        setBookings(bookingsRes.data.bookings || []);
        if (bookingsRes.data.counts) setCounts(bookingsRes.data.counts);
      }
    } catch (err) {
      console.error('Failed to load dining data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiningData();
  }, [statusFilter, searchTerm]);

  // Toggle Dining ON / OFF
  const handleToggleDining = async () => {
    setUpdatingDining(true);
    try {
      const nextStatus = !diningEnabled;
      const res = await foodService.updateDiningInfo({ diningEnabled: nextStatus });
      if (res.data?.success) {
        setDiningEnabled(nextStatus);
        if (restaurant) {
          setRestaurantData({ ...restaurant, diningEnabled: nextStatus });
        }
      }
    } catch (err) {
      alert('Failed to toggle dining status');
    } finally {
      setUpdatingDining(false);
    }
  };

  // Update Table Booking Status (Confirm, Seat, Complete, Reject)
  const handleUpdateBookingStatus = async (bookingId: string, status: string, tableNumber?: string, rejectionReason?: string) => {
    try {
      const res = await foodService.updateDiningBookingStatus(bookingId, { status, tableNumber, rejectionReason });
      if (res.data?.success) {
        loadDiningData();
      }
    } catch (err) {
      alert('Failed to update booking status');
    }
  };

  // Create Manual Table Reservation
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.customerName || !newBooking.customerPhone) {
      alert('Please fill customer name and phone');
      return;
    }
    try {
      const res = await foodService.createDiningBooking(newBooking);
      if (res.data?.success) {
        setShowAddBookingModal(false);
        setNewBooking({
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          guestCount: 2,
          bookingDate: new Date().toISOString().split('T')[0],
          bookingTime: '08:00 PM',
          tableType: '4-Seater Family Table',
          occasion: 'Casual Dining',
          specialRequests: '',
          tableNumber: ''
        });
        loadDiningData();
      }
    } catch (err) {
      alert('Failed to create table booking');
    }
  };

  // Handle Image Upload
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await foodService.uploadImage(file);
      if (res.url) {
        const updatedImages = [...(diningInfo.images || []), res.url];
        const nextInfo = { ...diningInfo, images: updatedImages };
        setDiningInfo(nextInfo);
        await foodService.updateDiningInfo({ diningInfo: nextInfo });
      }
    } catch (err) {
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle Add Image URL
  const handleAddImageUrl = async () => {
    if (!newImageUrl.trim()) return;
    const updatedImages = [...(diningInfo.images || []), newImageUrl.trim()];
    const nextInfo = { ...diningInfo, images: updatedImages };
    setDiningInfo(nextInfo);
    setNewImageUrl('');
    await foodService.updateDiningInfo({ diningInfo: nextInfo });
  };

  // Handle Remove Image
  const handleRemoveImage = async (index: number) => {
    const updatedImages = diningInfo.images.filter((_: any, idx: number) => idx !== index);
    const nextInfo = { ...diningInfo, images: updatedImages };
    setDiningInfo(nextInfo);
    await foodService.updateDiningInfo({ diningInfo: nextInfo });
  };

  // Handle Add Video Link
  const handleAddVideoUrl = async () => {
    if (!newVideoUrl.trim()) return;
    const updatedVideos = [...(diningInfo.videos || []), newVideoUrl.trim()];
    const nextInfo = { ...diningInfo, videos: updatedVideos };
    setDiningInfo(nextInfo);
    setNewVideoUrl('');
    await foodService.updateDiningInfo({ diningInfo: nextInfo });
  };

  // Handle Remove Video
  const handleRemoveVideo = async (index: number) => {
    const updatedVideos = diningInfo.videos.filter((_: any, idx: number) => idx !== index);
    const nextInfo = { ...diningInfo, videos: updatedVideos };
    setDiningInfo(nextInfo);
    await foodService.updateDiningInfo({ diningInfo: nextInfo });
  };

  // Save Dining Setup Info
  const handleSaveDiningInfo = async () => {
    setSavingInfo(true);
    try {
      const res = await foodService.updateDiningInfo({ diningInfo, diningEnabled });
      if (res.data?.success) {
        alert('Dining information and settings updated successfully!');
      }
    } catch (err) {
      alert('Failed to save dining info');
    } finally {
      setSavingInfo(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* TOP BANNER & TOGGLE HEADER */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 rounded-2xl shadow-lg shadow-amber-500/20">
            <UtensilsCrossed className="w-8 h-8 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-black text-slate-100 font-heading">DINING & TABLE BOOKINGS</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border ${
                diningEnabled
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              }`}>
                {diningEnabled ? '● DINING IN ACTIVE' : '○ DINING IN PAUSED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Manage live table reservations, guest capacity, ambience photos &amp; video tours for {restaurant?.restaurantName || 'your restaurant'}.
            </p>
          </div>
        </div>

        {/* DINING ON / OFF TOGGLE BUTTON */}
        <button
          onClick={handleToggleDining}
          disabled={updatingDining}
          className={`px-6 py-3.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center space-x-2 shadow-lg cursor-pointer ${
            diningEnabled
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
          }`}
        >
          <Power className="w-4 h-4" />
          <span>{diningEnabled ? 'TURN DINING OFF' : 'TURN DINING ON'}</span>
        </button>
      </div>

      {/* QUICK STATS SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Reservations</span>
            <span className="text-2xl font-black text-slate-100 mt-1 block">{counts.total}</span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Requests</span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">{counts.pending}</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Seated Guests</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">{counts.seated}</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Capacity</span>
            <span className="text-2xl font-black text-purple-400 mt-1 block">{diningInfo.seatingCapacity || 64} Seats</span>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-5 py-3 text-xs font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer ${
            activeTab === 'bookings'
              ? 'border-amber-400 text-amber-400 bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Live Table Reservations ({counts.total})</span>
        </button>

        <button
          onClick={() => setActiveTab('gallery')}
          className={`px-5 py-3 text-xs font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer ${
            activeTab === 'gallery'
              ? 'border-amber-400 text-amber-400 bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Ambience &amp; Media Gallery</span>
        </button>

        <button
          onClick={() => setActiveTab('info')}
          className={`px-5 py-3 text-xs font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer ${
            activeTab === 'info'
              ? 'border-amber-400 text-amber-400 bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Dining Setup &amp; Info</span>
        </button>
      </div>

      {/* TABS CONTENT */}

      {/* TAB 1: LIVE TABLE RESERVATIONS */}
      {activeTab === 'bookings' && (
        <div className="space-y-5">
          {/* SEARCH & FILTERS HEADER */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/60 p-4 border border-slate-800/80 rounded-2xl">
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
              {['ALL', 'PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                    statusFilter === st
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search guest or booking #"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                onClick={() => setShowAddBookingModal(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 shrink-0 shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Reservation</span>
              </button>
            </div>
          </div>

          {/* TABLE BOOKINGS LIST */}
          {bookings.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <UtensilsCrossed className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-300">No Table Reservations Found</h3>
              <p className="text-xs text-slate-500">No table bookings match your selected status filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {bookings.map((booking) => {
                const isPending = booking.status === 'PENDING';
                const isConfirmed = booking.status === 'CONFIRMED';
                const isSeated = booking.status === 'SEATED';

                return (
                  <div
                    key={booking._id}
                    className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4 hover:border-slate-700 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                      <div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-black text-amber-400 font-mono">{booking.bookingNumber}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                            isPending ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                            isConfirmed ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                            isSeated ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                            'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-slate-100 mt-1">{booking.customerName}</h3>
                        <div className="flex items-center space-x-4 text-xs text-slate-400 mt-1">
                          <span className="flex items-center space-x-1">
                            <Phone className="w-3.5 h-3.5 text-amber-400" />
                            <span>{booking.customerPhone}</span>
                          </span>
                          {booking.customerEmail && (
                            <span className="flex items-center space-x-1">
                              <Mail className="w-3.5 h-3.5 text-slate-500" />
                              <span>{booking.customerEmail}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right sm:border-l sm:border-slate-800 sm:pl-5">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Guests &amp; Slot</span>
                        <div className="flex items-center space-x-2 text-slate-100 font-extrabold text-sm mt-0.5">
                          <Users className="w-4 h-4 text-purple-400" />
                          <span>{booking.guestCount} Guests</span>
                          <span>•</span>
                          <span className="text-amber-400">{booking.bookingTime}</span>
                        </div>
                        <span className="text-xs text-slate-400 block mt-0.5">Date: {booking.bookingDate}</span>
                      </div>
                    </div>

                    {/* BOOKING DETAILS BODY */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/50">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Table Preference</span>
                        <span className="font-semibold text-slate-200 mt-0.5 block">{booking.tableType}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Occasion</span>
                        <span className="font-semibold text-amber-400 mt-0.5 block">{booking.occasion || 'Casual Dining'}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Assigned Table</span>
                        <span className="font-mono font-bold text-emerald-400 mt-0.5 block">
                          {booking.tableNumber || 'Unassigned'}
                        </span>
                      </div>
                    </div>

                    {booking.specialRequests && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                        <strong>Special Request:</strong> {booking.specialRequests}
                      </div>
                    )}

                    {/* ACTION BUTTONS */}
                    <div className="flex items-center justify-end space-x-3 pt-2">
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleUpdateBookingStatus(booking._id, 'REJECTED', undefined, 'Fully booked')}
                            className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-xl transition cursor-pointer"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleUpdateBookingStatus(booking._id, 'CONFIRMED', 'T-04')}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition cursor-pointer"
                          >
                            Confirm Reservation
                          </button>
                        </>
                      )}

                      {isConfirmed && (
                        <button
                          onClick={() => handleUpdateBookingStatus(booking._id, 'SEATED')}
                          className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white font-extrabold text-xs rounded-xl shadow-md shadow-purple-500/20 transition cursor-pointer"
                        >
                          Mark Guest Seated
                        </button>
                      )}

                      {isSeated && (
                        <button
                          onClick={() => handleUpdateBookingStatus(booking._id, 'COMPLETED')}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer"
                        >
                          Complete Dining
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AMBIENCE & MEDIA GALLERY (IMAGES AND VIDEOS) */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          {/* PHOTO GALLERY SECTION */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-100 flex items-center space-x-2">
                  <ImageIcon className="w-5 h-5 text-amber-400" />
                  <span>Ambience &amp; Dining Photos</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">Upload high quality photos of dining hall, seating, rooftop, and table setup.</p>
              </div>

              <label className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-2 cursor-pointer shrink-0">
                <Plus className="w-4 h-4" />
                <span>{uploadingImage ? 'Uploading...' : 'Upload Photo'}</span>
                <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
              </label>
            </div>

            {/* ADD VIA URL INPUT */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Or paste image URL (https://...)"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={handleAddImageUrl}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl cursor-pointer"
              >
                Add Image URL
              </button>
            </div>

            {/* IMAGE GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(diningInfo.images || []).map((imgUrl: string, idx: number) => (
                <div key={idx} className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 h-40">
                  <img src={imgUrl} alt={`Ambience ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <button
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-2 right-2 p-1.5 bg-rose-500/80 hover:bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* VIDEO GALLERY SECTION */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-extrabold text-slate-100 flex items-center space-x-2">
                <Video className="w-5 h-5 text-purple-400" />
                <span>Restaurant Video Tours &amp; Shorts</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">Add YouTube embed links or MP4 video tour URLs for customers to preview ambience.</p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Paste YouTube embed URL or MP4 link (https://www.youtube.com/embed/...)"
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-400"
              />
              <button
                onClick={handleAddVideoUrl}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Add Video Tour
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(diningInfo.videos || []).map((videoUrl: string, idx: number) => (
                <div key={idx} className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 h-52">
                  <iframe src={videoUrl} title={`Video Tour ${idx}`} className="w-full h-full border-0" allowFullScreen />
                  <button
                    onClick={() => handleRemoveVideo(idx)}
                    className="absolute top-2 right-2 p-1.5 bg-rose-500/80 hover:bg-rose-500 text-white rounded-lg transition cursor-pointer"
                    title="Remove Video"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DINING SETUP & INFO */}
      {activeTab === 'info' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-100">Dining Capacity &amp; Operational Setup</h3>
              <p className="text-xs text-slate-400 mt-0.5">Configure table count, seating capacity, slot durations, and guest amenities.</p>
            </div>

            <button
              onClick={handleSaveDiningInfo}
              disabled={savingInfo}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center space-x-2 shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{savingInfo ? 'Saving...' : 'Save Setup Info'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Total Dining Tables</label>
              <input
                type="number"
                value={diningInfo.totalTables || 16}
                onChange={(e) => setDiningInfo({ ...diningInfo, totalTables: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Total Seating Capacity</label>
              <input
                type="number"
                value={diningInfo.seatingCapacity || 64}
                onChange={(e) => setDiningInfo({ ...diningInfo, seatingCapacity: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Slot Duration (Minutes)</label>
              <input
                type="number"
                value={diningInfo.slotDurationMinutes || 60}
                onChange={(e) => setDiningInfo({ ...diningInfo, slotDurationMinutes: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Ambience &amp; Dining Description</label>
            <textarea
              rows={3}
              value={diningInfo.description || ''}
              onChange={(e) => setDiningInfo({ ...diningInfo, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Booking Policy &amp; Notice for Guests</label>
            <input
              type="text"
              value={diningInfo.bookingNotice || ''}
              onChange={(e) => setDiningInfo({ ...diningInfo, bookingNotice: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      )}

      {/* MANUAL RESERVATION MODAL */}
      {showAddBookingModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-100">Add Phone / Walk-in Reservation</h3>
              <button onClick={() => setShowAddBookingModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={newBooking.customerName}
                    onChange={(e) => setNewBooking({ ...newBooking, customerName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={newBooking.customerPhone}
                    onChange={(e) => setNewBooking({ ...newBooking, customerPhone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Guests</label>
                  <input
                    type="number"
                    min={1}
                    value={newBooking.guestCount}
                    onChange={(e) => setNewBooking({ ...newBooking, guestCount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Date</label>
                  <input
                    type="date"
                    value={newBooking.bookingDate}
                    onChange={(e) => setNewBooking({ ...newBooking, bookingDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={newBooking.bookingTime}
                    onChange={(e) => setNewBooking({ ...newBooking, bookingTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Table Preference</label>
                <select
                  value={newBooking.tableType}
                  onChange={(e) => setNewBooking({ ...newBooking, tableType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                >
                  <option value="Standard Table">Standard Table</option>
                  <option value="4-Seater Family Table">4-Seater Family Table</option>
                  <option value="VIP Booth Section">VIP Booth Section</option>
                  <option value="Rooftop Terrace">Rooftop Terrace</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Special Requests</label>
                <input
                  type="text"
                  placeholder="e.g. Birthday cake arrangement"
                  value={newBooking.specialRequests}
                  onChange={(e) => setNewBooking({ ...newBooking, specialRequests: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddBookingModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 text-slate-950 rounded-xl font-extrabold shadow-md shadow-amber-500/20"
                >
                  Confirm Table Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
