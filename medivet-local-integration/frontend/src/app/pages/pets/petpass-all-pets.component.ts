import { Component, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PetPassService } from '../../services/petpass.service';
import { SearchService } from '../../services/search.service';
import { ToastService } from '../../components/ui/toast/toast.service';
import { Animal, Species } from '../../models/animal.model';

@Component({
  selector: 'app-petpass-all-pets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mes-animaux-page">
      <!-- 1. HERO BANNER: MES ANIMAUX -->
      <section class="mes-animaux-banner">
        <!-- Background Decor Wave Image -->
        <div class="banner-bg-decor" aria-hidden="true">
          <img 
            src="assets/images/mes-animaux-banner-bg.webp" 
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
            <h1 class="banner-title">Mes animaux</h1>
          </div>
          <p class="banner-subtitle">
            Retrouvez les profils et les informations de santé de vos compagnons
          </p>

          <div class="banner-actions-row">
            <button type="button" class="btn-ajouter-animal" (click)="openAddPetModal()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Ajouter un animal</span>
            </button>

            <button type="button" class="btn-retour-petpass" (click)="goBack()">
              <span>Retour à PetPass</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        </div>

        <!-- Right Pets Cutout (Golden Retriever & Kitten lying down) -->
        <div class="banner-pets-wrapper">
          <img 
            src="assets/images/profile-pets.png" 
            alt="Golden Retriever et chaton" 
            class="banner-pets-cutout"
            (error)="$any($event.target).src = 'assets/images/mes-animaux-pets-cutout.webp'"
          />
        </div>
      </section>

      <!-- 2. FILTER BAR: MES ANIMAUX -->
      <section class="mes-animaux-filter-bar">
        <div class="filter-chips-container">
          <button 
            type="button" 
            class="filter-tab-chip" 
            [class.active]="selectedCategory() === 'TOUS'"
            (click)="selectedCategory.set('TOUS')">
            <span>Tous</span>
            <span class="filter-count-badge">{{ speciesCounts().all }}</span>
          </button>

          <button 
            type="button" 
            class="filter-tab-chip" 
            [class.active]="selectedCategory() === 'CHIEN'"
            (click)="selectedCategory.set('CHIEN')">
            <span class="chip-emoji">🐶</span>
            <span>Chiens</span>
            <span class="filter-count-badge">{{ speciesCounts().chiens }}</span>
          </button>

          <button 
            type="button" 
            class="filter-tab-chip" 
            [class.active]="selectedCategory() === 'CHAT'"
            (click)="selectedCategory.set('CHAT')">
            <span class="chip-emoji">🐱</span>
            <span>Chats</span>
            <span class="filter-count-badge">{{ speciesCounts().chats }}</span>
          </button>

          <button 
            type="button" 
            class="filter-tab-chip" 
            [class.active]="selectedCategory() === 'AUTRE'"
            (click)="selectedCategory.set('AUTRE')">
            <span class="chip-emoji">🐰</span>
            <span>Rongeurs & Autres</span>
            <span class="filter-count-badge">{{ speciesCounts().autres }}</span>
          </button>
        </div>
      </section>

      <!-- 3. ANIMALS GRID -->
      <section class="animals-grid">
        @for (pet of filteredPets(); track pet.id) {
          <div class="animal-card">
            <!-- Left: Pet Photo -->
            <div class="pet-photo-wrapper">
              <img 
                [src]="getPetPhoto(pet)" 
                [alt]="pet.name" 
                class="pet-photo-img"
                (error)="$any($event.target).src = getDefaultPhoto(pet)"
              />
            </div>

            <!-- Right: Pet Details & Actions -->
            <div class="pet-card-content">
              <!-- Top Row: Name + Gender + 3 dots menu -->
              <div class="card-top-row">
                <div class="name-gender-wrap">
                  <h2 class="pet-card-name">{{ pet.name }}</h2>
                  <img 
                    [src]="pet.gender === 'F' ? 'assets/images/gender-female.png' : 'assets/images/gender-male.png'" 
                    [alt]="pet.gender === 'F' ? 'Femelle' : 'Mâle'" 
                    class="gender-icon-img" 
                  />
                </div>
                <button type="button" class="btn-dots-menu" title="Options">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2"/>
                    <circle cx="12" cy="12" r="2"/>
                    <circle cx="12" cy="19" r="2"/>
                  </svg>
                </button>
              </div>

              <!-- Metadata: Species · Breed · Age -->
              <p class="pet-meta-text">
                <span class="meta-paw">🐾</span>
                <span>{{ formatSpeciesLabel(pet.species) }} · {{ pet.breed || 'Européen' }} · {{ formatAge(pet.birthDate) }}</span>
              </p>

              <!-- Pill: Profil complet -->
              <div class="badge-status-row">
                <span class="pill-profil-complet">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Profil complet</span>
                </span>
              </div>

              <!-- Health and Last Visit row -->
              <div class="health-visit-row">
                <div class="health-status-item">
                  <svg class="heart-icon" viewBox="0 0 24 24" fill="#10b981" width="16" height="16">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  <span>Bonne santé</span>
                </div>

                <div class="last-visit-item">
                  <svg class="calendar-icon" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" width="15" height="15">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>Dernière visite {{ getLastVisitDate(pet) }}</span>
                </div>
              </div>

              <!-- Action button: SEULEMENT Carnet de santé -->
              <div class="card-actions-row">
                <button type="button" class="btn-carnet-sante" (click)="onOpenCarnet(pet)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <rect x="3" y="3" width="18" height="18" rx="4" ry="4"></rect>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                  <span>Carnet de santé</span>
                </button>
              </div>
            </div>
          </div>
        }

        @if (myPets().length === 0 && !petPassService.isLoading()) {
          <div class="empty-pets-state">
            <div class="empty-icon-wrap">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2">
                <path d="M12 11c-1.8 0-3.3 1.5-3.3 3.8 0 2.3 1.5 4.2 3.3 4.2s3.3-1.9 3.3-4.2c0-2.3-1.5-3.8-3.3-3.8zM7 9.5C5.9 9.5 5 10.4 5 11.5S5.9 13.5 7 13.5s2-.9 2-2S8.1 9.5 7 9.5zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM4.5 14C3.7 14 3 14.7 3 15.5S3.7 17 4.5 17 6 16.3 6 15.5 5.3 14 4.5 14zm15 0c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5 1.5-.7 1.5-1.5-.7-1.5-1.5-1.5z"/>
              </svg>
            </div>
            <h3>Aucun animal enregistré pour le moment</h3>
            <p>Vos compagnons enregistrés dans la base de données apparaîtront ici.</p>
            <button type="button" class="btn-ajouter-first-pet" (click)="openAddPetModal()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Ajouter un animal</span>
            </button>
          </div>
        } @else if (filteredPets().length === 0) {
          <div class="no-pets-found">
            <div class="no-pets-icon">🔍</div>
            <h3>Aucun animal ne correspond à votre recherche</h3>
            <p>Aucun résultat pour cette sélection ou recherche.</p>
            <button type="button" class="btn-reset-search" (click)="resetFilters()">
              Réinitialiser les filtres
            </button>
          </div>
        }
      </section>

      <!-- 4. MODAL AJOUTER UN ANIMAL (Multi-step identical to PetPass) -->
      @if (showAddPetModal) {
        <div class="modal-overlay" (click)="showAddPetModal = false">
          <div class="add-pet-modal-card" (click)="$event.stopPropagation()">
            <!-- Left Side Banner with Foreground Typography & Clean Illustration -->
            <div class="add-pet-side-banner">
              <!-- Header with Official Logo -->
              <div class="side-brand-header">
                <div class="side-logo-wrap">
                  <img src="assets/images/medivet-logo-icon.png" alt="MediVet" class="brand-heart-icon" />
                  <span class="brand-title">MediVet <span class="brand-subtitle">Connect</span></span>
                </div>
              </div>

              <!-- Main Title & Subtitle in FOREGROUND, 100% visible -->
              <div class="side-intro">
                <h2 class="side-main-title">Add a Pet</h2>
                <p class="side-main-desc">
                  Help us keep your furry friend<br />healthy and happy !
                </p>
              </div>

              <!-- Illustration below the text -->
              <div class="side-illustration-wrap">
                <img src="assets/images/add-pet-illustration-clean.png" alt="Pets illustration" class="side-illustration-img" />
              </div>
            </div>

            <!-- Right Form Content -->
            <div class="add-pet-form-container">
              <!-- Header with Stepper and Close Button -->
              <div class="form-stepper-header">
                <div class="modal-stepper">
                  <div class="step-item" [class.completed]="currentModalStep > 1" [class.active]="currentModalStep === 1" (click)="goToStep(1)">
                    <span class="step-badge" [class.completed-badge]="currentModalStep > 1">
                      @if (currentModalStep > 1) {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" width="13" height="13">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      } @else {
                        1
                      }
                    </span>
                    <span class="step-label">Pet Information</span>
                    @if (currentModalStep === 1) {
                      <div class="step-active-bar"></div>
                    }
                  </div>

                  <div class="step-divider-line" [class.active-divider]="currentModalStep > 1"></div>

                  <div class="step-item" [class.completed]="currentModalStep > 2" [class.active]="currentModalStep === 2" (click)="goToStep(2)">
                    <span class="step-badge" [class.completed-badge]="currentModalStep > 2">
                      @if (currentModalStep > 2) {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" width="13" height="13">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      } @else {
                        2
                      }
                    </span>
                    <span class="step-label">Medical Details</span>
                    @if (currentModalStep === 2) {
                      <div class="step-active-bar"></div>
                    }
                  </div>

                  <div class="step-divider-line" [class.active-divider]="currentModalStep > 2"></div>

                  <div class="step-item" [class.active]="currentModalStep === 3" (click)="goToStep(3)">
                    <span class="step-badge">3</span>
                    <span class="step-label">Confirm</span>
                    @if (currentModalStep === 3) {
                      <div class="step-active-bar"></div>
                    }
                  </div>
                </div>

                <button class="btn-close-modal" (click)="showAddPetModal = false" aria-label="Close">
                  ✕
                </button>
              </div>

              <!-- Step 1 Body: Pet Information -->
              @if (currentModalStep === 1) {
                <div class="add-pet-form-grid">
                  <!-- Row 1: Name & Species -->
                  <div class="form-field-wrap">
                    <label class="field-label">
                      <img src="assets/images/green-paw-icon.png" alt="paw" class="field-icon-img" />
                      Name of your pet *
                    </label>
                    <div class="input-with-icon">
                      <img src="assets/images/green-paw-icon.png" alt="paw" class="prefix-icon-img" />
                      <input type="text" [(ngModel)]="newPet.name" class="styled-input with-prefix" placeholder="e.g. Milo, Bella, Max..." />
                    </div>
                  </div>

                  <div class="form-field-wrap">
                    <label class="field-label">
                      <span class="field-icon">🐾</span>
                      Species *
                    </label>
                    <div class="select-with-icon">
                      <select [(ngModel)]="newPet.species" class="styled-select">
                        <option value="" disabled selected>Select species</option>
                        <option value="CHIEN">🐶 Dog</option>
                        <option value="CHAT">🐱 Cat</option>
                        <option value="NAC">🐰 Rabbit (NAC)</option>
                        <option value="RONGEUR">🐹 Rodent</option>
                        <option value="OISEAU">🦜 Bird</option>
                        <option value="AUTRE">🐾 Other</option>
                      </select>
                    </div>
                  </div>

                  <!-- Row 2: Breed & Sex -->
                  <div class="form-field-wrap">
                    <label class="field-label">
                      <span class="field-icon">🐕</span>
                      Breed
                    </label>
                    <div class="input-with-icon">
                      <span class="prefix-icon">🦴</span>
                      <input type="text" [(ngModel)]="newPet.breed" class="styled-input with-prefix" placeholder="e.g. Labrador, Siamois..." />
                    </div>
                  </div>

                  <div class="form-field-wrap">
                    <label class="field-label">
                      <span class="field-icon">⚧</span>
                      Sex *
                    </label>
                    <div class="input-with-icon">
                      @if (newPet.gender) {
                        <img 
                          [src]="getGenderIcon(newPet.gender)" 
                          [alt]="newPet.gender === 'F' ? 'Female' : 'Male'" 
                          class="prefix-icon-img" 
                        />
                      }
                      <select [(ngModel)]="newPet.gender" class="styled-select" [class.with-prefix]="!!newPet.gender">
                        <option value="" disabled selected>Select sex</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                      </select>
                    </div>
                  </div>

                  <!-- Row 3: Age & Weight -->
                  <div class="form-field-wrap">
                    <label class="field-label">
                      <span class="field-icon">📅</span>
                      Age *
                    </label>
                    <div class="input-with-icon">
                      <span class="prefix-icon">🎂</span>
                      <input type="text" [(ngModel)]="newPet.ageStr" class="styled-input with-prefix" placeholder="e.g. 2 years" />
                    </div>
                  </div>

                  <div class="form-field-wrap">
                    <label class="field-label">
                      <span class="field-icon">⚖</span>
                      Weight (kg) *
                    </label>
                    <div class="input-with-icon">
                      <span class="prefix-icon">⚖</span>
                      <input type="number" [(ngModel)]="newPet.weightKg" class="styled-input with-prefix" placeholder="e.g. 10" />
                    </div>
                  </div>

                  <!-- Row 4: Date of Birth (Full width) -->
                  <div class="form-field-wrap full-col">
                    <label class="field-label">
                      <span class="field-icon">📅</span>
                      Date of Birth *
                    </label>
                    <input type="date" [(ngModel)]="newPet.birthDate" (change)="onBirthDateChange()" class="styled-input" />
                  </div>

                  <!-- Row 5: Microchip Number (Full width) -->
                  <div class="form-field-wrap full-col">
                    <label class="field-label">
                      <img src="assets/images/microchip-icon.png" alt="Microchip" class="field-icon-img" />
                      Microchip Number (optional)
                    </label>
                    <div class="input-with-icon">
                      <img src="assets/images/microchip-icon.png" alt="Microchip" class="prefix-icon-img" />
                      <input type="text" [(ngModel)]="newPet.microchipNumber" maxlength="15" class="styled-input with-prefix" placeholder="e.g. 123456789012345" />
                      <span class="suffix-info" title="Vérification automatique SOAP">ⓘ</span>
                    </div>
                  </div>

                  <!-- Row 6: Photo of your pet (Full width) -->
                  <div class="form-field-wrap full-col">
                    <label class="field-label">
                      <img src="assets/images/pet-photo-icon.png" alt="Photo" class="field-icon-img photo-label-icon" />
                      Photo of your pet (optional)
                    </label>

                    <div class="photo-upload-row">
                      <!-- Dropzone -->
                      <label class="upload-dropzone" [class.has-file]="!!newPetPhotoPreview">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" class="upload-cloud-icon">
                          <path d="M7 16a4 4 0 0 1-.88-7.9A5 5 0 0 1 15.9 6L16 6a5 5 0 0 1 1 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                        </svg>
                        <span class="upload-primary-text">Click to upload or drag and drop</span>
                        <span class="upload-sub-text">PNG, JPG up to 5MB</span>
                        <input type="file" accept="image/*" (change)="onPetPhotoSelected($event)" style="display:none" />
                      </label>

                      <!-- Preview Thumbnail if selected -->
                      @if (newPetPhotoPreview) {
                        <div class="photo-preview-card">
                          <div class="preview-img-box">
                            <img [src]="newPetPhotoPreview" alt="Pet preview" class="preview-thumb" />
                            <span class="preview-check-badge">✓</span>
                          </div>
                          <button type="button" class="btn-remove-photo" (click)="removeSelectedPhoto()">
                            🗑 Remove
                          </button>
                        </div>
                      }
                    </div>
                  </div>
                </div>

                <!-- Step 1 Footer -->
                <div class="add-pet-footer-actions">
                  <button type="button" class="btn-step-cancel" (click)="showAddPetModal = false">
                    ← Cancel
                  </button>
                  <button type="button" class="btn-step-next" (click)="nextStepFrom1()">
                    Next Step →
                  </button>
                </div>
              }

              <!-- Step 2 Body: Medical Details -->
              @if (currentModalStep === 2) {
                <div class="medical-step-content">
                  <!-- Section Header with Cross Icon -->
                  <div class="medical-section-header">
                    <img src="assets/images/step2-cross-icon.png" alt="Medical Details" class="section-cross-icon" />
                    <div class="section-title-wrap">
                      <h3 class="section-title">Medical Details</h3>
                      <p class="section-subtitle">Add your pet's medical information (optional)</p>
                    </div>
                  </div>

                  <!-- Upper Card: Vaccination Status & Medical Records -->
                  <div class="medical-upper-card">
                    <!-- Left: Vaccination Status -->
                    <div class="vaccination-col">
                      <label class="field-label-header">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.3" width="22" height="22" stroke-linecap="round" stroke-linejoin="round" class="header-icon-inline">
                          <path d="m18 2 4 4"></path>
                          <path d="m17 7 3-3"></path>
                          <path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"></path>
                          <path d="m9 11 4 4"></path>
                          <path d="m5 19-3 3"></path>
                          <path d="m14 4 6 6"></path>
                        </svg>
                        Vaccination Status <span class="required-asterisk">*</span>
                      </label>

                      <div class="vaccination-radio-group">
                        <label class="custom-radio-option" (click)="newPetMedical.vaccinationStatus = 'UP_TO_DATE'">
                          <span class="custom-radio-dot" [class.checked]="newPetMedical.vaccinationStatus === 'UP_TO_DATE'">
                            @if (newPetMedical.vaccinationStatus === 'UP_TO_DATE') {
                              <span class="inner-dot"></span>
                            }
                          </span>
                          <span class="radio-option-text">Up to date</span>
                        </label>

                        <label class="custom-radio-option" (click)="newPetMedical.vaccinationStatus = 'PARTIALLY'">
                          <span class="custom-radio-dot" [class.checked]="newPetMedical.vaccinationStatus === 'PARTIALLY'">
                            @if (newPetMedical.vaccinationStatus === 'PARTIALLY') {
                              <span class="inner-dot"></span>
                            }
                          </span>
                          <span class="radio-option-text">Partially vaccinated</span>
                        </label>

                        <label class="custom-radio-option" (click)="newPetMedical.vaccinationStatus = 'NOT_VACCINATED'">
                          <span class="custom-radio-dot" [class.checked]="newPetMedical.vaccinationStatus === 'NOT_VACCINATED'">
                            @if (newPetMedical.vaccinationStatus === 'NOT_VACCINATED') {
                              <span class="inner-dot"></span>
                            }
                          </span>
                          <span class="radio-option-text">Not vaccinated</span>
                        </label>
                      </div>
                    </div>

                    <!-- Right: Medical Records -->
                    <div class="medical-records-col">
                      <label class="field-label-header">
                        <img src="assets/images/step2-folder-icon.png" alt="Medical Records" class="header-icon-img" />
                        Medical Records
                      </label>

                      <label class="medical-upload-dropzone" [class.has-file]="!!newPetMedical.medicalRecordsFileName">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" class="medical-cloud-icon">
                          <path d="M7 16a4 4 0 0 1-.88-7.9A5 5 0 0 1 15.9 6L16 6a5 5 0 0 1 1 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                        </svg>
                        <span class="medical-upload-title">
                          {{ newPetMedical.medicalRecordsFileName ? newPetMedical.medicalRecordsFileName : 'Click to upload medical records' }}
                        </span>
                        <span class="medical-upload-subtitle">PNG, JPG or PDF (Max 5MB)</span>
                        <input type="file" accept=".png,.jpg,.jpeg,.pdf" (change)="onMedicalRecordSelected($event)" style="display:none" />
                      </label>
                    </div>
                  </div>

                  <!-- 2x2 Grid of Medical Fields -->
                  <div class="medical-fields-grid">
                    <!-- Row 1 Left: Health Conditions -->
                    <div class="form-field-wrap">
                      <label class="field-label">
                        <img src="assets/images/step2-heart-icon.png" alt="Health Conditions" class="field-icon-img heart-icon-img" />
                        Health Conditions
                      </label>
                      <div class="input-with-icon-right">
                        <input type="text" [(ngModel)]="newPetMedical.healthConditions" class="styled-input with-suffix" placeholder="e.g. Allergies, chronic diseases..." />
                        <span class="suffix-info" title="Information regarding medical conditions">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                          </svg>
                        </span>
                      </div>
                    </div>

                    <!-- Row 1 Right: Current Medications -->
                    <div class="form-field-wrap">
                      <label class="field-label">
                        <img src="assets/images/step2-pills-icon.png" alt="Current Medications" class="field-icon-img pills-icon-img" />
                        Current Medications
                      </label>
                      <input type="text" [(ngModel)]="newPetMedical.currentMedications" class="styled-input" placeholder="e.g. Antifungal, Insulin..." />
                    </div>

                    <!-- Row 2 Left: Allergies -->
                    <div class="form-field-wrap">
                      <label class="field-label">
                        <img src="assets/images/step2-paw-cross-icon.png" alt="Allergies" class="field-icon-img" />
                        Allergies
                      </label>
                      <input type="text" [(ngModel)]="newPetMedical.allergies" class="styled-input" placeholder="e.g. Pollen, Chicken..." />
                    </div>

                    <!-- Row 2 Right: Additional Notes -->
                    <div class="form-field-wrap">
                      <label class="field-label">
                        <img src="assets/images/step2-notes-icon.png" alt="Additional Notes" class="field-icon-img notes-icon-img" />
                        Additional Notes
                      </label>
                      <input type="text" [(ngModel)]="newPetMedical.additionalNotes" class="styled-input" placeholder="Any other important information..." />
                    </div>
                  </div>

                  <!-- Bottom Info Banner -->
                  <div class="medical-info-banner">
                    <div class="banner-left-info">
                      <span class="info-circle-badge">i</span>
                      <span class="info-text">This information helps us provide the best care for your pet.</span>
                    </div>
                    <img src="assets/images/green-paw-icon.png" alt="paw" class="banner-paw-watermark-small" />
                  </div>
                </div>

                <!-- Step 2 Footer Actions -->
                <div class="add-pet-footer-actions">
                  <button type="button" class="btn-step-prev" (click)="currentModalStep = 1">
                    ← Previous
                  </button>
                  <button type="button" class="btn-step-next" (click)="submitCreatePet()">
                    Save Pet →
                  </button>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .mes-animaux-page {
      max-width: 1240px;
      margin: 0 auto;
      padding: 24px 24px 60px;
      display: flex;
      flex-direction: column;
      gap: 28px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    /* 1. HERO BANNER */
    .mes-animaux-banner {
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
        opacity: 0.85;
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
        letter-spacing: -0.5px;
        margin: 0;
      }
    }

    .banner-subtitle {
      font-size: 1.05rem;
      color: #047857;
      margin: 0 0 24px 0;
      font-weight: 500;
      line-height: 1.45;
    }

    .banner-actions-row {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }

    .btn-ajouter-animal {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: #059669;
      color: #ffffff;
      font-weight: 700;
      font-size: 0.95rem;
      border: none;
      border-radius: 9999px;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(5, 150, 105, 0.28);
      transition: all 0.2s ease;

      &:hover {
        background: #047857;
        transform: translateY(-2px);
        box-shadow: 0 6px 18px rgba(5, 150, 105, 0.36);
      }
    }

    .btn-retour-petpass {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 22px;
      background: #044e3f;
      color: #ffffff;
      font-weight: 700;
      font-size: 0.95rem;
      border: none;
      border-radius: 9999px;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(4, 78, 63, 0.22);
      transition: all 0.2s ease;

      &:hover {
        background: #022c24;
        transform: translateY(-2px);
        box-shadow: 0 6px 18px rgba(4, 78, 63, 0.32);
      }
    }

    .banner-pets-wrapper {
      position: absolute;
      right: 32px;
      bottom: 0;
      z-index: 2;
      height: 100%;
      display: flex;
      align-items: flex-end;
      pointer-events: none;

      .banner-pets-cutout {
        max-height: 185px;
        width: auto;
        display: block;
        filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.08));
      }
    }

    /* 2. ANIMALS GRID (2 COLUMNS) */
    .animals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(460px, 1fr));
      gap: 24px;
    }

    .animal-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      padding: 24px;
      display: flex;
      gap: 24px;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.03);
      transition: all 0.25s ease;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 28px rgba(16, 185, 129, 0.08);
        border-color: #cbd5e1;
      }
    }

    .pet-photo-wrapper {
      flex-shrink: 0;
      width: 140px;
      height: 140px;
      border-radius: 20px;
      overflow: hidden;
      background: #f1f5f9;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);

      .pet-photo-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
    }

    .pet-card-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .card-top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;

      .name-gender-wrap {
        display: flex;
        align-items: center;
        gap: 8px;

        .pet-card-name {
          font-size: 1.45rem;
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

      .btn-dots-menu {
        background: transparent;
        border: none;
        color: #64748b;
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;

        &:hover {
          color: #0f172a;
          background: #f1f5f9;
        }
      }
    }

    .pet-meta-text {
      font-size: 0.95rem;
      color: #64748b;
      margin: 0 0 10px 0;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;

      .meta-paw {
        font-size: 0.9rem;
      }
    }

    .badge-status-row {
      margin-bottom: 12px;

      .pill-profil-complet {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        background: #d1fae5;
        color: #059669;
        font-size: 0.82rem;
        font-weight: 700;
        border-radius: 9999px;
      }
    }

    .health-visit-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 20px;
      font-size: 0.88rem;

      .health-status-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 700;
        color: #065f46;

        .heart-icon {
          flex-shrink: 0;
        }
      }

      .last-visit-item {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #64748b;
        font-weight: 500;

        .calendar-icon {
          flex-shrink: 0;
        }
      }
    }

    /* 2. FILTER BAR */
    .mes-animaux-filter-bar {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      margin-top: 2px;
      margin-bottom: 2px;
    }

    .filter-chips-container {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 6px;
      background: #f8fafc;
      border-radius: 9999px;
      border: 1px solid #e2e8f0;
      overflow-x: auto;
    }

    .filter-tab-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 18px;
      border-radius: 9999px;
      border: none;
      background: transparent;
      color: #64748b;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;

      .chip-emoji {
        font-size: 1.05rem;
      }

      .filter-count-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        height: 20px;
        padding: 0 6px;
        font-size: 0.75rem;
        font-weight: 800;
        border-radius: 9999px;
        background: #e2e8f0;
        color: #475569;
        transition: all 0.2s ease;
      }

      &:hover {
        color: #0f172a;
        background: rgba(255, 255, 255, 0.8);
      }

      &.active {
        background: #044e3f;
        color: #ffffff;
        box-shadow: 0 2px 8px rgba(4, 78, 63, 0.2);

        .filter-count-badge {
          background: rgba(255, 255, 255, 0.25);
          color: #ffffff;
        }
      }
    }

    .card-actions-row {
      display: flex;
      align-items: center;
      margin-top: auto;
      width: 100%;

      .btn-carnet-sante {
        width: 100%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px 20px;
        background: #044e3f;
        color: #ffffff;
        border: none;
        font-size: 0.92rem;
        font-weight: 700;
        border-radius: 9999px;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(4, 78, 63, 0.15);

        &:hover {
          background: #022c24;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(4, 78, 63, 0.25);
        }

        &:active {
          transform: translateY(0);
        }
      }
    }

    .empty-pets-state {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 24px;
      text-align: center;
      background: #ffffff;
      border: 1px dashed #cbd5e1;
      border-radius: 24px;

      .empty-icon-wrap {
        width: 76px;
        height: 76px;
        border-radius: 50%;
        background: #ecfdf5;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
      }

      h3 {
        font-size: 1.25rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0 0 8px 0;
      }

      p {
        font-size: 0.95rem;
        color: #64748b;
        margin: 0 0 20px 0;
      }

      .btn-ajouter-first-pet {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        background: #059669;
        color: #ffffff;
        font-size: 0.95rem;
        font-weight: 700;
        border: none;
        border-radius: 9999px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: #047857;
          transform: translateY(-1px);
        }
      }
    }

    /* 3. BOTTOM WIDGETS ROW */
    .bottom-widgets-row {
      display: grid;
      grid-template-columns: 2.2fr 1fr;
      gap: 24px;
    }

    .reminder-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      padding: 24px 28px;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.03);
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .reminder-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      .reminder-title-wrap {
        display: flex;
        align-items: center;
        gap: 10px;

        .bell-icon {
          color: #0f172a;
        }

        h3 {
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }
      }

      .decorative-sparks {
        display: flex;
        gap: 3px;

        span {
          width: 3px;
          height: 12px;
          background: #059669;
          border-radius: 2px;
          transform: rotate(25deg);

          &:nth-child(2) { height: 16px; }
          &:nth-child(3) { height: 10px; }
        }
      }
    }

    .reminder-body-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .reminder-item {
      display: flex;
      align-items: center;
      gap: 14px;
      flex: 1;

      .reminder-item-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: #e6fcf5;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .reminder-item-text {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .rem-item-title {
          font-size: 0.95rem;
          font-weight: 800;
          color: #0f172a;
        }

        .rem-item-sub {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 500;
        }
      }

      .reminder-date-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        background: #e0f7f0;
        color: #0d9488;
        font-size: 0.82rem;
        font-weight: 700;
        border-radius: 9999px;
        margin-left: auto;
      }
    }

    .vertical-divider {
      width: 1px;
      height: 48px;
      background: #e2e8f0;
      margin: 0 8px;
    }

    .reminder-chevron {
      padding: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.2s;

      &:hover {
        background: #f1f5f9;
      }
    }

    /* Stats Counter Card */
    .stats-counter-card {
      background: linear-gradient(135deg, #e6fcf5 0%, #d3f9ec 50%, #bbf7e2 100%);
      border: 1px solid rgba(255, 255, 255, 0.7);
      border-radius: 24px;
      padding: 24px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 18px rgba(16, 185, 129, 0.08);

      .counter-top-row {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 4px;

        .counter-paw {
          flex-shrink: 0;
        }

        .huge-number {
          font-size: 3.5rem;
          font-weight: 900;
          color: #064e3b;
          line-height: 1;
        }

        .counter-heart {
          flex-shrink: 0;
        }
      }

      .counter-label {
        font-size: 0.95rem;
        font-weight: 700;
        color: #047857;
      }
    }

    /* Modal Styling */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .add-pet-modal-card {
      background: #ffffff;
      border-radius: 28px;
      width: 100%;
      max-width: 1040px;
      max-height: 94vh;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.3);
      display: flex;
      overflow: hidden;
      animation: modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.96) translateY(12px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    /* Left Side Banner */
    .add-pet-side-banner {
      width: 370px;
      flex-shrink: 0;
      position: relative;
      background: #e8fcf6;
      padding: 30px 24px 0;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #d1fae5;
      overflow: hidden;

      .side-brand-header {
        position: relative;
        z-index: 10;
        margin-bottom: 14px;

        .side-logo-wrap {
          display: flex;
          align-items: center;
          gap: 12px;

          .brand-heart-icon {
            width: 44px;
            height: 44px;
            flex-shrink: 0;
            object-fit: contain;
          }

          .brand-title {
            font-size: 26px;
            font-weight: 800;
            color: #064e3b;
            letter-spacing: -0.4px;
            line-height: 1;

            .brand-subtitle {
              color: #059669;
              font-weight: 600;
            }
          }
        }
      }

      .side-intro {
        position: relative;
        z-index: 10;
        text-align: center;
        margin-top: 18px;
        margin-bottom: 8px;

        .side-main-title {
          font-size: 36px;
          font-weight: 800;
          color: #064e3b;
          letter-spacing: -0.6px;
          margin: 0 0 8px;
          line-height: 1.1;
          text-align: center;
        }

        .side-main-desc {
          font-size: 15px;
          color: #047857;
          line-height: 1.45;
          margin: 0 auto;
          font-weight: 500;
          letter-spacing: -0.1px;
          text-align: center;
        }
      }

      .side-illustration-wrap {
        margin-top: auto;
        margin-left: 0;
        margin-right: 0;
        margin-bottom: 8px;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: flex-end;
        border: none;
        background: transparent;
        box-shadow: none;
        padding: 0 8px;
        overflow: hidden;

        .side-illustration-img {
          width: 100%;
          max-height: 440px;
          height: auto;
          display: block;
          object-fit: contain;
          border: none;
          box-shadow: none;
          border-radius: 0;
        }
      }
    }

    /* Right Form Content */
    .add-pet-form-container {
      flex: 1;
      padding: 28px 36px 24px 32px;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      max-height: 94vh;
      background: #ffffff;

      .form-stepper-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 22px;
        padding-bottom: 14px;
        border-bottom: 1px solid #f1f5f9;

        .modal-stepper {
          display: flex;
          align-items: center;
          gap: 12px;

          .step-item {
            display: flex;
            align-items: center;
            gap: 8px;
            position: relative;
            padding-bottom: 6px;

            .step-badge {
              width: 26px;
              height: 26px;
              border-radius: 50%;
              background: #f1f5f9;
              border: 1.5px solid #cbd5e1;
              color: #64748b;
              font-size: 12px;
              font-weight: 700;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .step-label {
              font-size: 13.5px;
              font-weight: 600;
              color: #64748b;
            }

            &.completed {
              cursor: pointer;
              .step-badge {
                background: #059669;
                border-color: #059669;
                color: #ffffff;
              }
              .step-label {
                color: #064e3b;
                font-weight: 600;
              }
            }

            &.active {
              .step-badge {
                background: #059669;
                border-color: #059669;
                color: #ffffff;
                box-shadow: 0 2px 6px rgba(5, 150, 105, 0.35);
              }
              .step-label {
                color: #0f172a;
                font-weight: 700;
              }
              .step-active-bar {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 2.5px;
                background: #059669;
                border-radius: 9999px;
              }
            }
          }

          .step-divider-line {
            width: 32px;
            height: 2px;
            background: #e2e8f0;

            &.active-divider {
              background: #059669;
            }
          }
        }

        .btn-close-modal {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          font-size: 15px;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          &:hover {
            background: #fee2e2;
            color: #ef4444;
            border-color: #fca5a5;
          }
        }
      }

      /* Form Grid */
      .add-pet-form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px 18px;

        .form-field-wrap {
          display: flex;
          flex-direction: column;
          gap: 6px;

          &.full-col {
            grid-column: 1 / -1;
          }

          .field-label {
            font-size: 12.5px;
            font-weight: 700;
            color: #064e3b;
            display: flex;
            align-items: center;
            gap: 6px;

            .field-icon {
              font-size: 14px;
            }

            .field-icon-img {
              width: 17px;
              height: 17px;
              object-fit: contain;
              display: inline-block;
              vertical-align: middle;

              &.photo-label-icon {
                width: 48px;
                height: 48px;
                object-fit: contain;
                filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08));
              }
            }
          }

          .styled-input, .styled-select {
            width: 100%;
            height: 42px;
            padding: 0 14px;
            border: 1.5px solid #e2e8f0;
            border-radius: 12px;
            font-size: 13.5px;
            font-family: inherit;
            color: #0f172a;
            background: #ffffff;
            outline: none;
            transition: all 0.15s;
            box-sizing: border-box;

            &::placeholder {
              color: #94a3b8;
            }

            &:focus {
              border-color: #059669;
              box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
            }
          }

          .input-with-icon {
            position: relative;
            display: flex;
            align-items: center;

            .prefix-icon {
              position: absolute;
              left: 12px;
              font-size: 14px;
              color: #059669;
              pointer-events: none;
            }

            .prefix-icon-img {
              position: absolute;
              left: 11px;
              width: 17px;
              height: 17px;
              object-fit: contain;
              pointer-events: none;
              z-index: 2;
            }

            .styled-input.with-prefix,
            .styled-select.with-prefix {
              padding-left: 36px;
            }

            .suffix-info {
              position: absolute;
              right: 12px;
              font-size: 14px;
              color: #94a3b8;
              cursor: help;
            }
          }

          /* Photo upload zone */
          .photo-upload-row {
            display: flex;
            gap: 16px;
            align-items: center;

            .upload-dropzone {
              flex: 1;
              border: 1.5px dashed #cbd5e1;
              background: #f8fafc;
              border-radius: 14px;
              padding: 14px 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: all 0.15s;

              &:hover {
                border-color: #059669;
                background: #f0fdf4;
              }

              .upload-cloud-icon {
                width: 28px;
                height: 28px;
                margin-bottom: 4px;
              }

              .upload-primary-text {
                font-size: 12.5px;
                font-weight: 700;
                color: #334155;
              }

              .upload-sub-text {
                font-size: 11px;
                color: #94a3b8;
                font-weight: 500;
              }
            }

            .photo-preview-card {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 6px;

              .preview-img-box {
                position: relative;
                width: 72px;
                height: 72px;
                border-radius: 14px;
                overflow: hidden;
                border: 2px solid #bbf7d0;
                box-shadow: 0 4px 10px rgba(5, 150, 105, 0.15);

                .preview-thumb {
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                }

                .preview-check-badge {
                  position: absolute;
                  top: 4px;
                  right: 4px;
                  width: 18px;
                  height: 18px;
                  border-radius: 50%;
                  background: #059669;
                  color: #ffffff;
                  font-size: 11px;
                  font-weight: 800;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
                }
              }

              .btn-remove-photo {
                background: none;
                border: none;
                color: #64748b;
                font-size: 11.5px;
                font-weight: 600;
                cursor: pointer;
                padding: 2px 6px;
                border-radius: 6px;
                display: flex;
                align-items: center;
                gap: 4px;

                &:hover {
                  color: #ef4444;
                  background: #fee2e2;
                }
              }
            }
          }
        }
      }

      /* Step 2: Medical Details Content */
      .medical-step-content {
        display: flex;
        flex-direction: column;
        flex: 1;

        .medical-section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;

          .section-cross-icon {
            width: 38px;
            height: 38px;
            object-fit: contain;
            flex-shrink: 0;
          }

          .section-title-wrap {
            display: flex;
            flex-direction: column;
            gap: 2px;

            .section-title {
              font-size: 17px;
              font-weight: 800;
              color: #064e3b;
              margin: 0;
              line-height: 1.2;
            }

            .section-subtitle {
              font-size: 12px;
              color: #64748b;
              margin: 0;
            }
          }
        }

        /* Upper card: Vaccination Status & Medical Records */
        .medical-upper-card {
          border: 1.5px solid #eef2f6;
          background: #fbfdfc;
          border-radius: 16px;
          padding: 16px 20px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          align-items: start;

          .field-label-header {
            font-size: 13px;
            font-weight: 700;
            color: #064e3b;
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 12px;

            .header-icon-inline {
              width: 22px;
              height: 22px;
              flex-shrink: 0;
            }

            .header-icon-img {
              width: 24px;
              height: 24px;
              object-fit: contain;
              flex-shrink: 0;
            }

            .required-asterisk {
              color: #ef4444;
            }
          }

          .vaccination-radio-group {
            display: flex;
            flex-direction: column;
            gap: 10px;

            .custom-radio-option {
              display: flex;
              align-items: center;
              gap: 10px;
              cursor: pointer;
              user-select: none;

              .custom-radio-dot {
                width: 17px;
                height: 17px;
                border-radius: 50%;
                border: 2px solid #cbd5e1;
                background: #ffffff;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.15s;

                &.checked {
                  border-color: #059669;

                  .inner-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #059669;
                  }
                }
              }

              .radio-option-text {
                font-size: 13px;
                font-weight: 600;
                color: #1e293b;
              }
            }
          }

          .medical-records-col {
            .medical-upload-dropzone {
              border: 1.5px dashed #cbd5e1;
              background: #ffffff;
              border-radius: 12px;
              padding: 14px 10px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              cursor: pointer;
              transition: all 0.15s;

              &:hover {
                border-color: #059669;
                background: #f0fdf4;
              }

              &.has-file {
                border-color: #059669;
                background: #f0fdf4;
              }

              .medical-cloud-icon {
                width: 24px;
                height: 24px;
                margin-bottom: 4px;
              }

              .medical-upload-title {
                font-size: 12.5px;
                font-weight: 700;
                color: #0f172a;
                margin-bottom: 2px;
                max-width: 180px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }

              .medical-upload-subtitle {
                font-size: 11px;
                color: #64748b;
              }
            }
          }
        }

        /* 2x2 Grid of medical fields */
        .medical-fields-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px 18px;
          margin-top: 16px;

          .form-field-wrap {
            display: flex;
            flex-direction: column;
            gap: 7px;

            .field-label {
              font-size: 13.5px;
              font-weight: 700;
              color: #064e3b;
              display: flex;
              align-items: center;
              gap: 10px;

              .field-icon-img {
                width: 30px;
                height: 30px;
                object-fit: contain;
                flex-shrink: 0;
                filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08));

                &.heart-icon-img {
                  width: 44px;
                  height: 44px;
                }

                &.pills-icon-img {
                  width: 26px;
                  height: 26px;
                }

                &.notes-icon-img {
                  width: 26px;
                  height: 26px;
                }
              }
            }

            .styled-input {
              width: 100%;
              height: 44px;
              padding: 0 16px;
              border: 1.5px solid #e2e8f0;
              border-radius: 12px;
              font-size: 13.5px;
              font-family: inherit;
              color: #0f172a;
              background: #ffffff;
              outline: none;
              transition: all 0.15s ease-in-out;
              box-sizing: border-box;

              &::placeholder {
                color: #94a3b8;
                font-size: 13px;
              }

              &:focus {
                border-color: #059669;
                box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
              }
            }

            .input-with-icon-right {
              position: relative;
              display: flex;
              align-items: center;
              width: 100%;

              .styled-input.with-suffix {
                padding-right: 42px;
              }

              .suffix-info {
                position: absolute;
                right: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #94a3b8;
                cursor: pointer;
                transition: color 0.15s;

                &:hover {
                  color: #059669;
                }
              }
            }
          }
        }

        /* Bottom info banner */
        .medical-info-banner {
          margin-top: 18px;
          background: #e6f7ef;
          border-radius: 12px;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;

          .banner-left-info {
            display: flex;
            align-items: center;
            gap: 12px;

            .info-circle-badge {
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: #059669;
              color: #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: 700;
              font-style: normal;
              font-family: inherit;
              flex-shrink: 0;
            }

            .info-text {
              font-size: 13px;
              font-weight: 600;
              color: #064e3b;
            }
          }

          .banner-paw-watermark-small {
            width: 42px;
            height: 42px;
            object-fit: contain;
            opacity: 0.75;
            flex-shrink: 0;
          }
        }
      }

      /* Modal Footer Actions */
      .add-pet-footer-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 22px;
        padding-top: 16px;
        border-top: 1px solid #f1f5f9;

        .btn-step-prev {
          background: #ffffff;
          border: 1.5px solid #059669;
          border-radius: 9999px;
          padding: 10px 24px;
          font-size: 13.5px;
          font-weight: 700;
          color: #059669;
          cursor: pointer;
          transition: all 0.15s;

          &:hover {
            background: #f0fdf4;
          }
        }

        .btn-step-cancel {
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          border-radius: 9999px;
          padding: 10px 24px;
          font-size: 13.5px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s;

          &:hover {
            background: #f8fafc;
            border-color: #94a3b8;
          }
        }

        .btn-step-next {
          background: #059669;
          border: none;
          border-radius: 9999px;
          padding: 11px 30px;
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 14px rgba(5, 150, 105, 0.3);
          transition: all 0.15s;

          &:hover {
            background: #047857;
            transform: translateY(-1px);
            box-shadow: 0 6px 18px rgba(5, 150, 105, 0.4);
          }

          &:active {
            transform: translateY(0);
          }
        }
      }
    }

    @media (max-width: 900px) {
      .mes-animaux-banner {
        flex-direction: column;
        align-items: flex-start;
        padding: 28px 24px;

        .banner-pets-wrapper {
          display: none;
        }
      }

      .animals-grid {
        grid-template-columns: 1fr;
      }

      .bottom-widgets-row {
        grid-template-columns: 1fr;
      }
    }

    .no-pets-found {
      grid-column: 1 / -1;
      text-align: center;
      padding: 48px 24px;
      background: #ffffff;
      border: 1.5px dashed #cbd5e1;
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;

      .no-pets-icon {
        font-size: 2.2rem;
      }

      h3 {
        font-size: 1.25rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0;
      }

      p {
        font-size: 0.95rem;
        color: #64748b;
        margin: 0;
      }

      .btn-reset-search {
        margin-top: 8px;
        padding: 9px 20px;
        background: #059669;
        color: #ffffff;
        font-weight: 700;
        font-size: 0.9rem;
        border: none;
        border-radius: 9999px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: #047857;
        }
      }
    }
  `]
})
export class PetPassAllPetsComponent {
  readonly petPassService = inject(PetPassService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  readonly searchService = inject(SearchService);

  back = output<void>();
  openCarnet = output<Animal>();
  addPet = output<void>();

  showAddPetModal = false;
  currentModalStep = 1;
  newPetPhotoPreview: string = '';

  selectedCategory = signal<string>('TOUS');

  newPet: {
    name: string;
    species: 'CHIEN' | 'CHAT' | 'NAC' | 'RONGEUR' | 'OISEAU' | 'AUTRE' | '';
    breed: string;
    birthDate: string;
    ageStr: string;
    microchipNumber: string;
    gender: 'M' | 'F' | '';
    weightKg: number | null;
    photoUrl: string;
  } = {
    name: '',
    species: '',
    breed: '',
    birthDate: '',
    ageStr: '',
    microchipNumber: '',
    gender: '',
    weightKg: null,
    photoUrl: ''
  };

  newPetMedical: {
    vaccinationStatus: 'UP_TO_DATE' | 'PARTIALLY' | 'NOT_VACCINATED';
    medicalRecordsFileName: string;
    healthConditions: string;
    currentMedications: string;
    allergies: string;
    additionalNotes: string;
  } = {
    vaccinationStatus: 'UP_TO_DATE',
    medicalRecordsFileName: '',
    healthConditions: '',
    currentMedications: '',
    allergies: '',
    additionalNotes: ''
  };

  // Uniquement les vrais animaux depuis PostgreSQL (aucun animal fictif / démo)
  readonly myPets = computed<Animal[]>(() => {
    return this.petPassService.animals();
  });

  readonly speciesCounts = computed(() => {
    const list = this.myPets();
    return {
      all: list.length,
      chiens: list.filter(p => p.species === 'CHIEN').length,
      chats: list.filter(p => p.species === 'CHAT').length,
      autres: list.filter(p => p.species !== 'CHIEN' && p.species !== 'CHAT').length
    };
  });

  readonly filteredPets = computed<Animal[]>(() => {
    const q = this.searchService.query().trim().toLowerCase();
    const cat = this.selectedCategory();
    let list = this.myPets();

    if (cat === 'CHIEN') {
      list = list.filter(p => p.species === 'CHIEN');
    } else if (cat === 'CHAT') {
      list = list.filter(p => p.species === 'CHAT');
    } else if (cat === 'AUTRE') {
      list = list.filter(p => p.species !== 'CHIEN' && p.species !== 'CHAT');
    }

    if (!q) return list;
    return list.filter(pet => {
      const name = (pet.name || '').toLowerCase();
      const breed = (pet.breed || '').toLowerCase();
      const species = (pet.species || '').toLowerCase();
      const speciesFr = this.formatSpeciesLabel(pet.species).toLowerCase();
      const chip = (pet.microchipNumber || '').toLowerCase();
      return name.includes(q) || breed.includes(q) || species.includes(q) || speciesFr.includes(q) || chip.includes(q);
    });
  });

  resetFilters(): void {
    this.selectedCategory.set('TOUS');
    this.searchService.clear();
  }

  goBack(): void {
    this.back.emit();
  }

  openAddPetModal(): void {
    this.currentModalStep = 1;
    this.newPet = {
      name: '',
      species: '',
      breed: '',
      birthDate: '',
      ageStr: '',
      microchipNumber: '',
      gender: '',
      weightKg: null,
      photoUrl: ''
    };
    this.newPetPhotoPreview = '';
    this.newPetMedical = {
      vaccinationStatus: 'UP_TO_DATE',
      medicalRecordsFileName: '',
      healthConditions: '',
      currentMedications: '',
      allergies: '',
      additionalNotes: ''
    };
    this.showAddPetModal = true;
  }

  closeAddPetModal(): void {
    this.showAddPetModal = false;
  }

  goToStep(step: number): void {
    if (step > 1 && !this.newPet.name.trim()) {
      this.toast.show('Veuillez entrer le nom de votre animal', 'error');
      return;
    }
    this.currentModalStep = step;
  }

  nextStepFrom1(): void {
    if (!this.newPet.name.trim()) {
      this.toast.show('Veuillez entrer le nom de votre animal', 'error');
      return;
    }
    this.currentModalStep = 2;
  }

  getGenderIcon(gender: 'M' | 'F' | string | undefined | null): string {
    return gender === 'F' ? 'assets/images/gender-female.png' : 'assets/images/gender-male.png';
  }

  private calculateAge(birthDateStr?: string): number {
    if (!birthDateStr) return 1;
    const birthDate = new Date(birthDateStr);
    const now = new Date();
    let years = now.getFullYear() - birthDate.getFullYear();
    const m = now.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
      years--;
    }
    return Math.max(0, years);
  }

  onBirthDateChange(): void {
    if (!this.newPet.birthDate) return;
    const age = this.calculateAge(this.newPet.birthDate);
    this.newPet.ageStr = age <= 1 ? `${age} an` : `${age} ans`;
  }

  onMedicalRecordSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.newPetMedical.medicalRecordsFileName = input.files[0].name;
      this.toast.show(`Dossier médical "${input.files[0].name}" joint`, 'success');
    }
  }

  removeSelectedPhoto(): void {
    this.newPet.photoUrl = '';
    this.newPetPhotoPreview = '';
  }

  onPetPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          this.newPet.photoUrl = compressed;
          this.newPetPhotoPreview = compressed;
        } else {
          this.newPet.photoUrl = rawUrl;
          this.newPetPhotoPreview = rawUrl;
        }
      };
      img.onerror = () => {
        this.newPet.photoUrl = rawUrl;
        this.newPetPhotoPreview = rawUrl;
      };
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  }

  submitCreatePet(): void {
    if (!this.newPet.name.trim()) {
      this.toast.show('Veuillez entrer le nom de votre animal', 'error');
      return;
    }
    let chip = this.newPet.microchipNumber?.trim() || '';
    if (!chip || chip.length !== 15 || !/^\d{15}$/.test(chip)) {
      chip = `${Math.floor(100000000000000 + Math.random() * 900000000000000)}`;
      this.newPet.microchipNumber = chip;
    }

    this.petPassService.createAnimal({
      name: this.newPet.name.trim(),
      species: (this.newPet.species as any) || 'CHIEN',
      breed: this.newPet.breed || undefined,
      birthDate: this.newPet.birthDate || new Date().toISOString().slice(0, 10),
      microchipNumber: this.newPet.microchipNumber,
      gender: (this.newPet.gender as any) || 'M',
      weightKg: this.newPet.weightKg || 5,
      photoUrl: this.newPet.photoUrl || undefined,
      vaccinationStatus: this.newPetMedical.vaccinationStatus,
      currentMedications: this.newPetMedical.currentMedications,
      healthConditions: this.newPetMedical.healthConditions,
      allergies: this.newPetMedical.allergies,
      additionalNotes: this.newPetMedical.additionalNotes
    }).subscribe({
      next: (created) => {
        this.toast.show(`Animal "${created.name}" enregistré avec succès dans la base de données !`, 'success');
        this.showAddPetModal = false;
        this.currentModalStep = 1;
        this.petPassService.loadAnimals();
      },
      error: (err) => {
        console.error('Erreur enregistrement animal PostgreSQL:', err);
        this.toast.show('Erreur lors de l\'enregistrement de l\'animal dans la base de données', 'error');
      }
    });
  }

  onSelectPet(pet: Animal): void {
    this.petPassService.selectAnimal(pet);
    this.openCarnet.emit(pet);
  }

  onOpenCarnet(pet: Animal): void {
    this.petPassService.selectAnimal(pet);
    this.openCarnet.emit(pet);
  }

  goToBooking(): void {
    this.router.navigate(['/booking']);
  }

  formatSpeciesLabel(species: Species): string {
    switch (species) {
      case 'CHIEN': return 'Chien';
      case 'CHAT': return 'Chat';
      case 'RONGEUR': return 'Rongeur';
      case 'NAC': return 'NAC';
      default: return 'Animal';
    }
  }

  formatAge(birthDate?: string): string {
    if (!birthDate) return '2 ans';
    try {
      const birth = new Date(birthDate);
      const now = new Date();
      let years = now.getFullYear() - birth.getFullYear();
      if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
        years--;
      }
      return `${Math.max(1, years)} ans`;
    } catch {
      return '2 ans';
    }
  }

  getLastVisitDate(pet: Animal): string {
    if (pet.name.toLowerCase().includes('max')) return '12/08/2026';
    if (pet.name.toLowerCase().includes('luna')) return '05/09/2026';
    return '15/10/2026';
  }

  getPetPhoto(pet: Animal): string {
    if (pet.photoUrl && pet.photoUrl.trim().length > 0) {
      return pet.photoUrl;
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
}
