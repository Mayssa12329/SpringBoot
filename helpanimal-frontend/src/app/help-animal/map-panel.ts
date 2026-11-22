import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Signal,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, Observable, of, switchMap } from 'rxjs';
import { AuthService } from '../core/auth.service';
import {
  Coordinates,
  ReportStatus,
  ReportSummary,
  STATUS_LABELS,
  VISIBLE_STATUSES,
} from '../core/models';
import { apiErrorMessage, existingReportId, ReportService } from '../core/report.service';
import { Icon } from '../shared/icon';
import { ReportRow } from '../shared/report-row';
import { HelpAnimalStore, matchesSearch } from './help-animal.store';
import { ReportMap } from './report-map';

const RADIUS_OPTIONS = [1, 5, 10, 25, 50];

/** Bloc central : carte (US21), mes signalements, signalements proches (US22). */
@Component({
  selector: 'app-map-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, ReportMap, ReportRow],
  template: `
    <div class="tabs" role="tablist" aria-label="Vues des signalements">
      <button
        type="button"
        role="tab"
        [class.active]="tab() === 'map'"
        [attr.aria-selected]="tab() === 'map'"
        (click)="store.activeTab.set('map')"
      >
        <app-icon name="pin" [size]="18" /> Carte des signalements
      </button>
      <button
        type="button"
        role="tab"
        [class.active]="tab() === 'mine'"
        [attr.aria-selected]="tab() === 'mine'"
        (click)="store.activeTab.set('mine')"
      >
        <app-icon name="user" [size]="18" /> Mes signalements
      </button>
      @if (auth.canSeeNearby()) {
        <button
          type="button"
          role="tab"
          [class.active]="tab() === 'nearby'"
          [attr.aria-selected]="tab() === 'nearby'"
          (click)="store.activeTab.set('nearby')"
        >
          <app-icon name="locate" [size]="18" /> À proximité
        </button>
      }
    </div>

    <div class="map-view" [hidden]="tab() !== 'map'">
      <div class="filters">
        <label>
          <span>Statut</span>
          <select #status class="field" (change)="statusFilter.set(status.value)">
            <option value="">Actifs</option>
            @for (s of statuses; track s) {
              <option [value]="s">{{ statusLabels[s] }}</option>
            }
          </select>
        </label>
        <label>
          <span>Espèce</span>
          <input
            #species
            class="field"
            placeholder="ex. chien"
            (input)="speciesFilter.set(species.value)"
          />
        </label>
      </div>

      <div class="map-box">
        @if (store.relocatingReportId(); as id) {
          <div class="banner">
            <span>Cliquez sur la nouvelle position du signalement #{{ id }}</span>
            <button type="button" class="btn" (click)="store.relocatingReportId.set(null)">
              Annuler
            </button>
          </div>
        }
        <app-report-map
          [reports]="visibleReports()"
          (boundsChange)="bbox.set($event)"
          (mapClick)="onMapClick($event)"
        />
        <button
          type="button"
          class="locate"
          (click)="store.locateUser()"
          aria-label="Me localiser"
          title="Me localiser"
        >
          <app-icon name="locate" />
        </button>
      </div>
    </div>

    @if (tab() === 'mine') {
      <div class="list-view card">
        @for (report of visibleMine(); track report.id) {
          <app-report-row
            [report]="report"
            [reference]="store.referencePosition()"
            (opened)="store.selectedReportId.set($event)"
          />
        } @empty {
          <p class="empty">Vous n'avez encore envoyé aucun signalement.</p>
        }
      </div>
    }

    @if (tab() === 'nearby') {
      <div class="list-view card">
        <div class="filters">
          <label>
            <span>Rayon</span>
            <select #radiusSelect class="field" (change)="radiusKm.set(+radiusSelect.value)">
              @for (r of radiusOptions; track r) {
                <option [value]="r" [selected]="r === radiusKm()">{{ r }} km</option>
              }
            </select>
          </label>
          <label>
            <span>Statut</span>
            <select #nearStatus class="field" (change)="nearbyStatus.set(nearStatus.value)">
              <option value="">Actifs</option>
              @for (s of statuses; track s) {
                <option [value]="s">{{ statusLabels[s] }}</option>
              }
            </select>
          </label>
        </div>
        <p class="hint">
          Distances mesurées depuis
          {{ store.userPosition() ? 'votre position' : 'le centre de la carte' }}.
          @if (!store.userPosition()) {
            <button type="button" class="link" (click)="store.locateUser()">
              Utiliser ma position
            </button>
          }
        </p>
        @for (report of visibleNearby(); track report.id) {
          <app-report-row
            [report]="report"
            [reference]="store.referencePosition()"
            (opened)="store.selectedReportId.set($event)"
          />
        } @empty {
          <p class="empty">Aucun signalement dans ce rayon.</p>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 0;
    }
    .tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .tabs button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border: 0;
      border-radius: 14px;
      background: #eef4f0;
      font-weight: 700;
      font-size: 13px;
    }
    .tabs button.active {
      background: var(--green-700);
      color: #fff;
    }
    .map-view {
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex: 1;
    }
    .map-view[hidden] {
      display: none;
    }
    .filters {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .filters span {
      display: block;
      font-size: 12px;
      font-weight: 700;
      color: var(--muted);
      margin-bottom: 3px;
    }
    .filters .field {
      padding: 7px 10px;
    }
    .map-box {
      position: relative;
      flex: 1;
      min-height: 480px;
      border-radius: var(--radius);
      overflow: hidden;
      box-shadow: var(--shadow);
      isolation: isolate;
    }
    app-report-map {
      position: absolute;
      inset: 0;
    }
    .locate {
      position: absolute;
      right: 10px;
      bottom: 90px;
      z-index: 500;
      width: 36px;
      height: 36px;
      display: grid;
      place-items: center;
      border: 0;
      border-radius: 50%;
      background: #fff;
      box-shadow: var(--shadow);
      color: var(--green-900);
    }
    .banner {
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      z-index: 600;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 8px 8px 8px 14px;
      border-radius: 14px;
      background: var(--green-900);
      color: #fff;
      font-weight: 600;
    }
    .list-view {
      flex: 1;
      min-height: 480px;
      padding: 14px;
      overflow: auto;
    }
    .empty {
      padding: 40px 10px;
      text-align: center;
      color: var(--muted);
    }
    .hint {
      margin: 10px 0 4px;
      color: var(--muted);
      font-size: 12.5px;
    }
    .link {
      border: 0;
      background: none;
      padding: 0;
      color: var(--green-700);
      font-weight: 700;
      text-decoration: underline;
    }
  `,
})
export class MapPanel {
  protected readonly store = inject(HelpAnimalStore);
  protected readonly auth = inject(AuthService);
  private readonly reportService = inject(ReportService);

  protected readonly statuses = VISIBLE_STATUSES;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly radiusOptions = RADIUS_OPTIONS;
  protected readonly tab = this.store.activeTab;

  protected readonly statusFilter = signal('');
  protected readonly speciesFilter = signal('');
  protected readonly bbox = signal<string | null>(null);
  protected readonly radiusKm = signal(5);
  protected readonly nearbyStatus = signal('');

  /** Chaque liste se recharge quand ses criteres, l'utilisateur ou refreshTick changent. */
  private readonly mapReports = this.load(
    computed(() => ({
      statuses: this.statusFilter() ? [this.statusFilter() as ReportStatus] : undefined,
      species: this.speciesFilter(),
      bbox: this.bbox(),
      ...this.reloadKey(),
    })),
    (filters) => this.reportService.list(filters),
  );

  private readonly mine = this.load(
    computed(() => ({ active: this.tab() === 'mine', ...this.reloadKey() })),
    (params) => (params.active ? this.reportService.mine() : of([])),
  );

  private readonly nearby = this.load(
    computed(() => ({
      active: this.tab() === 'nearby' && this.auth.canSeeNearby(),
      center: this.store.referencePosition(),
      radiusKm: this.radiusKm(),
      status: (this.nearbyStatus() || null) as ReportStatus | null,
      ...this.reloadKey(),
    })),
    (params) =>
      params.active
        ? this.reportService.nearby(params.center, params.radiusKm, params.status)
        : of([]),
  );

  protected readonly visibleReports = computed(() => this.filterBySearch(this.mapReports()));
  protected readonly visibleMine = computed(() => this.filterBySearch(this.mine()));
  protected readonly visibleNearby = computed(() => this.filterBySearch(this.nearby()));

  constructor() {
    // Un role qui perd l'acces aux signalements proches revient a la carte
    effect(() => {
      if (this.tab() === 'nearby' && !this.auth.canSeeNearby()) this.store.activeTab.set('map');
    });
  }

  protected onMapClick(position: Coordinates): void {
    const relocating = this.store.relocatingReportId();
    if (relocating === null) {
      this.store.pickedPosition.set(position);
      return;
    }
    this.reportService.updateLocation(relocating, position).subscribe({
      next: () => {
        this.store.relocatingReportId.set(null);
        this.store.showToast({
          kind: 'success',
          text: `Position du signalement #${relocating} corrigée.`,
        });
        this.store.refresh();
      },
      error: (error) =>
        this.store.showToast({
          kind: 'error',
          text: apiErrorMessage(error),
          openReportId: existingReportId(error) ?? undefined,
        }),
    });
  }

  private reloadKey() {
    return { tick: this.store.refreshTick(), token: this.auth.session()?.token };
  }

  private filterBySearch(reports: ReportSummary[]): ReportSummary[] {
    const text = this.store.search();
    return text ? reports.filter((report) => matchesSearch(report, text)) : reports;
  }

  private load<P>(params: Signal<P>, request: (params: P) => Observable<ReportSummary[]>) {
    return toSignal(
      toObservable(params).pipe(
        debounceTime(150),
        switchMap((value) =>
          (this.auth.session() ? request(value) : of<ReportSummary[]>([])).pipe(
            catchError((error) => {
              this.store.showToast({ kind: 'error', text: apiErrorMessage(error) });
              return of<ReportSummary[]>([]);
            }),
          ),
        ),
      ),
      { initialValue: [] as ReportSummary[] },
    );
  }
}
