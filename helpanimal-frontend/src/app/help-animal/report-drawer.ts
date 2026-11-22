import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, Observable, of, switchMap } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { CATEGORY_LABELS, ReportDetail, ReportStatus, STATUS_LABELS } from '../core/models';
import { availableActions } from '../core/report-actions';
import { apiErrorMessage, ReportService } from '../core/report.service';
import { Icon } from '../shared/icon';
import { HelpAnimalStore } from './help-animal.store';

const LIFECYCLE: ReportStatus[] = ['NOUVEAU', 'QUALIFIE', 'ATTRIBUE', 'EN_COURS', 'TERMINE'];

/** US23, US24, US25 : detail, suivi du sauvetage et actions selon le role. */
@Component({
  selector: 'app-report-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, Icon],
  templateUrl: './report-drawer.html',
  styleUrl: './report-drawer.css',
})
export class ReportDrawer {
  private readonly store = inject(HelpAnimalStore);
  private readonly auth = inject(AuthService);
  private readonly reportService = inject(ReportService);

  protected readonly categoryLabels = CATEGORY_LABELS;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly lifecycle = LIFECYCLE;

  protected readonly selectedId = this.store.selectedReportId;
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Rejet et masquage demandent un motif avant confirmation. */
  protected readonly reasonFor = signal<'reject' | 'hide' | null>(null);
  protected readonly reason = signal('');

  private readonly loaded = toSignal(
    toObservable(
      computed(() => ({
        id: this.selectedId(),
        tick: this.store.refreshTick(),
        token: this.auth.session()?.token,
      })),
    ).pipe(
      switchMap(({ id }) =>
        id === null
          ? of(null)
          : this.reportService.get(id).pipe(
              catchError((error) => {
                this.store.showToast({ kind: 'error', text: apiErrorMessage(error) });
                this.close();
                return of(null);
              }),
            ),
      ),
    ),
    { initialValue: null as ReportDetail | null },
  );

  protected readonly report = computed(() => {
    const report = this.loaded();
    return report?.id === this.selectedId() ? report : null;
  });

  protected readonly actions = computed(() => {
    const report = this.report();
    return report ? availableActions(report, this.auth.session()) : null;
  });

  protected readonly currentStep = computed(() => {
    const status = this.report()?.status;
    return status ? LIFECYCLE.indexOf(status) : -1;
  });

  @HostListener('document:keydown.escape')
  protected close(): void {
    this.selectedId.set(null);
    this.error.set(null);
    this.cancelReason();
  }

  protected setStatus(report: ReportDetail, status: ReportStatus, comment: string): void {
    this.run(
      this.reportService.changeStatus(report.id, status, comment),
      `Statut : ${STATUS_LABELS[status]}.`,
    );
  }

  protected accept(report: ReportDetail): void {
    this.run(this.reportService.accept(report.id), 'Mission acceptée.');
  }

  protected startRelocation(report: ReportDetail): void {
    this.store.relocatingReportId.set(report.id);
    this.store.activeTab.set('map');
    this.store.focusRequest.set({ lat: report.latitude, lng: report.longitude });
    this.close();
  }

  protected confirmReason(report: ReportDetail): void {
    const reason = this.reason().trim();
    if (!reason) {
      this.error.set('Le motif est obligatoire.');
      return;
    }
    if (this.reasonFor() === 'hide') {
      this.run(
        this.reportService.hide(report.id, reason),
        `Signalement #${report.id} masqué.`,
        true,
      );
    } else {
      this.setStatus(report, 'REJETE', reason);
    }
  }

  protected cancelReason(): void {
    this.reasonFor.set(null);
    this.reason.set('');
  }

  private run(action: Observable<ReportDetail>, success: string, closeAfter = false): void {
    this.busy.set(true);
    this.error.set(null);
    action.subscribe({
      next: () => {
        this.busy.set(false);
        this.cancelReason();
        this.store.showToast({ kind: 'success', text: success });
        if (closeAfter) this.close();
        this.store.refresh();
      },
      error: (error) => {
        this.busy.set(false);
        this.error.set(apiErrorMessage(error));
        this.store.refresh(); // L'etat a pu changer (mission prise par un autre intervenant)
      },
    });
  }
}
