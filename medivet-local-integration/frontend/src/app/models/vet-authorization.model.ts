export type AccessScope = 'FULL_ACCESS' | 'READ_ONLY' | 'EMERGENCY_ONLY';

export interface VetAuthorization {
  id: number;
  animalId: number;
  veterinarianId: number;
  veterinarianName?: string;
  accessScope?: AccessScope;
  scope?: AccessScope;
  grantedAt?: string;
  expiresAt: string;
  active?: boolean;
  isRevoked?: boolean;
  isValid?: boolean;
}

export interface GrantAccessRequest {
  veterinarianId: number;
  accessScope: AccessScope;
  expiresAt: string; // ISO format: YYYY-MM-DDTHH:mm:ss
  scope?: AccessScope;
}
