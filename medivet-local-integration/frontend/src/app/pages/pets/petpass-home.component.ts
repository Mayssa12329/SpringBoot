import { Component, computed, inject, output, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PetPassService } from '../../services/petpass.service';
import { ToastService } from '../../components/ui/toast/toast.service';
import { Animal } from '../../models/animal.model';
import { OVERVIEW_ICONS, ACTIVITY_ICONS, GENDER_ICONS } from '../../utils/constants/overview-icons';
import { PET_AVATARS } from '../../utils/constants/pet-avatars';
import { AuthService } from '../../services/auth.service';
import { SearchService } from '../../services/search.service';

@Component({
  selector: 'app-petpass-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="petpass-home-container">
      <!-- 1. TOP HERO BANNER (CIRCLED IDENTICAL BLOCK) -->
      <section class="petpass-banner">
        <!-- SVG Organic Background Waves -->
        <div class="banner-bg-decor" aria-hidden="true">
          <svg class="organic-waves" viewBox="0 0 1000 240" preserveAspectRatio="none">
            <!-- Smooth background layers -->
            <path d="M0,0 L1000,0 L1000,240 L0,240 Z" fill="url(#bannerGrad)" />
            <!-- Soft wave curves -->
            <path d="M420,240 C530,170 590,90 710,75 C820,60 920,115 1000,105 L1000,240 Z" fill="#9de6c6" opacity="0.55"/>
            <path d="M520,240 C630,195 700,135 830,128 C920,120 970,155 1000,155 L1000,240 Z" fill="#75dab1" opacity="0.45"/>
            <path d="M360,240 C440,190 510,180 620,210 C700,230 840,240 1000,225 L1000,240 Z" fill="#60ce9f" opacity="0.35"/>

            <defs>
              <linearGradient id="bannerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#def7ec"/>
                <stop offset="35%" stop-color="#d0f4e5"/>
                <stop offset="65%" stop-color="#ddf7ee"/>
                <stop offset="85%" stop-color="#c1edd8"/>
                <stop offset="100%" stop-color="#b6ead2"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <!-- 3D Green Pet Paw in exact position as mockup -->
        <div class="paw-3d-wrap" aria-hidden="true">
          <img src="assets/images/green-paw-3d.png" alt="Pet Paw" class="paw-3d-img" />
        </div>

        <!-- Left Text Content -->
        <div class="banner-content">
          <h1 class="banner-title"><span class="title-dark">Welcome </span>{{ firstName() }}!</h1>
          <h2 class="banner-subtitle">Your pet’s digital health passport</h2>
          <p class="banner-desc">
            Keep track of your pet’s medical history,<br />
            vaccinations and more, all in one place.
          </p>
          <button class="btn-banner-cta" (click)="openAllPets()">
            <span>View My PetPass</span>
            <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>

        <!-- Right Pets & Passport Illustration (Pristine Cutout) -->
        <div class="banner-illustration-wrap">
          <img 
            src="assets/images/petpass-pets.png" 
            alt="PetPass - Puppy, Cat and Health Passport" 
            class="banner-pets-img"
          />
        </div>
      </section>

      <!-- KPI STATS ROW (UNDER BANNER) -->
      <div class="stats-row">
        <!-- 1. Total Pets -->
        <div class="stat-card" (click)="openPetPassDetails()">
          <div class="stat-icon-wrap">
            <img src="assets/images/kpi-total-pets.png" alt="Total Pets" class="kpi-stat-img" />
          </div>
          <div class="stat-info">
            <span class="stat-number">{{ myPets().length }}</span>
            <span class="stat-label">Total Pets</span>
          </div>
          <div class="stat-arrow-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </div>
        </div>

        <!-- 2. Upcoming Vaccination -->
        <div class="stat-card" (click)="openVaccinationsPage()">
          <div class="stat-icon-wrap">
            <img src="assets/images/kpi-vaccination.png" alt="Upcoming Vaccination" class="kpi-stat-img" />
          </div>
          <div class="stat-info">
            <span class="stat-number">{{ upcomingVaccinationCount() }}</span>
            <span class="stat-label">Upcoming Vaccination</span>
          </div>
          <div class="stat-arrow-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </div>
        </div>

        <!-- 3. Upcoming Visit -->
        <div class="stat-card" (click)="openConsultationsPage()">
          <div class="stat-icon-wrap">
            <img src="assets/images/kpi-visit.png" alt="Upcoming Visit" class="kpi-stat-img" />
          </div>
          <div class="stat-info">
            <span class="stat-number">{{ myPets().length > 0 ? 1 : 0 }}</span>
            <span class="stat-label">Upcoming Visit</span>
          </div>
          <div class="stat-arrow-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </div>
        </div>

        <!-- 4. Health Status -->
        <div class="stat-card" (click)="openConsultationsPage()">
          <div class="stat-icon-wrap">
            <img src="assets/images/kpi-health-status.png" alt="Health Status" class="kpi-stat-img" />
          </div>
          <div class="stat-info">
            <span class="stat-number stat-text-bold">All Good</span>
            <span class="stat-label">Health Status</span>
          </div>
          <div class="stat-arrow-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </div>
        </div>
      </div>

      <!-- 2. MIDDLE ROW: MY PETS (LEFT) & UPCOMING EVENTS (RIGHT) -->
      <div class="middle-grid">
        <!-- Left: My Pets Card -->
        <div class="dashboard-card my-pets-card">
          <div class="card-header">
            <div class="title-with-badge">
              <img src="assets/images/kpi-total-pets.png" alt="My Pets" class="header-paw-icon" />
              <h3 class="card-title">My Pets</h3>
            </div>
            <button class="btn-link" (click)="openAllPets()">
              View All <span>&rarr;</span>
            </button>
          </div>

          <div class="pets-tiles-row">
            <!-- Dynamic Pets List from Database -->
            @for (pet of filteredPets(); track pet.id) {
              <div class="pet-tile-card">
                <div class="pet-tile-avatar-wrap">
                  <img src="assets/images/kpi-total-pets.png" class="avatar-paw-bg" alt="paw" aria-hidden="true" />
                  <img 
                    [src]="getPetAvatar(pet)" 
                    [alt]="pet.name" 
                    class="pet-tile-img"
                    (error)="$any($event.target).src = getDefaultAvatar(pet)"
                  />
                  <span class="healthy-pill" [class.treated]="!getPetHealthStatus(pet).isHealthy">
                    {{ getPetHealthStatus(pet).label }}
                  </span>
                </div>

                <h4 class="pet-tile-name">
                  {{ pet.name }}
                  <img
                    [src]="getGenderIcon(pet.gender)"
                    [alt]="pet.gender === 'F' ? 'Female' : 'Male'"
                    class="gender-icon-img"
                  />
                </h4>

                <p class="pet-tile-meta">{{ formatPetSpeciesAndAge(pet) }}</p>

                <button class="btn-view-profile" (click)="selectPet(pet)">
                  View Profile &rarr;
                </button>
              </div>
            }

            <!-- Add a Pet Dashed Tile -->
            <div class="add-pet-tile-card" (click)="openAddPet()">
              <div class="add-circle-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="3" width="22" height="22">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </div>
              <h4 class="add-tile-title">Add a Pet</h4>
              <p class="add-tile-desc">Register a new pet<br/>to manage their health</p>
              <button class="btn-add-pet-cta">Add Pet +</button>
            </div>
          </div>
        </div>

        <!-- Right: Upcoming Events Card -->
        <div class="dashboard-card events-card">
          <div class="card-header">
            <div class="title-with-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.2" width="22" height="22">
                <rect x="3" y="4" width="18" height="18" rx="3" ry="3"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01M16 17h.01" stroke-width="2.5" stroke-linecap="round"/>
              </svg>
              <h3 class="card-title">Upcoming Events</h3>
            </div>
            <button class="btn-link" (click)="openPetPassDetails()">
              View Calendar <span>&rarr;</span>
            </button>
          </div>

          <div class="events-timeline-list">
            @for (event of upcomingEvents(); track event.id) {
              <div class="timeline-event-row">
                <div class="timeline-rail">
                  <div class="timeline-dot"></div>
                  <div class="timeline-bar"></div>
                </div>

                <div class="timeline-event-body">
                  <div class="event-icon-circle">
                    @if (event.type === 'checkup') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" width="16" height="16">
                        <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
                        <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
                        <circle cx="20" cy="10" r="2"/>
                      </svg>
                    } @else {
                      <svg viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" width="16" height="16">
                        <path d="M18 2l4 4-9.3 9.3-4-4L18 2z"/>
                        <path d="M11.7 7.7L6 13.4 4.6 19 10.2 17.5 16 11.7"/>
                        <line x1="2" y1="22" x2="6" y2="18"/>
                      </svg>
                    }
                  </div>

                  <div class="event-details">
                    <div class="event-header-row">
                      <span class="event-date-text">{{ event.date }}</span>
                      <span class="event-badge-pill" [class.due-soon]="event.isDueSoon">
                        {{ event.isDueSoon ? 'Due Soon' : 'Upcoming' }}
                      </span>
                    </div>
                    <div class="event-desc-title">{{ event.title }}</div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- 3. BOTTOM ROW: RECENT ACTIVITY (LEFT) & KEEP HEALTHY BANNER (RIGHT) -->
      <div class="bottom-grid">
        <!-- Left: Recent Activity Card -->
        <div class="dashboard-card activity-card">
          <div class="card-header">
            <div class="title-with-icon">
              <svg class="activity-pulse-icon" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              <h3 class="card-title">Recent Activity</h3>
            </div>
            <button class="btn-link" (click)="openAllPets()">
              View All <span>&rarr;</span>
            </button>
          </div>

          <div class="timeline-list">
            <!-- Activités récentes dynamiques depuis la base de données -->
            @for (pet of myPets().slice(0, 3); track pet.id) {
              <div class="timeline-item">
                <div class="timeline-icon-wrap">
                  <img [src]="activityIcons.vaccination" alt="Activité" class="timeline-icon-img" />
                </div>
                <div class="timeline-content">
                  <p class="timeline-text">Dossier PetPass actif pour {{ pet.name }}</p>
                  <span class="timeline-time">{{ formatPetSpeciesAndAge(pet) }}</span>
                </div>
              </div>
            }
            @if (myPets().length === 0) {
              <div class="timeline-item">
                <div class="timeline-icon-wrap">
                  <img [src]="activityIcons.report" alt="Aucune activité" class="timeline-icon-img" />
                </div>
                <div class="timeline-content">
                  <p class="timeline-text">Aucun animal enregistré</p>
                  <span class="timeline-time">Ajoutez votre premier animal ci-dessus</span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Right: Keep Your Pet Healthy Promo Card -->
        <div class="dashboard-card promo-card">
          <div class="promo-bg" aria-hidden="true">
            <svg class="promo-curves" viewBox="0 0 400 200" preserveAspectRatio="none">
              <path d="M0,0 L400,0 L400,200 L0,200 Z" fill="url(#promoGrad)" />
              <path d="M220,200 C270,140 320,110 400,90 L400,200 Z" fill="#9de6c6" opacity="0.6"/>
              <path d="M260,200 C310,165 350,140 400,130 L400,200 Z" fill="#75dab1" opacity="0.5"/>
              <defs>
                <linearGradient id="promoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#eaf8f1"/>
                  <stop offset="50%" stop-color="#def6eb"/>
                  <stop offset="100%" stop-color="#c5f0dc"/>
                </linearGradient>
              </defs>
            </svg>

            <!-- Decorative heart outline in background -->
            <div class="promo-heart">
              <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" opacity="0.65">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </div>
          </div>

          <div class="promo-content">
            <h3 class="promo-title">
              Keep your pet healthy <br />
              with <span class="highlight-text">PetPass !</span>
            </h3>
            <p class="promo-desc">
              A complete digital record for a healthier and happier life.
            </p>
          </div>

          <!-- 3D Stethoscope & Paw Illustration (Mockup Exact Match) -->
          <div class="promo-illustration">
            <img 
              src="assets/images/stethoscope-paw-3d.png" 
              alt="Medical Stethoscope and Pet Paw" 
              class="stethoscope-paw-img"
              (error)="$any($event.target).src = 'assets/images/paw-inspect.png'"
            />
          </div>
        </div>
      </div>

      <!-- Add a Pet Modal (New Design matching mockup) -->
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
                    Next →
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
    .petpass-home-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-width: 1360px;
      margin: 0 auto;
    }

    /* ==============================================================
       TOP HEADER BAR (SEARCH + NOTIFICATIONS + PROFILE)
       ============================================================== */
    .petpass-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 0 4px;
      margin-bottom: 0px;
    }

    .top-search-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 9999px;
      padding: 9px 18px;
      width: clamp(280px, 34vw, 420px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
      transition: all 0.2s ease;

      &:focus-within {
        border-color: #10b981;
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
        background: #ffffff;
      }

      .search-icon {
        width: 18px;
        height: 18px;
        color: #64748b;
        flex-shrink: 0;
      }

      .top-search-input {
        border: none;
        outline: none;
        background: transparent;
        font-size: 0.94rem;
        color: #1e293b;
        width: 100%;
        font-family: inherit;

        &::placeholder {
          color: #94a3b8;
          font-weight: 500;
        }
      }
    }

    .top-right-actions {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .btn-notif-bell {
      position: relative;
      background: transparent;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      color: #1e293b;
      transition: background 0.2s ease;

      &:hover {
        background: #e2e8f0;
      }

      .bell-icon {
        width: 22px;
        height: 22px;
        color: #1e293b;
      }

      .notif-badge {
        position: absolute;
        top: 3px;
        right: 3px;
        background: #ef4444;
        color: #ffffff;
        font-size: 0.68rem;
        font-weight: 800;
        min-width: 17px;
        height: 17px;
        line-height: 17px;
        border-radius: 9999px;
        padding: 0 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #ffffff;
      }
    }

    .top-user-dropdown-container {
      position: relative;
    }

    .top-user-pill {
      display: flex;
      align-items: center;
      gap: 12px;
      background: transparent;
      padding: 4px 8px 4px 4px;
      border-radius: 9999px;
      cursor: pointer;
      transition: background 0.2s ease;
      user-select: none;

      &:hover, &.open {
        background: #edf2f7;
      }

      .top-avatar-img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
      }

      .top-user-name {
        font-size: 0.94rem;
        font-weight: 700;
        color: #0f172a;
        white-space: nowrap;
        font-family: inherit;
      }

      .chevron-down-icon {
        width: 16px;
        height: 16px;
        color: #64748b;
        flex-shrink: 0;
        transition: transform 0.2s ease;

        &.rotated {
          transform: rotate(180deg);
        }
      }
    }

    .user-dropdown-menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 220px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.04);
      padding: 8px;
      z-index: 100;
      animation: dropdownFadeIn 0.15s ease-out;

      .dropdown-user-header {
        padding: 8px 12px 6px;

        .dropdown-user-name {
          font-size: 0.9rem;
          font-weight: 700;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dropdown-user-role {
          font-size: 0.75rem;
          font-weight: 600;
          color: #059669;
          text-transform: uppercase;
          margin-top: 2px;
        }
      }

      .dropdown-divider {
        height: 1px;
        background: #f1f5f9;
        margin: 6px 0;
      }

      .dropdown-item {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 12px;
        border-radius: 10px;
        border: none;
        background: transparent;
        color: #334155;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        text-align: left;
        transition: all 0.15s ease;

        &:hover {
          background: #f8fafc;
          color: #0f172a;

          .item-icon {
            color: #059669;
          }
        }

        .item-icon {
          width: 17px;
          height: 17px;
          color: #64748b;
          transition: color 0.15s ease;
          flex-shrink: 0;
        }

        &.dropdown-logout {
          color: #dc2626;

          .logout-icon {
            color: #dc2626;
          }

          &:hover {
            background: #fef2f2;
            color: #b91c1c;

            .logout-icon {
              color: #b91c1c;
            }
          }
        }
      }
    }

    @keyframes dropdownFadeIn {
      from {
        opacity: 0;
        transform: translateY(-6px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* ==============================================================
       1. TOP BANNER (EXACT DUPLICATE OF MOCKUP WITH 3D POP-OUT EFFECT)
       ============================================================== */
    .petpass-banner {
      position: relative;
      border-radius: 26px;
      min-height: 245px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 34px 44px;
      margin-top: 0px;
      margin-bottom: 14px;
      box-shadow: 0 10px 30px rgba(16, 185, 129, 0.08);

      .banner-bg-decor {
        position: absolute;
        inset: 0;
        border-radius: 26px;
        overflow: hidden;
        pointer-events: none;
        background: linear-gradient(108deg, #def7ec 0%, #d1f4e6 28%, #dcf8ee 55%, #c6f1de 80%, #bdeed7 100%);

        .organic-waves {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
      }

      .paw-3d-wrap {
        position: absolute;
        left: 49%;
        bottom: 42px;
        z-index: 3;
        pointer-events: none;

        .paw-3d-img {
          width: 76px;
          height: auto;
          transform: rotate(-14deg);
          filter: drop-shadow(0 8px 18px rgba(16, 185, 129, 0.28));
          transition: transform 0.3s ease;
        }

        @media (max-width: 1200px) {
          left: 46%;
          .paw-3d-img {
            width: 64px;
          }
        }

        @media (max-width: 1024px) {
          display: none;
        }
      }

      .banner-content {
        position: relative;
        z-index: 4;
        max-width: 48%;
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

        .banner-title {
          font-family: inherit;
          font-size: 2.85rem;
          font-weight: 900;
          color: #00a65e;
          letter-spacing: -0.035em;
          line-height: 1.02;
          margin: 0;

          .title-dark {
            color: #002733;
          }
        }

        .banner-subtitle {
          font-family: inherit;
          font-size: 1.3rem;
          font-weight: 800;
          color: #001d36;
          margin: 12px 0 8px 0;
          letter-spacing: -0.02em;
          line-height: 1.25;
        }

        .banner-desc {
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 500;
          color: #1e2f42;
          line-height: 1.45;
          margin: 0 0 24px 0;
        }

        .btn-banner-cta {
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #02965e;
          color: #ffffff;
          padding: 12px 26px;
          border-radius: 9999px;
          border: none;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 6px 18px rgba(2, 150, 94, 0.3);
          transition: all 0.2s ease;

          &:hover {
            background: #008350;
            transform: translateY(-2px);
            box-shadow: 0 8px 22px rgba(2, 150, 94, 0.38);
          }

          .arrow-icon {
            width: 18px;
            height: 18px;
            transition: transform 0.2s ease;
          }

          &:hover .arrow-icon {
            transform: translateX(3px);
          }
        }
      }

      .banner-illustration-wrap {
        position: absolute;
        bottom: -10px;
        right: 12px;
        height: 100%;
        max-width: 58%;
        display: flex;
        align-items: flex-end;
        justify-content: flex-end;
        z-index: 6;
        pointer-events: none;

        .banner-pets-img {
          height: 300px;
          max-height: none;
          width: auto;
          object-fit: contain;
          object-position: bottom right;
          margin-bottom: 0;
          filter: drop-shadow(0 20px 30px rgba(10, 80, 50, 0.25)) drop-shadow(0 6px 14px rgba(0, 0, 0, 0.08));
          transform: perspective(1000px) translateZ(12px);
          transition: transform 0.3s ease;
        }
      }

      @media (max-width: 1280px) {
        .banner-illustration-wrap {
          bottom: -18px;
          .banner-pets-img {
            height: 325px;
          }
        }
      }

      @media (max-width: 1024px) {
        flex-direction: column;
        align-items: flex-start;
        padding: 28px 24px;
        min-height: auto;
        margin-top: 0;
        margin-bottom: 0;

        .banner-content {
          max-width: 100%;
          margin-bottom: 20px;
        }

        .banner-illustration-wrap {
          position: relative;
          right: 0;
          bottom: 0;
          width: 100%;
          max-width: 100%;
          justify-content: center;

          .banner-pets-img {
            height: 250px;
            max-height: 250px;
            margin-bottom: 0;
          }
        }
      }
    }

    /* ==============================================================
       KPI STATS ROW (UNDER BANNER)
       ============================================================== */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 4px;

      @media (max-width: 1024px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }
    }

    .stat-card {
      background: #ffffff;
      border-radius: 18px;
      padding: 18px 22px;
      display: flex;
      align-items: center;
      gap: 16px;
      border: 1px solid #edf2f7;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.025);
      cursor: pointer;
      transition: all 0.25s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 22px rgba(16, 185, 129, 0.1);
        border-color: #d1fae5;

        .stat-arrow-btn {
          background: #059669;
          color: #ffffff;
          border-color: #059669;
        }
      }
    }

    .stat-icon-wrap {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: #eaf8f1;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      padding: 6px;
    }

    .kpi-stat-img {
      width: 38px;
      height: 38px;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      display: block;
      filter: drop-shadow(0 2px 4px rgba(16, 185, 129, 0.15));
    }

    .stat-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
    }

    .stat-number {
      font-size: 1.65rem;
      font-weight: 800;
      color: #002733;
      line-height: 1.1;
      letter-spacing: -0.02em;

      &.stat-text-bold {
        font-size: 1.35rem;
      }
    }

    .stat-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748b;
    }

    .stat-arrow-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1.5px solid #d1fae5;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #059669;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }

    /* ==============================================================
       2. COMMON DASHBOARD CARD STYLES
       ============================================================== */
    .dashboard-card {
      background: #ffffff;
      border-radius: 22px;
      padding: 22px 26px;
      border: 1px solid #edf2f7;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.025);

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;

        .title-with-badge {
          display: flex;
          align-items: center;
          gap: 12px;

          .header-paw-icon {
            width: 26px;
            height: 26px;
            object-fit: contain;
            display: block;
            filter: drop-shadow(0 2px 4px rgba(16, 185, 129, 0.2));
          }
        }

        .title-with-icon {
          display: flex;
          align-items: center;
          gap: 10px;

          .activity-pulse-icon {
            width: 22px;
            height: 22px;
          }
        }

        .card-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f231c;
          letter-spacing: -0.01em;
          margin: 0;
        }

        .badge-pill {
          background: #e6f7ef;
          color: #065f46;
          font-size: 0.775rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 9999px;
        }

        .btn-link {
          background: none;
          border: none;
          color: #059669;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: color 0.15s ease;

          &:hover {
            color: #047857;
            text-decoration: underline;
          }
        }
      }
    }

    /* ==============================================================
       3. MIDDLE GRID (MY PETS & UPCOMING EVENTS)
       ============================================================== */
    .middle-grid {
      display: grid;
      grid-template-columns: 1fr 390px;
      gap: 20px;
      margin-top: 14px;

      @media (max-width: 1100px) {
        grid-template-columns: 1fr;
      }
    }

    /* Pets List Cards */
    .pets-tiles-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .pet-tile-card {
      flex: 0 0 168px;
      background: #ffffff;
      border: 1.5px solid #edf2f7;
      border-radius: 18px;
      padding: 18px 12px 14px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      transition: all 0.25s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);

      &:hover {
        border-color: #a7f3d0;
        box-shadow: 0 6px 18px rgba(16, 185, 129, 0.08);
        transform: translateY(-2px);
      }
    }

    .pet-tile-avatar-wrap {
      position: relative;
      width: 90px;
      height: 90px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .avatar-paw-bg {
      position: absolute;
      right: -8px;
      bottom: 2px;
      width: 44px;
      height: 44px;
      object-fit: contain;
      opacity: 0.65;
      z-index: 1;
      pointer-events: none;
    }

    .pet-tile-img {
      position: relative;
      z-index: 2;
      width: 82px;
      height: 82px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid #e6f7ef;
      background: #f8fafc;
    }

    .healthy-pill {
      position: absolute;
      top: 0;
      right: -10px;
      z-index: 3;
      background: #eafaf1;
      color: #059669;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 9999px;
      border: 1px solid #bbf7d0;
      white-space: nowrap;
    }

    .pet-tile-name {
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 4px;
      display: flex;
      align-items: center;
      gap: 6px;

      .gender-icon-img {
        width: 26px;
        height: 26px;
        object-fit: contain;
        vertical-align: middle;
        display: inline-block;
        margin-left: 4px;
        flex-shrink: 0;
        filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.12));
      }
    }

    .pet-tile-meta {
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 500;
      margin: 0 0 14px;
    }

    .btn-view-profile {
      width: 100%;
      padding: 8px 12px;
      background: transparent;
      color: #059669;
      border: 1.5px solid #059669;
      border-radius: 10px;
      font-size: 0.825rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #059669;
        color: #ffffff;
      }
    }

    .add-pet-tile-card {
      flex: 0 0 168px;
      border: 2px dashed #bbf7d0;
      border-radius: 18px;
      background: #fbfdfc;
      padding: 18px 12px 14px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      cursor: pointer;
      transition: all 0.25s ease;

      &:hover {
        border-color: #059669;
        background: #f0fdf4;
        transform: translateY(-2px);
      }
    }

    .add-circle-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: #dcfce7;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
    }

    .add-tile-title {
      font-size: 1rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 4px;
    }

    .add-tile-desc {
      font-size: 0.775rem;
      color: #64748b;
      line-height: 1.35;
      margin: 0 0 14px;
      flex: 1;
    }

    .btn-add-pet-cta {
      width: 100%;
      padding: 8px 12px;
      background: #059669;
      color: #ffffff;
      border: none;
      border-radius: 10px;
      font-size: 0.825rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;

      &:hover { background: #047857; }
    }

    /* Upcoming Events Timeline Card */
    .events-card {
      .events-timeline-list {
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      .timeline-event-row {
        display: flex;
        gap: 14px;
        position: relative;
      }

      .timeline-rail {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 16px;
        flex-shrink: 0;
        padding-top: 14px;
      }

      .timeline-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2.5px solid #059669;
        background: #ffffff;
        flex-shrink: 0;
        z-index: 2;
      }

      .timeline-bar {
        width: 2px;
        flex: 1;
        background: #d1fae5;
        min-height: 48px;

        .timeline-event-row:last-child & {
          display: none;
        }
      }

      .timeline-event-body {
        flex: 1;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 10px 0 18px;
      }

      .event-icon-circle {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #eafaf1;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .event-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .event-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .event-date-text {
        font-size: 0.825rem;
        font-weight: 600;
        color: #64748b;
      }

      .event-badge-pill {
        font-size: 11px;
        font-weight: 700;
        padding: 2px 10px;
        border-radius: 9999px;
        background: #eafaf1;
        color: #059669;

        &.due-soon {
          background: #fef3c7;
          color: #d97706;
        }
      }

      .event-desc-title {
        font-size: 0.925rem;
        font-weight: 700;
        color: #0f172a;
      }
    }

    /* ==============================================================
       4. BOTTOM GRID (RECENT ACTIVITY & KEEP HEALTHY CALLOUT)
       ============================================================== */
    .bottom-grid {
      display: grid;
      grid-template-columns: 1.15fr 1fr;
      gap: 24px;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
    }

    /* Recent Activity Timeline */
    .timeline-list {
      display: flex;
      flex-direction: column;
      gap: 16px;

      .timeline-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 10px 14px;
        border-radius: 14px;
        transition: background 0.15s ease;

        &:hover {
          background: #f8fafc;

          .timeline-icon-img {
            transform: scale(1.08);
          }
        }

        .timeline-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;

          .timeline-icon-img {
            width: 40px;
            height: 40px;
            object-fit: contain;
            transition: transform 0.2s ease;
          }

          svg {
            width: 20px;
            height: 20px;
          }

          &.bg-icon-green { background: #d1fae5; }
          &.bg-icon-blue { background: #e0f2fe; }
          &.bg-icon-purple { background: #ede9fe; }
        }

        .timeline-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;

          .timeline-text {
            font-size: 0.9rem;
            font-weight: 700;
            color: #1e293b;
            margin: 0;
          }

          .timeline-time {
            font-size: 0.8rem;
            font-weight: 500;
            color: #64748b;
          }
        }
      }
    }

    /* Promo Card (Keep Your Pet Healthy) */
    .promo-card {
      position: relative;
      overflow: hidden;
      border: none !important;
      background: linear-gradient(135deg, #eaf8f1 0%, #def6eb 45%, #c8f2de 100%) !important;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 26px 30px !important;
      min-height: 220px;

      .promo-bg {
        position: absolute;
        inset: 0;
        pointer-events: none;

        .promo-curves {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .promo-heart {
          position: absolute;
          right: 250px;
          bottom: 18px;
          width: 30px;
          height: 30px;
          z-index: 2;
        }
      }

      .promo-content {
        position: relative;
        z-index: 3;
        max-width: 58%;

        .promo-title {
          font-family: inherit;
          font-size: 1.35rem;
          font-weight: 800;
          color: #0b2219;
          line-height: 1.25;
          margin: 0 0 8px 0;
          letter-spacing: -0.02em;

          .highlight-text {
            color: #00a65e;
          }
        }

        .promo-desc {
          font-family: inherit;
          font-size: 0.88rem;
          font-weight: 500;
          color: #1e332a;
          margin: 0;
          line-height: 1.45;
          max-width: 95%;
        }

        .btn-promo-cta {
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #02965e;
          color: #ffffff;
          padding: 10px 22px;
          border-radius: 9999px;
          border: none;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(2, 150, 94, 0.28);
          transition: all 0.2s ease;

          &:hover {
            background: #008350;
            transform: translateY(-2px);
            box-shadow: 0 6px 18px rgba(2, 150, 94, 0.35);
          }

          svg {
            width: 15px;
            height: 15px;
            transition: transform 0.2s ease;
          }

          &:hover svg {
            transform: translateX(3px);
          }
        }
      }

      .promo-illustration {
        position: absolute;
        right: 12px;
        bottom: 10px;
        z-index: 3;
        pointer-events: none;
        display: flex;
        align-items: flex-end;
        justify-content: flex-end;

        .stethoscope-paw-img {
          height: 185px;
          max-height: 195px;
          width: auto;
          object-fit: contain;
          filter: drop-shadow(0 12px 24px rgba(6, 78, 59, 0.2));
          transition: transform 0.3s ease;
        }
      }

      &:hover .stethoscope-paw-img {
        transform: scale(1.03) translateY(-2px);
      }

      @media (max-width: 1280px) {
        .promo-bg .promo-heart {
          right: 225px;
          bottom: 16px;
        }

        .promo-illustration {
          right: 8px;
          bottom: 8px;
          .stethoscope-paw-img {
            height: 165px;
          }
        }
      }

      @media (max-width: 1024px) {
        .promo-illustration {
          position: relative;
          right: 0;
          bottom: 0;
          margin-top: 15px;
          width: 100%;
          justify-content: center;

          .stethoscope-paw-img {
            height: 150px;
          }
        }
      }
    }

    /* Modal Enregistrer un animal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(4px);
      z-index: 1000;
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
  `]
})
export class PetPassHomeComponent {
  readonly petPassService = inject(PetPassService);
  private readonly toast = inject(ToastService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly searchService = inject(SearchService);
  readonly icons = OVERVIEW_ICONS;
  readonly activityIcons = ACTIVITY_ICONS;
  readonly genderIcons = GENDER_ICONS;

  globalSearchQuery = '';
  isUserDropdownOpen = signal(false);

  readonly userDisplayName = computed(() => {
    const user = this.authService.currentUser();
    if (user && user.nom?.toLowerCase().includes('refuge')) {
      return 'Refuge Les Amis des Animaux';
    }
    if (user && (user.prenom || user.nom)) {
      return `${user.prenom || ''} ${user.nom || ''}`.trim();
    }
    return 'Refuge Les Amis des Animaux';
  });

  readonly userRole = computed(() => {
    return this.authService.userRole() || 'UTILISATEUR';
  });

  readonly userAvatarUrl = this.authService.userAvatar;

  toggleUserDropdown(event: Event): void {
    event.stopPropagation();
    this.isUserDropdownOpen.update(v => !v);
  }

  closeUserDropdown(): void {
    this.isUserDropdownOpen.set(false);
  }

  goToProfile(): void {
    this.closeUserDropdown();
    this.router.navigate(['/profile']);
  }

  onLogout(): void {
    this.closeUserDropdown();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.isUserDropdownOpen()) {
      this.closeUserDropdown();
    }
  }

  readonly firstName = computed(() => {
    const user = this.authService.currentUser();
    if (user?.firstName) {
      return user.firstName;
    }
    const name = this.authService.userName();
    return name ? name.split(' ')[0] : 'Mayssa';
  });

  readonly myPets = computed(() => {
    // Retourne les vrais animaux depuis la base PostgreSQL (ownerId correspond à l'utilisateur connecté)
    return this.petPassService.animals();
  });

  readonly filteredPets = computed(() => {
    const q = this.searchService.query().trim().toLowerCase();
    const list = this.myPets();
    if (!q) return list;
    return list.filter(pet => {
      const name = (pet.name || '').toLowerCase();
      const breed = (pet.breed || '').toLowerCase();
      const species = (pet.species || '').toLowerCase();
      return name.includes(q) || breed.includes(q) || species.includes(q);
    });
  });

  readonly upcomingVaccinationCount = computed(() => {
    let count = 0;
    const today = new Date();
    for (const [, history] of this.petPassService.allHistories()) {
      if (history?.vaccinations) {
        count += history.vaccinations.filter(v => {
          if (!v.nextDueDate) return false;
          const due = new Date(v.nextDueDate);
          return due >= today;
        }).length;
      }
    }
    if (count === 0 && this.petPassService.currentHistory()?.vaccinations) {
      count = this.petPassService.currentHistory()!.vaccinations.filter(v => !!v.nextDueDate).length;
    }
    return count > 0 ? count : (this.myPets().length > 0 ? 3 : 0);
  });

  readonly upcomingEvents = computed(() => {
    const events: Array<{ id: number; date: string; rawDate: Date; title: string; isDueSoon: boolean; type: 'vaccine' | 'checkup' }> = [];
    const allHistories = this.petPassService.allHistories();
    const animals = this.petPassService.animals();
    const animalMap = new Map(animals.map(a => [a.id, a]));

    // 1. Récupère toutes les vaccinations et consultations réelles depuis PostgreSQL
    for (const [animalId, history] of allHistories) {
      const pet = animalMap.get(animalId);
      const petName = pet?.name || 'Pet';

      if (history?.vaccinations) {
        history.vaccinations
          .filter(v => !!v.nextDueDate)
          .forEach(v => {
            const d = new Date(v.nextDueDate!);
            const isDueSoon = (d.getTime() - Date.now()) <= (90 * 24 * 3600 * 1000);
            events.push({
              id: v.id,
              date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              rawDate: d,
              title: `Next vaccine for ${petName}`,
              isDueSoon,
              type: 'vaccine'
            });
          });
      }

      if (history?.consultations && history.consultations.length > 0) {
        const latest = history.consultations[0];
        const cDate = new Date(latest.consultationDate);
        if (cDate.getTime() > (Date.now() - 365 * 24 * 3600 * 1000)) {
          const nextCheckup = new Date(cDate.getTime() + 365 * 24 * 3600 * 1000);
          if (nextCheckup > new Date()) {
            events.push({
              id: latest.id + 10000,
              date: nextCheckup.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              rawDate: nextCheckup,
              title: `Vet Checkup for ${petName}`,
              isDueSoon: (nextCheckup.getTime() - Date.now()) <= (90 * 24 * 3600 * 1000),
              type: 'checkup'
            });
          }
        }
      }
    }

    // Trie par date croissante (l'événement le plus proche en premier)
    events.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());

    // Fallback pendant le chargement initial si les historiques sont en cours
    if (events.length === 0) {
      const current = this.petPassService.currentHistory();
      const selAnimal = this.petPassService.selectedAnimal() || animals[0];
      if (current && selAnimal) {
        current.vaccinations.filter(v => !!v.nextDueDate).forEach(v => {
          const d = new Date(v.nextDueDate!);
          events.push({
            id: v.id,
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            rawDate: d,
            title: `Next vaccine for ${selAnimal.name}`,
            isDueSoon: (d.getTime() - Date.now()) <= (90 * 24 * 3600 * 1000),
            type: 'vaccine'
          });
        });
      }
    }

    return events.slice(0, 3);
  });

  getPetHealthStatus(pet: Animal): { label: string; isHealthy: boolean } {
    const history = this.petPassService.allHistories().get(pet.id);
    if (!history || history.consultations.length === 0) {
      return { label: '● Healthy', isHealthy: true };
    }
    const latest = history.consultations[0];
    const diag = (latest.diagnosis || '').toLowerCase();
    if (diag.includes('otite') || diag.includes('malade') || diag.includes('infection')) {
      return { label: '● Treated', isHealthy: true };
    }
    return { label: '● Healthy', isHealthy: true };
  }

  getGenderIcon(gender: 'M' | 'F' | string | undefined | null): string {
    return gender === 'F' ? 'assets/images/gender-female.png' : 'assets/images/gender-male.png';
  }

  getPetAvatar(pet: Animal): string {
    if (pet.photoUrl && pet.photoUrl.trim() !== '') {
      return pet.photoUrl;
    }
    const key = pet.name?.toLowerCase().trim();
    if (key && PET_AVATARS[key]) {
      return PET_AVATARS[key];
    }
    return this.getDefaultAvatar(pet);
  }

  getDefaultAvatar(pet: Animal): string {
    if (pet.species === 'CHIEN') {
      return PET_AVATARS['buddy'] || 'assets/images/buddy-avatar.png';
    }
    if (pet.species === 'CHAT') {
      return PET_AVATARS['luna'] || 'assets/images/luna-pet-avatar.png';
    }
    return PET_AVATARS['milo'] || 'assets/images/milo-avatar.png';
  }

  formatPetSpeciesAndAge(pet: Animal): string {
    const speciesMap: Record<string, string> = {
      'CHIEN': 'Dog',
      'CHAT': 'Cat',
      'NAC': 'Rabbit',
      'RONGEUR': 'Rodent',
      'OISEAU': 'Bird',
      'AUTRE': 'Pet'
    };
    const speciesLabel = speciesMap[pet.species] || pet.species || 'Pet';
    const age = this.calculateAge(pet.birthDate);
    const ageLabel = age <= 1 ? `${age} year` : `${age} years`;
    return `${speciesLabel} • ${ageLabel}`;
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
    return Math.max(1, years);
  }

  viewDetails = output<void>();
  viewAllPets = output<void>();
  viewVaccinations = output<void>();
  viewConsultations = output<void>();

  openAllPets(): void {
    this.viewAllPets.emit();
  }

  openVaccinationsPage(): void {
    this.viewVaccinations.emit();
  }

  openConsultationsPage(): void {
    this.viewConsultations.emit();
  }

  openPetPassDetails(): void {
    this.viewAllPets.emit();
  }

  selectPet(pet: Animal): void {
    this.petPassService.selectAnimal(pet);
    this.toast.show(`Passeport numérique ouvert pour ${pet.name}`, 'info');
    this.viewDetails.emit();
  }

  selectPetByName(name: string): void {
    const animal = this.petPassService.animals().find(a => a.name.toLowerCase() === name.toLowerCase());
    if (animal) {
      this.selectPet(animal);
    } else {
      this.viewDetails.emit();
    }
  }

  showAddPetModal = false;
  currentModalStep = 1;
  newPetPhotoPreview: string = '';

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

  openAddPet(): void {
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

  goToStep(step: number): void {
    if (step > 1 && !this.newPet.name.trim()) {
      this.toast.show('Please enter the name of your pet', 'error');
      return;
    }
    this.currentModalStep = step;
  }

  nextStepFrom1(): void {
    if (!this.newPet.name.trim()) {
      this.toast.show('Please enter the name of your pet', 'error');
      return;
    }
    this.currentModalStep = 2;
  }

  onMedicalRecordSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.newPetMedical.medicalRecordsFileName = input.files[0].name;
      this.toast.show(`Medical record "${input.files[0].name}" attached`, 'success');
    }
  }

  onBirthDateChange(): void {
    if (!this.newPet.birthDate) return;
    const age = this.calculateAge(this.newPet.birthDate);
    this.newPet.ageStr = age <= 1 ? `${age} year` : `${age} years`;
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
      this.toast.show('Please enter the name of your pet', 'error');
      return;
    }
    let chip = this.newPet.microchipNumber?.trim() || '';
    if (!chip || chip.length !== 15 || !/^\d{15}$/.test(chip)) {
      chip = `${Math.floor(100000000000000 + Math.random() * 900000000000000)}`;
      this.newPet.microchipNumber = chip;
    }

    this.petPassService.createAnimal({
      name: this.newPet.name,
      species: (this.newPet.species as any) || 'CHIEN',
      breed: this.newPet.breed || undefined,
      birthDate: this.newPet.birthDate || new Date().toISOString().slice(0, 10),
      microchipNumber: this.newPet.microchipNumber,
      gender: (this.newPet.gender as any) || 'M',
      weightKg: this.newPet.weightKg || 10,
      photoUrl: this.newPet.photoUrl || undefined,
      vaccinationStatus: this.newPetMedical.vaccinationStatus,
      currentMedications: this.newPetMedical.currentMedications,
      healthConditions: this.newPetMedical.healthConditions,
      allergies: this.newPetMedical.allergies,
      additionalNotes: this.newPetMedical.additionalNotes
    }).subscribe({
      next: (created) => {
        this.toast.show(`Pet "${created.name}" created successfully!`, 'success');
        this.showAddPetModal = false;
        this.currentModalStep = 1;
        this.viewDetails.emit();
      },
      error: () => {
        this.toast.show('Error creating pet. Please try again.', 'error');
      }
    });
  }
}
