import axios, { isAxiosError } from 'axios';
import { Capacitor } from '@capacitor/core';

function runtimeContext(): Record<string, unknown> {
  const ctx: Record<string, unknown> = {};
  try {
    ctx.platform = Capacitor.getPlatform();
    ctx.isNative = Capacitor.isNativePlatform();
  } catch {
    /* no Capacitor */
  }
  if (typeof navigator !== 'undefined') {
    ctx.navigatorOnLine = navigator.onLine;
    ctx.userAgent = navigator.userAgent?.slice(0, 200);
  }
  if (typeof window !== 'undefined' && window.location?.href) {
    ctx.pageUrl = window.location.href.split('?')[0];
  }
  return ctx;
}

function responseDataPreview(data: unknown): string | undefined {
  if (data == null) return undefined;
  try {
    const s = typeof data === 'string' ? data : JSON.stringify(data);
    return s.length > 800 ? `${s.slice(0, 800)}…` : s;
  } catch {
    return String(data).slice(0, 200);
  }
}

/**
 * Serializa un error de Axios (o cualquier error) para Sentry extras / logs.
 * Incluye URL completa, método, código de red y ausencia de response (típico Network Error).
 */
export function buildAxiosErrorReport(error: unknown): Record<string, unknown> {
  const report: Record<string, unknown> = {
    ...runtimeContext(),
  };

  if (!isAxiosError(error)) {
    report.kind = 'nonAxios';
    report.message = error instanceof Error ? error.message : String(error);
    if (error instanceof Error && error.name) report.name = error.name;
    return report;
  }

  const e = error as import('axios').AxiosError;
  const cfg = e.config;
  const base = cfg?.baseURL ?? '';
  const path = cfg?.url ?? '';
  const fullUrl = `${base}${path}`;

  report.kind = 'axios';
  report.axiosCode = e.code;
  report.axiosMessage = e.message;
  report.method = (cfg?.method ?? 'get').toUpperCase();
  report.baseURL = base || undefined;
  report.urlPath = path || undefined;
  report.fullUrl = fullUrl || undefined;
  report.hasResponse = !!e.response;
  report.hasRequest = !!e.request;
  report.noResponseLikelyNetwork =
    !e.response && (e.code === 'ERR_NETWORK' || e.message === 'Network Error');

  if (e.response) {
    report.httpStatus = e.response.status;
    report.httpStatusText = e.response.statusText;
    report.responseContentType = String(
      e.response.headers?.['content-type'] ?? '',
    ).slice(0, 120);
    const data = e.response.data;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      report.responseKeys = Object.keys(data as object).slice(0, 24);
    }
    report.responseDataPreview = responseDataPreview(data);
  }

  return report;
}

/**
 * Devuelve un mensaje corto para usuario cuando el backend no devuelve cuerpo (p. ej. CORS / red).
 */
export function axiosErrorUserHint(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  if (error.response) return undefined;
  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    return 'No hay conexión con el servidor o la petición fue bloqueada (CORS/red).';
  }
  return undefined;
}
