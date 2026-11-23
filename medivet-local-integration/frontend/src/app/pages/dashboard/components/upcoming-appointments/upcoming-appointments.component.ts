import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment } from '../../../../models/appointment.model';

@Component({
  selector: 'app-upcoming-appointments',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="appointments-card">
      <!-- Header -->
      <div class="card-header">
        <h3 class="card-title">Upcoming Appointments</h3>
        <button class="view-all-btn" (click)="viewAll.emit()">
          View All <span class="arrow">→</span>
        </button>
      </div>

      <!-- List -->
      <div class="appointment-list">
        @for (item of appointments(); track item.id) {
          <div class="appointment-row">
            <div class="patient-profile">
              <img [src]="item.avatarUrl" [alt]="item.patientName" class="patient-avatar"
                   (error)="useFallbackImg($event, item.species)" />
              <div class="patient-text">
                <span class="patient-name">{{ item.patientName }}</span>
                <span class="patient-breed">{{ item.breed }}</span>
              </div>
            </div>

            <div class="appointment-time">
              {{ item.time }}
            </div>

            <div class="appointment-action">
              @if (item.status === 'CHECKED_IN') {
                <span class="checked-in-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Checked In
                </span>
              } @else {
                <button class="check-in-btn" (click)="onCheckIn(item.id)">
                  Check In
                </button>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .appointments-card {
      background: #ffffff;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
      border: 1px solid #f1f5f9;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .card-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .view-all-btn {
      background: none;
      border: none;
      color: #059669;
      font-size: 0.825rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: gap 0.2s ease, color 0.2s ease;

      &:hover {
        color: #047857;
        gap: 7px;
      }
    }

    .appointment-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .appointment-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-radius: 16px;
      background: #f8fafc;
      transition: all 0.2s ease;

      &:hover {
        background: #f1f5f9;
        transform: translateX(3px);
      }
    }

    .patient-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .patient-avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .patient-text {
      display: flex;
      flex-direction: column;
    }

    .patient-name {
      font-size: 0.95rem;
      font-weight: 700;
      color: #1e293b;
    }

    .patient-breed {
      font-size: 0.775rem;
      color: #64748b;
    }

    .appointment-time {
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
      padding: 0 16px;
    }

    .check-in-btn {
      background: #10b981;
      color: #ffffff;
      border: none;
      border-radius: 9999px;
      padding: 7px 18px;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
      transition: all 0.2s ease;

      &:hover {
        background: #059669;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
      }
    }

    .checked-in-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: #d1fae5;
      color: #065f46;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 9999px;

      svg {
        width: 14px;
        height: 14px;
      }
    }
  `]
})
export class UpcomingAppointmentsComponent {
  appointments = input.required<Appointment[]>();
  checkIn = output<number>();
  viewAll = output<void>();

  onCheckIn(id: number): void {
    this.checkIn.emit(id);
  }

  useFallbackImg(event: Event, species: string): void {
    const img = event.target as HTMLImageElement;
    img.src = species.toLowerCase().includes('chat') 
      ? 'assets/images/milo-avatar.png'
      : 'assets/images/bella-avatar.png';
  }
}

