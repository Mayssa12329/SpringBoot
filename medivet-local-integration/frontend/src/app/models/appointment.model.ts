import { ConsultationType } from './vet.model';

export type AppointmentStatus =
  | 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'LATE_CANCELLED' | 'COMPLETED' | 'CHECKED_IN';

// Type aliases for compatibility
export type Appointment = AppointmentResponse & {
  patientName?: string;
  breed?: string;
  species?: string;
  avatarUrl?: string;
  time?: string;
  ownerName?: string;
  reason?: string;
};

export interface MetricCardData {
  label?: string;
  value?: string | number;
  change?: number;
  title?: string;
  trendText?: string;
  trendPositive?: boolean;
  icon?: string;
  iconBgColor?: string;
  iconColor?: string;
}

export interface PatientOverviewStats {
  totalAppointments?: number;
  completedAppointments?: number;
  pendingAppointments?: number;
  cancelledAppointments?: number;
  healthyPercentage?: number;
  underTreatmentPercentage?: number;
  needsFollowUpPercentage?: number;
}

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
