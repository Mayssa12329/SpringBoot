import { ConsultationType } from './vet.model';

export type WaitingListStatus =
  | 'WAITING' | 'OFFERED' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';

export interface WaitingListEntry {
  id: number;
  slotId: number;
  slotStartTime: string;   // ISO 8601
  vetId: number;
  vetFullName: string;
  ownerId: number;
  petId?: number;
  consultationType: ConsultationType;
  status: WaitingListStatus;
  registeredAt: string;
  offerExpiresAt?: string; // present only when status = OFFERED
}

/** Payload for POST /api/v1/waiting-list */
export interface WaitingListRequest {
  slotId: number;
  ownerId: number;
  petId?: number;
  consultationType: ConsultationType;
}
