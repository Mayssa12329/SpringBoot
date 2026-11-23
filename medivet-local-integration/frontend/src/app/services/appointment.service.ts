import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Appointment, MetricCardData, PatientOverviewStats } from '../models/appointment.model';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private readonly API_URL = '/api/v1/appointments';
  
  readonly appointments = signal<Appointment[]>([]);
  readonly metrics = signal<MetricCardData[]>([]);
  readonly patientOverview = signal<PatientOverviewStats>({});
  readonly isLoading = signal(false);

  constructor(private http: HttpClient) {}

  loadAppointments(): Observable<Appointment[]> {
    this.isLoading.set(true);
    return this.http.get<Appointment[]>(this.API_URL).pipe(
      tap(data => {
        this.appointments.set(data);
        this.isLoading.set(false);
      })
    );
  }

  checkIn(appointmentId: number): Observable<Appointment> {
    return this.http.patch<Appointment>(
      `${this.API_URL}/${appointmentId}/check-in`,
      {}
    ).pipe(
      tap(updated => {
        this.appointments.update(items =>
          items.map(app => app.id === appointmentId ? updated : app)
        );
      })
    );
  }
}



