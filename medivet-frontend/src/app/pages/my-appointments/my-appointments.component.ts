import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { VetService } from '../../services/vet.service';
import { AppointmentResponse, AppointmentStatus } from '../../models/appointment.model';
import { Slot } from '../../models/slot.model';
import { APP_CONFIG } from '../../config/app-config';

type FilterStatus = AppointmentStatus | 'ALL';

@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './my-appointments.component.html',
  styleUrls: ['./my-appointments.component.scss']
})
export class MyAppointmentsComponent implements OnInit {

  /**
   * TODO (US01): replace APP_CONFIG.currentUserId with AuthService.getCurrentUserId()
   * once the authentication module (Engineer 1) is integrated.
   */
  readonly ownerId = APP_CONFIG.currentUserId;

  // ── Data ─────────────────────────────────────────────────────────────────
  appointments: AppointmentResponse[] = [];
  filteredAppointments: AppointmentResponse[] = [];
  loading = false;
  errorMsg = '';
  successMsg = '';

  // ── Filter ────────────────────────────────────────────────────────────────
  filterStatus: FilterStatus = 'ALL';

  // ── Cancel confirmation dialog ────────────────────────────────────────────
  confirmCancelId: number | null = null;

  // ── Reschedule panel ──────────────────────────────────────────────────────
  reschedulingId: number | null = null;
  availableSlots: Slot[] = [];
  selectedNewSlotId: number | null = null;
  rescheduleDate = '';
  slotsLoading = false;
  rescheduleError = '';

  // ── Notes edit panel ──────────────────────────────────────────────────────
  editingNotesId: number | null = null;
  editNotes = '';

  constructor(private vetService: VetService) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  // ── Load ──────────────────────────────────────────────────────────────────

  loadAppointments(): void {
    this.loading = true;
    this.errorMsg = '';

    this.vetService.getAppointmentsByOwner(this.ownerId).subscribe({
      next: appts => {
        // Sort: upcoming first, then by date
        this.appointments = appts.sort((a, b) =>
          a.slotStartTime.localeCompare(b.slotStartTime));
        this.applyFilter();
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.errorMsg = err.status === 0
          ? 'Cannot reach the server.'
          : `Error ${err.status}: ${err.error?.message || 'Failed to load appointments.'}`;
      }
    });
  }

  applyFilter(): void {
    this.filteredAppointments = this.filterStatus === 'ALL'
      ? this.appointments
      : this.appointments.filter(a => a.status === this.filterStatus);
  }

  setFilter(status: FilterStatus): void {
    this.filterStatus = status;
    this.applyFilter();
  }

  // ── Cancel ────────────────────────────────────────────────────────────────

  askCancel(id: number): void {
    this.confirmCancelId = id;
  }

  dismissCancel(): void {
    this.confirmCancelId = null;
  }

  confirmCancel(): void {
    if (this.confirmCancelId === null) return;
    const id = this.confirmCancelId;
    this.confirmCancelId = null;

    this.vetService.cancelAppointment(id).subscribe({
      next: () => {
        this.showSuccess('Appointment cancelled. A notification has been sent (US17).');
        this.loadAppointments();
      },
      error: err => {
        this.errorMsg = err.error?.message || 'Failed to cancel appointment.';
      }
    });
  }

  // ── Reschedule ────────────────────────────────────────────────────────────

  startReschedule(appt: AppointmentResponse): void {
    this.reschedulingId = appt.id;
    this.selectedNewSlotId = null;
    this.rescheduleError = '';
    // Default to current appointment date
    this.rescheduleDate = appt.slotStartTime.substring(0, 10);
    this.loadAvailableSlots(appt.vetId, this.rescheduleDate);
  }

  onRescheduleDateChange(appt: AppointmentResponse): void {
    if (!this.rescheduleDate) return;
    this.selectedNewSlotId = null;
    this.loadAvailableSlots(appt.vetId, this.rescheduleDate);
  }

  private loadAvailableSlots(vetId: number, date: string): void {
    this.slotsLoading = true;
    this.availableSlots = [];

    this.vetService.getAvailableSlots(vetId, date).subscribe({
      next: slots => {
        this.availableSlots = slots;
        this.slotsLoading = false;
      },
      error: () => {
        this.slotsLoading = false;
        this.rescheduleError = 'Failed to load available slots.';
      }
    });
  }

  submitReschedule(apptId: number): void {
    if (!this.selectedNewSlotId) {
      this.rescheduleError = 'Please select a new slot.';
      return;
    }

    this.vetService.modifyAppointment(apptId, { newSlotId: this.selectedNewSlotId }).subscribe({
      next: () => {
        this.reschedulingId = null;
        this.showSuccess('Appointment rescheduled. A notification has been sent (US17).');
        this.loadAppointments();
      },
      error: err => {
        this.rescheduleError = err.error?.message || 'Failed to reschedule appointment.';
      }
    });
  }

  cancelReschedule(): void {
    this.reschedulingId = null;
    this.availableSlots = [];
    this.rescheduleError = '';
  }

  // ── Notes update ──────────────────────────────────────────────────────────

  startEditNotes(appt: AppointmentResponse): void {
    this.editingNotesId = appt.id;
    this.editNotes = appt.notes ?? '';
  }

  submitNotes(apptId: number): void {
    this.vetService.modifyAppointment(apptId, { notes: this.editNotes }).subscribe({
      next: () => {
        this.editingNotesId = null;
        this.showSuccess('Notes updated. A notification has been sent (US17).');
        this.loadAppointments();
      },
      error: err => {
        this.errorMsg = err.error?.message || 'Failed to update notes.';
      }
    });
  }

  cancelEditNotes(): void {
    this.editingNotesId = null;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  formatDateTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  formatTime(iso: string): string {
    return iso.substring(11, 16);
  }

  statusLabel(status: AppointmentStatus): string {
    const map: Record<AppointmentStatus, string> = {
      PENDING:       'Pending',
      CONFIRMED:     'Confirmed',
      CANCELLED:     'Cancelled',
      LATE_CANCELLED:'Late Cancel',
      COMPLETED:     'Completed'
    };
    return map[status] ?? status;
  }

  statusClass(status: AppointmentStatus): string {
    const map: Record<AppointmentStatus, string> = {
      PENDING:       'badge-pending',
      CONFIRMED:     'badge-confirmed',
      CANCELLED:     'badge-cancelled',
      LATE_CANCELLED:'badge-late',
      COMPLETED:     'badge-completed'
    };
    return map[status] ?? '';
  }

  isModifiable(appt: AppointmentResponse): boolean {
    return appt.status === 'CONFIRMED' || appt.status === 'PENDING';
  }

  get counts(): Record<string, number> {
    return {
      ALL:           this.appointments.length,
      CONFIRMED:     this.appointments.filter(a => a.status === 'CONFIRMED').length,
      PENDING:       this.appointments.filter(a => a.status === 'PENDING').length,
      CANCELLED:     this.appointments.filter(a =>
                       a.status === 'CANCELLED' || a.status === 'LATE_CANCELLED').length,
      COMPLETED:     this.appointments.filter(a => a.status === 'COMPLETED').length,
    };
  }

  dismissError(): void { this.errorMsg = ''; }

  private showSuccess(msg: string): void {
    this.successMsg = msg;
    setTimeout(() => this.successMsg = '', 4000);
  }
}
