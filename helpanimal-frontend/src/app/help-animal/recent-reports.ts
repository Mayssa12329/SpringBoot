import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { ReportSummary, VISIBLE_STATUSES } from '../core/models';
import { ReportService } from '../core/report.service';
import { Icon } from '../shared/icon';
import { ReportRow } from '../shared/report-row';
import { HelpAnimalStore, matchesSearch } from './help-animal.store';

const PREVIEW_SIZE = 4;

/** Signalements les plus recents, tous statuts visibles confondus. */
@Component({
  selector: 'app-recent-reports',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, ReportRow],
  template: `
    <section class="card recent">
      <header>
        <app-icon name="clock" [size]="26" />
        <h2>Signalements récents</h2>
        @if (filtered().length > previewSize) {
          <button type="button" (click)="expanded.update((v) => !v)">
            {{ expanded() ? 'Réduire' : 'Voir tout' }} <app-icon name="arrow" [size]="16" />
          </button>
        }
      </header>
      <div class="list" [class.expanded]="expanded()">
        @for (report of shown(); track report.id) {
          <app-report-row
            [report]="report"
            [reference]="store.referencePosition()"
            (opened)="store.selectedReportId.set($event)"
          />
        } @empty {
          <p class="empty">
            {{
              store.search()
                ? 'Aucun résultat pour cette recherche.'
                : 'Aucun signalement pour le moment.'
            }}
          </p>
        }
      </div>
    </section>

    <section class="help">
      <app-icon name="headset" [size]="50" />
      <div>
        <h2>Besoin d'aide ?</h2>
        <p>Notre équipe est là pour vous aider.</p>
        <button type="button" disabled title="Canal de contact à définir par l'équipe">
          Contactez-nous <app-icon name="arrow" [size]="16" />
        </button>
      </div>
      <span class="paw"><app-icon name="paw" [size]="38" /></span>
    </section>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 0;
    }
    .recent {
      flex: 1;
      padding: 16px;
    }
    header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--line);
    }
    h2 {
      font-size: 16px;
      font-weight: 800;
    }
    header h2 {
      flex: 1;
    }
    header button {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 0;
      border: 0;
      background: none;
      color: var(--green-700);
      font-weight: 700;
      font-size: 13px;
    }
    .list.expanded {
      max-height: 520px;
      overflow: auto;
    }
    .empty {
      padding: 30px 10px;
      text-align: center;
      color: var(--muted);
    }
    .help {
      position: relative;
      display: flex;
      gap: 14px;
      align-items: center;
      padding: 18px;
      border-radius: var(--radius);
      background: var(--mint-100);
      color: var(--ink);
    }
    .help > app-icon {
      color: var(--green-900);
    }
    .help p {
      font-size: 12.5px;
      margin: 2px 0 8px;
    }
    .help button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 16px;
      border-radius: 999px;
      border: 1.5px solid var(--green-700);
      background: #fff;
      color: var(--green-900);
      font-weight: 700;
      font-size: 13px;
    }
    .help button:disabled {
      opacity: 0.6;
    }
    .paw {
      position: absolute;
      right: 16px;
      bottom: 14px;
      color: var(--green-500);
    }
  `,
})
export class RecentReports {
  protected readonly store = inject(HelpAnimalStore);
  private readonly auth = inject(AuthService);
  private readonly reportService = inject(ReportService);

  protected readonly previewSize = PREVIEW_SIZE;
  protected readonly expanded = signal(false);

  private readonly reports = toSignal(
    toObservable(
      computed(() => ({ tick: this.store.refreshTick(), token: this.auth.session()?.token })),
    ).pipe(
      switchMap(({ token }) =>
        (token
          ? this.reportService.list({ statuses: VISIBLE_STATUSES })
          : of<ReportSummary[]>([])
        ).pipe(
          catchError(() => of<ReportSummary[]>([])), // L'erreur est deja signalee par la carte
        ),
      ),
    ),
    { initialValue: [] as ReportSummary[] },
  );

  protected readonly filtered = computed(() =>
    [...this.reports()]
      .filter((report) => matchesSearch(report, this.store.search()))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id),
  );

  protected readonly shown = computed(() =>
    this.expanded() ? this.filtered() : this.filtered().slice(0, PREVIEW_SIZE),
  );
}
