import React, { useState, useEffect, useMemo } from 'react';
import {
  Tv,
  Bell,
  CheckCircle2,
  Clock,
  Printer,
  Volume2,
  RefreshCw,
  Plus,
  Trash2,
  X,
  ExternalLink,
  ChevronRight,
  Flame,
  Maximize2,
  Minimize2,
  Search,
} from 'lucide-react';
import {
  fastFoodTokenStorage,
  IFastFoodToken,
  playTokenBuzzer,
  announceTokenSpeech,
} from '../../services/fastFoodTokenStorage';
import { useFoodAuthStore } from '../../store/useFoodAuthStore';
import { getBusinessCapabilities } from '../../utils/businessCapabilities';

export const TokenKitchenDisplayPage: React.FC = () => {
  const restaurant = useFoodAuthStore((state) => state.restaurant);
  const caps = useMemo(
    () => getBusinessCapabilities(restaurant?.businessType, restaurant?.diningEnabled, restaurant?.cuisines),
    [restaurant?.businessType, restaurant?.diningEnabled, restaurant?.cuisines]
  );

  const [tokens, setTokens] = useState<IFastFoodToken[]>([]);
  const [isTvMode, setIsTvMode] = useState(false);
  const [isNewTokenModalOpen, setIsNewTokenModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [flashingToken, setFlashingToken] = useState<string | null>(null);

  // New manual token form
  const [manualItemText, setManualItemText] = useState('');
  const [manualAmount, setManualAmount] = useState('150');
  const [manualCustomer, setManualCustomer] = useState('');
  const [manualPayMode, setManualPayMode] = useState<'CASH' | 'UPI'>('UPI');

  const loadTokens = () => {
    const list = fastFoodTokenStorage.getTokens(restaurant?._id);
    setTokens(list);
  };

  useEffect(() => {
    loadTokens();

    const handleCreated = (e: any) => {
      loadTokens();
    };
    const handleStatus = (e: any) => {
      loadTokens();
    };
    const handleCalled = (e: any) => {
      loadTokens();
      if (e.detail?.tokenDisplay) {
        setFlashingToken(e.detail.tokenDisplay);
        setTimeout(() => setFlashingToken(null), 6000);
      }
    };

    window.addEventListener('apexbee:token_created', handleCreated);
    window.addEventListener('apexbee:token_status_changed', handleStatus);
    window.addEventListener('apexbee:token_called', handleCalled);

    const interval = setInterval(loadTokens, 4000);

    return () => {
      window.removeEventListener('apexbee:token_created', handleCreated);
      window.removeEventListener('apexbee:token_status_changed', handleStatus);
      window.removeEventListener('apexbee:token_called', handleCalled);
      clearInterval(interval);
    };
  }, [restaurant?._id]);

  const preparingTokens = useMemo(
    () => tokens.filter((t) => t.status === 'PREPARING'),
    [tokens]
  );

  const readyTokens = useMemo(
    () => tokens.filter((t) => t.status === 'READY_FOR_PICKUP'),
    [tokens]
  );

  const handleMarkReady = (tok: IFastFoodToken) => {
    fastFoodTokenStorage.callToken(tok.id, restaurant?._id);
    loadTokens();
  };

  const handleCallAgain = (tok: IFastFoodToken) => {
    fastFoodTokenStorage.callToken(tok.id, restaurant?._id);
  };

  const handleHandedOver = (id: string) => {
    fastFoodTokenStorage.updateTokenStatus(id, 'COMPLETED', restaurant?._id);
    loadTokens();
  };

  const handleClearCompleted = () => {
    fastFoodTokenStorage.clearCompletedTokens(restaurant?._id);
    loadTokens();
  };

  const handlePrintSlip = (tok: IFastFoodToken) => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    printWin.document.write(`
      <html>
        <head>
          <title>Token Slip ${tok.tokenDisplay}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, monospace, sans-serif;
              padding: 16px;
              max-width: 300px;
              margin: 0 auto;
              color: #000;
            }
            .center { text-align: center; }
            .token-box {
              border: 3px solid #000;
              border-radius: 12px;
              padding: 10px;
              margin: 10px 0;
              text-align: center;
            }
            .token-num {
              font-size: 42px;
              font-weight: 900;
              margin: 0;
              line-height: 1;
            }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .item-row { display: flex; justify-content: space-between; margin: 4px 0; font-size: 13px; }
            .bold { font-weight: bold; }
            .notice { font-size: 11px; text-align: center; margin-top: 12px; }
          </style>
        </head>
        <body>
          <div class="center">
            <h3 style="margin: 0;">${restaurant?.restaurantName || 'APEXBEE FAST FOOD'}</h3>
            <p style="margin: 2px 0; font-size: 11px;">QUICK SERVICE TOKEN RECEIPT</p>
          </div>

          <div class="token-box">
            <div style="font-size: 11px; font-weight: bold; text-transform: uppercase;">YOUR TOKEN NUMBER</div>
            <div class="token-num">${tok.tokenDisplay}</div>
            <div style="font-size: 11px; margin-top: 4px;">${tok.orderNumber} • ${new Date(tok.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>

          <div class="divider"></div>

          <div>
            ${tok.items
              .map(
                (item) => `
              <div class="item-row">
                <span class="bold">${item.quantity}x ${item.name}</span>
                <span>${item.price ? '₹' + item.price * item.quantity : ''}</span>
              </div>
            `
              )
              .join('')}
          </div>

          <div class="divider"></div>

          <div class="item-row bold" style="font-size: 15px;">
            <span>TOTAL PAID</span>
            <span>₹${tok.totalAmount} (${tok.paymentMode})</span>
          </div>

          <div class="notice">
            <strong>Please watch the Counter TV Display!</strong><br/>
            Your token will chime when ready for collection.
          </div>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handleCreateManualToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualItemText.trim()) return;

    const items = manualItemText.split(',').map((s) => ({
      name: s.trim(),
      quantity: 1,
    }));

    fastFoodTokenStorage.createToken(
      {
        orderNumber: `POS-${Math.floor(1000 + Math.random() * 9000)}`,
        orderType: 'COUNTER',
        customerName: manualCustomer.trim() || 'Counter Customer',
        items,
        totalAmount: Number(manualAmount) || 100,
        paymentMode: manualPayMode,
      },
      restaurant?._id
    );

    setManualItemText('');
    setIsNewTokenModalOpen(false);
    loadTokens();
  };

  // FULLSCREEN TV CUSTOMER DISPLAY MODE
  if (isTvMode) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0A1128] text-white flex flex-col p-6 select-none font-['Plus_Jakarta_Sans',sans-serif]">
        {/* TV TOP HEADER */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <span className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl">
              ⚡
            </span>
            <div>
              <h1 className="text-2xl font-black font-heading text-slate-100 tracking-wide">
                {restaurant?.restaurantName || 'APEXBEE FAST FOOD'}
              </h1>
              <p className="text-xs text-amber-400 font-bold uppercase tracking-widest">
                CUSTOMER TOKEN DISPLAY SCREEN
              </p>
            </div>
          </div>

          {/* FLASHING ALERT BANNER */}
          {flashingToken && (
            <div className="px-6 py-2 rounded-2xl bg-emerald-500 text-slate-950 font-black text-lg animate-bounce shadow-xl flex items-center space-x-2">
              <Bell className="w-5 h-5 animate-spin" />
              <span>TOKEN {flashingToken} IS READY! COLLECT AT COUNTER</span>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <div className="text-right font-mono">
              <div className="text-lg font-black text-slate-200">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="text-[10px] text-slate-400">COUNTER PICKUP LIVE</div>
            </div>

            <button
              onClick={() => setIsTvMode(false)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Exit TV</span>
            </button>
          </div>
        </div>

        {/* TV MAIN DUAL DISPLAY SPLIT */}
        <div className="flex-1 grid grid-cols-2 gap-6 pt-6">
          {/* LEFT: PREPARING (AMBER) */}
          <div className="rounded-3xl border-2 border-amber-500/30 bg-slate-950/60 p-6 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-amber-400 font-black text-xl font-heading">
                <Flame className="w-6 h-6 animate-pulse" />
                <span>NOW PREPARING</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono font-black text-sm">
                {preparingTokens.length} In Kitchen
              </span>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-4 content-start">
              {preparingTokens.length === 0 ? (
                <div className="col-span-full py-20 text-center text-slate-600 text-base italic">
                  Kitchen is all caught up!
                </div>
              ) : (
                preparingTokens.map((tok) => (
                  <div
                    key={tok.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center flex flex-col justify-center space-y-1"
                  >
                    <div className="font-mono text-4xl font-black text-amber-400 tracking-tight">
                      {tok.tokenDisplay}
                    </div>
                    <div className="text-xs text-slate-400 font-medium truncate">
                      {tok.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: READY FOR PICKUP (EMERALD / PULSE) */}
          <div className="rounded-3xl border-2 border-emerald-500/40 bg-slate-950/60 p-6 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-emerald-400 font-black text-xl font-heading">
                <Bell className="w-6 h-6 animate-bounce" />
                <span>READY FOR PICKUP</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-black text-sm">
                {readyTokens.length} At Counter
              </span>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-4 content-start">
              {readyTokens.length === 0 ? (
                <div className="col-span-full py-20 text-center text-slate-600 text-base italic">
                  No orders waiting for pickup
                </div>
              ) : (
                readyTokens.map((tok) => (
                  <div
                    key={tok.id}
                    className={`p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border-2 border-emerald-500 text-center flex flex-col justify-center space-y-1 shadow-lg shadow-emerald-500/10 ${
                      tok.tokenDisplay === flashingToken ? 'animate-pulse ring-4 ring-emerald-400' : ''
                    }`}
                  >
                    <div className="font-mono text-5xl font-black text-emerald-400 tracking-tight">
                      {tok.tokenDisplay}
                    </div>
                    <div className="text-xs text-emerald-300/90 font-bold uppercase tracking-wider">
                      COLLECT AT COUNTER
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STANDARD STAFF KITCHEN & COUNTER DISPATCH VIEW
  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-3xl backdrop-blur-xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20 text-lg">
              ⚡
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-100 font-heading">
                Fast Food Live Token &amp; Kitchen Display (KDS)
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                High-speed counter order flow, kitchen preparation queues, and audio token calling system.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* TEST AUDIO CHIME */}
          <button
            onClick={() => {
              playTokenBuzzer();
              announceTokenSpeech('#01');
            }}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
            title="Test speaker buzzer & voice call"
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>Test Chime</span>
          </button>

          {/* LAUNCH TV MODE */}
          <button
            onClick={() => setIsTvMode(true)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold text-xs border border-slate-700 transition flex items-center space-x-1.5 cursor-pointer shadow-md"
          >
            <Tv className="w-4 h-4 text-amber-400" />
            <span>Launch TV Display</span>
          </button>

          {/* MANUAL TOKEN BUTTON */}
          <button
            onClick={() => setIsNewTokenModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Quick Walk-in Token</span>
          </button>
        </div>
      </div>

      {/* METRIC KPI COUNTERS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400">Total Tokens Today</div>
          <div className="text-2xl font-black text-slate-100 mt-1 font-mono">{tokens.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Counter + takeaway</div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30">
          <div className="text-[11px] font-bold text-amber-400">Now Preparing (Kitchen)</div>
          <div className="text-2xl font-black text-amber-300 mt-1 font-mono">{preparingTokens.length}</div>
          <div className="text-[10px] text-amber-400/80 mt-0.5">On grill &amp; fryer</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
          <div className="text-[11px] font-bold text-emerald-400">Ready for Pickup</div>
          <div className="text-2xl font-black text-emerald-300 mt-1 font-mono">{readyTokens.length}</div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">Awaiting customer</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-400">Clean Old Tokens</div>
            <div className="text-xs text-slate-500 mt-1">Clear completed tokens from screen</div>
          </div>
          <button
            onClick={handleClearCompleted}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            title="Clear Handed-Over Tokens"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DUAL COLUMN WORKFLOW: KITCHEN PREPARATION VS COUNTER SERVICE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN: KITCHEN ORDERS (NOW PREPARING) */}
        <div className="space-y-4 bg-slate-900/50 border border-slate-800 rounded-3xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400">
                <Flame className="w-4 h-4 animate-pulse" />
              </span>
              <h2 className="text-base font-extrabold text-slate-100 font-heading">
                1. Now Cooking &amp; Frying
              </h2>
            </div>
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {preparingTokens.length} Orders
            </span>
          </div>

          <div className="space-y-3">
            {preparingTokens.length === 0 ? (
              <div className="py-14 text-center text-slate-500 text-xs italic bg-slate-950/40 rounded-2xl border border-slate-800/60">
                All fast food orders cooked &amp; packed!
              </div>
            ) : (
              preparingTokens.map((tok) => (
                <div
                  key={tok.id}
                  className="bg-slate-950 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 space-y-3 transition shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xl font-black px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20">
                        {tok.tokenDisplay}
                      </span>
                      <div>
                        <div className="text-xs font-mono font-bold text-slate-300">{tok.orderNumber}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(tok.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 uppercase">
                      {tok.orderType}
                    </span>
                  </div>

                  {/* ITEMS LIST IN BOLD */}
                  <div className="p-3 bg-slate-900/80 rounded-xl space-y-1 border border-slate-800/80">
                    {tok.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-100">
                          <span className="text-amber-400 font-mono mr-1.5">{item.quantity}x</span>
                          {item.name}
                        </span>
                        {item.notes && (
                          <span className="text-[10px] text-slate-400 italic">({item.notes})</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* ACTION: MARK READY */}
                  <button
                    onClick={() => handleMarkReady(tok)}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Bell className="w-4 h-4" />
                    <span>MARK READY &amp; CALL TOKEN 🔔</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: READY FOR PICKUP (COUNTER SERVICE) */}
        <div className="space-y-4 bg-slate-900/50 border border-slate-800 rounded-3xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Bell className="w-4 h-4 animate-bounce" />
              </span>
              <h2 className="text-base font-extrabold text-slate-100 font-heading">
                2. Ready for Pickup at Counter
              </h2>
            </div>
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {readyTokens.length} Ready
            </span>
          </div>

          <div className="space-y-3">
            {readyTokens.length === 0 ? (
              <div className="py-14 text-center text-slate-500 text-xs italic bg-slate-950/40 rounded-2xl border border-slate-800/60">
                No orders waiting for customer pickup.
              </div>
            ) : (
              readyTokens.map((tok) => (
                <div
                  key={tok.id}
                  className="bg-slate-950 border-2 border-emerald-500/40 rounded-2xl p-4 space-y-3 transition shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-2xl font-black px-3 py-1 rounded-xl bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20">
                        {tok.tokenDisplay}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-200">
                          {tok.customerName || 'Counter Customer'}
                        </div>
                        <div className="text-[10px] text-emerald-400 font-semibold">
                          Called {tok.callCount || 1} time(s)
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-200 text-xs">₹{tok.totalAmount}</div>
                      <div className="text-[10px] text-slate-400">{tok.paymentMode}</div>
                    </div>
                  </div>

                  {/* ITEMS SUMMARY */}
                  <div className="text-xs text-slate-300 line-clamp-1 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                    {tok.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </div>

                  {/* ACTIONS */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      onClick={() => handleCallAgain(tok)}
                      className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs transition border border-amber-500/30 flex items-center justify-center space-x-1"
                      title="Re-announce token voice call"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Re-Call 📢</span>
                    </button>

                    <button
                      onClick={() => handlePrintSlip(tok)}
                      className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition border border-slate-700 flex items-center justify-center space-x-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Slip</span>
                    </button>

                    <button
                      onClick={() => handleHandedOver(tok.id)}
                      className="py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center justify-center space-x-1 shadow-md shadow-emerald-500/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Handed Over</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* QUICK WALK-IN TOKEN MODAL */}
      {isNewTokenModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 text-base">⚡</span>
                <h3 className="text-base font-extrabold text-slate-100 font-heading">
                  Quick Walk-in Counter Token
                </h3>
              </div>
              <button
                onClick={() => setIsNewTokenModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualToken} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Items Ordered (Comma Separated) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2x Veg Burger, 1x Peri Peri Fries, 1x Coke"
                  value={manualItemText}
                  onChange={(e) => setManualItemText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Total Bill (₹)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Payment Mode</label>
                  <select
                    value={manualPayMode}
                    onChange={(e) => setManualPayMode(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="UPI">UPI / QR Scan</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Customer Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul"
                  value={manualCustomer}
                  onChange={(e) => setManualCustomer(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewTokenModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  Generate Token &amp; Dispatch to Kitchen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenKitchenDisplayPage;

