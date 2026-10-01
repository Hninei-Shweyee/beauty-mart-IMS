const defaultApiBaseUrl = import.meta.env.DEV
  ? 'http://localhost:5001/api'
  : 'https://beauty-mart-ims.vercel.app/api';

export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl).replace(/\/$/, '');
