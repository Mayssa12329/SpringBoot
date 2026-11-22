import { Component, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PetPassService } from '../../services/petpass.service';
import { SearchService } from '../../services/search.service';
import { Animal } from '../../models/animal.model';

export interface DisplayConsultation {
  id: number;
  animalId: number;
  animalName: string;
  animalGender: 'M' | 'F';
  animalBreed: string;
  animalPhoto?: string;
  veterinarianName: string;
  clinicName: string;
  vetAvatarUrl: string;
  consultationDate: string; // e.g. 15/10/2026
  consultationTime: string; // e.g. 10:30 AM
  motif: string;
  diagnosis: string;
  diagnosticStatus: 'healthy' | 'warning' | 'cured';
  treatment?: string;
  notes?: string;
}

@Component({
  selector: 'app-petpass-consultations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="consultations-page">
      <!-- 1. HERO BANNER: MES CONSULTATIONS -->
      <section class="consultations-banner">
        <!-- Background Decor Wave Image -->
        <div class="banner-bg-decor" aria-hidden="true">
          <img 
            src="assets/images/mes-consultations-banner-bg.webp" 
            alt="Paws and waves" 
            class="bg-wave-img"
            (error)="$any($event.target).style.display = 'none'"
          />
        </div>

        <!-- Left Content -->
        <div class="banner-left-content">
          <div class="banner-title-row">
            <svg class="banner-paw-icon" viewBox="0 0 24 24" fill="#059669" width="32" height="32">
              <path d="M12 11c-1.8 0-3.3 1.5-3.3 3.8 0 2.3 1.5 4.2 3.3 4.2s3.3-1.9 3.3-4.2c0-2.3-1.5-3.8-3.3-3.8zM7 9.5C5.9 9.5 5 10.4 5 11.5S5.9 13.5 7 13.5s2-.9 2-2S8.1 9.5 7 9.5zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM4.5 14C3.7 14 3 14.7 3 15.5S3.7 17 4.5 17 6 16.3 6 15.5 5.3 14 4.5 14zm15 0c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5 1.5-.7 1.5-1.5-.7-1.5-1.5-1.5z"/>
            </svg>
            <h1 class="banner-title">Mes Consultations</h1>
          </div>
          <p class="banner-subtitle">
            Consultez l'historique de toutes les consultations de vos animaux
          </p>

          <div class="banner-actions-row">
            <button type="button" class="btn-retour-petpass" (click)="goBack()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>Retour à PetPass</span>
            </button>
          </div>
        </div>

        <!-- Right Pets Cutout (Golden Retriever & Kitten lying down) -->
        <div class="banner-pets-wrapper">
          <img 
            src="assets/images/mes-consultations-pets-cutout.webp" 
            alt="Golden Retriever et chaton" 
            class="banner-pets-cutout"
            (error)="$any($event.target).src = 'assets/images/profile-pets.png'"
          />
        </div>
      </section>

      <!-- 2. FILTER CONTROLS TOOLBAR -->
      <section class="filters-toolbar-card">
        <div class="filter-paw-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="#059669" width="22" height="22">
            <path d="M12 11c-1.8 0-3.3 1.5-3.3 3.8 0 2.3 1.5 4.2 3.3 4.2s3.3-1.9 3.3-4.2c0-2.3-1.5-3.8-3.3-3.8zM7 9.5C5.9 9.5 5 10.4 5 11.5S5.9 13.5 7 13.5s2-.9 2-2S8.1 9.5 7 9.5zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM4.5 14C3.7 14 3 14.7 3 15.5S3.7 17 4.5 17 6 16.3 6 15.5 5.3 14 4.5 14zm15 0c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5 1.5-.7 1.5-1.5-.7-1.5-1.5-1.5z"/>
          </svg>
        </div>

        <div class="filter-inputs-group">
          <!-- Filter: Animal -->
          <div class="filter-field">
            <label class="filter-label">Animal</label>
            <div class="select-container">
              <select [(ngModel)]="filterAnimal" class="clean-select">
                <option value="ALL">Tous mes animaux</option>
                @for (pet of myPets(); track pet.id) {
                  <option [value]="pet.id">{{ pet.name }}</option>
                }
              </select>
              <svg class="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>

          <!-- Filter: Vétérinaire -->
          <div class="filter-field">
            <label class="filter-label">Vétérinaire</label>
            <div class="select-container">
              <select [(ngModel)]="filterVet" class="clean-select">
                <option value="ALL">Tous les vétérinaires</option>
                <option value="Sarah">Dr. Sarah Ben Ali</option>
                <option value="Amine">Dr. Amine Trabelsi</option>
              </select>
              <svg class="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>

          <!-- Filter: Période -->
          <div class="filter-field">
            <label class="filter-label">Période</label>
            <div class="select-container">
              <select [(ngModel)]="filterPeriod" class="clean-select">
                <option value="ALL">Toutes les périodes</option>
                <option value="2026">Année 2026</option>
                <option value="30D">30 derniers jours</option>
              </select>
              <svg class="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>

          <!-- Filter: Type de consultation -->
          <div class="filter-field">
            <label class="filter-label">Type de consultation</label>
            <div class="select-container">
              <select [(ngModel)]="filterType" class="clean-select">
                <option value="ALL">Tous les types</option>
                <option value="Vaccin">Vaccin annuel</option>
                <option value="Contrôle">Contrôle général</option>
                <option value="Cutané">Problème cutané</option>
                <option value="Suivi">Suivi médical</option>
              </select>
              <svg class="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>
        </div>

        <div class="filter-buttons-group">
          <button type="button" class="btn-apply-filters" (click)="applyFilters()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            <span>Appliquer les filtres</span>
          </button>

          <button type="button" class="btn-reset-filters" (click)="resetFilters()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            <span>Réinitialiser</span>
          </button>
        </div>
      </section>

      <!-- 3. CONSULTATIONS LIST -->
      <section class="consultations-list-container">
        @for (item of filteredConsultations(); track item.id) {
          <div class="consultation-row-card">
            <!-- Col 1: Animal -->
            <div class="col-animal">
              <div class="animal-avatar-wrap">
                <img [src]="item.animalPhoto || getDefaultAnimalPhoto(item)" [alt]="item.animalName" class="animal-avatar-img" />
              </div>
              <div class="animal-text-wrap">
                <div class="animal-name-gender">
                  <span class="animal-name">{{ item.animalName }}</span>
                  <img 
                    [src]="item.animalGender === 'F' ? 'assets/images/gender-female.png' : 'assets/images/gender-male.png'" 
                    [alt]="item.animalGender === 'F' ? 'Femelle' : 'Mâle'" 
                    class="gender-icon-img" 
                  />
                </div>
                <span class="animal-breed">{{ item.animalBreed }}</span>
              </div>
            </div>

            <!-- Col 2: Vétérinaire -->
            <div class="col-vet">
              <div class="vet-avatar-wrap">
                <img [src]="item.vetAvatarUrl" [alt]="item.veterinarianName" class="vet-avatar-img" />
              </div>
              <div class="vet-text-wrap">
                <span class="vet-name">{{ item.veterinarianName }}</span>
                <span class="vet-clinic">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>{{ item.clinicName }}</span>
                </span>
              </div>
            </div>

            <!-- Col 3: Date & Heure -->
            <div class="col-datetime">
              <div class="datetime-item date">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>{{ item.consultationDate }}</span>
              </div>
              <div class="datetime-item time">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>{{ item.consultationTime }}</span>
              </div>
            </div>

            <!-- Col 4: Motif -->
            <div class="col-motif">
              <span class="column-micro-label">Motif</span>
              <span class="motif-value">{{ item.motif }}</span>
            </div>

            <!-- Col 5: Diagnostic -->
            <div class="col-diagnostic">
              <span class="column-micro-label">Diagnostic</span>
              @if (item.diagnosticStatus === 'healthy' || item.diagnosticStatus === 'cured') {
                <div class="diag-status-wrap healthy">
                  <span class="diag-check">✓</span>
                  <span class="diag-text">{{ item.diagnosis }}</span>
                </div>
              } @else {
                <div class="diag-status-wrap warning">
                  <span class="diag-warning-icon">⚠</span>
                  <span class="diag-text">{{ item.diagnosis }}</span>
                </div>
              }
            </div>

            <!-- Col 6: Actions (Never cut off!) -->
            <div class="col-actions">
              <button type="button" class="btn-voir-detail" (click)="openDetailModal(item)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>Voir le détail</span>
              </button>
            </div>
          </div>
        }

        @if (filteredConsultations().length === 0) {
          <div class="empty-state-card">
            <div class="empty-icon">🔍</div>
            <h3>Aucune consultation ne correspond à vos filtres</h3>
            <p>Essayez de réinitialiser vos critères de recherche.</p>
            <button type="button" class="btn-reset-empty" (click)="resetFilters()">
              Réinitialiser les filtres
            </button>
          </div>
        }
      </section>

      <!-- 4. BOTTOM STATS & ADVICE ROW -->
      <section class="bottom-stats-row">
        <!-- 1. Total Consultations -->
        <div class="stat-pill-card">
          <div class="pill-icon stethoscope">
            <svg viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.2" width="22" height="22">
              <path d="M4.5 3v5a4.5 4.5 0 0 0 9 0V3"></path>
              <path d="M9 12.5a6 6 0 0 0 6 6h1a4 4 0 0 0 4-4v-1.5"></path>
              <circle cx="20" cy="13" r="2"></circle>
            </svg>
          </div>
          <div class="pill-text">
            <span class="pill-num">{{ totalConsultationsCount() }}</span>
            <span class="pill-lbl">Consultations totales</span>
          </div>
        </div>

        <!-- 2. This Year -->
        <div class="stat-pill-card">
          <div class="pill-icon calendar">
            <svg viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" width="20" height="20">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div class="pill-text">
            <span class="pill-num">{{ thisYearCount() }}</span>
            <span class="pill-lbl">Cette année</span>
          </div>
        </div>

        <!-- 3. Health Status Summary -->
        <div class="stat-pill-card">
          <div class="pill-icon heart">
            <svg viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.2" width="22" height="22">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </div>
          <div class="pill-text">
            <span class="pill-lbl-bold">Aucun problème majeur</span>
          </div>
        </div>

        <!-- 4. Conseil Banner -->
        <div class="advice-card-item">
          <div class="advice-bulb-icon">💡</div>
          <div class="advice-text-wrap">
            <span class="advice-title">Conseil</span>
            <p class="advice-p">
              N'oubliez pas de consulter votre vétérinaire régulièrement pour le bien-être de vos animaux.
            </p>
          </div>
          <div class="advice-paw-decor">
            <svg viewBox="0 0 24 24" fill="#059669" width="32" height="32" opacity="0.45">
              <path d="M12 11c-1.8 0-3.3 1.5-3.3 3.8 0 2.3 1.5 4.2 3.3 4.2s3.3-1.9 3.3-4.2c0-2.3-1.5-3.8-3.3-3.8zM7 9.5C5.9 9.5 5 10.4 5 11.5S5.9 13.5 7 13.5s2-.9 2-2S8.1 9.5 7 9.5zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM4.5 14C3.7 14 3 14.7 3 15.5S3.7 17 4.5 17 6 16.3 6 15.5 5.3 14 4.5 14zm15 0c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5 1.5-.7 1.5-1.5-.7-1.5-1.5-1.5z"/>
            </svg>
          </div>
        </div>
      </section>

      <!-- 5. MODAL: DÉTAIL DE LA CONSULTATION -->
      @if (selectedConsultation) {
        <div class="modal-backdrop" (click)="closeDetailModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-header-left">
                <span class="modal-icon">🩺</span>
                <div>
                  <h3 class="modal-title">Détail de la consultation</h3>
                  <p class="modal-subtitle">{{ selectedConsultation.animalName }} · {{ selectedConsultation.consultationDate }}</p>
                </div>
              </div>
              <button type="button" class="btn-close-modal" (click)="closeDetailModal()">✕</button>
            </div>

            <div class="modal-body">
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="item-label">Animal</span>
                  <span class="item-val"><strong>{{ selectedConsultation.animalName }}</strong> ({{ selectedConsultation.animalBreed }})</span>
                </div>
                <div class="detail-item">
                  <span class="item-label">Vétérinaire</span>
                  <span class="item-val"><strong>{{ selectedConsultation.veterinarianName }}</strong></span>
                </div>
                <div class="detail-item">
                  <span class="item-label">Clinique</span>
                  <span class="item-val">{{ selectedConsultation.clinicName }}</span>
                </div>
                <div class="detail-item">
                  <span class="item-label">Date & Heure</span>
                  <span class="item-val">{{ selectedConsultation.consultationDate }} à {{ selectedConsultation.consultationTime }}</span>
                </div>
                <div class="detail-item">
                  <span class="item-label">Motif</span>
                  <span class="item-val font-semibold">{{ selectedConsultation.motif }}</span>
                </div>
                <div class="detail-item">
                  <span class="item-label">Diagnostic</span>
                  <span class="item-val font-bold text-emerald-700">{{ selectedConsultation.diagnosis }}</span>
                </div>
                <div class="detail-item full-width">
                  <span class="item-label">Traitement prescrit</span>
                  <span class="item-val">{{ selectedConsultation.treatment || "Aucun traitement spécifique prescrit." }}</span>
                </div>
                <div class="detail-item full-width">
                  <span class="item-label">Notes cliniques</span>
                  <span class="item-val">{{ selectedConsultation.notes || "Examen clinique satisfaisant." }}</span>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-open-pet-carnet" (click)="goToAnimalCarnet(selectedConsultation)">
                Voir dans le carnet de santé
              </button>
              <button type="button" class="btn-modal-close" (click)="closeDetailModal()">
                Fermer
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .consultations-page {
      max-width: 1320px;
      margin: 0 auto;
      padding: 24px 28px 60px;
      display: flex;
      flex-direction: column;
      gap: 22px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    /* 1. HERO BANNER */
    .consultations-banner {
      position: relative;
      background: linear-gradient(105deg, #e6fcf5 0%, #d3f9ec 45%, #c1f4e5 100%);
      border-radius: 28px;
      padding: 38px 44px;
      min-height: 200px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.7);
    }

    .banner-bg-decor {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 1;

      .bg-wave-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .banner-left-content {
      position: relative;
      z-index: 2;
      max-width: 580px;
    }

    .banner-title-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;

      .banner-paw-icon {
        flex-shrink: 0;
      }

      .banner-title {
        font-size: 2.25rem;
        font-weight: 800;
        color: #064e3b;
        margin: 0;
        letter-spacing: -0.02em;
      }
    }

    .banner-subtitle {
      font-size: 1.05rem;
      color: #046c4e;
      margin: 0 0 24px 0;
      font-weight: 500;
    }

    .banner-actions-row {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .btn-retour-petpass {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 22px;
      background: #044e3f;
      color: #ffffff;
      font-size: 0.92rem;
      font-weight: 700;
      border: none;
      border-radius: 9999px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 10px rgba(4, 78, 63, 0.2);

      &:hover {
        background: #022c24;
        transform: translateY(-1px);
        box-shadow: 0 4px 14px rgba(4, 78, 63, 0.3);
      }
    }

    .banner-pets-wrapper {
      position: relative;
      z-index: 2;
      flex-shrink: 0;
      margin-right: 10px;

      .banner-pets-cutout {
        height: 190px;
        width: auto;
        object-fit: contain;
        filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.12));
      }
    }

    /* 2. FILTERS TOOLBAR CARD */
    .filters-toolbar-card {
      background: #ffffff;
      border: 1px solid #eef2f6;
      border-radius: 22px;
      padding: 16px 24px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.025);
      display: flex;
      align-items: flex-end;
      gap: 16px;
      flex-wrap: wrap;
    }

    .filter-paw-badge {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      background: #ecfdf5;
      border: 1.5px solid #d1fae5;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-bottom: 2px;
    }

    .filter-inputs-group {
      display: flex;
      align-items: flex-end;
      gap: 14px;
      flex: 1;
      flex-wrap: wrap;
    }

    .filter-field {
      display: flex;
      flex-direction: column;
      gap: 5px;
      flex: 1 1 185px;
      min-width: 175px;

      .filter-label {
        font-size: 0.8rem;
        font-weight: 700;
        color: #1e293b;
        letter-spacing: -0.1px;
      }

      .select-container {
        position: relative;
        display: flex;
        align-items: center;
        width: 100%;

        .clean-select {
          width: 100%;
          appearance: none;
          -webkit-appearance: none;
          padding: 10px 32px 10px 14px;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          font-size: 0.88rem;
          font-weight: 600;
          color: #0f172a;
          cursor: pointer;
          outline: none;
          transition: all 0.18s ease;

          &:hover {
            border-color: #cbd5e1;
            background: #ffffff;
          }

          &:focus {
            border-color: #059669;
            background: #ffffff;
            box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
          }
        }

        .select-arrow {
          position: absolute;
          right: 12px;
          width: 15px;
          height: 15px;
          color: #64748b;
          pointer-events: none;
        }
      }
    }

    .filter-buttons-group {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
      margin-bottom: 2px;
    }

    .btn-apply-filters {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 11px 20px;
      background: #044e3f;
      color: #ffffff;
      font-size: 0.88rem;
      font-weight: 700;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(4, 78, 63, 0.18);

      &:hover {
        background: #022c24;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(4, 78, 63, 0.25);
      }
    }

    .btn-reset-filters {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 18px;
      background: #ffffff;
      color: #059669;
      border: 1.5px solid #a7f3d0;
      border-radius: 12px;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;

      &:hover {
        background: #ecfdf5;
        border-color: #059669;
      }
    }

    /* 3. CONSULTATIONS LIST CARDS */
    .consultations-list-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .consultation-row-card {
      background: #ffffff;
      border: 1px solid #edf2f7;
      border-radius: 20px;
      padding: 16px 24px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
      display: grid;
      grid-template-columns: minmax(160px, 1.4fr) minmax(180px, 1.6fr) minmax(140px, 1.1fr) minmax(130px, 1.1fr) minmax(150px, 1.2fr) minmax(135px, auto);
      align-items: center;
      gap: 20px;
      transition: all 0.2s ease;

      &:hover {
        border-color: #cbd5e1;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.045);
        transform: translateY(-1px);
      }
    }

    /* Col 1: Animal */
    .col-animal {
      display: flex;
      align-items: center;
      gap: 12px;

      .animal-avatar-wrap {
        width: 52px;
        height: 52px;
        border-radius: 15px;
        overflow: hidden;
        background: #f1f5f9;
        flex-shrink: 0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

        .animal-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .animal-text-wrap {
        display: flex;
        flex-direction: column;
        line-height: 1.25;

        .animal-name-gender {
          display: flex;
          align-items: center;
          gap: 6px;

          .animal-name {
            font-size: 1.12rem;
            font-weight: 800;
            color: #0f172a;
          }

          .gender-icon-img {
            width: 18px;
            height: 18px;
            object-fit: contain;
            flex-shrink: 0;
          }
        }

        .animal-breed {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 500;
          margin-top: 2px;
        }
      }
    }

    /* Col 2: Vet */
    .col-vet {
      display: flex;
      align-items: center;
      gap: 12px;

      .vet-avatar-wrap {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        overflow: hidden;
        background: #e2e8f0;
        flex-shrink: 0;
        border: 2px solid #f8fafc;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);

        .vet-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .vet-text-wrap {
        display: flex;
        flex-direction: column;
        line-height: 1.25;

        .vet-name {
          font-size: 0.98rem;
          font-weight: 700;
          color: #0f172a;
        }

        .vet-clinic {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.82rem;
          color: #64748b;
          font-weight: 500;
          margin-top: 2px;
        }
      }
    }

    /* Col 3: Date & Time */
    .col-datetime {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .datetime-item {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.88rem;
        font-weight: 600;

        &.date {
          color: #1e293b;
        }

        &.time {
          color: #64748b;
          font-size: 0.82rem;
          font-weight: 500;
        }
      }
    }

    /* Col 4: Motif */
    .col-motif {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .column-micro-label {
        font-size: 0.78rem;
        color: #94a3b8;
        font-weight: 600;
      }

      .motif-value {
        font-size: 0.95rem;
        font-weight: 700;
        color: #0f172a;
      }
    }

    /* Col 5: Diagnostic */
    .col-diagnostic {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .column-micro-label {
        font-size: 0.78rem;
        color: #94a3b8;
        font-weight: 600;
      }

      .diag-status-wrap {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.92rem;
        font-weight: 700;

        &.healthy {
          color: #059669;

          .diag-check {
            font-size: 1rem;
            font-weight: 900;
          }
        }

        &.warning {
          color: #d97706;

          .diag-warning-icon {
            font-size: 0.95rem;
          }
        }
      }
    }

    /* Col 6: Actions */
    .col-actions {
      display: flex;
      justify-content: flex-end;

      .btn-voir-detail {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 9px 18px;
        background: transparent;
        border: 1.5px solid #a7f3d0;
        border-radius: 9999px;
        color: #059669;
        font-size: 0.86rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;

        &:hover {
          background: #044e3f;
          border-color: #044e3f;
          color: #ffffff;
          box-shadow: 0 3px 10px rgba(4, 78, 63, 0.2);
          transform: translateY(-1px);
        }
      }
    }

    /* Empty state */
    .empty-state-card {
      background: #ffffff;
      border: 1.5px dashed #cbd5e1;
      border-radius: 20px;
      padding: 50px 24px;
      text-align: center;

      .empty-icon {
        font-size: 2.2rem;
        margin-bottom: 12px;
      }

      h3 {
        font-size: 1.2rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0 0 6px 0;
      }

      p {
        color: #64748b;
        font-size: 0.9rem;
        margin: 0 0 16px 0;
      }

      .btn-reset-empty {
        padding: 9px 20px;
        background: #059669;
        color: #ffffff;
        border: none;
        border-radius: 9999px;
        font-weight: 700;
        font-size: 0.88rem;
        cursor: pointer;
      }
    }

    /* 4. BOTTOM STATS ROW */
    .bottom-stats-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1.3fr 2.2fr;
      gap: 16px;
      align-items: stretch;
    }

    .stat-pill-card {
      background: #ffffff;
      border: 1px solid #eef2f6;
      border-radius: 20px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);

      .pill-icon {
        width: 44px;
        height: 44px;
        border-radius: 13px;
        background: #ecfdf5;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .pill-text {
        display: flex;
        flex-direction: column;
        line-height: 1.25;

        .pill-num {
          font-size: 1.4rem;
          font-weight: 800;
          color: #0f172a;
        }

        .pill-lbl {
          font-size: 0.84rem;
          color: #64748b;
          font-weight: 600;
        }

        .pill-lbl-bold {
          font-size: 0.96rem;
          font-weight: 800;
          color: #0f172a;
        }
      }
    }

    .advice-card-item {
      background: linear-gradient(90deg, #e6fcf5 0%, #d8f8ee 100%);
      border: 1px solid #a7f3d0;
      border-radius: 20px;
      padding: 14px 22px;
      display: flex;
      align-items: center;
      gap: 14px;
      position: relative;
      overflow: hidden;

      .advice-bulb-icon {
        font-size: 1.4rem;
        flex-shrink: 0;
      }

      .advice-text-wrap {
        position: relative;
        z-index: 2;

        .advice-title {
          font-size: 0.9rem;
          font-weight: 800;
          color: #065f46;
        }

        .advice-p {
          font-size: 0.84rem;
          color: #064e3b;
          margin: 2px 0 0 0;
          line-height: 1.35;
        }
      }

      .advice-paw-decor {
        position: absolute;
        right: 14px;
        z-index: 1;
        pointer-events: none;
      }
    }

    /* 5. MODAL */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .modal-card {
      background: #ffffff;
      border-radius: 24px;
      width: 100%;
      max-width: 560px;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.16);
      overflow: hidden;
      animation: modalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes modalPop {
      from {
        transform: scale(0.94);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    .modal-header {
      padding: 20px 24px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .modal-header-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .modal-icon {
          font-size: 1.5rem;
        }

        .modal-title {
          font-size: 1.18rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .modal-subtitle {
          font-size: 0.84rem;
          color: #64748b;
          margin: 2px 0 0 0;
        }
      }

      .btn-close-modal {
        background: transparent;
        border: none;
        font-size: 1.2rem;
        color: #94a3b8;
        cursor: pointer;

        &:hover {
          color: #0f172a;
        }
      }
    }

    .modal-body {
      padding: 24px;

      .detail-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;

          &.full-width {
            grid-column: 1 / -1;
          }

          .item-label {
            font-size: 0.78rem;
            color: #64748b;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
          }

          .item-val {
            font-size: 0.92rem;
            color: #0f172a;
          }
        }
      }
    }

    .modal-footer {
      padding: 16px 24px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;

      .btn-open-pet-carnet {
        padding: 9px 18px;
        background: #044e3f;
        color: #ffffff;
        border: none;
        border-radius: 9999px;
        font-size: 0.88rem;
        font-weight: 700;
        cursor: pointer;

        &:hover {
          background: #022c24;
        }
      }

      .btn-modal-close {
        padding: 9px 18px;
        background: #ffffff;
        color: #64748b;
        border: 1px solid #cbd5e1;
        border-radius: 9999px;
        font-size: 0.88rem;
        font-weight: 700;
        cursor: pointer;

        &:hover {
          background: #f1f5f9;
        }
      }
    }

    @media (max-width: 1150px) {
      .filters-toolbar-card {
        flex-wrap: wrap;
      }

      .consultation-row-card {
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }

      .col-actions {
        justify-content: flex-start;
      }

      .bottom-stats-row {
        grid-template-columns: 1fr 1fr;
      }
    }
  `]
})
export class PetPassConsultationsComponent {
  private readonly petPassService = inject(PetPassService);
  private readonly searchService = inject(SearchService);

  back = output<void>();
  openCarnet = output<Animal>();

  filterAnimal: string = 'ALL';
  filterVet: string = 'ALL';
  filterPeriod: string = 'ALL';
  filterType: string = 'ALL';

  selectedConsultation: DisplayConsultation | null = null;

  // Real pets from PostgreSQL
  readonly myPets = computed<Animal[]>(() => {
    return this.petPassService.animals();
  });

  // Données réelles issues de PostgreSQL
  readonly allConsultations = computed<DisplayConsultation[]>(() => {
    const pets = this.myPets();
    const recordsMap = this.petPassService.allMedicalRecords();
    const list: DisplayConsultation[] = [];

    for (const pet of pets) {
      const recs = recordsMap.get(pet.id);
      if (recs && recs.length > 0) {
        recs.forEach(r => {
          const dStr = r.consultationDate ? String(r.consultationDate) : '';
          let dateFormatted = '15/10/2026';
          let timeFormatted = '10:30 AM';
          if (dStr.includes('T')) {
            const [dPart, tPart] = dStr.split('T');
            const dArr = dPart.split('-');
            if (dArr.length === 3) dateFormatted = `${dArr[2]}/${dArr[1]}/${dArr[0]}`;
            if (tPart) timeFormatted = tPart.substring(0, 5);
          }

          const diag = r.diagnosis || 'En bonne santé';
          let diagStatus: 'healthy' | 'warning' | 'cured' = 'healthy';
          const diagLower = diag.toLowerCase();
          if (diagLower.includes('allergie') || diagLower.includes('problème') || diagLower.includes('attention')) {
            diagStatus = 'warning';
          } else if (diagLower.includes('guérison') || diagLower.includes('guéri')) {
            diagStatus = 'cured';
          }

          let motif = 'Contrôle général';
          if (r.notes && r.notes.includes('Motif:')) {
            const mMatch = r.notes.match(/Motif:\s*([^.]+)/);
            if (mMatch) motif = mMatch[1].trim();
          } else if (diagLower.includes('santé') || diagLower.includes('vaccin')) {
            motif = 'Vaccin annuel';
          } else if (diagLower.includes('allergie')) {
            motif = 'Contrôle général';
          } else if (diagLower.includes('guérison') || diagLower.includes('cutané')) {
            motif = 'Problème cutané';
          }

          const vetName = r.veterinarianName || (pet.species === 'CHIEN' ? 'Dr. Sarah Ben Ali' : 'Dr. Amine Trabelsi');
          const vetAvatar = vetName.toLowerCase().includes('sarah') ? 'assets/images/vet-sarah-avatar.png' : 'assets/images/vet-amine-avatar.png';

          list.push({
            id: r.id,
            animalId: pet.id,
            animalName: pet.name,
            animalGender: (pet.gender || 'M') as 'M' | 'F',
            animalBreed: pet.breed || (pet.species === 'CHIEN' ? 'Golden Retriever' : 'Chat Européen'),
            animalPhoto: pet.photoUrl,
            veterinarianName: vetName,
            clinicName: 'Clinique VetCare, Sfax',
            vetAvatarUrl: vetAvatar,
            consultationDate: dateFormatted,
            consultationTime: timeFormatted,
            motif: motif,
            diagnosis: diag,
            diagnosticStatus: diagStatus,
            treatment: r.treatment || 'Traitement adapté administré',
            notes: r.notes || 'Examen clinique satisfaisant.'
          });
        });
      }
    }

    return list;
  });
  });

  readonly filteredConsultations = computed<DisplayConsultation[]>(() => {
    const q = this.searchService.query().trim().toLowerCase();
    let list = this.allConsultations();

    if (this.filterAnimal !== 'ALL') {
      list = list.filter(c => String(c.animalId) === this.filterAnimal);
    }

    if (this.filterVet !== 'ALL') {
      list = list.filter(c => c.veterinarianName.toLowerCase().includes(this.filterVet.toLowerCase()));
    }

    if (this.filterType !== 'ALL') {
      list = list.filter(c => c.motif.toLowerCase().includes(this.filterType.toLowerCase()));
    }

    if (this.filterPeriod !== 'ALL') {
      if (this.filterPeriod === '2026') {
        list = list.filter(c => c.consultationDate.includes('2026'));
      } else if (this.filterPeriod === '30D') {
        list = list.filter(c => c.consultationDate.includes('10/2026') || c.consultationDate.includes('11/2026') || c.consultationDate.includes('09/2026'));
      }
    }

    if (!q) return list;

    return list.filter(c => 
      c.animalName.toLowerCase().includes(q) ||
      c.animalBreed.toLowerCase().includes(q) ||
      c.veterinarianName.toLowerCase().includes(q) ||
      c.clinicName.toLowerCase().includes(q) ||
      c.motif.toLowerCase().includes(q) ||
      c.diagnosis.toLowerCase().includes(q)
    );
  });

  readonly totalConsultationsCount = computed(() => this.filteredConsultations().length);
  readonly thisYearCount = computed(() => {
    return this.filteredConsultations().filter(c => c.consultationDate.includes('2026')).length;
  });

  goBack(): void {
    this.back.emit();
  }

  resetFilters(): void {
    this.filterAnimal = 'ALL';
    this.filterVet = 'ALL';
    this.filterPeriod = 'ALL';
    this.filterType = 'ALL';
    this.searchService.clear();
    this.petPassService.refreshAll();
  }

  applyFilters(): void {
    // Les signals réactifs Angular mettent à jour la liste instantanément
  }

  openDetailModal(consultation: DisplayConsultation): void {
    this.selectedConsultation = consultation;
  }

  closeDetailModal(): void {
    this.selectedConsultation = null;
  }

  goToAnimalCarnet(consultation: DisplayConsultation): void {
    const animal = this.myPets().find(p => p.id === consultation.animalId);
    if (animal) {
      this.petPassService.selectAnimal(animal);
      this.openCarnet.emit(animal);
    }
    this.closeDetailModal();
  }

  getDefaultAnimalPhoto(item: DisplayConsultation): string {
    if (item.animalBreed.toLowerCase().includes('chien') || item.animalName.toLowerCase().includes('max')) {
      return 'assets/images/buddy-avatar.png';
    }
    return 'assets/images/luna-pet-avatar.png';
  }
}
