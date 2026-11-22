import { computed, Injectable, signal } from '@angular/core';
import { CATEGORY_LABELS, Coordinates, ReportSummary, STATUS_LABELS } from '../core/models';

export type MapTab = 'map' | 'mine' | 'nearby';

/** Recherche de la barre du haut : numero, espece, categorie ou statut. */
export function matchesSearch(report: ReportSummary, search: string): boolean {
  const text = search.trim().toLowerCase();
  return (
    !text ||
    `#${report.id} ${report.species} ${CATEGORY_LABELS[report.category]} ${STATUS_LABELS[report.status]}`
      .toLowerCase()
      .includes(text)
  );
}

export interface Toast {
  kind: 'success' | 'error';
  text: string;
  /** RM02 : lien vers le signalement deja existant. */
  openReportId?: number;
}

/** Tunis : centre par defaut tant qu'aucune position n'est connue. */
export const DEFAULT_CENTER: Coordinates = { lat: 36.8065, lng: 10.1815 };

const TOAST_DURATION_MS = 7000;

/** Etat partage entre le formulaire, la carte, les listes et le panneau de detail. */
@Injectable({ providedIn: 'root' })
export class HelpAnimalStore {
  /** Incremente pour recharger toutes les listes. */
  readonly refreshTick = signal(0);
  readonly search = signal('');
  readonly activeTab = signal<MapTab>('map');
  readonly selectedReportId = signal<number | null>(null);

  /** Position choisie pour un nouveau signalement. */
  readonly pickedPosition = signal<Coordinates | null>(null);
  /** Signalement en cours de deplacement sur la carte (US20). */
  readonly relocatingReportId = signal<number | null>(null);
  /** Demande a la carte de se centrer sur ce point. */
  readonly focusRequest = signal<Coordinates | null>(null);

  readonly mapCenter = signal<Coordinates>(DEFAULT_CENTER);
  readonly userPosition = signal<Coordinates | null>(null);
  /** Point de reference des distances affichees. */
  readonly referencePosition = computed(() => this.userPosition() ?? this.mapCenter());

  readonly toast = signal<Toast | null>(null);
  private toastTimer?: ReturnType<typeof setTimeout>;

  refresh(): void {
    this.refreshTick.update((tick) => tick + 1);
  }

  showToast(toast: Toast): void {
    clearTimeout(this.toastTimer);
    this.toast.set(toast);
    this.toastTimer = setTimeout(() => this.toast.set(null), TOAST_DURATION_MS);
  }

  /** Demande la position GPS du navigateur. Renvoie null si elle est indisponible. */
  locateUser(): Promise<Coordinates | null> {
    return new Promise((resolve) => {
      const fail = () => {
        this.showToast({
          kind: 'error',
          text: 'Position indisponible : autorisez la localisation ou cliquez sur la carte.',
        });
        resolve(null);
      };
      if (!navigator.geolocation) {
        fail();
        return;
      }
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const position = { lat: coords.latitude, lng: coords.longitude };
          this.userPosition.set(position);
          this.focusRequest.set(position);
          resolve(position);
        },
        fail,
        { enableHighAccuracy: true, timeout: 10_000 },
      );
    });
  }
}
