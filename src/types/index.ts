// src/types/index.ts

export interface LocationPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface HydraCollection<T> {
  'hydra:member'?: T[];
  'member'?: T[];
  'hydra:totalItems'?: number;
}

export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'PENDING_APPROVAL';

export type BidStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';

export type VisitStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface CalendarEvent {
  '@id'?: string;
  id: number;
  /** Fecha y hora de comienzo (ISO datetime). Sin hora de fin. */
  startsAt: string;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  request: Pick<ServiceRequest, 'id' | 'title' | 'status'> & {
    '@id'?: string;
  };
  professional?: ProfessionalProfile;
}

export type Category =
  | 'CLEANING'
  | 'DIY'
  | 'ELECTRICITY'
  | 'GARDENING'
  | 'PAINTING'
  | 'PLUMBING'
  | 'HVAC'
  | 'MASONRY'
  | 'APPLIANCES'
  | 'MOVING'
  | 'LOCKSMITH'
  | 'POOL'
  | 'SEWING'
  | 'BLINDS'
  | 'GLAZING'
  | 'FURNITURE'
  | 'CLEAROUT'
  | 'PEST_CONTROL'
  | 'SMART_HOME'
  | 'BEAUTY'
  | 'PETS'
  | 'CARE';

export interface ProfessionalProfile {
  '@id': string;
  id: number;
  fullName: string;
  phoneNumber?: string;
  verifiedPhone?: boolean;
  avatar?: string;
  taxId?: string;
  bio?: string;
  skills: string[];
  isVerified: boolean;
  rating?: number; 
  reviewCount?: number; 
  user?: User;
  notifyRequestActivity?: boolean;
  notifyBidActivity?: boolean;
  notifyReviews?: boolean;
  /** Fin de suscripción vigente (ISO 8601); el backend puede exponerlo aquí o en User. */
  paidThroughAt?: string | null;
}

export interface ClientProfile {
  '@id': string;
  id: number;
  fullName: string;
  phoneNumber?: string;
  verifiedPhone?: boolean;
  avatar?: string;
  rating?: number;
  reviewCount?: number;
  user?: User;
  notifyRequestActivity?: boolean;
  notifyBidActivity?: boolean;
  notifyReviews?: boolean;
}

export interface User {
  '@id': string;
  id: number;
  email: string;
  roles: string[];
  fcmToken?: string | null;
  verifiedEmail?: boolean;
  verifiedPhone?: boolean;
  paidThroughAt?: string | null;
  /** Si la suscripción está programada para cancelarse al final del periodo (Stripe cancel_at_period_end). Fuente de verdad desde el backend. */
  subscriptionCancelAtPeriodEnd?: boolean;
  professionalProfile?: ProfessionalProfile;
  clientProfile?: ClientProfile;
}

export interface Bid {
  '@id': string;
  id: number;
  pricingType?: 'FIXED' | 'RANGE';
  priceQuote: number;
  priceQuoteMin?: number | null;
  priceQuoteMax?: number | null;
  comment?: string;
  /** Texto libre del backend para cuándo se estima realizar el trabajo */
  estimatedExecutionTime?: string | null;
  status: BidStatus;
  createdAt: string;
  professional: User;
  request: ServiceRequest; 
}

export interface RequestQuestion {
    id: number;
    questionText: string;
    answerText?: string;
    /** URLs de media (imágenes o vídeos) adjuntadas en la respuesta del cliente */
    answerMediaUrls?: string[];
    createdAt: string;
    author: {
        fullName: string;
    };
}

export interface VisitRequest {
  id: number;
  status: VisitStatus;
  professional?: ProfessionalProfile;
  /** Teléfono del profesional, solo presente cuando la visita ha sido aceptada */
  professionalPhone?: string;
}

export interface ServiceRequest {
  '@id': string;
  id: number;
  title: string;
  description: string;
  /** Texto libre que escribió el cliente (modo texto + imagen), antes de la valoración IA. Opcional; requiere soporte en API. */
  clientOriginalDescription?: string | null;
  /** Rango en céntimos estimado por la IA para la zona (persistido en backend). */
  estimatedPriceMin: number;
  estimatedPriceMax: number;
  status: RequestStatus;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  category: Category;
  address: string;  
  preciseAddress?: string; 
  photoUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  /** Media adicional opcional subida en el step 2 */
  extraPhotoUrls?: string[];
  extraAudioUrls?: string[];
  extraVideoUrls?: string[];
  /** Disponibilidad preferida para realizar el trabajo (sin fecha exacta) */
  desiredExecutionTime?: string | null;
  locationPoint: LocationPoint;
  createdAt: string;
  aiDiagnosis?: Record<string, any>; 
  pricingType?: 'FIXED' | 'RANGE' | 'VISIT_REQUIRED' | null;
  client: ClientProfile;
  /** Profesional asignado; el teléfono de contacto viene en assignedProfessional.phoneNumber */
  assignedProfessional?: ProfessionalProfile;
  /** Solicitudes de visita de valoración (solo para PRO) */
  visitRequests?: VisitRequest[];
  bids: Bid[];
  questions?: RequestQuestion[];
}

export interface HydraMember {
  '@id'?: string;
  id?: number;
}

/** Violación 422 de API Platform (propertyPath, code estable, message para UI). */
export interface ApiViolation {
  message?: string;
  propertyPath?: string;
  /** Ej. BID_HIGH_REQUIRES_PAID_SUBSCRIPTION, BID_MONTHLY_LIMIT_EXCEEDED */
  code?: string;
}

/** Error de API típico de API Platform / Symfony */
export interface ApiError {
  violations?: ApiViolation[];
  'hydra:description'?: string;
  message?: string;
  detail?: string;
  error?: string;
}

// (Opcional) Si vas a listar reviews en el futuro, te vendrá bien esto:
export interface Review {
  '@id': string;
  id: number;
  score: number;
  comment?: string;
  createdAt: string;
  author: User;
  target: User;
}