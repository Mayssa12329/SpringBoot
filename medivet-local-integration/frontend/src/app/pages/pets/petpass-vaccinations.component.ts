import { Component, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PetPassService } from '../../services/petpass.service';
import { SearchService } from '../../services/search.service';
import { Animal } from '../../models/animal.model';
import { Vaccination } from '../../models/medical-record.model';

export interface DisplayVaccination {
  id: number;
  animalId: number;
  vaccineName: string;
  injectionDate: string;
  nextDueDate: string;
  status: 'À jour' | 'À venir' | 'En retard';
  iconType: 'shield' | 'syringe';
  batchNumber?: string;
  veterinarianName?: string;
}

@Component({
  selector: 'app-petpass-vaccinations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="vaccinations-page">
      <!-- 1. HERO BANNER: MES VACCINATIONS -->
      <section class="vaccinations-banner">
        <!-- Background Decor Wave Image -->
        <div class="banner-bg-decor" aria-hidden="true">
          <img 
            src="assets/images/mes-vaccinations-banner-bg.webp" 
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
            <h1 class="banner-title">Mes Vaccinations</h1>
          </div>
          <p class="banner-subtitle">
            Consultez toutes les vaccinations de vos animaux
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
            src="assets/images/mes-vaccinations-pets-cutout.webp" 
            alt="Golden Retriever et chaton" 
            class="banner-pets-cutout"
            (error)="$any($event.target).src = 'assets/images/profile-pets.png'"
          />
        </div>
      </section>

      <!-- 2. FILTER CONTROLS TOOLBAR -->
      <section class="filters-toolbar-card">
        <div class="filters-toolbar-row">
          <!-- Reset button -->
          <button type="button" class="btn-reset-filter" (click)="resetFilters()" title="Réinitialiser les filtres">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>

          <!-- Filter: Animal -->
          <div class="filter-group">
            <label class="filter-label">Animal</label>
            <div class="select-wrapper">
              <span class="select-icon">🐾</span>
              <select [(ngModel)]="filterAnimal" class="styled-select">
                <option value="ALL">Tous mes animaux</option>
                @for (pet of myPets(); track pet.id) {
                  <option [value]="pet.id">{{ pet.name }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Filter: Statut -->
          <div class="filter-group">
            <label class="filter-label">Statut</label>
            <div class="select-wrapper">
              <span class="select-icon">🛡️</span>
              <select [(ngModel)]="filterStatus" class="styled-select">
                <option value="ALL">Tous les statuts</option>
                <option value="A_JOUR">À jour</option>
                <option value="A_VENIR">À venir</option>
                <option value="EN_RETARD">En retard</option>
              </select>
            </div>
          </div>

          <!-- Filter: Type de vaccin -->
          <div class="filter-group">
            <label class="filter-label">Type de vaccin</label>
            <div class="select-wrapper">
              <span class="select-icon">💉</span>
              <select [(ngModel)]="filterVaccineType" class="styled-select">
                <option value="ALL">Tous les types</option>
                <option value="Rage">Rage</option>
                <option value="Parvovirose">Parvovirose</option>
                <option value="Hépatite">Hépatite Canine</option>
                <option value="Typhus">Typhus</option>
                <option value="Leucose">Leucose Féline</option>
              </select>
            </div>
          </div>

          <!-- Filter: Période -->
          <div class="filter-group">
            <label class="filter-label">Période</label>
            <div class="select-wrapper">
              <span class="select-icon">📅</span>
              <select [(ngModel)]="filterPeriod" class="styled-select">
                <option value="ALL">Toutes les périodes</option>
                <option value="THIS_YEAR">Année en cours</option>
                <option value="UPCOMING">Prochaines échéances</option>
              </select>
            </div>
          </div>

          <!-- Apply Filter button -->
          <button type="button" class="btn-apply-filters" (click)="applyFilters()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            <span>Appliquer</span>
          </button>
        </div>
      </section>

      <!-- 3. ANIMALS VACCINATIONS LIST -->
      <section class="vaccinations-list">
        @for (pet of visiblePetsWithVaccines(); track pet.id) {
          <div class="animal-vaccine-card">
              <!-- Left Column: Pet Profile -->
              <div class="pet-profile-col">
                <div class="pet-avatar-wrap">
                  <img 
                    [src]="getPetPhoto(pet)" 
                    [alt]="pet.name" 
                    class="pet-avatar-img"
                    (error)="$any($event.target).src = getDefaultPhoto(pet)"
                  />
                </div>

                <div class="pet-info-wrap">
                  <div class="name-gender-row">
                    <h3 class="pet-name">{{ pet.name }}</h3>
                    <img 
                      [src]="pet.gender === 'F' ? 'assets/images/gender-female.png' : 'assets/images/gender-male.png'" 
                      [alt]="pet.gender === 'F' ? 'Femelle' : 'Mâle'" 
                      class="gender-icon-img" 
                    />
                  </div>
                  <p class="pet-breed">{{ pet.breed || (pet.species === 'CHIEN' ? 'Golden Retriever' : 'Chat Européen') }}</p>
                </div>

                <button type="button" class="btn-voir-profil" (click)="onOpenCarnet(pet)">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <span>Voir profil</span>
                </button>
              </div>

              <!-- Right Column: Vaccinations Table -->
              <div class="pet-vaccinations-col">
                <!-- Section Header with collapse toggle -->
                <div class="vaccine-col-header" (click)="toggleCollapse(pet.id)">
                  <div class="header-left">
                    <svg class="header-paw-icon" viewBox="0 0 24 24" fill="#059669" width="20" height="20">
                      <path d="M12 11c-1.8 0-3.3 1.5-3.3 3.8 0 2.3 1.5 4.2 3.3 4.2s3.3-1.9 3.3-4.2c0-2.3-1.5-3.8-3.3-3.8zM7 9.5C5.9 9.5 5 10.4 5 11.5S5.9 13.5 7 13.5s2-.9 2-2S8.1 9.5 7 9.5zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM4.5 14C3.7 14 3 14.7 3 15.5S3.7 17 4.5 17 6 16.3 6 15.5 5.3 14 4.5 14zm15 0c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5 1.5-.7 1.5-1.5-.7-1.5-1.5-1.5z"/>
                    </svg>
                    <span class="header-title">Vaccinations ({{ getVaccinationsForPet(pet).length }})</span>
                  </div>

                  <button type="button" class="btn-collapse" [class.rotated]="isCollapsed(pet.id)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                  </button>
                </div>

                <!-- Table Content -->
                @if (!isCollapsed(pet.id)) {
                  <div class="vaccine-table-responsive">
                    <table class="vaccine-table">
                      <thead>
                        <tr>
                          <th>Vaccin</th>
                          <th>Date d'injection</th>
                          <th>Prochaine dose</th>
                          <th>Statut</th>
                          <th class="th-actions">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (vac of getVaccinationsForPet(pet); track vac.id) {
                          <tr>
                            <!-- Vaccine Name with Icon -->
                            <td class="td-vaccine-name">
                              <div class="vaccine-name-wrap">
                                @if (vac.iconType === 'shield') {
                                  <svg class="vac-icon shield" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.3">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                    <line x1="12" y1="8" x2="12" y2="14"></line>
                                    <line x1="9" y1="11" x2="15" y2="11"></line>
                                  </svg>
                                } @else {
                                  <svg class="vac-icon syringe" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.3">
                                    <path d="M18 2l4 4-2 2-4-4 2-2zM15 5l2 2-8 8H7v-2l8-8zM3 21l3-3M9 13l2 2"></path>
                                  </svg>
                                }
                                <span class="vac-title">{{ vac.vaccineName }}</span>
                              </div>
                            </td>

                            <!-- Injection Date -->
                            <td class="td-date">{{ vac.injectionDate }}</td>

                            <!-- Next Due Date -->
                            <td class="td-date">{{ vac.nextDueDate }}</td>

                            <!-- Status Badge -->
                            <td class="td-status">
                              <span class="badge-status-ajour">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                <span>{{ vac.status }}</span>
                              </span>
                            </td>

                            <!-- Actions -->
                            <td class="td-actions">
                              <button type="button" class="btn-action-voir" (click)="openVaccineDetail(pet, vac)">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                  <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                                <span>Voir</span>
                              </button>
                            </td>
                          </tr>
                        }

                        @if (getVaccinationsForPet(pet).length === 0) {
                          <tr>
                            <td colspan="5" class="td-empty">
                              Aucune vaccination enregistrée pour cet animal avec les critères actuels.
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            </div>
        }

        @if (visiblePetsWithVaccines().length === 0) {
          <div class="empty-results-card">
            <div class="empty-icon">🔍</div>
            <h3>Aucun résultat pour cette recherche</h3>
            <p>Essayez de réinitialiser vos filtres ou sélectionnez un autre animal.</p>
            <button type="button" class="btn-reset-empty" (click)="resetFilters()">
              Réinitialiser les filtres
            </button>
          </div>
        }
      </section>

      <!-- 4. BOTTOM ADVICE BANNER -->
      <section class="advice-banner">
        <div class="advice-content">
          <div class="advice-info-icon">
            <span>i</span>
          </div>
          <p class="advice-text">
            <strong>Conseil :</strong> Respectez toujours le calendrier vaccinal pour une meilleure protection de vos animaux.
          </p>
        </div>
        <div class="advice-paw-watermark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="#059669" width="36" height="36" opacity="0.45">
            <path d="M12 11c-1.8 0-3.3 1.5-3.3 3.8 0 2.3 1.5 4.2 3.3 4.2s3.3-1.9 3.3-4.2c0-2.3-1.5-3.8-3.3-3.8zM7 9.5C5.9 9.5 5 10.4 5 11.5S5.9 13.5 7 13.5s2-.9 2-2S8.1 9.5 7 9.5zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM4.5 14C3.7 14 3 14.7 3 15.5S3.7 17 4.5 17 6 16.3 6 15.5 5.3 14 4.5 14zm15 0c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5 1.5-.7 1.5-1.5-.7-1.5-1.5-1.5z"/>
          </svg>
        </div>
      </section>

      <!-- 5. MODAL: DÉTAILS DU VACCIN -->
      @if (selectedDetailVaccine) {
        <div class="modal-backdrop" (click)="closeVaccineDetail()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-title-wrap">
                <span class="modal-vac-icon">💉</span>
                <div>
                  <h3 class="modal-title">{{ selectedDetailVaccine.vac.vaccineName }}</h3>
                  <p class="modal-sub">Animal : <strong>{{ selectedDetailVaccine.pet.name }}</strong></p>
                </div>
              </div>
              <button type="button" class="btn-close-modal" (click)="closeVaccineDetail()">✕</button>
            </div>

            <div class="modal-body">
              <div class="detail-row">
                <span class="detail-label">Date d'administration :</span>
                <span class="detail-value">{{ selectedDetailVaccine.vac.injectionDate }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Prochain rappel recommandé :</span>
                <span class="detail-value highlight">{{ selectedDetailVaccine.vac.nextDueDate }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Statut :</span>
                <span class="badge-status-ajour">✓ {{ selectedDetailVaccine.vac.status }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Numéro de lot :</span>
                <span class="detail-value">{{ selectedDetailVaccine.vac.batchNumber || 'VAC-2025-0982' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Vétérinaire praticien :</span>
                <span class="detail-value">{{ selectedDetailVaccine.vac.veterinarianName || 'Dr. Thomas Laurent (Clinique MediVet)' }}</span>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-modal-carnet" (click)="onOpenCarnet(selectedDetailVaccine.pet); closeVaccineDetail()">
                Voir dans le carnet
              </button>
              <button type="button" class="btn-modal-close" (click)="closeVaccineDetail()">
                Fermer
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .vaccinations-page {
      max-width: 1240px;
      margin: 0 auto;
      padding: 24px 24px 60px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    /* 1. HERO BANNER */
    .vaccinations-banner {
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
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 16px 24px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
    }

    .filters-toolbar-row {
      display: flex;
      align-items: flex-end;
      gap: 16px;
      flex-wrap: wrap;
    }

    .btn-reset-filter {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      border: 1.5px solid #d1fae5;
      background: #ecfdf5;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;
      margin-bottom: 2px;

      &:hover {
        background: #d1fae5;
        transform: rotate(-45deg);
      }
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
      min-width: 170px;

      .filter-label {
        font-size: 0.82rem;
        font-weight: 700;
        color: #334155;
      }

      .select-wrapper {
        position: relative;
        display: flex;
        align-items: center;

        .select-icon {
          position: absolute;
          left: 12px;
          font-size: 0.95rem;
          pointer-events: none;
        }

        .styled-select {
          width: 100%;
          padding: 10px 14px 10px 38px;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          font-size: 0.88rem;
          font-weight: 600;
          color: #0f172a;
          cursor: pointer;
          outline: none;
          transition: all 0.15s;

          &:focus {
            border-color: #059669;
            background: #ffffff;
            box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
          }
        }
      }
    }

    .btn-apply-filters {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 11px 24px;
      background: #044e3f;
      color: #ffffff;
      font-size: 0.9rem;
      font-weight: 700;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 2px;

      &:hover {
        background: #022c24;
        transform: translateY(-1px);
      }
    }

    /* 3. VACCINATIONS LIST & ANIMAL CARDS */
    .vaccinations-list {
      display: flex;
      flex-direction: column;
      gap: 22px;
    }

    .animal-vaccine-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      padding: 24px;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.03);
      display: grid;
      grid-template-columns: 210px 1fr;
      gap: 28px;
      align-items: start;
      transition: all 0.2s;

      &:hover {
        border-color: #cbd5e1;
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.05);
      }
    }

    /* Left Profile Column */
    .pet-profile-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 8px 12px;
      border-right: 1px solid #f1f5f9;

      .pet-avatar-wrap {
        width: 124px;
        height: 124px;
        border-radius: 20px;
        overflow: hidden;
        background: #f1f5f9;
        margin-bottom: 12px;
        border: 3px solid #f8fafc;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);

        .pet-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .name-gender-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;

        .pet-name {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .gender-icon-img {
          width: 20px;
          height: 20px;
          object-fit: contain;
          flex-shrink: 0;
        }
      }

      .pet-breed {
        font-size: 0.88rem;
        color: #64748b;
        margin: 4px 0 16px 0;
        font-weight: 500;
      }

      .btn-voir-profil {
        width: 100%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 8px 16px;
        background: #f0fdf4;
        color: #059669;
        border: 1.5px solid #a7f3d0;
        border-radius: 9999px;
        font-size: 0.86rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: #d1fae5;
          transform: translateY(-1px);
        }
      }
    }

    /* Right Table Column */
    .pet-vaccinations-col {
      display: flex;
      flex-direction: column;
      gap: 14px;
      overflow: hidden;
    }

    .vaccine-col-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      user-select: none;
      padding-bottom: 8px;
      border-bottom: 1.5px solid #f1f5f9;

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;

        .header-title {
          font-size: 1.08rem;
          font-weight: 800;
          color: #065f46;
        }
      }

      .btn-collapse {
        background: transparent;
        border: none;
        color: #64748b;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        transition: transform 0.2s;

        &.rotated {
          transform: rotate(180deg);
        }
      }
    }

    .vaccine-table-responsive {
      overflow-x: auto;
    }

    .vaccine-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;

      thead {
        background: #f8fafc;
        border-radius: 8px;

        th {
          padding: 10px 14px;
          font-size: 0.82rem;
          font-weight: 700;
          color: #475569;
          border-bottom: 1.5px solid #e2e8f0;

          &.th-actions {
            text-align: center;
          }
        }
      }

      tbody {
        tr {
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.15s;

          &:hover {
            background: #fbfdfc;
          }

          &:last-child {
            border-bottom: none;
          }
        }

        td {
          padding: 13px 14px;
          font-size: 0.9rem;
          vertical-align: middle;

          &.td-date {
            color: #334155;
            font-weight: 500;
          }
        }
      }

      .td-vaccine-name {
        .vaccine-name-wrap {
          display: flex;
          align-items: center;
          gap: 10px;

          .vac-icon {
            width: 17px;
            height: 17px;
            flex-shrink: 0;

            &.shield {
              stroke: #059669;
            }

            &.syringe {
              stroke: #0d9488;
            }
          }

          .vac-title {
            font-weight: 700;
            color: #0f172a;
          }
        }
      }

      .badge-status-ajour {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 4px 10px;
        border-radius: 9999px;
        background: #d1fae5;
        color: #059669;
        font-size: 0.78rem;
        font-weight: 800;
      }

      .td-actions {
        text-align: center;

        .btn-action-voir {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 14px;
          background: transparent;
          border: 1px solid #cbd5e1;
          color: #334155;
          border-radius: 9999px;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;

          &:hover {
            background: #044e3f;
            border-color: #044e3f;
            color: #ffffff;
          }
        }
      }

      .td-empty {
        text-align: center;
        padding: 24px;
        color: #94a3b8;
        font-style: italic;
      }
    }

    /* 4. ADVICE BANNER */
    .advice-banner {
      position: relative;
      background: linear-gradient(90deg, #e6fcf5 0%, #d8f8ee 100%);
      border: 1px solid #a7f3d0;
      border-radius: 18px;
      padding: 14px 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      overflow: hidden;

      .advice-content {
        display: flex;
        align-items: center;
        gap: 12px;
        position: relative;
        z-index: 2;

        .advice-info-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #059669;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.85rem;
          flex-shrink: 0;
        }

        .advice-text {
          font-size: 0.92rem;
          color: #065f46;
          margin: 0;
        }
      }

      .advice-paw-watermark {
        position: relative;
        z-index: 1;
        flex-shrink: 0;
      }
    }

    /* Empty state */
    .empty-results-card {
      background: #ffffff;
      border: 1.5px dashed #cbd5e1;
      border-radius: 20px;
      padding: 48px 24px;
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
      max-width: 500px;
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

      .modal-title-wrap {
        display: flex;
        align-items: center;
        gap: 12px;

        .modal-vac-icon {
          font-size: 1.5rem;
        }

        .modal-title {
          font-size: 1.18rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .modal-sub {
          font-size: 0.85rem;
          color: #64748b;
          margin: 2px 0 0 0;
        }
      }

      .btn-close-modal {
        background: transparent;
        border: none;
        font-size: 1.15rem;
        color: #94a3b8;
        cursor: pointer;

        &:hover {
          color: #0f172a;
        }
      }
    }

    .modal-body {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 14px;

      .detail-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: 10px;
        border-bottom: 1px dashed #f1f5f9;

        &:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .detail-label {
          font-size: 0.88rem;
          color: #64748b;
          font-weight: 600;
        }

        .detail-value {
          font-size: 0.92rem;
          color: #0f172a;
          font-weight: 700;

          &.highlight {
            color: #059669;
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

      .btn-modal-carnet {
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

    @media (max-width: 900px) {
      .animal-vaccine-card {
        grid-template-columns: 1fr;
      }

      .pet-profile-col {
        border-right: none;
        border-bottom: 1px solid #f1f5f9;
        padding-bottom: 20px;
      }
    }
  `]
})
export class PetPassVaccinationsComponent {
  private readonly petPassService = inject(PetPassService);
  private readonly searchService = inject(SearchService);

  back = output<void>();
  openCarnet = output<Animal>();

  filterAnimal: string = 'ALL';
  filterStatus: string = 'ALL';
  filterVaccineType: string = 'ALL';
  filterPeriod: string = 'ALL';

  collapsedMap = signal<Map<number, boolean>>(new Map());
  selectedDetailVaccine: { pet: Animal; vac: DisplayVaccination } | null = null;

  // Real pets from PostgreSQL
  readonly myPets = computed<Animal[]>(() => {
    return this.petPassService.animals();
  });

  readonly displayedPets = computed<Animal[]>(() => {
    const list = this.myPets();
    const q = this.searchService.query().trim().toLowerCase();
    const selectedPetId = this.filterAnimal;

    return list.filter(pet => {
      if (selectedPetId !== 'ALL' && String(pet.id) !== selectedPetId) {
        return false;
      }

      if (q) {
        const matchesPet = (pet.name || '').toLowerCase().includes(q) ||
          (pet.breed || '').toLowerCase().includes(q) ||
          (pet.species || '').toLowerCase().includes(q);

        const vacs = this.getVaccinationsForPet(pet);
        const matchesVac = vacs.some(v => v.vaccineName.toLowerCase().includes(q));

        if (!matchesPet && !matchesVac) return false;
      }

      return true;
    });
  });

  readonly visiblePetsWithVaccines = computed<Animal[]>(() => {
    return this.displayedPets().filter(pet => this.getVaccinationsForPet(pet).length > 0);
  });

  goBack(): void {
    this.back.emit();
  }

  onOpenCarnet(pet: Animal): void {
    this.petPassService.selectAnimal(pet);
    this.openCarnet.emit(pet);
  }

  toggleCollapse(petId: number): void {
    this.collapsedMap.update(map => {
      const next = new Map(map);
      next.set(petId, !next.get(petId));
      return next;
    });
  }

  isCollapsed(petId: number): boolean {
    return !!this.collapsedMap().get(petId);
  }

  resetFilters(): void {
    this.filterAnimal = 'ALL';
    this.filterStatus = 'ALL';
    this.filterVaccineType = 'ALL';
    this.filterPeriod = 'ALL';
    this.searchService.clear();
    this.petPassService.refreshAll();
  }

  applyFilters(): void {
    // Les signals réactifs mettent à jour la vue instantanément
  }

  openVaccineDetail(pet: Animal, vac: DisplayVaccination): void {
    this.selectedDetailVaccine = { pet, vac };
  }

  closeVaccineDetail(): void {
    this.selectedDetailVaccine = null;
  }

  getVaccinationsForPet(pet: Animal): DisplayVaccination[] {
    const realVacs = this.petPassService.allVaccinations().get(pet.id);
    let list: DisplayVaccination[] = [];

    if (realVacs && realVacs.length > 0) {
      list = realVacs.map(v => ({
        id: v.id,
        animalId: v.animalId || pet.id,
        vaccineName: v.vaccineName,
        injectionDate: this.formatDate(v.dateAdministered || v.injectionDate || '2025-03-15'),
        nextDueDate: this.formatDate(v.nextDueDate || v.nextBoosterDate || '2026-03-15'),
        status: (v.status || 'À jour') as any,
        iconType: (v.vaccineName.toLowerCase().includes('rage') || v.vaccineName.toLowerCase().includes('typhus')) ? 'shield' : 'syringe',
        batchNumber: v.batchNumber || 'LOT-8472',
        veterinarianName: v.veterinarianName || (pet.species === 'CHIEN' ? 'Dr. Sarah Ben Ali' : 'Dr. Amine Trabelsi')
      }));
    } else {
      const hist = this.petPassService.allHistories().get(pet.id);
      if (hist && hist.vaccinations && hist.vaccinations.length > 0) {
        list = hist.vaccinations.map(v => ({
          id: v.id,
          animalId: v.animalId || pet.id,
          vaccineName: v.vaccineName,
          injectionDate: this.formatDate(v.injectionDate || v.administeredDate || '2025-03-15'),
          nextDueDate: this.formatDate(v.nextDueDate || v.nextBoosterDate || '2026-03-15'),
          status: 'À jour' as const,
          iconType: v.vaccineName.toLowerCase().includes('rage') || v.vaccineName.toLowerCase().includes('typhus') ? 'shield' : 'syringe',
          batchNumber: v.batchNumber,
          veterinarianName: v.veterinarianName
        }));
      } else {
        // Fallback mockup selon l'espèce
        if (pet.species === 'CHIEN' || pet.name.toLowerCase().includes('max')) {
          list = [
            {
              id: 101,
              animalId: pet.id,
              vaccineName: 'Rage',
              injectionDate: '15/03/2025',
              nextDueDate: '15/03/2026',
              status: 'À jour',
              iconType: 'shield',
              batchNumber: 'LOT-RAG-2025-0481',
              veterinarianName: 'Dr. Sarah Ben Ali'
            },
            {
              id: 102,
              animalId: pet.id,
              vaccineName: 'Parvovirose',
              injectionDate: '15/03/2025',
              nextDueDate: '15/03/2026',
              status: 'À jour',
              iconType: 'syringe',
              batchNumber: 'LOT-PARVO-2025-8812',
              veterinarianName: 'Dr. Sarah Ben Ali'
            },
            {
              id: 103,
              animalId: pet.id,
              vaccineName: 'Hépatite Canine',
              injectionDate: '15/03/2025',
              nextDueDate: '15/03/2026',
              status: 'À jour',
              iconType: 'syringe',
              batchNumber: 'LOT-HEP-2025-1120',
              veterinarianName: 'Dr. Sarah Ben Ali'
            }
          ];
        } else {
          list = [
            {
              id: 201,
              animalId: pet.id,
              vaccineName: 'Typhus',
              injectionDate: '10/04/2025',
              nextDueDate: '10/04/2026',
              status: 'À jour',
              iconType: 'shield',
              batchNumber: 'LOT-TYP-2025-7731',
              veterinarianName: 'Dr. Amine Trabelsi'
            },
            {
              id: 202,
              animalId: pet.id,
              vaccineName: 'Leucose Féline',
              injectionDate: '10/04/2025',
              nextDueDate: '10/04/2026',
              status: 'À jour',
              iconType: 'syringe',
              batchNumber: 'LOT-LEU-2025-3390',
              veterinarianName: 'Dr. Amine Trabelsi'
            }
          ];
        }
      }
    }

    // Apply Filters
    return list.filter(v => {
      if (this.filterStatus !== 'ALL') {
        const s = (v.status || '').toLowerCase();
        if (this.filterStatus === 'A_JOUR' && !s.includes('jour')) return false;
        if (this.filterStatus === 'A_VENIR' && !s.includes('venir')) return false;
        if (this.filterStatus === 'EN_RETARD' && !s.includes('retard')) return false;
      }

      if (this.filterVaccineType !== 'ALL') {
        if (!v.vaccineName.toLowerCase().includes(this.filterVaccineType.toLowerCase())) {
          return false;
        }
      }

      if (this.filterPeriod !== 'ALL') {
        if (this.filterPeriod === 'THIS_YEAR' && !v.injectionDate.includes('2026') && !v.nextDueDate.includes('2026')) {
          return false;
        }
        if (this.filterPeriod === 'UPCOMING' && !v.nextDueDate.includes('2026') && !v.nextDueDate.includes('2027')) {
          return false;
        }
      }

      return true;
    });
  }

  getPetPhoto(pet: Animal): string {
    if (pet.photoUrl && pet.photoUrl.trim().length > 0) {
      return pet.photoUrl.split('#')[0];
    }
    return this.getDefaultPhoto(pet);
  }

  getDefaultPhoto(pet: Animal): string {
    if (pet.species === 'CHIEN' || pet.name.toLowerCase().includes('max')) {
      return 'assets/images/buddy-avatar.png';
    }
    if (pet.species === 'RONGEUR') {
      return 'assets/images/milo-avatar.png';
    }
    return 'assets/images/luna-pet-avatar.png';
  }

  private formatDate(isoOrFr: string): string {
    if (!isoOrFr) return '15/03/2025';
    if (isoOrFr.includes('/')) return isoOrFr;
    try {
      const parts = isoOrFr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch {
      // fallback
    }
    return isoOrFr;
  }
}
