import { Capacitor } from '@capacitor/core';

type AnalyticsEventParams = Record<string, string | number | boolean | null>;

export async function initAnalytics(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
  // Habilita recolección automática (el cambio aplica en el siguiente arranque según el SDK).
  await FirebaseAnalytics.setEnabled({ enabled: true });
}

export async function logEvent(name: string, params?: AnalyticsEventParams): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (!name) return;

  const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
  await FirebaseAnalytics.logEvent({ name, params });
}

export async function setUserId(userId: string | null): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
  await FirebaseAnalytics.setUserId({ userId: userId ?? null });
}

