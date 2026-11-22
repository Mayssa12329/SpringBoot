import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import * as L from 'leaflet';
import { distanceMeters, formatDistance, timeAgo } from '../core/geo';
import { CATEGORY_LABELS, Coordinates, ReportStatus, ReportSummary } from '../core/models';
import { PAW_PATHS, PIN_PATH } from '../shared/icon';
import { HelpAnimalStore } from './help-animal.store';

type PinKind = 'urgent' | 'taken' | 'closed' | 'picked';

const PIN_COLORS: Record<PinKind, string> = {
  urgent: '#e5484d',
  taken: '#0e6f52',
  closed: '#8a9a93',
  picked: '#2f7fd6',
};

const PAW = `<g transform="translate(8 6) scale(.84)">${PAW_PATHS.map((d) => `<path d="${d}"/>`).join('')}</g>`;
const EXCLAMATION = '<path d="M16.2 9h3.6l-.6 11h-2.4zM18 22a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/>';

function createPin(kind: PinKind): L.DivIcon {
  const color = PIN_COLORS[kind];
  const glyph = kind === 'urgent' ? EXCLAMATION : PAW;
  return L.divIcon({
    className: 'map-pin',
    iconSize: [36, 46],
    iconAnchor: [18, 45],
    popupAnchor: [0, -42],
    html: `<svg width="36" height="46" viewBox="0 0 36 46" aria-hidden="true">
      <path d="${PIN_PATH}" fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <circle cx="18" cy="18" r="12.5" fill="#fff"/><g fill="${color}">${glyph}</g></svg>`,
  });
}

const PINS: Record<PinKind, L.DivIcon> = {
  urgent: createPin('urgent'),
  taken: createPin('taken'),
  closed: createPin('closed'),
  picked: createPin('picked'),
};

const pinKind = (status: ReportStatus): PinKind => {
  if (status === 'NOUVEAU' || status === 'QUALIFIE') return 'urgent';
  return status === 'ATTRIBUE' || status === 'EN_COURS' ? 'taken' : 'closed';
};

interface MarkerEntry {
  marker: L.Marker;
  report: ReportSummary;
}

/** Carte Leaflet (US21). Les marqueurs sont mis a jour un par un : un popup ouvert le reste. */
@Component({
  selector: 'app-report-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
})
export class ReportMap {
  readonly reports = input.required<ReportSummary[]>();
  readonly boundsChange = output<string>();
  readonly mapClick = output<Coordinates>();

  private readonly store = inject(HelpAnimalStore);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ready = signal(false);
  private readonly markers = new Map<number, MarkerEntry>();
  private map!: L.Map;
  private pickedMarker: L.Marker | null = null;
  private fittedToData = false;

  constructor() {
    afterNextRender(() => this.init());

    effect(() => {
      const reports = this.reports();
      if (this.ready()) this.syncMarkers(reports);
    });
    effect(() => {
      const picked = this.store.pickedPosition();
      if (this.ready()) this.showPicked(picked);
    });
    effect(() => {
      const focus = this.store.focusRequest();
      if (this.ready() && focus) {
        this.fittedToData = true;
        this.map.flyTo(focus, Math.max(this.map.getZoom(), 15), { duration: 0.6 });
      }
    });
  }

  private init(): void {
    const center = this.store.mapCenter();
    this.map = L.map(this.host.nativeElement, { zoomControl: false }).setView(center, 13);
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.map);

    // Ecoute apres setView : le premier chargement porte sur tous les signalements
    this.map.on('moveend', () => this.publishBounds());
    this.map.on('click', (event) =>
      this.mapClick.emit({ lat: event.latlng.lat, lng: event.latlng.lng }),
    );

    // Recalcule la taille quand l'onglet Carte revient ou que la page change de largeur.
    // Taille nulle = carte masquee par un autre onglet : la vue doit rester telle quelle.
    const resizeObserver = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0 && entry.contentRect.height > 0) this.map.invalidateSize();
    });
    resizeObserver.observe(this.host.nativeElement);

    this.destroyRef.onDestroy(() => {
      resizeObserver.disconnect();
      this.map.remove();
    });
    this.ready.set(true);
  }

  private publishBounds(): void {
    const center = this.map.getCenter();
    this.store.mapCenter.set({ lat: center.lat, lng: center.lng });
    const bounds = this.map.getBounds();
    this.boundsChange.emit(
      [bounds.getSouth(), bounds.getWest(), bounds.getNorth(), bounds.getEast()]
        .map((v) => v.toFixed(5))
        .join(','),
    );
  }

  private syncMarkers(reports: ReportSummary[]): void {
    const seen = new Set<number>();
    for (const report of reports) {
      seen.add(report.id);
      const entry = this.markers.get(report.id);
      if (entry) {
        this.updateMarker(entry, report);
      } else {
        this.markers.set(report.id, this.createMarker(report));
      }
    }
    for (const [id, entry] of this.markers) {
      if (!seen.has(id)) {
        entry.marker.remove();
        this.markers.delete(id);
      }
    }
    if (!this.fittedToData && reports.length > 0) {
      this.fittedToData = true;
      this.map.fitBounds(L.latLngBounds(reports.map((r) => [r.latitude, r.longitude])), {
        padding: [50, 50],
        maxZoom: 14,
      });
    }
  }

  private createMarker(report: ReportSummary): MarkerEntry {
    const marker = L.marker([report.latitude, report.longitude], {
      icon: PINS[pinKind(report.status)],
    });
    const entry: MarkerEntry = { marker, report };
    marker.bindPopup(() => this.buildPopup(entry.report));
    marker.addTo(this.map);
    return entry;
  }

  private updateMarker(entry: MarkerEntry, report: ReportSummary): void {
    if (entry.report.status !== report.status) entry.marker.setIcon(PINS[pinKind(report.status)]);
    if (entry.report.latitude !== report.latitude || entry.report.longitude !== report.longitude) {
      entry.marker.setLatLng([report.latitude, report.longitude]);
    }
    entry.report = report;
  }

  /** Construit le popup avec textContent : les donnees saisies ne sont jamais lues comme du HTML. */
  private buildPopup(report: ReportSummary): HTMLElement {
    const distance = distanceMeters(this.store.referencePosition(), {
      lat: report.latitude,
      lng: report.longitude,
    });
    const root = document.createElement('div');
    root.className = 'map-popup';

    const photo = document.createElement('img');
    photo.src = report.photoUrl;
    photo.alt = CATEGORY_LABELS[report.category];

    const text = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = CATEGORY_LABELS[report.category];
    const species = document.createElement('span');
    species.textContent = `${report.species} · ${formatDistance(distance)}`;
    const age = document.createElement('span');
    age.textContent = timeAgo(report.createdAt);
    const details = document.createElement('button');
    details.type = 'button';
    details.textContent = 'Voir détails →';
    details.addEventListener('click', () => this.store.selectedReportId.set(report.id));

    text.append(title, species, age, details);
    root.append(photo, text);
    return root;
  }

  private showPicked(picked: Coordinates | null): void {
    if (!picked) {
      this.pickedMarker?.remove();
      this.pickedMarker = null;
    } else if (this.pickedMarker) {
      this.pickedMarker.setLatLng(picked);
    } else {
      this.pickedMarker = L.marker(picked, { icon: PINS.picked, zIndexOffset: 1000 }).addTo(
        this.map,
      );
    }
  }
}
