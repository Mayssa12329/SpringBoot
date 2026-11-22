import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { distanceMeters, formatDistance, timeAgo } from '../core/geo';
import { CATEGORY_LABELS, Coordinates, ReportSummary, STATUS_LABELS } from '../core/models';

/** Une ligne de signalement : recents, mes signalements, signalements proches. */
@Component({
  selector: 'app-report-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="row" (click)="opened.emit(report().id)">
      <img [src]="report().photoUrl" [alt]="title()" loading="lazy" />
      <span class="text">
        <strong><i class="dot" [attr.data-category]="report().category"></i>{{ title() }}</strong>
        <small class="species">{{ report().species }} · gravité {{ report().severity }}/5</small>
        <small>{{ meta() }}</small>
      </span>
      <span class="pill" [attr.data-status]="report().status">{{ statusLabel() }}</span>
    </button>
  `,
  styles: `
    .row {
      display: grid;
      grid-template-columns: 68px 1fr auto;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 10px 6px;
      border: 0;
      border-bottom: 1px solid var(--line);
      background: none;
      text-align: left;
      border-radius: 12px;
    }
    .row:hover {
      background: var(--mint-100);
    }
    :host(:last-child) .row {
      border-bottom: 0;
    }
    img {
      width: 68px;
      height: 68px;
      object-fit: cover;
      border-radius: 14px;
      background: var(--mint-100);
    }
    .text {
      min-width: 0;
    }
    strong {
      display: block;
      font-size: 13.5px;
    }
    small {
      display: block;
      color: var(--muted);
      font-size: 12px;
      margin-top: 2px;
    }
    .species {
      text-transform: capitalize;
    }
    .dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      margin-right: 6px;
      border-radius: 50%;
      background: var(--green-500);
    }
    .dot[data-category='BLESSE'],
    .dot[data-category='MALTRAITE'] {
      background: var(--red);
    }
    .dot[data-category='ABANDONNE'],
    .dot[data-category='MALADE'] {
      background: var(--orange);
    }
    .pill {
      padding: 5px 11px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
      background: #e7f1fb;
      color: var(--blue);
    }
    .pill[data-status='NOUVEAU'] {
      background: #fdecec;
      color: #b42328;
    }
    .pill[data-status='QUALIFIE'] {
      background: #fef3dc;
      color: #a86a04;
    }
    .pill[data-status='TERMINE'] {
      background: var(--mint-200);
      color: var(--green-900);
    }
    .pill[data-status='REJETE'] {
      background: #eef1f0;
      color: var(--muted);
    }
  `,
})
export class ReportRow {
  readonly report = input.required<ReportSummary>();
  readonly reference = input.required<Coordinates>();
  readonly opened = output<number>();

  readonly title = computed(() => CATEGORY_LABELS[this.report().category]);
  readonly statusLabel = computed(() => STATUS_LABELS[this.report().status]);
  readonly meta = computed(() => {
    const report = this.report();
    const position = { lat: report.latitude, lng: report.longitude };
    const distance = report.distanceMeters ?? distanceMeters(this.reference(), position);
    return `${formatDistance(distance)} • ${timeAgo(report.createdAt)}`;
  });
}
