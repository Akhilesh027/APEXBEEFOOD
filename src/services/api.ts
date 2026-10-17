import axios from 'axios';

const defaultApiHost = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  ? `http://${window.location.hostname}:5500/api`
  : 'https://server.apexbee.in/api';

export const API_BASE_URL = import.meta.env.VITE_API_URL || defaultApiHost;

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
