import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Vet, ConsultationType } from '../models/vet.model';
import { Slot } from '../models/slot.model';
import { SlotRequest } from '../models/slot-request.model';
import { AppointmentRequest, AppointmentResponse, AppointmentModifyRequest } from '../models/appointment.model';
import { WaitingListEntry, WaitingListRequest } from '../models/waiting-list.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class VetService {

  private readonly apiBase = '/api/v1';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private authHeaders(): HttpHeaders {
    const token = this.authService.token();
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  // ── Vets ──────────────────────────────────────────────────────────────────

  getVets(city?: string, consultationType?: ConsultationType): Observable<Vet[]> {
    let params = new HttpParams();
    if (city && city !== 'All Cities') params = params.set('city', city);
    if (consultationType)              params = params.set('consultationType', consultationType);
    return this.http.get<Vet[]>(`${this.apiBase}/vets`, {
      params,
      headers: this.authHeaders()
    });
  }

  getVet(id: number): Observable<Vet> {
    return this.http.get<Vet>(`${this.apiBase}/vets/${id}`, {
      headers: this.authHeaders()
    });
  }

  // ── Slots ─────────────────────────────────────────────────────────────────

  getAvailableSlots(vetId: number, date: string): Observable<Slot[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<Slot[]>(`${this.apiBase}/vets/${vetId}/slots/available`, {
      params,
      headers: this.authHeaders()
    });
  }

  /** Returns ALL slots for a vet (AVAILABLE + BOOKED + BLOCKED) — US14. */
  getAllSlots(vetId: number): Observable<Slot[]> {
    return this.http.get<Slot[]>(`${this.apiBase}/vets/${vetId}/slots`, {
      headers: this.authHeaders()
    });
  }

  /** Creates a new slot for a vet — US14. */
  createSlot(vetId: number, request: SlotRequest): Observable<Slot> {
    return this.http.post<Slot>(`${this.apiBase}/vets/${vetId}/slots`, request, {
      headers: this.authHeaders()
    });
  }

  /** Blocks an AVAILABLE slot — US14 (returns 422 if BOOKED). */
  blockSlot(slotId: number): Observable<Slot> {
    return this.http.patch<Slot>(`${this.apiBase}/vets/slots/${slotId}/block`, {}, {
      headers: this.authHeaders()
    });
  }

  /** Re-opens a BLOCKED slot — US14. */
  openSlot(slotId: number): Observable<Slot> {
    return this.http.patch<Slot>(`${this.apiBase}/vets/slots/${slotId}/open`, {}, {
      headers: this.authHeaders()
    });
  }

  // ── Appointments ──────────────────────────────────────────────────────────

  bookAppointment(request: AppointmentRequest): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(`${this.apiBase}/appointments`, request, {
      headers: this.authHeaders()
    });
  }

  /** Returns all appointments for an owner — US16. */
  getAppointmentsByOwner(ownerId: number): Observable<AppointmentResponse[]> {
    return this.http.get<AppointmentResponse[]>(`${this.apiBase}/appointments/owner/${ownerId}`, {
      headers: this.authHeaders()
    });
  }

  /** Modify an appointment (reschedule or notes update) — US16. Triggers US17 notification. */
  modifyAppointment(id: number, request: AppointmentModifyRequest): Observable<AppointmentResponse> {
    return this.http.patch<AppointmentResponse>(`${this.apiBase}/appointments/${id}`, request, {
      headers: this.authHeaders()
    });
  }

  /** Cancel an appointment — US16. Triggers US17 notification + RM08 waiting list. */
  cancelAppointment(id: number): Observable<AppointmentResponse> {
    return this.http.patch<AppointmentResponse>(`${this.apiBase}/appointments/${id}/cancel`, {}, {
      headers: this.authHeaders()
    });
  }

  // ── Waiting List (US18) ───────────────────────────────────────────────────

  /** Join the waiting list for a BOOKED slot — US18 (RM08 FIFO). */
  joinWaitingList(request: WaitingListRequest): Observable<WaitingListEntry> {
    return this.http.post<WaitingListEntry>(`${this.apiBase}/waiting-list`, request, {
      headers: this.authHeaders()
    });
  }

  /** Get all waiting-list entries for an owner — US18. */
  getWaitingListByOwner(ownerId: number): Observable<WaitingListEntry[]> {
    return this.http.get<WaitingListEntry[]>(`${this.apiBase}/waiting-list/owner/${ownerId}`, {
      headers: this.authHeaders()
    });
  }

  /**
   * Accept a slot offer — US18.
   * Triggers real appointment creation + slot BOOKED + US17 notification (RM08).
   */
  acceptWaitingListOffer(entryId: number): Observable<WaitingListEntry> {
    return this.http.patch<WaitingListEntry>(`${this.apiBase}/waiting-list/${entryId}/accept`, {}, {
      headers: this.authHeaders()
    });
  }

  /** Cancel a waiting-list entry — US18. */
  cancelWaitingListEntry(entryId: number): Observable<WaitingListEntry> {
    return this.http.patch<WaitingListEntry>(`${this.apiBase}/waiting-list/${entryId}/cancel`, {}, {
      headers: this.authHeaders()
    });
  }
}
