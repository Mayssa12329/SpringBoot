export type Species = 'CHIEN' | 'CHAT' | 'NAC' | 'OISEAU' | 'RONGEUR' | 'AUTRE';

export type MicrochipStatus = 'VERIFIED' | 'NOT_FOUND' | 'INCONSISTENT' | 'UNDETERMINED' | 'PENDING';

export interface Animal {
  id: number;
  name: string;
  species: Species;
  breed: string;
  birthDate: string; // ISO format YYYY-MM-DD
  microchipNumber: string;
  microchipStatus: MicrochipStatus;
  ownerId: number;
  photoUrl?: string;
  weightKg?: number;
  gender?: 'M' | 'F';
  isEligibleForAdoption?: boolean;
}

export interface CreateAnimalRequest {
  name: string;
  species: Species;
  breed?: string;
  birthDate: string; // YYYY-MM-DD
  microchipNumber: string; // 15 digits
  photoUrl?: string;
  weightKg?: number;
  gender?: 'M' | 'F';
  vaccinationStatus?: 'UP_TO_DATE' | 'PARTIALLY' | 'NOT_VACCINATED' | string;
  currentMedications?: string;
  healthConditions?: string;
  allergies?: string;
  additionalNotes?: string;
}

export interface AnimalResponse {
  id: number;
  name: string;
  species: Species;
  breed?: string;
  birthDate: string;
  microchipNumber: string;
  microchipStatus: MicrochipStatus;
  ownerId: number;
  photoUrl?: string;
  weightKg?: number;
  gender?: 'M' | 'F';
}
