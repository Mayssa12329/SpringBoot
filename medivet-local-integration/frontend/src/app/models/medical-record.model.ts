export interface MedicalRecord {
  id: number;
  animalId: number;
  veterinarianId: number;
  veterinarianName?: string;
  consultationDate: string; // ISO date-time
  diagnosis: string;
  treatment: string;
  notes?: string;
}

export interface AddConsultationRequest {
  diagnosis: string;
  treatment?: string;
  notes?: string;
  consultationDate?: string; // ISO LocalDateTime
}

export interface Vaccination {
  id: number;
  animalId: number;
  vaccineName: string;
  batchNumber?: string;
  injectionDate?: string; // YYYY-MM-DD
  nextDueDate?: string;   // YYYY-MM-DD
  administeredDate?: string;
  nextBoosterDate?: string;
  veterinarianId: number;
  veterinarianName?: string;
}

export interface AddVaccinationRequest {
  vaccineName: string;
  batchNumber?: string;
  injectionDate: string; // YYYY-MM-DD
  nextDueDate: string;   // YYYY-MM-DD
  administeredDate?: string;
  nextBoosterDate?: string;
}

export interface MedicalHistoryResponse {
  animalId: number;
  animalName?: string;
  consultations: MedicalRecord[];
  vaccinations: Vaccination[];
}

export interface MedicalEligibilityResponse {
  animalId: number;
  eligible?: boolean;
  status: 'ELIGIBLE' | 'NOT_ELIGIBLE';
  reasons: string[];
}
