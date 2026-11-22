import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VetService } from '../../services/vet.service';
import { Slot, SlotStatus } from '../../models/slot.model';
import { APP_CONFIG } from '../../config/app-config';

interface SlotGroup {
  date: string;       // "2026-11-10"
  label: string;      // "Monday 10 November 2026"
  slots: Slot[];
}

@Component({
  selector: 'app-vet-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vet-dashboard.component.html',
  styleUrls: ['./vet-dashboard.component.scss']
})
export class VetDashboardComponent implements OnInit {

  /**
   * TODO (US01): replace APP_CONFIG.currentVetId with AuthService.getCurrentVetId()
   * once the authentication module (Engineer 1) is integrated.
   */
  readonly vetId = APP_CONFIG.currentVetId;

  // ── Data ─────────────────────────────────────────────────────────────────
  slots: Slot[] = [];
  slotGroups: SlotGroup[] = [];
  loading = false;
  errorMsg = '';
  successMsg = '';

  // ── Status filter ─────────────────────────────────────────────────────────
  filterStatus: SlotStatus | 'ALL' = 'ALL';

  // ── New slot form ─────────────────────────────────────────────────────────
  showAddForm = false;
  newStartDate = '';   // "2026-11-10"
  newStartTime = '';   // "09:00"
  newEndTime   = '';   // "09:30"
  formError    = '';

  constructor(private vetService: VetService) {}

  ngOnInit(): void {
    this.loadSlots();
  }

  // ── Load & group ──────────────────────────────────────────────────────────

  loadSlots(): void {
    this.loading = true;
    this.errorMsg = '';

    this.vetService.getAllSlots(this.vetId).subscribe({
      next: slots => {
        this.slots = slots;
        this.buildGroups();
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.errorMsg = err.status === 0
          ? 'Cannot reach the server.'
          : `Error ${err.status}: ${err.error?.message || 'Failed to load slots.'}`;
      }
    });
  }

  buildGroups(): void {
    const filtered = this.filterStatus === 'ALL'
      ? this.slots
      : this.slots.filter(s => s.status === this.filterStatus);

    // Group by date (YYYY-MM-DD extracted from ISO startTime)
    const map = new Map<string, Slot[]>();
    filtered.forEach(slot => {
      const dateKey = slot.startTime.substring(0, 10);
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(slot);
    });

    // Sort groups by date, sort slots within each group by startTime
    this.slotGroups = Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, slots]) => ({
        date,
        label: this.formatDateLabel(date),
        slots: slots.sort((a, b) => a.startTime.localeCompare(b.startTime))
      }));
  }

  setFilter(status: SlotStatus | 'ALL'): void {
    this.filterStatus = status;
    this.buildGroups();
  }

  // ── Add slot ──────────────────────────────────────────────────────────────

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    this.formError = '';
    if (this.showAddForm) {
      // Default: tomorrow 09:00–09:30
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      this.newStartDate = this.formatDate(tomorrow);
      this.newStartTime = '09:00';
      this.newEndTime   = '09:30';
    }
  }

  submitNewSlot(): void {
    this.formError = '';

    if (!this.newStartDate || !this.newStartTime || !this.newEndTime) {
      this.formError = 'All fields are required.';
      return;
    }

    const startISO = `${this.newStartDate}T${this.newStartTime}:00`;
    const endISO   = `${this.newStartDate}T${this.newEndTime}:00`;

    if (endISO <= startISO) {
      this.formError = 'End time must be after start time.';
      return;
    }

    this.vetService.createSlot(this.vetId, { startTime: startISO, endTime: endISO }).subscribe({
      next: () => {
        this.showAddForm = false;
        this.showSuccess('Slot created successfully.');
        this.loadSlots();
      },
      error: err => {
        this.formError = err.error?.message || 'Failed to create slot.';
      }
    });
  }

  // ── Block / open ──────────────────────────────────────────────────────────

  blockSlot(slot: Slot): void {
    if (slot.status === 'BOOKED') return; // guard — button should be hidden
    this.vetService.blockSlot(slot.id).subscribe({
      next: () => {
        this.showSuccess(`Slot ${this.formatTime(slot.startTime)} blocked.`);
        this.loadSlots();
      },
      error: err => {
        this.errorMsg = err.error?.message || 'Failed to block slot.';
      }
    });
  }

  openSlot(slot: Slot): void {
    this.vetService.openSlot(slot.id).subscribe({
      next: () => {
        this.showSuccess(`Slot ${this.formatTime(slot.startTime)} re-opened.`);
        this.loadSlots();
      },
      error: err => {
        this.errorMsg = err.error?.message || 'Failed to open slot.';
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  formatTime(iso: string): string {
    return iso.substring(11, 16);
  }

  formatDateLabel(dateKey: string): string {
    const d = new Date(dateKey + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  statusLabel(status: SlotStatus): string {
    const map: Record<SlotStatus, string> = {
      AVAILABLE: 'Available',
      BOOKED:    'Booked',
      BLOCKED:   'Blocked'
    };
    return map[status];
  }

  statusClass(status: SlotStatus): string {
    const map: Record<SlotStatus, string> = {
      AVAILABLE: 'badge-available',
      BOOKED:    'badge-booked',
      BLOCKED:   'badge-blocked'
    };
    return map[status];
  }

  get slotCounts(): Record<string, number> {
    return {
      ALL:       this.slots.length,
      AVAILABLE: this.slots.filter(s => s.status === 'AVAILABLE').length,
      BOOKED:    this.slots.filter(s => s.status === 'BOOKED').length,
      BLOCKED:   this.slots.filter(s => s.status === 'BLOCKED').length,
    };
  }

  private showSuccess(msg: string): void {
    this.successMsg = msg;
    setTimeout(() => this.successMsg = '', 3500);
  }

  dismissError(): void { this.errorMsg = ''; }
}
