import { Component, inject, computed, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WelcomeHeroComponent } from './components/welcome-hero/welcome-hero.component';
import { UpcomingAppointmentsComponent } from './components/upcoming-appointments/upcoming-appointments.component';
import { PatientOverviewComponent } from './components/patient-overview/patient-overview.component';
import { MetricCardComponent } from '../../components/ui/metric-card/metric-card.component';
import { AppointmentService } from '../../services/appointment.service';
import { ToastService } from '../../components/ui/toast/toast.service';
import { SearchService } from '../../services/search.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    WelcomeHeroComponent,
    UpcomingAppointmentsComponent,
    PatientOverviewComponent,
    MetricCardComponent
  ],
  template: `
    <div class="dashboard-page">
      <!-- 1. Hero Welcome Banner (Dr. Sarah + Golden retriever) -->
      <app-welcome-hero></app-welcome-hero>

      <!-- 2. Metrics Bar (4 cards) -->
      <div class="metrics-row">
        @for (metric of appointmentService.metrics(); track metric.title) {
          <app-metric-card
            [title]="metric.title"
            [value]="metric.value"
            [trendText]="metric.trendText"
            [trendPositive]="metric.trendPositive"
            [icon]="metric.icon"
            [bgColor]="metric.iconBgColor"
            [iconColor]="metric.iconColor"
          ></app-metric-card>
        }
      </div>

      <!-- 3. Bottom Grid: Upcoming Appointments (Left) & Patient Overview (Right) -->
      <div class="dashboard-bottom-grid">
        <div class="grid-left">
          <app-upcoming-appointments
            [appointments]="filteredAppointments()"
            (checkIn)="handleCheckIn($event)"
            (viewAll)="goToPetPass.emit()"
          ></app-upcoming-appointments>
        </div>

        <div class="grid-right">
          <app-patient-overview
            [stats]="appointmentService.patientOverview()"
          ></app-patient-overview>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .metrics-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;

      @media (max-width: 1024px) {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .dashboard-bottom-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;

      @media (max-width: 900px) {
        grid-template-columns: 1fr;
      }
    }

    .grid-left, .grid-right {
      display: flex;
      flex-direction: column;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly appointmentService = inject(AppointmentService);
  private readonly toast = inject(ToastService);
  readonly searchService = inject(SearchService);

  ngOnInit(): void {
    // Ne charger les appointments QUE si vétérinaire ou admin
    const role = (this.authService.userRole() || '').toUpperCase();
    
    if (role !== 'VETERINAIRE' && role !== 'VET' && role !== 'ADMINISTRATEUR' && role !== 'ADMIN') {
      console.log('⚠ Utilisateur non-vétérinaire détecté, redirection vers /pets');
      this.router.navigate(['/pets']);
      return;
    }
    
    console.log('✓ Vétérinaire détecté, chargement des rendez-vous');
    this.appointmentService.loadAppointments().subscribe({
      next: () => console.log('✓ Rendez-vous chargés'),
      error: (err) => {
        console.error('✗ Erreur chargement rendez-vous:', err);
        this.toast.show('Impossible de charger les rendez-vous', 'error');
      }
    });
  }

  readonly filteredAppointments = computed(() => {
    const q = this.searchService.query().trim().toLowerCase();
    const list = this.appointmentService.appointments();
    if (!q) return list;
    return list.filter(a => 
      a.patientName?.toLowerCase().includes(q) ||
      a.reason?.toLowerCase().includes(q) ||
      a.time?.toLowerCase().includes(q) ||
      a.species?.toLowerCase().includes(q)
    );
  });

  goToPetPass = output<void>();

  handleCheckIn(id: number): void {
    const item = this.appointmentService.appointments().find(a => a.id === id);
    this.appointmentService.checkIn(id).subscribe({
      next: () => {
        this.toast.show(`Check-in validé pour ${item?.patientName || 'le patient'} ! Statut mis à jour.`, 'success');
      },
      error: (err) => {
        console.error('Erreur check-in:', err);
        this.toast.show('Erreur lors du check-in', 'error');
      }
    });
  }
}

