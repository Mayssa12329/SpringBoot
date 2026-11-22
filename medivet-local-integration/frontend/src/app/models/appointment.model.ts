import { ConsultationType } from './vet.model';

export type AppointmentStatus =
  | 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'LATE_CANCELLED' | 'COMPLETED';

export interface AppointmentRequest {
  slotId: number;
  ownerId: number;
  petId?: number;
  consultationType: ConsultationType;
  notes?: string;
}

export interface AppointmentResponse {
  id: number;
  slotId: number;
  slotStartTime: string;
  slotEndTime: string;
  vetId: number;
  vetFullName: string;
  ownerId: number;
  petId?: number;
  consultationType: ConsultationType;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Payload for PATCH /api/v1/appointments/{id} — US16.
 * newSlotId is optional: omit for notes-only update, provide for reschedule.
 */
export interface AppointmentModifyRequest {
  newSlotId?: number;
  notes?: string;
}
