export type ConsultationType =
  | 'GENERAL' | 'SURGERY' | 'DERMATOLOGY'
  | 'CARDIOLOGY' | 'ORTHOPEDICS' | 'OPHTHALMOLOGY'
  | 'DENTISTRY' | 'EMERGENCY';

export interface Vet {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  clinicName: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  consultationType: ConsultationType;
  active: boolean;
  // UI extras
  rating?: number;
  reviewCount?: number;
  experience?: number;
  avatarUrl?: string;
  availability?: 'today' | 'tomorrow' | 'later';
}
