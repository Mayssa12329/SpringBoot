import { ChangeDetectionStrategy, Component, DestroyRef, inject, viewChild } from '@angular/core';
import { Icon, PAW_PATHS, PIN_PATH } from '../shared/icon';
import { HelpAnimalStore } from './help-animal.store';
import { MapPanel } from './map-panel';
import { RecentReports } from './recent-reports';
import { ReportDrawer } from './report-drawer';
import { ReportForm } from './report-form';

const REFRESH_INTERVAL_MS = 30_000;

/** Page HelpAnimal : bandeau, formulaire, carte, signalements recents. */
@Component({
  selector: 'app-help-animal-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, MapPanel, RecentReports, ReportDrawer, ReportForm],
  template: `
    <section class="hero">
      <div class="hero-text">
        <svg class="hero-pin" viewBox="0 0 36 46" aria-hidden="true">
          <path [attr.d]="pinPath" fill="#0e6f52" />
          <circle cx="18" cy="18" r="13" fill="#fff" />
          <g fill="#0e6f52" transform="translate(7.5 6) scale(.88)">
            @for (d of pawPaths; track d) {
              <path [attr.d]="d" />
            }
          </g>
        </svg>
        <div>
          <h1>HelpAnimal</h1>
          <p class="subtitle">Signalement d'animaux en détresse</p>
          <p>Ensemble, sauvons des vies</p>
          <button type="button" class="btn btn-primary" (click)="form()?.focus()">
            <app-icon name="megaphone" [size]="20" /> Signaler un animal
            <app-icon name="arrow" [size]="18" />
          </button>
        </div>
      </div>
      <img class="hero-pets" src="images/hero-pets.webp" alt="Un chien et un chat côte à côte" />
      <p class="tagline">Chaque signalement<br />fait la différence</p>
    </section>

    <div class="grid">
      <app-report-form />
      <app-map-panel />
      <app-recent-reports />
    </div>

    <app-report-drawer />

    @if (store.toast(); as toast) {
      <div class="toast" [class.error]="toast.kind === 'error'" role="status">
        <span>{{ toast.text }}</span>
        @if (toast.openReportId; as id) {
          <button type="button" (click)="store.selectedReportId.set(id); store.toast.set(null)">
            Voir #{{ id }}
          </button>
        }
        <button type="button" aria-label="Fermer" (click)="store.toast.set(null)">
          <app-icon name="close" [size]="16" />
        </button>
      </div>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .hero {
      position: relative;
      display: flex;
      justify-content: space-between;
      min-height: 215px;
      overflow: hidden;
      border-radius: 28px;
      background: linear-gradient(100deg, #d4f2e0, #c9eed8 55%, #d9f4e3);
    }
    .hero-text {
      flex: none;
      display: flex;
      gap: 22px;
      padding: 18px 26px;
      align-items: flex-start;
    }
    .hero-pin {
      flex: none;
      width: 92px;
      height: 118px;
    }
    h1 {
      font-size: 50px;
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -0.02em;
    }
    .subtitle {
      font-size: 20px;
      font-weight: 700;
    }
    .hero-text p:not(.subtitle) {
      font-size: 18px;
      margin-bottom: 10px;
    }
    .hero-text .btn {
      padding: 11px 20px;
      font-size: 15px;
      background: var(--green-900);
    }
    /* Occupe la place laissee par le texte : l'image ne peut pas le recouvrir */
    .hero-pets {
      flex: 1 1 0;
      align-self: flex-end;
      min-width: 0;
      max-width: 470px;
      height: 215px;
      margin-left: auto;
      margin-right: 240px; /* Place reservee a la phrase manuscrite */
      object-fit: cover;
      object-position: 65% bottom;
      -webkit-mask-image: linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent);
      mask-image: linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent);
    }
    .tagline {
      position: absolute;
      right: 26px;
      top: 50%;
      transform: translateY(-50%) rotate(-7deg);
      font-family: 'Caveat', cursive;
      font-size: 30px;
      line-height: 1.15;
      text-align: center;
      color: var(--green-900);
    }
    .grid {
      display: grid;
      align-items: stretch;
      gap: 16px;
      grid-template-columns: minmax(380px, 450px) minmax(380px, 1fr) minmax(340px, 390px);
    }
    .toast {
      position: fixed;
      left: 50%;
      bottom: 22px;
      z-index: 2100;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: min(560px, calc(100% - 32px));
      padding: 12px 16px;
      border-radius: 14px;
      background: var(--green-900);
      color: #fff;
      font-weight: 600;
      box-shadow: var(--shadow);
    }
    .toast.error {
      background: #a4262c;
    }
    .toast button {
      display: inline-flex;
      padding: 0;
      border: 0;
      background: none;
      color: inherit;
      font-weight: 800;
      text-decoration: underline;
    }

    @media (max-width: 1450px) {
      .grid {
        grid-template-columns: minmax(360px, 430px) minmax(0, 1fr);
      }
      app-recent-reports {
        grid-column: 1 / -1;
        flex-direction: row;
      }
      .tagline {
        display: none;
      }
      .hero-pets {
        margin-right: 0;
      }
    }
    @media (max-width: 900px) {
      .grid {
        grid-template-columns: minmax(0, 1fr);
      }
      app-recent-reports {
        flex-direction: column;
      }
      .hero-pets {
        display: none;
      }
      .hero-pin {
        width: 60px;
        height: 77px;
      }
      h1 {
        font-size: 34px;
      }
      .subtitle {
        font-size: 16px;
      }
      .hero-text {
        flex: 1 1 auto;
        min-width: 0;
        padding: 16px;
        gap: 12px;
      }
    }
  `,
})
export class HelpAnimalPage {
  protected readonly store = inject(HelpAnimalStore);
  protected readonly form = viewChild(ReportForm);
  protected readonly pinPath = PIN_PATH;
  protected readonly pawPaths = PAW_PATHS;

  constructor() {
    // Statuts, priorites et nouveaux signalements restent a jour sans recharger la page
    const timer = setInterval(() => {
      if (!document.hidden) this.store.refresh();
    }, REFRESH_INTERVAL_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
