import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VetService } from '../../services/vet.service';
import { WaitingListEntry, WaitingListStatus } from '../../models/waiting-list.model';
import { APP_CONFIG } from '../../config/app-config';

@Component({
  selector: 'app-waiting-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './waiting-list.component.html',
  styleUrls: ['./waiting-list.component.scss']
})
export class WaitingListComponent implements OnInit, OnDestroy {

  /**
   * TODO (US01): replace APP_CONFIG.currentUserId with AuthService.getCurrentUserId()
   */
  readonly ownerId = APP_CONFIG.currentUserId;

  // ── Data ─────────────────────────────────────────────────────────────────
  entries: WaitingListEntry[] = [];
  loading = false;
  errorMsg = '';
  successMsg = '';

  // ── Countdown timer (refreshes countdown display every 30 s) ─────────────
  private timerRef: ReturnType<typeof setInterval> | null = null;
  now = new Date();

  constructor(private vetService: VetService) {}

  ngOnInit(): void {
    this.loadEntries();
    // Refresh "time remaining" display every 30 seconds
    this.timerRef = setInterval(() => { this.now = new Date(); }, 30_000);
  }

  ngOnDestroy(): void {
    if (this.timerRef) clearInterval(this.timerRef);
  }

  // ── Load ──────────────────────────────────────────────────────────────────

  loadEntries(): void {
    this.loading = true;
    this.errorMsg = '';

    this.vetService.getWaitingListByOwner(this.ownerId).subscribe({
      next: entries => {
        // Sort: OFFERED first (urgent), then by registeredAt desc
        this.entries = entries.sort((a, b) => {
          if (a.status === 'OFFERED' && b.status !== 'OFFERED') return -1;
          if (b.status === 'OFFERED' && a.status !== 'OFFERED') return  1;
          return b.registeredAt.localeCompare(a.registeredAt);
        });
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.errorMsg = err.status === 0
          ? 'Cannot reach the server.'
          : `Error ${err.status}: ${err.error?.message || 'Failed to load waiting list.'}`;
      }
    });
  }

  // ── Accept offer ──────────────────────────────────────────────────────────

  /**
   * Accepts the slot offer (RM08 — 30-min window).
   * The backend creates a real Appointment + marks slot BOOKED + fires US17 notification.
   */
  acceptOffer(entry: WaitingListEntry): void {
    this.vetService.acceptWaitingListOffer(entry.id).subscribe({
      next: () => {
        this.showSuccess(
          `Offer accepted! Your appointment with ${entry.vetFullName} is now CONFIRMED. ` +
          `A notification has been sent (US17).`
        );
        this.loadEntries();
      },
      error: err => {
        this.errorMsg = err.error?.message
          || (err.status === 422 ? 'The offer has expired or the slot is no longer available.'
                                  : 'Failed to accept the offer.');
      }
    });
  }

  // ── Cancel entry ──────────────────────────────────────────────────────────

  cancelEntry(entry: WaitingListEntry): void {
    this.vetService.cancelWaitingListEntry(entry.id).subscribe({
      next: () => {
        this.showSuccess('Waiting-list entry cancelled.');
        this.loadEntries();
      },
      error: err => {
        this.errorMsg = err.error?.message || 'Failed to cancel entry.';
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  statusLabel(status: WaitingListStatus): string {
    const map: Record<WaitingListStatus, string> = {
      WAITING:   'Waiting',
      OFFERED:   'Offer Available!',
      ACCEPTED:  'Accepted',
      EXPIRED:   'Expired',
      CANCELLED: 'Cancelled'
    };
    return map[status];
  }

  statusClass(status: WaitingListStatus): string {
    const map: Record<WaitingListStatus, string> = {
      WAITING:   'badge-waiting',
      OFFERED:   'badge-offered',
      ACCEPTED:  'badge-accepted',
      EXPIRED:   'badge-expired',
      CANCELLED: 'badge-cancelled'
    };
    return map[status];
  }

  /**
   * Returns the minutes remaining in the 30-min offer window.
   * Returns null if no expiry or if already expired.
   */
  minutesRemaining(entry: WaitingListEntry): number | null {
    if (entry.status !== 'OFFERED' || !entry.offerExpiresAt) return null;
    const diff = new Date(entry.offerExpiresAt).getTime() - this.now.getTime();
    return diff > 0 ? Math.ceil(diff / 60_000) : 0;
  }

  isOfferExpired(entry: WaitingListEntry): boolean {
    if (!entry.offerExpiresAt) return false;
    return new Date(entry.offerExpiresAt) <= this.now;
  }

  isActionable(entry: WaitingListEntry): boolean {
    return entry.status === 'WAITING' || entry.status === 'OFFERED';
  }

  formatDateTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  dismissError(): void { this.errorMsg = ''; }

  private showSuccess(msg: string): void {
    this.successMsg = msg;
    setTimeout(() => this.successMsg = '', 4500);
  }
}
