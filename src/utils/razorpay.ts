// food-partner-portal/src/utils/razorpay.ts - Razorpay Checkout Helper for Food Partner Portal

export interface RazorpayPrefill {
  name?: string;
  email?: string;
  contact?: string;
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  key?: string;
  amount: number; // in paise
  currency?: string;
  name?: string;
  description?: string;
  image?: string;
  order_id: string;
  prefill?: RazorpayPrefill;
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
}

/**
 * Ensures the Razorpay checkout script is loaded in the browser
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.getElementById('razorpay-checkout-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay SDK script');
      resolve(false);
    };

    document.body.appendChild(script);
  });
};

/**
 * Gets the configured Razorpay Key ID
 */
export const getRazorpayKey = (): string => {
  const envKey = (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || '';
  if (envKey && envKey.startsWith('rzp_')) {
    return envKey;
  }
  return 'rzp_test_ThlZYDDvRmTvhl';
};

/**
 * Opens the Razorpay Checkout popup modal and returns a Promise with the payment result
 */
export const openRazorpayModal = async (
  options: Omit<RazorpayOptions, 'key'> & { key?: string }
): Promise<RazorpaySuccessResponse> => {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    throw new Error('Razorpay payment gateway failed to load. Please check your internet connection.');
  }

  return new Promise((resolve, reject) => {
    let key = options.key || getRazorpayKey();
    if (!key || !key.startsWith('rzp_')) {
      key = 'rzp_test_ThlZYDDvRmTvhl';
    }

    let cleanContact: string | undefined = undefined;
    if (options.prefill?.contact) {
      const raw = String(options.prefill.contact).trim();
      const digitsOnly = raw.replace(/\D/g, '');
      if (digitsOnly.length === 10) {
        cleanContact = digitsOnly;
      } else if (digitsOnly.length > 10) {
        cleanContact = digitsOnly.slice(-10);
      }
    }

    const rzpOptions: any = {
      key,
      amount: options.amount,
      currency: options.currency || 'INR',
      name: options.name || 'ApexBee Food Partner',
      description: options.description || 'Food Partner Payment',
      image: options.image || 'https://apexbee.in/favicon.ico',
      order_id: options.order_id,
      notes: options.notes || {},
      theme: {
        color: options.theme?.color || '#F59E0B',
      },
      handler: (response: RazorpaySuccessResponse) => {
        if (!response.razorpay_payment_id || !response.razorpay_order_id) {
          reject(new Error('Incomplete payment details received from Razorpay.'));
          return;
        }
        resolve(response);
      },
      modal: {
        ondismiss: () => {
          reject(new Error('Payment window was closed before completion.'));
        },
        escape: true,
        backdropclose: false,
      },
    };

    if (options.prefill) {
      rzpOptions.prefill = {
        name: options.prefill.name || undefined,
        email: options.prefill.email || undefined,
        contact: cleanContact,
      };
    }

    const rzp = new (window as any).Razorpay(rzpOptions);

    rzp.on('payment.failed', (response: any) => {
      console.error('Razorpay payment failed:', response.error);
      const errDescription =
        response.error?.description ||
        response.error?.reason ||
        'Payment was declined or failed by bank.';
      reject(new Error(errDescription));
    });

    rzp.open();
  });
};
