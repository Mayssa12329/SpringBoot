import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SearchService } from '../../services/search.service';

export interface RescueReport {
  id: number;
  titre: string;
  typeUrgence: 'Animal blessé' | 'Animal errant / danger' | 'Animal abandonné' | 'Maltraitance suspectée';
  espece: 'Chien' | 'Chat' | 'Oiseau' | 'Autre';
  localisation: string;
  description: string;
  contact: string;
  dateSignalement: string;
  priorite: 'URGENTE' | 'HAUTE' | 'NORMALE';
  statut: 'SIGNALER' | 'EN_COURS' | 'PRIS_EN_CHARGE';
  intervenant?: string;
}

@Component({
  selector: 'app-helpanimal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="help-page">
      <!-- Emergency Header -->
      <header class="help-hero">
        <div class="hero-left">
          <div class="sos-tag">
            <span class="pulse-dot"></span>
            <span>Réseau d'Urgence Animale 24/7</span>
          </div>
          <h1>HelpAnimal — <span class="highlight">Signaler & Secourir</span></h1>
          <p>
            Vous avez trouvé un animal en détresse, blessé ou égaré ? Signalez-le immédiatement pour mobiliser notre réseau de vétérinaires partenaires et bénévoles.
          </p>
          <div class="hero-btn-row">
            <button type="button" class="btn-sos-report" (click)="openReportModal()">
              <span>🚨 Signaler un animal en détresse</span>
            </button>
            <a href="tel:112" class="btn-emergency-call">
              <span>📞 SOS Urgence Vétérinaire</span>
            </a>
          </div>
        </div>

        <div class="emergency-stats-card">
          <h3>Statut du Réseau</h3>
          <div class="stat-row">
            <span class="stat-num">{{ activeReportsCount() }}</span>
            <span class="stat-label">Signalements en cours d'intervention</span>
          </div>
          <div class="stat-row">
            <span class="stat-num text-green">{{ resolvedReportsCount() }}</span>
            <span class="stat-label">Animaux pris en charge cette semaine</span>
          </div>
        </div>
      </header>

      <!-- Alert Message -->
      @if (alertMessage()) {
        <div class="help-alert" [class.success]="alertType() === 'success'" [class.error]="alertType() === 'error'">
          <span>{{ alertMessage() }}</span>
          <button (click)="alertMessage.set(null)" class="alert-close">×</button>
        </div>
      }

      <!-- Signalements Feed -->
      <section class="feed-section">
        <div class="feed-header">
          <div>
            <h2>Fil des signalements et interventions en cours</h2>
            <p class="feed-subtitle">Consultez les alertes récentes et l'avancement des secours sur le terrain</p>
          </div>
          <button type="button" class="btn-refresh" (click)="refreshFeed()">
            <span>🔄 Actualiser</span>
          </button>
        </div>

        <div class="reports-list">
          @for (rep of filteredReports(); track rep.id) {
            <article class="report-card" [class.urgent-border]="rep.priorite === 'URGENTE'">
              <div class="report-top">
                <div class="badge-group">
                  <span class="priority-pill" [class]="rep.priorite.toLowerCase()">
                    Priorité {{ rep.priorite }}
                  </span>
                  <span class="type-pill">{{ rep.typeUrgence }}</span>
                </div>
                <span class="status-pill" [class]="rep.statut.toLowerCase()">
                  @if (rep.statut === 'SIGNALER') {
                    🟡 En attente de bénévole
                  } @else if (rep.statut === 'EN_COURS') {
                    🔵 Équipe en route
                  } @else {
                    🟢 Pris en charge par vétérinaire
                  }
                </span>
              </div>

              <h3 class="report-title">{{ rep.titre }}</h3>
              <p class="report-desc">{{ rep.description }}</p>

              <div class="report-meta-row">
                <span class="meta-item">📍 {{ rep.localisation }}</span>
                <span class="meta-item">🐾 Espèce: {{ rep.espece }}</span>
                <span class="meta-item">⏱ {{ rep.dateSignalement }}</span>
                @if (rep.intervenant) {
                  <span class="meta-item text-green">👨‍⚕️ Intervenant: {{ rep.intervenant }}</span>
                }
              </div>

              <div class="report-actions">
                @if (rep.statut !== 'PRIS_EN_CHARGE') {
                  <button type="button" class="btn-help-action" (click)="takeCharge(rep)">
                    <span>✋ Je peux aider / Prendre en charge</span>
                  </button>
                }
                <a routerLink="/pets" class="btn-view-carnet">
                  <span>🐾 Vérifier carnet PetPass</span>
                </a>
              </div>
            </article>
          }
        </div>
      </section>

      <!-- Modal de Signalement d'Urgence -->
      @if (reportModalOpen()) {
        <div class="modal-backdrop" (click)="reportModalOpen.set(false)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>🚨 Signaler un animal en détresse</h2>
              <button type="button" class="modal-close-btn" (click)="reportModalOpen.set(false)">×</button>
            </div>

            <form (ngSubmit)="submitReport()" class="modal-form">
              <div class="form-group">
                <label>Titre de l'alerte</label>
                <input type="text" [(ngModel)]="newTitre" name="newTitre" required placeholder="ex: Chien errant blessé à la patte" />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Type d'urgence</label>
                  <select [(ngModel)]="newType" name="newType">
                    <option value="Animal blessé">Animal blessé</option>
                    <option value="Animal errant / danger">Animal errant / danger</option>
                    <option value="Animal abandonné">Animal abandonné</option>
                    <option value="Maltraitance suspectée">Maltraitance suspectée</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Espèce</label>
                  <select [(ngModel)]="newEspece" name="newEspece">
                    <option value="Chien">Chien</option>
                    <option value="Chat">Chat</option>
                    <option value="Oiseau">Oiseau</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Localisation exacte (Adresse ou repère)</label>
                  <input type="text" [(ngModel)]="newLoc" name="newLoc" required placeholder="ex: Route de Téniour km 3, Sfax" />
                </div>
                <div class="form-group">
                  <label>Téléphone du signaleur</label>
                  <input type="tel" [(ngModel)]="newContact" name="newContact" required placeholder="ex: 29037656" />
                </div>
              </div>

              <div class="form-group">
                <label>Description détaillée de la situation</label>
                <textarea [(ngModel)]="newDesc" name="newDesc" rows="3" required placeholder="État de l'animal, comportement, danger immédiat..."></textarea>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn-cancel" (click)="reportModalOpen.set(false)">Annuler</button>
                <button type="submit" class="btn-submit-emergency">Diffuser l'alerte d'urgence</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .help-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding-bottom: 40px;
    }

    .help-hero {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      border: 1px solid #fecaca;
      border-radius: 20px;
      padding: 32px 36px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;

      .hero-left {
        max-width: 650px;
      }

      .sos-tag {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #ffffff;
        padding: 5px 14px;
        border-radius: 9999px;
        font-size: 0.8rem;
        font-weight: 700;
        color: #b91c1c;
        margin-bottom: 14px;
        box-shadow: 0 2px 6px rgba(185, 28, 28, 0.08);

        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          animation: pulse 1.5s infinite;
        }
      }

      h1 {
        font-size: 2.1rem;
        font-weight: 800;
        color: #7f1d1d;
        margin: 0 0 10px 0;
        line-height: 1.2;

        .highlight {
          color: #dc2626;
        }
      }

      p {
        color: #991b1b;
        font-size: 1.05rem;
        line-height: 1.5;
        margin: 0 0 22px 0;
      }

      .hero-btn-row {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .btn-sos-report {
        background: #dc2626;
        color: #ffffff;
        border: none;
        padding: 12px 24px;
        border-radius: 9999px;
        font-weight: 800;
        font-size: 0.95rem;
        cursor: pointer;
        transition: background 0.2s;
        box-shadow: 0 4px 14px rgba(220, 38, 38, 0.28);

        &:hover {
          background: #b91c1c;
        }
      }

      .btn-emergency-call {
        background: #ffffff;
        color: #991b1b;
        border: 1px solid #fecaca;
        padding: 12px 20px;
        border-radius: 9999px;
        font-weight: 700;
        font-size: 0.95rem;
        text-decoration: none;
        transition: all 0.2s;

        &:hover {
          background: #fef2f2;
        }
      }
    }

    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
      70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }

    .emergency-stats-card {
      background: #ffffff;
      border: 1px solid #fecaca;
      border-radius: 16px;
      padding: 20px 24px;
      min-width: 260px;
      box-shadow: 0 4px 16px rgba(220, 38, 38, 0.06);

      h3 {
        font-size: 0.9rem;
        font-weight: 800;
        color: #991b1b;
        margin: 0 0 14px 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .stat-row {
        display: flex;
        flex-direction: column;
        margin-bottom: 12px;

        &:last-child {
          margin-bottom: 0;
        }

        .stat-num {
          font-size: 1.8rem;
          font-weight: 800;
          color: #dc2626;

          &.text-green {
            color: #059669;
          }
        }

        .stat-label {
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 600;
        }
      }
    }

    .help-alert {
      padding: 14px 20px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 600;

      &.success {
        background: #d1fae5;
        color: #065f46;
        border: 1px solid #6ee7b7;
      }

      &.error {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fca5a5;
      }

      .alert-close {
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
      }
    }

    .feed-section {
      display: flex;
      flex-direction: column;
      gap: 16px;

      .feed-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        h2 {
          font-size: 1.4rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .feed-subtitle {
          font-size: 0.9rem;
          color: #64748b;
          margin: 4px 0 0 0;
        }

        .btn-refresh {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          padding: 8px 14px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.85rem;
          color: #334155;

          &:hover {
            background: #f8fafc;
          }
        }
      }
    }

    .reports-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .report-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);

      &.urgent-border {
        border-left: 5px solid #dc2626;
      }

      .report-top {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .badge-group {
          display: flex;
          gap: 8px;
        }

        .priority-pill {
          padding: 3px 9px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;

          &.urgente {
            background: #fef2f2;
            color: #dc2626;
            border: 1px solid #fecaca;
          }

          &.haute {
            background: #fffbeb;
            color: #d97706;
            border: 1px solid #fde68a;
          }

          &.normale {
            background: #f1f5f9;
            color: #475569;
          }
        }

        .type-pill {
          font-size: 0.75rem;
          font-weight: 600;
          background: #f8fafc;
          color: #334155;
          padding: 3px 9px;
          border-radius: 9999px;
          border: 1px solid #e2e8f0;
        }

        .status-pill {
          font-size: 0.8rem;
          font-weight: 700;
        }
      }

      .report-title {
        font-size: 1.15rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0;
      }

      .report-desc {
        color: #475569;
        font-size: 0.92rem;
        line-height: 1.5;
        margin: 0;
      }

      .report-meta-row {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        font-size: 0.82rem;
        color: #64748b;
        font-weight: 500;

        .text-green {
          color: #059669;
          font-weight: 700;
        }
      }

      .report-actions {
        display: flex;
        gap: 10px;
        padding-top: 10px;
        border-top: 1px solid #f1f5f9;

        .btn-help-action {
          background: #059669;
          color: #ffffff;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;

          &:hover {
            background: #047857;
          }
        }

        .btn-view-carnet {
          background: #f8fafc;
          color: #059669;
          border: 1px solid #cbd5e1;
          padding: 8px 14px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.85rem;
          text-decoration: none;

          &:hover {
            background: #ecfdf5;
          }
        }
      }
    }

    /* Modal Backdrop */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 16px;
      box-sizing: border-box;
    }

    .modal-card {
      background: #ffffff;
      border-radius: 20px;
      width: 100%;
      max-width: 540px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.18);
      padding: 26px 28px;
      box-sizing: border-box;

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 18px;

        h2 {
          font-size: 1.25rem;
          font-weight: 800;
          color: #991b1b;
          margin: 0;
        }

        .modal-close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #64748b;
        }
      }
    }

    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 14px;

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;

        label {
          font-size: 0.82rem;
          font-weight: 700;
          color: #334155;
        }

        input, select, textarea {
          padding: 9px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.9rem;
          outline: none;
          font-family: inherit;

          &:focus {
            border-color: #dc2626;
            box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12);
          }
        }
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 10px;

        .btn-cancel {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          padding: 9px 18px;
          border-radius: 8px;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
        }

        .btn-submit-emergency {
          background: #dc2626;
          border: none;
          color: #ffffff;
          padding: 9px 20px;
          border-radius: 8px;
          font-weight: 800;
          cursor: pointer;

          &:hover {
            background: #b91c1c;
          }
        }
      }
    }
  `]
})
export class HelpAnimalComponent {
  private authService = inject(AuthService);
  readonly searchService = inject(SearchService);

  public alertMessage = signal<string | null>(null);
  public alertType = signal<'success' | 'error'>('success');

  public reportModalOpen = signal(false);
  public newTitre = '';
  public newType: 'Animal blessé' | 'Animal errant / danger' | 'Animal abandonné' | 'Maltraitance suspectée' = 'Animal blessé';
  public newEspece: 'Chien' | 'Chat' | 'Oiseau' | 'Autre' = 'Chien';
  public newLoc = '';
  public newContact = '';
  public newDesc = '';

  public reports = signal<RescueReport[]>([
    {
      id: 101,
      titre: 'Chiot abandonné près du parc',
      typeUrgence: 'Animal errant / danger',
      espece: 'Chien',
      localisation: 'Avenue de la République, Paris 11e',
      description: 'Chiot d\'environ 3 mois trouvé seul sans collier ni puce apparente, craintif mais en bonne santé.',
      contact: '0612345678',
      dateSignalement: 'Il y a 35 minutes',
      priorite: 'HAUTE',
      statut: 'EN_COURS',
      intervenant: 'Association SOS Animaux'
    },
    {
      id: 102,
      titre: 'Chat accidenté patte arrière',
      typeUrgence: 'Animal blessé',
      espece: 'Chat',
      localisation: 'Boulevard Jean Jaurès, Lyon',
      description: 'Chat tigré blessé sur le trottoir après un choc avec une voiture, respire vite.',
      contact: '0698765432',
      dateSignalement: 'Il y a 10 minutes',
      priorite: 'URGENTE',
      statut: 'SIGNALER'
    },
    {
      id: 103,
      titre: 'Chien de chasse égaré en forêt',
      typeUrgence: 'Animal errant / danger',
      espece: 'Chien',
      localisation: 'Forêt de Fontainebleau',
      description: 'Setter anglais avec collier rouge mais numéro effacé. Récupéré par un promeneur.',
      contact: '0655443322',
      dateSignalement: 'Il y a 2 heures',
      priorite: 'NORMALE',
      statut: 'PRIS_EN_CHARGE',
      intervenant: 'Clinique Dr Sarah Martin'
    }
  ]);

  readonly filteredReports = computed(() => {
    const q = this.searchService.query().trim().toLowerCase();
    const list = this.reports();
    if (!q) return list;
    return list.filter(r => 
      r.titre?.toLowerCase().includes(q) ||
      r.espece?.toLowerCase().includes(q) ||
      r.typeUrgence?.toLowerCase().includes(q) ||
      r.localisation?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q)
    );
  });

  activeReportsCount(): number {
    return this.reports().filter(r => r.statut !== 'PRIS_EN_CHARGE').length;
  }

  resolvedReportsCount(): number {
    return this.reports().filter(r => r.statut === 'PRIS_EN_CHARGE').length + 14;
  }

  openReportModal(): void {
    const cur = this.authService.currentUser();
    if (cur) {
      this.newContact = cur.email;
    }
    this.reportModalOpen.set(true);
  }

  submitReport(): void {
    if (!this.newTitre || !this.newLoc || !this.newDesc) return;

    const newRep: RescueReport = {
      id: Date.now(),
      titre: this.newTitre,
      typeUrgence: this.newType,
      espece: this.newEspece,
      localisation: this.newLoc,
      description: this.newDesc,
      contact: this.newContact,
      dateSignalement: 'À l\'instant',
      priorite: this.newType === 'Animal blessé' ? 'URGENTE' : 'HAUTE',
      statut: 'SIGNALER'
    };

    this.reports.update(list => [newRep, ...list]);
    this.reportModalOpen.set(false);
    this.alertType.set('success');
    this.alertMessage.set(`L'alerte d'urgence a été transmise aux partenaires MediVet Connect les plus proches !`);

    this.newTitre = '';
    this.newLoc = '';
    this.newDesc = '';
  }

  takeCharge(report: RescueReport): void {
    const cur = this.authService.currentUser();
    const name = cur ? `${cur.prenom} ${cur.nom}` : 'Bénévole certifié';
    report.statut = 'EN_COURS';
    report.intervenant = name;
    this.alertType.set('success');
    this.alertMessage.set(`Merci ! Vous êtes maintenant assigné comme intervenant sur le signalement "${report.titre}".`);
  }

  refreshFeed(): void {
    this.alertType.set('success');
    this.alertMessage.set('Fil des signalements actualisé.');
    setTimeout(() => this.alertMessage.set(null), 2000);
  }
}
