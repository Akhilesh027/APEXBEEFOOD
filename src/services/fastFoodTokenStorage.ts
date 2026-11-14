export interface IFastFoodTokenItem {
  name: string;
  quantity: number;
  price?: number;
  notes?: string;
}

export interface IFastFoodToken {
  id: string;
  restaurantId?: string;
  tokenNumber: number; // e.g. 14
  tokenDisplay: string; // e.g. "#14"
  orderNumber: string; // e.g. "POS-2041"
  orderType: 'COUNTER' | 'TAKEAWAY' | 'DELIVERY';
  customerName?: string;
  customerPhone?: string;
  items: IFastFoodTokenItem[];
  totalAmount: number;
  paymentMode: 'CASH' | 'UPI' | 'CARD';
  status: 'PREPARING' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  readyAt?: string;
  completedAt?: string;
  callCount?: number;
  lastCalledAt?: string;
}

const getStorageKey = (restId?: string): string => {
  return restId ? `apexbee_tokens_${restId}` : 'apexbee_tokens_default';
};

const getCounterKey = (restId?: string): string => {
  const todayStr = new Date().toISOString().split('T')[0];
  return restId ? `apexbee_token_seq_${restId}_${todayStr}` : `apexbee_token_seq_default_${todayStr}`;
};

export const playTokenBuzzer = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Play pleasant 2-tone counter chime (880Hz -> 1174Hz)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
    osc1.frequency.exponentialRampToValueAtTime(1174.66, audioCtx.currentTime + 0.15); // D6
    gain1.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);

    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start();
    osc1.stop(audioCtx.currentTime + 0.6);
  } catch {}
};

export const announceTokenSpeech = (tokenDisplay: string) => {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const numOnly = tokenDisplay.replace(/[^0-9]/g, '');
      const text = numOnly
        ? `Token number ${numOnly}, your order is ready for pickup at the counter!`
        : `Order ${tokenDisplay} is ready for pickup!`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  } catch {}
};

export const fastFoodTokenStorage = {
  getTokens: (restaurantId?: string): IFastFoodToken[] => {
    try {
      const key = getStorageKey(restaurantId);
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      return [];
    } catch {
      return [];
    }
  },

  getNextTokenNumber: (restaurantId?: string): number => {
    try {
      const cKey = getCounterKey(restaurantId);
      const curr = Number(localStorage.getItem(cKey) || '0');
      const next = curr >= 99 ? 1 : curr + 1;
      localStorage.setItem(cKey, String(next));
      return next;
    } catch {
      return Math.floor(1 + Math.random() * 50);
    }
  },

  peekNextTokenNumber: (restaurantId?: string): number => {
    try {
      const cKey = getCounterKey(restaurantId);
      const curr = Number(localStorage.getItem(cKey) || '0');
      return curr >= 99 ? 1 : curr + 1;
    } catch {
      return 1;
    }
  },

  createToken: (
    data: Omit<IFastFoodToken, 'id' | 'tokenNumber' | 'tokenDisplay' | 'createdAt' | 'status'> & {
      customTokenNumber?: number;
    },
    restaurantId?: string
  ): IFastFoodToken => {
    const list = fastFoodTokenStorage.getTokens(restaurantId);
    const tokenNumber = data.customTokenNumber || fastFoodTokenStorage.getNextTokenNumber(restaurantId);
    const tokenDisplay = `#${String(tokenNumber).padStart(2, '0')}`;

    const newToken: IFastFoodToken = {
      ...data,
      id: `tok-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      restaurantId,
      tokenNumber,
      tokenDisplay,
      status: 'PREPARING',
      createdAt: new Date().toISOString(),
      callCount: 0,
    };

    const updated = [newToken, ...list];
    try {
      const key = getStorageKey(restaurantId);
      localStorage.setItem(key, JSON.stringify(updated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('apexbee:token_created', { detail: newToken }));
      }
    } catch {}

    return newToken;
  },

  updateTokenStatus: (
    id: string,
    status: IFastFoodToken['status'],
    restaurantId?: string
  ): IFastFoodToken[] => {
    const list = fastFoodTokenStorage.getTokens(restaurantId);
    const nowIso = new Date().toISOString();
    const updated = list.map((tok) => {
      if (tok.id === id) {
        return {
          ...tok,
          status,
          readyAt: status === 'READY_FOR_PICKUP' ? (tok.readyAt || nowIso) : tok.readyAt,
          completedAt: status === 'COMPLETED' ? nowIso : tok.completedAt,
        };
      }
      return tok;
    });

    try {
      const key = getStorageKey(restaurantId);
      localStorage.setItem(key, JSON.stringify(updated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('apexbee:token_status_changed', { detail: { id, status } }));
      }
    } catch {}

    return updated;
  },

  callToken: (id: string, restaurantId?: string): IFastFoodToken[] => {
    const list = fastFoodTokenStorage.getTokens(restaurantId);
    let targetToken: IFastFoodToken | undefined;

    const updated = list.map((tok) => {
      if (tok.id === id) {
        targetToken = {
          ...tok,
          status: 'READY_FOR_PICKUP',
          callCount: (tok.callCount || 0) + 1,
          lastCalledAt: new Date().toISOString(),
          readyAt: tok.readyAt || new Date().toISOString(),
        };
        return targetToken;
      }
      return tok;
    });

    try {
      const key = getStorageKey(restaurantId);
      localStorage.setItem(key, JSON.stringify(updated));
      if (targetToken) {
        playTokenBuzzer();
        announceTokenSpeech(targetToken.tokenDisplay);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('apexbee:token_called', { detail: targetToken }));
        }
      }
    } catch {}

    return updated;
  },

  clearCompletedTokens: (restaurantId?: string): IFastFoodToken[] => {
    const list = fastFoodTokenStorage.getTokens(restaurantId);
    const updated = list.filter((tok) => tok.status !== 'COMPLETED' && tok.status !== 'CANCELLED');
    try {
      const key = getStorageKey(restaurantId);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {}
    return updated;
  },
};

