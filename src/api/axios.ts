import axios from 'axios';
import * as Sentry from '@sentry/capacitor';
import { env } from '../config/env';
import { buildAxiosErrorReport } from './axiosErrorDebug';

const api = axios.create({
  baseURL: env.apiUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/ld+json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('quira_token');

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const report = buildAxiosErrorReport(error);
    Sentry.addBreadcrumb({
      category: 'http',
      level: 'error',
      message: `${String(report.method ?? '?')} ${String(report.fullUrl ?? '')}`,
      data: report,
    });

    if (error.response && error.response.status === 401) {
      const skipRedirect = (error.config as { skipAuthRedirect?: boolean })
        ?.skipAuthRedirect;
      if (!skipRedirect) {
        console.warn('Sesión caducada. Cerrando...');
        localStorage.removeItem('quira_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;