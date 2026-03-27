import type { User } from '../types';

export interface VerificationStatus {
  // Cliente
  hasClientPhone: boolean;
  verifiedClientPhone: boolean;
  canCreateRequest: boolean;

  // Profesional
  hasProPhone: boolean;
  verifiedProPhone: boolean;
  canBid: boolean;
}

/**
 * Comprueba si el usuario puede publicar solicitudes (cliente) o hacer pujas (pro).
 * Requiere: teléfono en el perfil correspondiente y verifiedPhone en ese perfil.
 */
export function getVerificationStatus(): VerificationStatus | null {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr) as User;

    const phoneClient = user.clientProfile?.phoneNumber?.trim();
    const phonePro = user.professionalProfile?.phoneNumber?.trim();

    const hasClientPhone = Boolean(phoneClient);
    const hasProPhone = Boolean(phonePro);

    const verifiedClientPhone = Boolean(user.clientProfile?.verifiedPhone);
    const verifiedProPhone = Boolean(user.professionalProfile?.verifiedPhone);

    const canCreateRequest = Boolean(user.clientProfile) && hasClientPhone && verifiedClientPhone;
    const canBid = Boolean(user.professionalProfile) && hasProPhone && verifiedProPhone;

    return {
      hasClientPhone,
      verifiedClientPhone,
      canCreateRequest,
      hasProPhone,
      verifiedProPhone,
      canBid,
    };
  } catch {
    return null;
  }
}
