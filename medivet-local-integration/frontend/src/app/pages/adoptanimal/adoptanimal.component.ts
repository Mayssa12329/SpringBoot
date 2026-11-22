import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SearchService } from '../../services/search.service';

export interface AdoptionPet {
  id: number;
  nom: string;
  espece: 'Chien' | 'Chat' | 'Autre';
  race: string;
  age: string;
  sexe: 'Mâle' | 'Femelle';
  ville: string;
  description: string;
  caractere: string[];
  photoUrl: string;
  statut: 'DISPONIBLE' | 'EN_COURS' | 'ADOPTE';
  refuge: string;
}

@Component({
  selector: 'app-adoptanimal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="adopt-page">
      <!-- Hero Banner -->
      <header class="adopt-hero">
        <div class="hero-content">
          <div class="hero-badge">
            <span class="badge-dot"></span>
            <span>AdoptAnimal — MediVet Connect</span>
          </div>
          <h1>Donnez une seconde chance, <span class="highlight">adoptez avec le cœur</span></h1>
          <p>
            Tous nos animaux sont suivis sur <strong>PetPass</strong>, vaccinés, identifiés et prêts à rejoindre un foyer aimant.
          </p>
          <div class="hero-actions">
            <button type="button" class="btn-primary" (click)="openNewAnnonceModal()">
              <span>+ Proposer un animal à l'adoption</span>
            </button>
            <a routerLink="/pets" class="btn-secondary">
              <span>🐾 Voir mon carnet PetPass</span>
            </a>
          </div>
        </div>
      </header>

      <!-- Alert Message -->
      @if (alertMessage()) {
        <div class="adopt-alert" [class.success]="alertType() === 'success'" [class.error]="alertType() === 'error'">
          <span>{{ alertMessage() }}</span>
          <button (click)="alertMessage.set(null)" class="alert-close">×</button>
        </div>
      }

      <!-- Filters Row -->
      <section class="filters-bar">
        <div class="chips-group">
          <button 
            type="button" 
            class="chip-btn" 
            [class.active]="selectedEspece() === 'TOUS'"
            (click)="selectedEspece.set('TOUS')"
          >
            Tous les animaux ({{ animals().length }})
          </button>
          <button 
            type="button" 
            class="chip-btn" 
            [class.active]="selectedEspece() === 'Chien'"
            (click)="selectedEspece.set('Chien')"
          >
            🐶 Chiens
          </button>
          <button 
            type="button" 
            class="chip-btn" 
            [class.active]="selectedEspece() === 'Chat'"
            (click)="selectedEspece.set('Chat')"
          >
            🐱 Chats
          </button>
          <button 
            type="button" 
            class="chip-btn" 
            [class.active]="selectedEspece() === 'Autre'"
            (click)="selectedEspece.set('Autre')"
          >
            🐰 NAC & Autres
          </button>
        </div>

        <div class="search-input-wrap">
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            placeholder="Rechercher par nom, race ou ville..."
            class="search-input"
          />
        </div>
      </section>

      <!-- Grid of Pets -->
      <section class="pets-grid">
        @for (pet of filteredPets(); track pet.id) {
          <article class="pet-card">
            <div class="card-media">
              <img [src]="pet.photoUrl" [alt]="pet.nom" class="pet-img" />
              <span class="status-pill" [class]="pet.statut.toLowerCase()">
                {{ pet.statut === 'DISPONIBLE' ? 'Disponible' : (pet.statut === 'EN_COURS' ? 'Candidature en cours' : 'Adopté') }}
              </span>
              <span class="gender-pill" [class.male]="pet.sexe === 'Mâle'" [class.female]="pet.sexe === 'Femelle'">
                {{ pet.sexe === 'Mâle' ? '♂ Mâle' : '♀ Femelle' }}
              </span>
            </div>

            <div class="card-body">
              <div class="card-header-row">
                <div>
                  <h3 class="pet-name">{{ pet.nom }}</h3>
                  <span class="pet-breed">{{ pet.race }} • {{ pet.age }}</span>
                </div>
                <span class="pet-city">📍 {{ pet.ville }}</span>
              </div>

              <p class="pet-desc">{{ pet.description }}</p>

              <div class="tags-row">
                @for (tag of pet.caractere; track tag) {
                  <span class="caractere-tag">#{{ tag }}</span>
                }
              </div>

              <div class="card-footer">
                <span class="refuge-label">Refuge / Contact: <strong>{{ pet.refuge }}</strong></span>
                <button 
                  type="button" 
                  class="btn-adopt" 
                  [disabled]="pet.statut === 'ADOPTE'"
                  (click)="openCandidatureModal(pet)"
                >
                  {{ pet.statut === 'ADOPTE' ? 'Déjà adopté' : 'Adopter ' + pet.nom }}
                </button>
              </div>
            </div>
          </article>
        } @empty {
          <div class="empty-state">
            <p>Aucun animal ne correspond à vos critères de recherche.</p>
          </div>
        }
      </section>

      <!-- Candidature Modal -->
      @if (candidatureModalOpen()) {
        <div class="modal-backdrop" (click)="closeCandidatureModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Candidature d'adoption pour {{ selectedPetForCandidature()?.nom }}</h2>
              <button type="button" class="modal-close-btn" (click)="closeCandidatureModal()">×</button>
            </div>
            <form (ngSubmit)="submitCandidature()" class="modal-form">
              <div class="pet-mini-preview">
                <img [src]="selectedPetForCandidature()?.photoUrl" [alt]="selectedPetForCandidature()?.nom" />
                <div>
                  <h4>{{ selectedPetForCandidature()?.nom }} ({{ selectedPetForCandidature()?.race }})</h4>
                  <p>{{ selectedPetForCandidature()?.ville }} — Carnet de santé PetPass à jour</p>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Votre nom complet</label>
                  <input type="text" [(ngModel)]="candNom" name="candNom" required placeholder="ex: Jean Dupont" />
                </div>
                <div class="form-group">
                  <label>Téléphone de contact</label>
                  <input type="tel" [(ngModel)]="candTel" name="candTel" required placeholder="0612345678" />
                </div>
              </div>

              <div class="form-group">
                <label>Type de logement</label>
                <select [(ngModel)]="candLogement" name="candLogement">
                  <option value="Maison avec jardin">Maison avec jardin clôturé</option>
                  <option value="Appartement avec balcon">Appartement avec balcon / terrasse</option>
                  <option value="Appartement">Appartement (sorties quotidiennes)</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div class="form-group">
                <label>Présentation de votre foyer et motivations</label>
                <textarea 
                  [(ngModel)]="candMessage" 
                  name="candMessage" 
                  rows="3" 
                  placeholder="Avez-vous déjà d'autres animaux ? Combien d'heures de présence par jour ?..."
                  required
                ></textarea>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn-cancel" (click)="closeCandidatureModal()">Annuler</button>
                <button type="submit" class="btn-submit">Confirmer ma demande d'adoption</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Proposer Annonce Modal -->
      @if (newAnnonceModalOpen()) {
        <div class="modal-backdrop" (click)="newAnnonceModalOpen.set(false)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Déposer une annonce d'adoption</h2>
              <button type="button" class="modal-close-btn" (click)="newAnnonceModalOpen.set(false)">×</button>
            </div>
            <form (ngSubmit)="submitNewAnnonce()" class="modal-form">
              <div class="form-row">
                <div class="form-group">
                  <label>Nom de l'animal</label>
                  <input type="text" [(ngModel)]="newNom" name="newNom" required placeholder="ex: Oscar" />
                </div>
                <div class="form-group">
                  <label>Espèce</label>
                  <select [(ngModel)]="newEspece" name="newEspece">
                    <option value="Chien">Chien</option>
                    <option value="Chat">Chat</option>
                    <option value="Autre">Autre / NAC</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Race</label>
                  <input type="text" [(ngModel)]="newRace" name="newRace" required placeholder="ex: Labrador, Européen..." />
                </div>
                <div class="form-group">
                  <label>Âge approximatif</label>
                  <input type="text" [(ngModel)]="newAge" name="newAge" required placeholder="ex: 2 ans" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Sexe</label>
                  <select [(ngModel)]="newSexe" name="newSexe">
                    <option value="Mâle">Mâle</option>
                    <option value="Femelle">Femelle</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Ville / Région</label>
                  <input type="text" [(ngModel)]="newVille" name="newVille" required placeholder="ex: Sfax, Paris..." />
                </div>
              </div>

              <div class="form-group">
                <label>Description et histoire de l'animal</label>
                <textarea [(ngModel)]="newDesc" name="newDesc" rows="3" required placeholder="Caractère, ententes, santé..."></textarea>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn-cancel" (click)="newAnnonceModalOpen.set(false)">Annuler</button>
                <button type="submit" class="btn-submit">Publier l'annonce</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .adopt-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding-bottom: 40px;
    }

    .adopt-hero {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border: 1px solid #a7f3d0;
      border-radius: 20px;
      padding: 32px 36px;
      position: relative;
      overflow: hidden;

      .hero-content {
        max-width: 720px;
      }

      .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #ffffff;
        padding: 5px 14px;
        border-radius: 9999px;
        font-size: 0.8rem;
        font-weight: 700;
        color: #065f46;
        margin-bottom: 14px;
        box-shadow: 0 2px 6px rgba(5, 150, 105, 0.08);

        .badge-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
        }
      }

      h1 {
        font-size: 2.1rem;
        font-weight: 800;
        color: #064e3b;
        margin: 0 0 10px 0;
        line-height: 1.2;

        .highlight {
          color: #059669;
        }
      }

      p {
        color: #065f46;
        font-size: 1.05rem;
        line-height: 1.5;
        margin: 0 0 20px 0;
      }

      .hero-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .btn-primary {
        background: #059669;
        color: #ffffff;
        border: none;
        padding: 11px 22px;
        border-radius: 9999px;
        font-weight: 700;
        font-size: 0.95rem;
        cursor: pointer;
        transition: background 0.2s;
        box-shadow: 0 4px 12px rgba(5, 150, 105, 0.2);

        &:hover {
          background: #047857;
        }
      }

      .btn-secondary {
        background: #ffffff;
        color: #065f46;
        border: 1px solid #a7f3d0;
        padding: 11px 20px;
        border-radius: 9999px;
        font-weight: 700;
        font-size: 0.95rem;
        text-decoration: none;
        transition: all 0.2s;

        &:hover {
          background: #f0fdf4;
        }
      }
    }

    .adopt-alert {
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

    .filters-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;

      .chips-group {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .chip-btn {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        padding: 8px 16px;
        border-radius: 9999px;
        font-size: 0.9rem;
        font-weight: 600;
        color: #475569;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        &.active {
          background: #059669;
          color: #ffffff;
          border-color: #059669;
        }
      }

      .search-input-wrap {
        flex: 1;
        max-width: 320px;
        min-width: 200px;
      }

      .search-input {
        width: 100%;
        padding: 9px 16px;
        border: 1px solid #e2e8f0;
        border-radius: 9999px;
        font-size: 0.9rem;
        outline: none;
        background: #ffffff;
        box-sizing: border-box;

        &:focus {
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
        }
      }
    }

    .pets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 22px;
    }

    .pet-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
      display: flex;
      flex-direction: column;
      transition: transform 0.2s ease, box-shadow 0.2s ease;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      }

      .card-media {
        position: relative;
        height: 210px;
        overflow: hidden;
        background: #f1f5f9;

        .pet-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        &:hover .pet-img {
          transform: scale(1.04);
        }

        .status-pill {
          position: absolute;
          top: 12px;
          left: 12px;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;

          &.disponible {
            background: #10b981;
            color: #ffffff;
          }

          &.en_cours {
            background: #f59e0b;
            color: #ffffff;
          }

          &.adopte {
            background: #64748b;
            color: #ffffff;
          }
        }

        .gender-pill {
          position: absolute;
          bottom: 12px;
          right: 12px;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(4px);

          &.male {
            color: #2563eb;
          }

          &.female {
            color: #db2777;
          }
        }
      }

      .card-body {
        padding: 18px 20px;
        display: flex;
        flex-direction: column;
        flex: 1;
        gap: 12px;
      }

      .card-header-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;

        .pet-name {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .pet-breed {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 500;
        }

        .pet-city {
          font-size: 0.82rem;
          color: #059669;
          font-weight: 700;
          background: #ecfdf5;
          padding: 3px 8px;
          border-radius: 6px;
        }
      }

      .pet-desc {
        color: #475569;
        font-size: 0.9rem;
        line-height: 1.45;
        margin: 0;
        flex: 1;
      }

      .tags-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;

        .caractere-tag {
          font-size: 0.75rem;
          font-weight: 600;
          background: #f1f5f9;
          color: #334155;
          padding: 3px 8px;
          border-radius: 6px;
        }
      }

      .card-footer {
        border-top: 1px solid #f1f5f9;
        padding-top: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;

        .refuge-label {
          font-size: 0.78rem;
          color: #64748b;
        }

        .btn-adopt {
          background: #059669;
          color: #ffffff;
          border: none;
          padding: 9px 14px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.2s;

          &:hover:not(:disabled) {
            background: #047857;
          }

          &:disabled {
            background: #cbd5e1;
            cursor: not-allowed;
          }
        }
      }
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 40px;
      color: #64748b;
      font-size: 1rem;
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
      max-height: 90vh;
      overflow-y: auto;
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
          color: #0f172a;
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

      .pet-mini-preview {
        display: flex;
        align-items: center;
        gap: 12px;
        background: #f8fafc;
        padding: 10px 14px;
        border-radius: 12px;
        border: 1px solid #e2e8f0;

        img {
          width: 52px;
          height: 52px;
          border-radius: 10px;
          object-fit: cover;
        }

        h4 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
        }

        p {
          margin: 2px 0 0 0;
          font-size: 0.8rem;
          color: #059669;
          font-weight: 600;
        }
      }

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
            border-color: #059669;
            box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
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

        .btn-submit {
          background: #059669;
          border: none;
          color: #ffffff;
          padding: 9px 20px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;

          &:hover {
            background: #047857;
          }
        }
      }
    }
  `]
})
export class AdoptAnimalComponent {
  private authService = inject(AuthService);
  readonly searchService = inject(SearchService);

  public selectedEspece = signal<'TOUS' | 'Chien' | 'Chat' | 'Autre'>('TOUS');
  public searchQuery = '';
  public alertMessage = signal<string | null>(null);
  public alertType = signal<'success' | 'error'>('success');

  // Modal Candidature
  public candidatureModalOpen = signal(false);
  public selectedPetForCandidature = signal<AdoptionPet | null>(null);
  public candNom = '';
  public candTel = '';
  public candLogement = 'Maison avec jardin';
  public candMessage = '';

  // Modal New Annonce
  public newAnnonceModalOpen = signal(false);
  public newNom = '';
  public newEspece: 'Chien' | 'Chat' | 'Autre' = 'Chien';
  public newRace = '';
  public newAge = '';
  public newSexe: 'Mâle' | 'Femelle' = 'Mâle';
  public newVille = '';
  public newDesc = '';

  public animals = signal<AdoptionPet[]>([
    {
      id: 1,
      nom: 'Buddy',
      espece: 'Chien',
      race: 'Golden Retriever',
      age: '3 ans',
      sexe: 'Mâle',
      ville: 'Paris / Île-de-France',
      description: 'Buddy est un chien adorable, plein de vie et très câlin. Il adore les longues balades en forêt et s’entend très bien avec les enfants.',
      caractere: ['Joueur', 'Affectueux', 'Sociable'],
      photoUrl: 'assets/images/buddy-avatar.png',
      statut: 'DISPONIBLE',
      refuge: 'Refuge SPA Saint-Germain'
    },
    {
      id: 2,
      nom: 'Luna',
      espece: 'Chat',
      race: 'Européen Tigré',
      age: '2 ans',
      sexe: 'Femelle',
      ville: 'Lyon / Rhône',
      description: 'Luna est calme, propre et très douce. Elle recherche un appartement paisible où elle pourra se prélasser au soleil.',
      caractere: ['Calme', 'Propre', 'Câline'],
      photoUrl: 'assets/images/luna-avatar.png',
      statut: 'DISPONIBLE',
      refuge: 'Association Féline Lyonnaise'
    },
    {
      id: 3,
      nom: 'Milo',
      espece: 'Chien',
      race: 'Berger Australien',
      age: '1 an et demi',
      sexe: 'Mâle',
      ville: 'Bordeaux / Gironde',
      description: 'Milo est vif, joueur et intelligent. Idéal pour une famille active ou des amateurs d’agility.',
      caractere: ['Dynamique', 'Sportif', 'Apprenant'],
      photoUrl: 'assets/images/milo-avatar.png',
      statut: 'DISPONIBLE',
      refuge: 'Refuge des Amis Fidèles'
    },
    {
      id: 4,
      nom: 'Bella',
      espece: 'Autre',
      race: 'Lapin Nain Bélier',
      age: '1 an',
      sexe: 'Femelle',
      ville: 'Toulouse / Occitanie',
      description: 'Bella est une petite lapine affectueuse habituée à la vie en liberté surveillée en intérieur.',
      caractere: ['Curieuse', 'Douce'],
      photoUrl: 'assets/images/bella-avatar.png',
      statut: 'DISPONIBLE',
      refuge: 'Refuge NAC Occitanie'
    }
  ]);

  filteredPets(): AdoptionPet[] {
    const esp = this.selectedEspece();
    const q = (this.searchService.query() || this.searchQuery).trim().toLowerCase();

    return this.animals().filter(p => {
      const matchEsp = esp === 'TOUS' || p.espece === esp;
      const matchQuery = !q || 
        p.nom.toLowerCase().includes(q) || 
        p.race.toLowerCase().includes(q) || 
        p.ville.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q);
      return matchEsp && matchQuery;
    });
  }

  openCandidatureModal(pet: AdoptionPet): void {
    const cur = this.authService.currentUser();
    if (cur) {
      this.candNom = `${cur.prenom} ${cur.nom}`.trim();
    }
    this.selectedPetForCandidature.set(pet);
    this.candidatureModalOpen.set(true);
  }

  closeCandidatureModal(): void {
    this.candidatureModalOpen.set(false);
    this.selectedPetForCandidature.set(null);
  }

  submitCandidature(): void {
    const pet = this.selectedPetForCandidature();
    if (!pet) return;

    pet.statut = 'EN_COURS';
    this.alertType.set('success');
    this.alertMessage.set(`Votre candidature pour ${pet.nom} a été envoyée avec succès ! Le refuge ${pet.refuge} prendra contact avec vous.`);
    this.closeCandidatureModal();
  }

  openNewAnnonceModal(): void {
    this.newAnnonceModalOpen.set(true);
  }

  submitNewAnnonce(): void {
    if (!this.newNom || !this.newRace || !this.newVille) return;

    const newPet: AdoptionPet = {
      id: Date.now(),
      nom: this.newNom,
      espece: this.newEspece,
      race: this.newRace,
      age: this.newAge || '1 an',
      sexe: this.newSexe,
      ville: this.newVille,
      description: this.newDesc,
      caractere: ['Attachant', 'Vacciné'],
      photoUrl: this.newEspece === 'Chat' ? 'assets/images/luna-avatar.png' : 'assets/images/buddy-avatar.png',
      statut: 'DISPONIBLE',
      refuge: 'Particulier certifié MediVet'
    };

    this.animals.update(list => [newPet, ...list]);
    this.newAnnonceModalOpen.set(false);
    this.alertType.set('success');
    this.alertMessage.set(`L'annonce pour ${newPet.nom} a été publiée avec succès !`);

    this.newNom = '';
    this.newRace = '';
    this.newAge = '';
    this.newVille = '';
    this.newDesc = '';
  }
}
