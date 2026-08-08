import React, { useState } from 'react';
import { Star, MessageSquare, ThumbsUp, ShieldCheck, UserCheck, Search, Filter } from 'lucide-react';

export const ReviewsManagement: React.FC = () => {
  const [filterRating, setFilterRating] = useState<number | 'ALL'>('ALL');

  const reviews = [
    {
      id: 'rev-1',
      customerName: 'Rahul Verma',
      rating: 5,
      date: '2 hours ago',
      dish: 'Chicken Dum Biryani',
      comment: 'Absolutely authentic Hyderabadi flavor! Aromatic rice and tender chicken pieces. Delivered piping hot.',
      reply: 'Thank you Rahul! We use 100% pure ghee and authentic spices in our Biryani.',
    },
    {
      id: 'rev-2',
      customerName: 'Priya Sharma',
      rating: 4,
      date: 'Yesterday',
      dish: 'Paneer Butter Masala + Butter Naan',
      comment: 'Very rich gravy and soft naan. Packaging was clean and spill-proof.',
      reply: null,
    },
    {
      id: 'rev-3',
      customerName: 'Karthik Rao',
      rating: 5,
      date: '2 days ago',
      dish: 'Apollo Fish Fry',
      comment: 'Crispy, spicy and delicious starter. Perfectly cooked fish fillet.',
      reply: 'Thanks Karthik! Apollo Fish is our chef signature starter.',
    },
  ];

  const filteredReviews = reviews.filter((r) =>
    filterRating === 'ALL' ? true : r.rating === filterRating
  );

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-slate-100 flex items-center space-x-2">
            <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
            <span>Customer Ratings & Food Reviews</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor diner feedback, ratings, and publish official restaurant responses
          </p>
        </div>

        {/* OVERALL RATING CARD */}
        <div className="glass-panel px-5 py-3 rounded-2xl border border-slate-800 flex items-center space-x-4 self-start md:self-auto">
          <div className="text-center">
            <div className="text-2xl font-extrabold text-amber-400 font-mono">4.8</div>
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400" />
              ))}
            </div>
          </div>
          <div className="border-l border-slate-800 pl-4 text-xs text-slate-400">
            <div className="font-bold text-slate-200">128 Verified Ratings</div>
            <div className="text-[11px] text-emerald-400">96% Positive Ratings</div>
          </div>
        </div>
      </div>

      {/* FILTER BUTTONS */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <button
          onClick={() => setFilterRating('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            filterRating === 'ALL' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All Reviews ({reviews.length})
        </button>
        {[5, 4, 3, 2, 1].map((stars) => (
          <button
            key={stars}
            onClick={() => setFilterRating(stars)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
              filterRating === stars ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>{stars}</span>
            <Star className="w-3 h-3 fill-current" />
          </button>
        ))}
      </div>

      {/* REVIEWS LIST */}
      <div className="space-y-4">
        {filteredReviews.map((rev) => (
          <div key={rev.id} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 font-extrabold flex items-center justify-center font-mono border border-amber-500/20">
                  {rev.customerName[0]}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-sm text-slate-100">{rev.customerName}</h3>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verified Order</span>
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Ordered: <span className="text-slate-200 font-semibold">{rev.dish}</span> • {rev.date}</div>
                </div>
              </div>

              <div className="flex items-center space-x-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-xs font-mono font-bold text-amber-300">{rev.rating}.0</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/80">
              "{rev.comment}"
            </p>

            {rev.reply ? (
              <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-2xl text-xs space-y-1">
                <div className="font-bold text-amber-400 text-[11px]">Official Restaurant Response:</div>
                <p className="text-slate-300">{rev.reply}</p>
              </div>
            ) : (
              <button
                onClick={() => alert('Reply feature initialized for restaurant response.')}
                className="text-xs font-bold text-amber-400 hover:underline flex items-center space-x-1 bg-transparent border-none cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Respond to Customer</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
