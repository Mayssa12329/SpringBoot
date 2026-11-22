import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Vet, ConsultationType } from '../models/vet.model';
import { Slot } from '../models/slot.model';
import { SlotRequest } from '../models/slot-request.model';
import { AppointmentRequest, AppointmentResponse, AppointmentModifyRequest } from '../models/appointment.model';
import { WaitingListEntry, WaitingListRequest } from '../models/waiting-list.model';

@Injectable({ providedIn: 'root' })
export class VetService {

  private readonly apiBase = '/api/v1';

  constructor(private http: HttpClient) {}

  // ── Vets ──────────────────────────────────────────────────────────────────

  getVets(city?: string, consultationType?: ConsultationType): Observable<Vet[]> {
    let params = new HttpParams();
    if (city && city !== 'All Cities') params = params.set('city', city);
    if (consultationType)              params = params.set('consultationType', consultationType);
    return this.http.get<Vet[]>(`${this.apiBase}/vets`, { params });
  }

  getVet(id: number): Observable<Vet> {
    return this.http.get<Vet>(`${this.apiBase}/vets/${id}`);
  }

  // ── Slots ─────────────────────────────────────────────────────────────────

  getAvailableSlots(vetId: number, date: string): Observable<Slot[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<Slot[]>(`${this.apiBase}/vets/${vetId}/slots/available`, { params });
  }

  /** Returns ALL slots for a vet (AVAILABLE + BOOKED + BLOCKED) — US14. */
  getAllSlots(vetId: number): Observable<Slot[]> {
    return this.http.get<Slot[]>(`${this.apiBase}/vets/${vetId}/slots`);
  }

  /** Creates a new slot for a vet — US14. */
  createSlot(vetId: number, request: SlotRequest): Observable<Slot> {
    return this.http.post<Slot>(`${this.apiBase}/vets/${vetId}/slots`, request);
  }

  /** Blocks an AVAILABLE slot — US14 (returns 422 if BOOKED). */
  blockSlot(slotId: number): Observable<Slot> {
    return this.http.patch<Slot>(`${this.apiBase}/vets/slots/${slotId}/block`, {});
  }

  /** Re-opens a BLOCKED slot — US14. */
  openSlot(slotId: number): Observable<Slot> {
    return this.http.patch<Slot>(`${this.apiBase}/vets/slots/${slotId}/open`, {});
  }

  // ── Appointments ──────────────────────────────────────────────────────────

  bookAppointment(request: AppointmentRequest): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(`${this.apiBase}/appointments`, request);
  }

  /** Returns all appointments for an owner — US16. */
  getAppointmentsByOwner(ownerId: number): Observable<AppointmentResponse[]> {
    return this.http.get<AppointmentResponse[]>(`${this.apiBase}/appointments/owner/${ownerId}`);
  }

  /** Modify an appointment (reschedule or notes update) — US16. Triggers US17 notification. */
  modifyAppointment(id: number, request: AppointmentModifyRequest): Observable<AppointmentResponse> {
    return this.http.patch<AppointmentResponse>(`${this.apiBase}/appointments/${id}`, request);
  }

  /** Cancel an appointment — US16. Triggers US17 notification + RM08 waiting list. */
  cancelAppointment(id: number): Observable<AppointmentResponse> {
    return this.http.patch<AppointmentResponse>(`${this.apiBase}/appointments/${id}/cancel`, {});
  }

  // ── Waiting List (US18) ───────────────────────────────────────────────────

  /** Join the waiting list for a BOOKED slot — US18 (RM08 FIFO). */
  joinWaitingList(request: WaitingListRequest): Observable<WaitingListEntry> {
    return this.http.post<WaitingListEntry>(`${this.apiBase}/waiting-list`, request);
  }

  /** Get all waiting-list entries for an owner — US18. */
  getWaitingListByOwner(ownerId: number): Observable<WaitingListEntry[]> {
    return this.http.get<WaitingListEntry[]>(`${this.apiBase}/waiting-list/owner/${ownerId}`);
  }

  /**
   * Accept a slot offer — US18.
   * Triggers real appointment creation + slot BOOKED + US17 notification (RM08).
   */
  acceptWaitingListOffer(entryId: number): Observable<WaitingListEntry> {
    return this.http.patch<WaitingListEntry>(`${this.apiBase}/waiting-list/${entryId}/accept`, {});
  }

  /** Cancel a waiting-list entry — US18. */
  cancelWaitingListEntry(entryId: number): Observable<WaitingListEntry> {
    return this.http.patch<WaitingListEntry>(`${this.apiBase}/waiting-list/${entryId}/cancel`, {});
  }
}
