import { Injectable, signal } from '@angular/core';
import { Appointment, MetricCardData, PatientOverviewStats } from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  // Upcoming appointments matching the screenshot
  readonly appointments = signal<Appointment[]>([
    {
      id: 1,
      patientName: 'Bella',
      breed: 'Golden Retriever',
      species: 'Chien',
      avatarUrl: 'assets/images/bella-avatar.png',
      time: '09:30 AM',
      status: 'CONFIRMED',
      ownerName: 'Sophie Martin',
      reason: 'Vaccin annuel & examen général'
    },
    {
      id: 2,
      patientName: 'Milo',
      breed: 'Cat',
      species: 'Chat',
      avatarUrl: 'assets/images/milo-avatar.png',
      time: '10:15 AM',
      status: 'CONFIRMED',
      ownerName: 'Thomas Leroy',
      reason: 'Contrôle post-opératoire'
    },
    {
      id: 3,
      patientName: 'Luna',
      breed: 'Rabbit',
      species: 'Lapin',
      avatarUrl: 'assets/images/luna-avatar.png',
      time: '11:00 AM',
      status: 'CONFIRMED',
      ownerName: 'Camille Dubois',
      reason: 'Vérification dentaire'
    }
  ]);

  // KPI Metrics matching the 4 cards in the screenshot
  readonly metrics = signal<MetricCardData[]>([
    {
      title: 'Total Patients',
      value: '48',
      trendText: '+12%',
      trendPositive: true,
      icon: 'paw',
      iconBgColor: '#e8f8f0',
      iconColor: '#10b981'
    },
    {
      title: "Today's Appointments",
      value: '12',
      trendText: '+8%',
      trendPositive: true,
      icon: 'calendar',
      iconBgColor: '#e0f2fe',
      iconColor: '#0284c7'
    },
    {
      title: 'New Records',
      value: '5',
      trendText: undefined,
      icon: 'file-text',
      iconBgColor: '#ecfdf5',
      iconColor: '#059669'
    },
    {
      title: 'Client Satisfaction',
      value: '98%',
      trendText: undefined,
      icon: 'star',
      iconBgColor: '#fffbeb',
      iconColor: '#f59e0b'
    }
  ]);

  // Patient overview donut stats
  readonly patientOverview = signal<PatientOverviewStats>({
    healthyPercentage: 68,
    underTreatmentPercentage: 22,
    needsFollowUpPercentage: 10
  });

  checkIn(appointmentId: number): void {
    this.appointments.update(items =>
      items.map(app =>
        app.id === appointmentId ? { ...app, status: 'CHECKED_IN' } : app
      )
    );
  }
}

