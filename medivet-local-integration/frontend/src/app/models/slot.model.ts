export type SlotStatus = 'AVAILABLE' | 'BOOKED' | 'BLOCKED';

export interface Slot {
  id: number;
  vetId: number;
  vetFullName: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
}
