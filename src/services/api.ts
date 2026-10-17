import axios from 'axios';

const getBaseApiUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Production ApexBee domains (e.g. food.apexbee.in) must route to server.apexbee.in
    if (hostname.includes('apexbee.in')) {
      return 'https://server.apexbee.in/api';
    }
    // LAN IP address (e.g., 192.168.x.x) for local network device testing
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
      return `http://${hostname}:5500/api`;
    }
  }
  return 'https://server.apexbee.in/api';
};

export const API_BASE_URL = getBaseApiUrl();

export const api = axios.create({
  baseURL: `${API_BASE_URL}/food-partner`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('food_partner_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('food_partner_token');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/verify-otp') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const publicCustomerFoodApi = axios.create({
  baseURL: `${API_BASE_URL}/food`,
  headers: {
    'Content-Type': 'application/json',
  },
});
