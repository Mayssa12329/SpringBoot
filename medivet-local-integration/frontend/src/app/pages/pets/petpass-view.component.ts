import { Component, computed, inject, output, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DETAIL_IMAGES } from '../../utils/constants/detail-images';
import { PetPassService } from '../../services/petpass.service';
import { ToastService } from '../../components/ui/toast/toast.service';
import { AuthService } from '../../services/auth.service';
import { SearchService } from '../../services/search.service';
import { Animal, Species } from '../../models/animal.model';
import { AccessScope } from '../../models/vet-authorization.model';

@Component({
  selector: 'app-petpass-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pet-detail-page">
      <!-- Back to My Pets Pill Header -->
      <div class="back-nav-wrap">
        <button class="btn-back" (click)="goBack()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Back to My Pets</span>
        </button>
        <div class="top-nav-paw" aria-hidden="true">
          <img src="assets/images/hero-paw.png" alt="" class="top-paw-img" />
        </div>
      </div>

      <!-- Hero Banner Profile (Exact Mockup Match) -->
      <section class="pet-hero-banner">
        <!-- Background Paw Pattern -->
        <div class="banner-paw-pattern" aria-hidden="true">
          <img src="assets/images/hero-paw.png" alt="" class="bg-paw p1" />
          <img src="assets/images/hero-paw.png" alt="" class="bg-paw p2" />
          <img src="assets/images/hero-paw.png" alt="" class="bg-paw p3" />
        </div>

        <div class="hero-left">
          <div class="pet-avatar-wrapper">
            <img [src]="currentPetAvatar()" [alt]="currentPet().name" class="hero-avatar-img" (error)="onAvatarError($event)" />
            <button class="avatar-camera-btn" (click)="fileInput.click()" aria-label="Change photo" title="Changer la photo de l'animal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </button>
            <input #fileInput type="file" accept="image/*" (change)="onPhotoSelected($event)" style="display: none;" />
          </div>

          <div class="hero-text-block">
            <div class="hero-name-row">
              <h1 class="hero-pet-name">{{ currentPet().name }}</h1>
              <img
                [src]="currentPet().gender === 'F' ? 'assets/images/gender-female.png' : 'assets/images/gender-male.png'"
                [alt]="currentPet().gender === 'F' ? 'Female' : 'Male'"
                class="hero-gender-icon"
              />
            </div>
            <p class="hero-subtext">{{ heroSubtitle() }}</p>

            <div class="hero-badges-row">
              <span class="hero-pill">
                <span class="pill-icon green-heart">💚</span>
                <span>Healthy</span>
              </span>
              <span class="hero-pill">
                <svg class="pill-svg" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <span>Indoor</span>
              </span>
              <span class="hero-pill">
                <svg class="pill-svg" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Sterilized</span>
              </span>
            </div>

            <p class="hero-quote">
              A lovely and playful {{ currentPet().species === 'CHIEN' ? 'dog' : 'cat' }} who loves cuddles 🐾
            </p>
          </div>
        </div>

        <!-- Floating Health Status Card Right -->
        <div class="health-status-card">
          <div class="health-card-paw-decor" aria-hidden="true">
            <img src="assets/images/hero-paw.png" alt="" class="card-decor-paw" />
          </div>
          <div class="health-card-inner">
            <div class="heartbeat-badge-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                <polyline points="7 12 10 12 12 9 14 15 16 12 19 12"/>
              </svg>
            </div>
            <div class="health-card-text">
              <span class="health-status-label">Health Status</span>
              <div class="health-status-title">{{ overallHealthStatus() }}</div>
              <div class="health-status-bottom">
                <span class="health-status-note">{{ healthStatusNote() }}</span>
                <span class="status-check-circle">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Navigation Tabs Row (Exact Mockup Match) -->
      <nav class="detail-nav-tabs">
        <button class="nav-tab" [class.active]="activeTab === 'medical_record' || activeTab === 'overview'" (click)="setTab('medical_record')">
          <img src="assets/images/tab-stethoscope.png" alt="Medical Record" class="tab-img-icon" />
          <span>Medical Record</span>
        </button>

        <button class="nav-tab" [class.active]="activeTab === 'vaccinations'" (click)="setTab('vaccinations')">
          <img src="assets/images/tab-syringe.png" alt="Vaccinations" class="tab-img-icon" />
          <span>Vaccinations</span>
        </button>

        <button class="nav-tab" [class.active]="activeTab === 'visits' || activeTab === 'records'" (click)="setTab('visits')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>Visits History</span>
        </button>

        <button class="nav-tab" [class.active]="activeTab === 'medications'" (click)="setTab('medications')">
          <img src="assets/images/tab-medications.png" alt="Medications" class="tab-img-icon" />
          <span>Medications</span>
        </button>

        <button class="nav-tab" [class.active]="activeTab === 'documents'" (click)="setTab('documents')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <span>Documents</span>
        </button>

        <div class="more-tab-container" (click)="$event.stopPropagation()">
          <button type="button" class="nav-tab" [class.active]="activeTab === 'authorizations' || activeTab === 'eligibility' || showMoreMenu" (click)="toggleMoreMenu($event)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="2"/>
              <circle cx="19" cy="12" r="2"/>
              <circle cx="5" cy="12" r="2"/>
            </svg>
            <span>More</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" [style.transform]="showMoreMenu ? 'rotate(180deg)' : 'none'" style="transition: transform 0.2s ease;">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          @if (showMoreMenu) {
            <div class="more-dropdown-menu" role="menu">
              <button type="button" class="dropdown-item" [class.active-item]="activeTab === 'authorizations'" (click)="setTab('authorizations'); showMoreMenu = false">
                <span class="item-icon">🛡️</span>
                <span class="item-label">Accès Vétérinaires</span>
              </button>
              <button type="button" class="dropdown-item" [class.active-item]="activeTab === 'eligibility'" (click)="setTab('eligibility'); showMoreMenu = false">
                <span class="item-icon">🐾</span>
                <span class="item-label">Éligibilité Adoption</span>
              </button>
              <button type="button" class="dropdown-item" [class.active-item]="activeTab === 'documents'" (click)="setTab('documents'); showMoreMenu = false">
                <span class="item-icon">📄</span>
                <span class="item-label">Carnet de Santé PDF</span>
              </button>
            </div>
          }
        </div>
      </nav>

      <!-- ==========================================
           TAB 1: MEDICAL RECORD (DEFAULT & EXACT MOCKUP)
           ========================================== -->
      @if (activeTab === 'medical_record' || activeTab === 'overview') {
        <!-- Middle 3-Column Grid -->
        <div class="middle-grid-row">
          <!-- 1. Pet Information Card -->
          <div class="info-card pet-info-card">
            <div class="card-head">
              <div class="head-left">
                <div class="head-icon-circle green-soft">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#059669">
                    <circle cx="12" cy="14" r="5"/><circle cx="6" cy="8" r="2.5"/><circle cx="18" cy="8" r="2.5"/><circle cx="9" cy="4" r="2"/><circle cx="15" cy="4" r="2"/>
                  </svg>
                </div>
                <h2 class="card-title">Pet Information</h2>
              </div>
              <button class="btn-edit-pill" (click)="openEditPetModal()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                <span>Edit</span>
              </button>
            </div>

            <div class="info-table">
              <div class="info-row">
                <span class="info-label">
                  <svg class="row-icon" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Name
                </span>
                <span class="info-val">{{ currentPet().name }}</span>
              </div>

              <div class="info-row">
                <span class="info-label">
                  <svg class="row-icon" viewBox="0 0 24 24" fill="#059669"><circle cx="12" cy="14" r="5"/><circle cx="6" cy="8" r="2.5"/><circle cx="18" cy="8" r="2.5"/><circle cx="9" cy="4" r="2"/><circle cx="15" cy="4" r="2"/></svg>
                  Species
                </span>
                <span class="info-val">{{ currentPet().species === 'CHIEN' ? 'Dog' : 'Cat' }}</span>
              </div>

              <div class="info-row">
                <span class="info-label">
                  <svg class="row-icon" viewBox="0 0 24 24" fill="#059669"><circle cx="12" cy="14" r="5"/><circle cx="6" cy="8" r="2.5"/><circle cx="18" cy="8" r="2.5"/><circle cx="9" cy="4" r="2"/><circle cx="15" cy="4" r="2"/></svg>
                  Breed
                </span>
                <span class="info-val">{{ currentPet().breed || 'Domestic Shorthair' }}</span>
              </div>

              <div class="info-row">
                <span class="info-label">
                  <svg class="row-icon" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Age
                </span>
                <span class="info-val">{{ petAgeText() }}</span>
              </div>

              <div class="info-row">
                <span class="info-label">
                  <svg class="row-icon" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><circle cx="12" cy="12" r="6"/><line x1="16" y1="8" x2="21" y2="3"/><line x1="17" y1="3" x2="21" y2="3"/><line x1="21" y1="3" x2="21" y2="7"/></svg>
                  Gender
                </span>
                <span class="info-val">
                  {{ currentPet().gender === 'F' ? 'Female' : 'Male' }}
                  <img
                    [src]="currentPet().gender === 'F' ? 'assets/images/gender-female.png' : 'assets/images/gender-male.png'"
                    [alt]="currentPet().gender === 'F' ? 'Female' : 'Male'"
                    class="info-gender-icon"
                  />
                </span>
              </div>

              <div class="info-row">
                <span class="info-label">
                  <svg class="row-icon" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><circle cx="12" cy="12" r="9"/><polyline points="12 6 12 12 16 14"/></svg>
                  Weight
                </span>
                <span class="info-val">{{ currentPet().weightKg || 4.5 }} kg</span>
              </div>

              <div class="info-row">
                <span class="info-label">
                  <svg class="row-icon" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/></svg>
                  Microchip ID
                </span>
                <span class="info-val">{{ currentPet().microchipNumber || '985141000123456' }}</span>
              </div>
            </div>
          </div>

          <!-- 2. Health Summary Card -->
          <div class="info-card health-summary-card">
            <div class="card-head">
              <div class="head-left">
                <div class="head-icon-circle green-soft">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </div>
                <h2 class="card-title">Health Summary</h2>
              </div>
              <button class="btn-card-link" (click)="openAddConsultationModal()">View Details &rarr;</button>
            </div>

            <div class="health-summary-body">
              <div class="donut-column">
                <div class="donut-chart-wrap">
                  <svg class="donut-svg" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="48" fill="none" stroke="#e6f7ef" stroke-width="11"/>
                    <circle cx="60" cy="60" r="48" fill="none" stroke="#059669" stroke-width="11"
                            stroke-linecap="round" stroke-dasharray="301" stroke-dashoffset="40"
                            transform="rotate(-90 60 60)"/>
                  </svg>
                  <div class="donut-center-heart">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="#059669">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </div>
                </div>
                <div class="donut-bottom-label">
                  <span class="donut-sub-text">Overall Health</span>
                  <span class="donut-main-text">{{ overallHealthStatus() }}</span>
                </div>
              </div>

              <div class="health-checklist">
                <div class="health-check-item">
                  <span class="green-check-dot">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                  <span class="check-item-text">Vaccinations up to date</span>
                </div>
                <div class="health-check-item">
                  <span class="green-check-dot">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                  <span class="check-item-text">No major issues</span>
                </div>
                <div class="health-check-item">
                  <span class="green-check-dot">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                  <span class="check-item-text">Regular check-ups</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Next Visit Card -->
          <div class="info-card next-visit-card">
            <div class="watermark-stethoscope" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.2" opacity="0.18">
                <path d="M4.5 3v5a4.5 4.5 0 0 0 9 0V3"/>
                <path d="M9 12.5a5 5 0 0 0 5 5h1a4 4 0 0 0 4-4v-1.5"/>
                <circle cx="19" cy="12" r="2"/>
              </svg>
            </div>

            <div class="card-head">
              <div class="head-left">
                <div class="head-icon-circle green-soft">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <h2 class="card-title">Next Visit</h2>
              </div>
            </div>

            <div class="visit-content-row">
              <div class="visit-date-badge">
                <span class="date-month">{{ nextVisitMonth() }}</span>
                <span class="date-day">{{ nextVisitDay() }}</span>
              </div>

              <div class="visit-meta">
                <h4 class="visit-type">{{ nextVisitTitle() }}</h4>
                <p class="visit-time">
                  <span>{{ nextVisitTime() }}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </p>
                <p class="visit-doctor">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span>{{ nextVisitDoctor() }}</span>
                </p>
              </div>
            </div>

            <button class="btn-add-calendar" (click)="notifyCalendar()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span>Add to Calendar</span>
            </button>
          </div>
        </div>

        <!-- Bottom 2-Column Grid (50% / 50% split) -->
        <div class="bottom-grid-row">
          <!-- 4. Vaccination History Card -->
          <div class="info-card vaccination-history-card">
            <div class="card-head">
              <div class="head-left">
                <div class="head-icon-circle green-soft">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/>
                  </svg>
                </div>
                <h2 class="card-title">Vaccination History</h2>
              </div>
              <button class="btn-card-link" (click)="setTab('vaccinations')">View All &rarr;</button>
            </div>

            <div class="vac-history-table">
              @for (v of displayVaccines(); track v.name) {
                <div class="vac-history-row">
                  <div class="vac-col-name">
                    <span class="vac-check-circle">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </span>
                    <span class="vac-name-text">{{ v.name }}</span>
                  </div>
                  <div class="vac-col-date">{{ v.date }}</div>
                  <div class="vac-col-valid">{{ v.validUntil }}</div>
                </div>
              }
            </div>
          </div>

          <!-- 5. Medical History Card -->
          <div class="info-card medical-history-card">
            <div class="watermark-paw" aria-hidden="true">
              <img src="assets/images/hero-paw.png" alt="" class="card-watermark-paw" />
            </div>

            <div class="card-head">
              <div class="head-left">
                <div class="head-icon-circle green-soft">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                    <line x1="9" y1="12" x2="15" y2="12"/>
                    <line x1="9" y1="16" x2="13" y2="16"/>
                  </svg>
                </div>
                <h2 class="card-title">Medical History</h2>
              </div>
              <button class="btn-card-link" (click)="setTab('visits')">View All &rarr;</button>
            </div>

            <div class="med-history-list">
              @for (rec of displayMedicalHistory(); track rec.title) {
                <div class="med-history-row" (click)="openAddConsultationModal()">
                  <div class="med-date-badge">
                    <span class="med-date-month">{{ rec.month }}</span>
                    <span class="med-date-day">{{ rec.day }}</span>
                  </div>
                  <div class="med-info-content">
                    <h4 class="med-title">{{ rec.title }}</h4>
                    <p class="med-subtitle">{{ rec.subtitle }}</p>
                  </div>
                  <div class="med-chevron">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- ==========================================
           TAB 2: VACCINATIONS (US10 - Backend API)
           TAB 2: VACCINATIONS
           ========================================== -->
      @if (activeTab === 'vaccinations') {
        <div class="feature-tab-container">
          <div class="tab-top-bar">
            <div>
              <h2 class="tab-main-title">Vaccination History & Schedule</h2>
              <p class="tab-sub-title">Registre officiel des vaccins administrés avec numéro de lot et date de rappel.</p>
            </div>
            <button class="btn-primary-action" (click)="openAddVaccineModal()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>+ Add Vaccination</span>
            </button>
          </div>

          <div class="cards-list-grid">
            @for (vac of vaccinations(); track vac.id) {
              <div class="item-feature-card">
                <div class="card-badge-header">
                  <div class="vaccine-icon-circle">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2">
                      <path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/>
                    </svg>
                  </div>
                  <span class="status-tag success">À jour</span>
                </div>
                <h3 class="item-title">{{ vac.vaccineName }}</h3>
                <div class="item-meta-grid">
                  <div class="meta-row">
                    <span class="meta-k">Date d'injection :</span>
                    <span class="meta-v">{{ (vac.injectionDate || vac.administeredDate) | date:'dd/MM/yyyy' }}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-k">Prochain rappel :</span>
                    <span class="meta-v text-highlight">{{ (vac.nextDueDate || vac.nextBoosterDate) | date:'dd/MM/yyyy' }}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-k">Numéro de lot :</span>
                    <span class="meta-v mono">{{ vac.batchNumber || 'N/A' }}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-k">Praticien :</span>
                    <span class="meta-v">{{ vac.veterinarianName || 'Dr. Sarah Ben Ali' }}</span>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="empty-state-card" style="grid-column: 1 / -1; padding: 36px 20px; text-align: center; background: #fff; border-radius: 16px; border: 1px dashed #cbd5e1;">
                <p style="color: #64748b; font-size: 14px; margin: 0; font-weight: 500;">Aucun vaccin enregistré pour cet animal.</p>
              </div>
            }
          </div>
        </div>
      }

      <!-- ==========================================
           TAB 3: VISITS HISTORY (US09 - Backend API)
           TAB 3: VISITS HISTORY
           ========================================== -->
      @if (activeTab === 'visits' || activeTab === 'records') {
        <div class="feature-tab-container">
          <div class="tab-top-bar">
            <div>
              <h2 class="tab-main-title">Consultations & Medical Records</h2>
              <p class="tab-sub-title">Dossier médical complet, actes cliniques et ordonnances archivés.</p>
            </div>
            <button class="btn-primary-action" (click)="openAddConsultationModal()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>+ Add Consultation</span>
            </button>
          </div>

          <div class="records-full-list">
            @for (rec of consultations(); track rec.id) {
              <div class="consultation-card">
                <div class="consultation-top">
                  <div class="consult-meta-left">
                    <span class="consult-date-badge">{{ rec.consultationDate | date:'dd MMMM yyyy - HH:mm' }}</span>
                    <h3 class="consult-diag">{{ rec.diagnosis }}</h3>
                  </div>
                  <span class="consult-vet-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    {{ rec.veterinarianName || 'Dr. Sarah Ben Ali' }}
                  </span>
                </div>

                <div class="consult-details">
                  <div class="detail-block">
                    <span class="detail-label">Traitement prescrit</span>
                    <p class="detail-text">{{ rec.treatment || 'Aucun traitement spécifique mentionné.' }}</p>
                  </div>
                  @if (rec.notes) {
                    <div class="detail-block">
                      <span class="detail-label">Notes cliniques</span>
                      <p class="detail-text">{{ rec.notes }}</p>
                    </div>
                  }
                </div>
              </div>
            } @empty {
              <div class="empty-state-card" style="padding: 36px 20px; text-align: center; background: #fff; border-radius: 16px; border: 1px dashed #cbd5e1;">
                <p style="color: #64748b; font-size: 14px; margin: 0; font-weight: 500;">Aucune consultation enregistrée pour cet animal.</p>
              </div>
            }
          </div>
        </div>
      }

      <!-- ==========================================
           TAB 4: MEDICATIONS TAB
           ========================================== -->
      @if (activeTab === 'medications') {
        <div class="feature-tab-container">
          <div class="tab-top-bar">
            <div>
              <h2 class="tab-main-title">Prescriptions & Active Medications</h2>
              <p class="tab-sub-title">Médicaments en cours d'administration, posologie et renouvellement.</p>
            </div>
            <button class="btn-primary-action" (click)="openAddMedicationModal()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>+ Add Medication</span>
            </button>
          </div>

          <div class="cards-list-grid">
            @for (med of medications(); track med.id) {
              <div class="item-feature-card">
                <div class="card-badge-header">
                  <img src="assets/images/tab-medications.png" alt="Medication" style="width: 24px; height: 24px;" />
                  <span class="status-tag success">{{ med.status || 'En cours' }}</span>
                </div>
                <h3 class="item-title">{{ med.name }}</h3>
                <div class="item-meta-grid">
                  <div class="meta-row">
                    <span class="meta-k">Posologie :</span>
                    <span class="meta-v">{{ med.dosage }}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-k">Date de début :</span>
                    <span class="meta-v">{{ med.startDate | date:'dd/MM/yyyy' }}</span>
                  </div>
                  @if (med.nextDoseDate) {
                    <div class="meta-row">
                      <span class="meta-k">Prochaine dose :</span>
                      <span class="meta-v text-highlight">{{ med.nextDoseDate | date:'dd/MM/yyyy' }}</span>
                    </div>
                  }
                  <div class="meta-row">
                    <span class="meta-k">Vétérinaire :</span>
                    <span class="meta-v">{{ med.veterinarianName || 'Dr. Sarah Ben Ali' }}</span>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="empty-state-card" style="grid-column: 1 / -1; padding: 36px 20px; text-align: center; background: #fff; border-radius: 16px; border: 1px dashed #cbd5e1;">
                <p style="color: #64748b; font-size: 14px; margin: 0; font-weight: 500;">Aucun médicament ou prescription en cours pour cet animal.</p>
              </div>
            }
          </div>
        </div>
      }

      <!-- ==========================================
           TAB 5: DOCUMENTS TAB
           ========================================== -->
      @if (activeTab === 'documents') {
        <div class="feature-tab-container">
          <div class="tab-top-bar">
            <div>
              <h2 class="tab-main-title">PetPass Official Documents</h2>
              <p class="tab-sub-title">Certificats vétérinaires, passeport européen et résultats d'analyses.</p>
            </div>
            <button class="btn-primary-action" (click)="notifyCalendar()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span>Download Health Passport PDF</span>
            </button>
          </div>

          <div class="cards-list-grid">
            <div class="item-feature-card">
              <div class="card-badge-header">
                <span class="status-tag success">PDF Certifié</span>
              </div>
              <h3 class="item-title">Certificat d'Identification SOAP</h3>
              <p class="meta-v">N° Transpondeur : {{ currentPet().microchipNumber || '985141000123456' }}</p>
            </div>
            <div class="item-feature-card">
              <div class="card-badge-header">
                <span class="status-tag success">PDF Certifié</span>
              </div>
              <h3 class="item-title">Passeport Européen de Santé Animale</h3>
              <p class="meta-v">Valide pour les déplacements transfrontaliers</p>
            </div>
          </div>
        </div>
      }

      <!-- ==========================================
           TAB 6: VET AUTHORIZATIONS (US12)
           TAB 6: VET AUTHORIZATIONS
           ========================================== -->
      @if (activeTab === 'authorizations') {
        <div class="feature-tab-container">
          <div class="tab-top-bar">
            <div>
              <h2 class="tab-main-title">Gestion des autorisations d'accès vétérinaire</h2>
              <p class="tab-sub-title">Contrôlez les praticiens habilités à consulter et modifier le carnet de santé.</p>
            </div>
            <button class="btn-primary-action" (click)="openGrantAccessModal()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
              <span>+ Accorder un accès vétérinaire</span>
            </button>
          </div>

          <div class="auth-table-card">
            <table class="auth-table">
              <thead>
                <tr>
                  <th>Vétérinaire</th>
                  <th>Périmètre accordé</th>
                  <th>Date d'octroi</th>
                  <th>Expiration</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                @for (auth of authorizations(); track auth.id) {
                  <tr>
                    <td class="col-vet">
                      <div class="vet-avatar-small">Dr</div>
                      <div class="vet-text">
                        <span class="vet-name">{{ auth.veterinarianName || 'Dr. Vétérinaire' }}</span>
                        <span class="vet-clinic">Clinique Partenaire</span>
                      </div>
                    </td>
                    <td><span class="scope-pill {{ (auth.accessScope || auth.scope || 'READ_ONLY').toLowerCase() }}">{{ auth.accessScope || auth.scope }}</span></td>
                    <td>{{ auth.grantedAt | date:'dd/MM/yyyy' }}</td>
                    <td>{{ auth.expiresAt | date:'dd/MM/yyyy' }}</td>
                    <td>
                      <span class="status-indicator" [class.active]="auth.active !== false && !auth.isRevoked">
                        {{ (auth.active !== false && !auth.isRevoked) ? 'ACTIF' : 'RÉVOQUÉ' }}
                      </span>
                    </td>
                    <td>
                      @if (auth.active !== false && !auth.isRevoked) {
                        <button class="btn-revoke" (click)="revokeAccess(auth.id)">Révoquer</button>
                      } @else {
                        <span class="revoked-label">Révoqué</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ==========================================
           TAB 7: ADOPTION ELIGIBILITY (US10)
           TAB 7: ADOPTION ELIGIBILITY
           ========================================== -->
      @if (activeTab === 'eligibility') {
        <div class="feature-tab-container">
          <div class="tab-top-bar">
            <div>
              <h2 class="tab-main-title">Contrôle d'éligibilité à l'adoption</h2>
              <p class="tab-sub-title">Vérification automatique de conformité : puce SOAP, vaccins à jour, stérilisation.</p>
            </div>
            <button class="btn-refresh-eligibility" (click)="refreshEligibility()">
              Actualiser le contrôle
            </button>
          </div>

          <div class="eligibility-content">
            <div class="status-banner" [class.eligible]="isEligible()" [class.not-eligible]="!isEligible()">
              <div class="eligibility-icon-wrap">
                @if (isEligible()) {
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                } @else {
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                }
              </div>
              <div class="status-banner-text">
                @if (isEligible()) {
                  <h3 class="status-banner-heading">Animal 100% Éligible à l'Adoption</h3>
                  <p class="status-banner-sub">Toutes les conditions sanitaires, légales et d'identification sont validées avec succès.</p>
                } @else {
                  <h3 class="status-banner-heading">Dossier Non Éligible - Prérequis Manquants</h3>
                  <p class="status-banner-sub">Veuillez régulariser les points de contrôle ci-dessous avant toute procédure d'adoption.</p>
                }
              </div>
            </div>

            <div class="checklist-section">
              <h4 class="checklist-title">Critères de conformité sanitaire vérifiés</h4>
              <ul class="criteria-list">
                @for (reason of eligibilityReasons(); track reason) {
                  <li class="criteria-item">
                    <span class="check-bullet">✓</span>
                    <span>{{ reason }}</span>
                  </li>
                }
              </ul>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- Modals -->
    @if (showVaccineModal) {
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">Ajouter un vaccin</h3>
            <button class="btn-modal-close" (click)="showVaccineModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Nom du vaccin *</label>
              <input type="text" [(ngModel)]="newVaccine.name" placeholder="ex: Rage, DHPP, FeLV..." class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Numéro de lot</label>
              <input type="text" [(ngModel)]="newVaccine.batch" class="form-input" />
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Date d'injection *</label>
                <input type="date" [(ngModel)]="newVaccine.injectionDate" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Prochain rappel *</label>
                <input type="date" [(ngModel)]="newVaccine.nextDueDate" class="form-input" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="showVaccineModal = false">Annuler</button>
            <button class="btn-submit" (click)="submitVaccination()">Enregistrer le vaccin</button>
          </div>
        </div>
      </div>
    }

    @if (showConsultationModal) {
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">Ajouter une consultation médicale</h3>
            <button class="btn-modal-close" (click)="showConsultationModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Diagnostic clinique *</label>
              <input type="text" [(ngModel)]="newConsultation.diagnosis" placeholder="ex: Contrôle annuel, Otite externe..." class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Traitement prescrit</label>
              <textarea [(ngModel)]="newConsultation.treatment" rows="2" placeholder="Prescription et posologie..." class="form-textarea"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Notes et observations</label>
              <textarea [(ngModel)]="newConsultation.notes" rows="2" placeholder="Remarques complémentaires..." class="form-textarea"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="showConsultationModal = false">Annuler</button>
            <button class="btn-submit" (click)="submitConsultation()">Archiver au dossier</button>
          </div>
        </div>
      </div>
    }

    @if (showAuthModal) {
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">Accorder un accès vétérinaire</h3>
            <button class="btn-modal-close" (click)="showAuthModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Sélectionner le praticien *</label>
              <select [(ngModel)]="newAuth.veterinarianId" class="form-select">
                <option [value]="1">Dr. Sarah Ben Ali (Clinique Centrale)</option>
                <option [value]="2">Dr. Karim Mansour (Clinique Pasteur)</option>
                <option [value]="3">Dr. Mehdi Trabelsi (Urgences SOS Véto)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Périmètre d'autorisation (Scope) *</label>
              <select [(ngModel)]="newAuth.accessScope" class="form-select">
                <option value="FULL_ACCESS">Accès Complet (Consultation + Ajout d'actes)</option>
                <option value="READ_ONLY">Lecture Seule (Consultation du carnet)</option>
                <option value="EMERGENCY_ONLY">Urgence Uniquement</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Date d'expiration *</label>
              <input type="date" [(ngModel)]="newAuth.expiresAt" class="form-input" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="showAuthModal = false">Annuler</button>
            <button class="btn-submit" (click)="submitAuthorization()">Accorder l'accès</button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL: EDIT PET DETAILS (PostgreSQL Sync) -->
    @if (showEditPetModal) {
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">Modifier les informations de l'animal</h3>
            <button class="btn-modal-close" (click)="showEditPetModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Nom de l'animal *</label>
              <input type="text" [(ngModel)]="editPetForm.name" placeholder="Ex: Micha" class="form-input" />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div class="form-group">
                <label class="form-label">Espèce *</label>
                <select [(ngModel)]="editPetForm.species" class="form-select">
                  <option value="CHAT">Chat (Cat)</option>
                  <option value="CHIEN">Chien (Dog)</option>
                  <option value="NAC">NAC / Lapin</option>
                  <option value="RONGEUR">Rongeur</option>
                  <option value="OISEAU">Oiseau</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Genre *</label>
                <select [(ngModel)]="editPetForm.gender" class="form-select">
                  <option value="F">Femelle (Female ♀)</option>
                  <option value="M">Mâle (Male ♂)</option>
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div class="form-group">
                <label class="form-label">Race *</label>
                <input type="text" [(ngModel)]="editPetForm.breed" placeholder="Ex: siamois" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Poids (kg) *</label>
                <input type="number" step="0.1" [(ngModel)]="editPetForm.weightKg" placeholder="Ex: 4.5" class="form-input" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div class="form-group">
                <label class="form-label">Date de naissance *</label>
                <input type="date" [(ngModel)]="editPetForm.birthDate" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Puce électronique (15 chiffres)</label>
                <input type="text" [(ngModel)]="editPetForm.microchipNumber" placeholder="Ex: 123456789123121" class="form-input" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="showEditPetModal = false">Annuler</button>
            <button class="btn-submit" (click)="savePetDetails()">Enregistrer les modifications</button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL: ADD MEDICATION (PostgreSQL Sync) -->
    @if (showAddMedicationModal) {
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">Ajouter un médicament / ordonnance</h3>
            <button class="btn-modal-close" (click)="showAddMedicationModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Nom du médicament *</label>
              <input type="text" [(ngModel)]="newMedicationForm.name" placeholder="Ex: Amoxicilline 250mg, Nexgard Spectra..." class="form-input" />
            </div>

            <div class="form-group">
              <label class="form-label">Posologie & Fréquence *</label>
              <input type="text" [(ngModel)]="newMedicationForm.dosage" placeholder="Ex: 1 comprimé matin et soir (7 jours)" class="form-input" />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div class="form-group">
                <label class="form-label">Date de début *</label>
                <input type="date" [(ngModel)]="newMedicationForm.startDate" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Prochaine dose / Rappel</label>
                <input type="date" [(ngModel)]="newMedicationForm.nextDoseDate" class="form-input" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div class="form-group">
                <label class="form-label">Statut *</label>
                <select [(ngModel)]="newMedicationForm.status" class="form-select">
                  <option value="En cours">En cours</option>
                  <option value="Préventif">Préventif</option>
                  <option value="Terminé">Terminé</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Vétérinaire prescripteur</label>
                <input type="text" [(ngModel)]="newMedicationForm.veterinarianName" placeholder="Dr. Sarah Ben Ali" class="form-input" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="showAddMedicationModal = false">Annuler</button>
            <button class="btn-submit" (click)="submitMedication()">Enregistrer le traitement</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      background: #f4faf6;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      box-sizing: border-box;
    }

    * { box-sizing: border-box; }

    .pet-detail-page {
      max-width: 1340px;
      margin: 0 auto;
      padding: 24px 28px 48px;
    }

    .back-nav-wrap {
      margin-bottom: 18px;
      position: relative;
      display: flex;
      align-items: center;

      .top-nav-paw {
        position: absolute;
        left: 390px;
        top: -12px;
        pointer-events: none;
        opacity: 0.22;

        .top-paw-img {
          width: 60px;
          height: auto;
          transform: rotate(10deg);
          display: block;
        }
      }
    }

    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #e6f7ef;
      border: 1px solid rgba(5, 150, 105, 0.15);
      padding: 8px 18px;
      font-size: 14px;
      font-weight: 700;
      color: #059669;
      cursor: pointer;
      border-radius: 9999px;
      transition: all 0.2s ease;
      &:hover {
        background: #d1fae5;
        transform: translateX(-3px);
      }
    }

    /* Hero Banner Profile (Exact Mockup Match) */
    .pet-hero-banner {
      position: relative;
      background: linear-gradient(112deg, #e4f9f0 0%, #d4f5e7 35%, #def7ed 70%, #c4f1dc 100%);
      border-radius: 24px;
      padding: 30px 36px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 32px;
      box-shadow: 0 4px 20px rgba(16, 185, 129, 0.08);
      margin-bottom: 24px;
      overflow: hidden;

      .banner-paw-pattern {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: hidden;

        .bg-paw {
          position: absolute;
          opacity: 0.28;
          object-fit: contain;
          pointer-events: none;

          &.p1 {
            width: 72px;
            height: auto;
            top: 14px;
            left: 380px;
            transform: rotate(-15deg);
          }

          &.p2 {
            width: 68px;
            height: auto;
            top: 16px;
            left: 585px;
            transform: rotate(12deg);
          }

          &.p3 {
            width: 82px;
            height: auto;
            bottom: 6px;
            left: 550px;
            transform: rotate(22deg);
          }
        }
      }

      .hero-left {
        display: flex;
        align-items: center;
        gap: 28px;
        z-index: 1;

        .pet-avatar-wrapper {
          position: relative;
          width: 140px;
          height: 140px;
          border-radius: 24px;
          overflow: visible;
          flex-shrink: 0;

          .hero-avatar-img {
            width: 100%;
            height: 100%;
            border-radius: 24px;
            object-fit: cover;
            display: block;
            box-shadow: 0 8px 24px rgba(16, 185, 129, 0.2);
            background: #a7f3d0;
          }

          .avatar-camera-btn {
            position: absolute;
            bottom: -4px;
            right: -4px;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #059669;
            color: #ffffff;
            border: 3px solid #ffffff;
            box-shadow: 0 4px 10px rgba(5, 150, 105, 0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            &:hover {
              transform: scale(1.08);
              background: #047857;
            }
          }
        }

        .hero-text-block {
          .hero-name-row {
            display: flex;
            align-items: center;
            gap: 10px;

            .hero-pet-name {
              margin: 0;
              font-size: 34px;
              font-weight: 800;
              color: #0f172a;
              letter-spacing: -0.5px;
            }

            .hero-gender-icon {
              width: 26px;
              height: 26px;
              object-fit: contain;
              vertical-align: middle;
              margin-left: 6px;
              display: inline-block;
              filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08));
            }
          }

          .hero-subtext {
            margin: 4px 0 10px;
            font-size: 15px;
            font-weight: 600;
            color: #475569;
          }

          .hero-badges-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 12px;

            .hero-pill {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: rgba(255, 255, 255, 0.7);
              backdrop-filter: blur(4px);
              border: 1px solid rgba(5, 150, 105, 0.2);
              border-radius: 9999px;
              padding: 5px 14px;
              font-size: 13.5px;
              font-weight: 700;
              color: #065f46;

              .pill-icon { font-size: 14px; }
              .pill-svg { width: 14px; height: 14px; }
            }
          }

          .hero-quote {
            margin: 0;
            font-size: 14px;
            font-weight: 500;
            color: #1e293b;
          }
        }
      }

      /* Floating Health Status Card Right */
      .health-status-card {
        background: #ffffff;
        border-radius: 20px;
        padding: 20px 24px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
        border: 1px solid rgba(226, 232, 240, 0.8);
        min-width: 270px;
        position: relative;
        overflow: hidden;
        z-index: 1;

        .health-card-paw-decor {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 78px;
          pointer-events: none;
          z-index: 0;

          .card-decor-paw {
            width: 100%;
            height: auto;
            opacity: 0.28;
            transform: rotate(16deg);
            display: block;
          }
        }

        .health-card-inner {
          display: flex;
          align-items: center;
          gap: 16px;
          position: relative;
          z-index: 1;

          .heartbeat-badge-icon {
            width: 52px;
            height: 52px;
            border-radius: 50%;
            background: #059669;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(5, 150, 105, 0.3);
            flex-shrink: 0;
          }

          .health-card-text {
            .health-status-label {
              font-size: 12.5px;
              font-weight: 700;
              color: #475569;
            }

            .health-status-title {
              font-size: 26px;
              font-weight: 800;
              color: #059669;
              line-height: 1.1;
              margin: 2px 0 4px;
            }

            .health-status-bottom {
              display: flex;
              align-items: center;
              gap: 8px;

              .health-status-note {
                font-size: 12.5px;
                color: #64748b;
                font-weight: 500;
              }

              .status-check-circle {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #10b981;
                display: inline-flex;
                align-items: center;
                justify-content: center;
              }
            }
          }
        }
      }
    }

    /* Navigation Tabs Row */
    .detail-nav-tabs {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
      overflow: visible;
      position: relative;
      z-index: 60;

      .nav-tab {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 10px 20px;
        font-size: 14px;
        font-weight: 700;
        color: #1e293b;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;

        .tab-img-icon {
          width: 20px;
          height: 20px;
          object-fit: contain;
          vertical-align: middle;
          transition: filter 0.2s;
        }

        &:hover {
          border-color: #059669;
          color: #059669;
          background: #f0fdf4;
        }

        &.active {
          background: #059669;
          color: #ffffff;
          border-color: #059669;
          box-shadow: 0 4px 14px rgba(5, 150, 105, 0.25);

          .tab-img-icon {
            filter: brightness(0) invert(1);
          }

          svg { stroke: #ffffff; }
        }
      }

      .more-tab-container {
        position: relative;
        display: inline-block;

        .more-dropdown-menu {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04);
          padding: 8px;
          z-index: 99999;
          min-width: 250px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          animation: moreDropAnim 0.18s cubic-bezier(0.16, 1, 0.3, 1);

          .dropdown-item {
            width: 100%;
            text-align: left;
            background: #ffffff;
            border: 1px solid transparent;
            border-radius: 12px;
            padding: 12px 16px;
            font-size: 14px;
            font-weight: 700;
            color: #1e293b;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: all 0.18s ease;

            .item-icon {
              font-size: 18px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
            }

            .item-label {
              flex: 1;
              color: #1e293b;
              font-weight: 700;
            }

            &:hover {
              background: #f0fdf4;
              border-color: #a7f3d0;
              color: #047857;
              transform: translateX(2px);

              .item-label {
                color: #047857;
              }
            }

            &.active-item {
              background: #ecfdf5;
              border-color: #6ee7b7;
              color: #059669;

              .item-label {
                color: #059669;
                font-weight: 800;
              }
            }
          }
        }
      }
    }

    @keyframes moreDropAnim {
      from {
        opacity: 0;
        transform: translateY(-8px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    /* Middle 3-Column Grid */
    .middle-grid-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 22px;
      margin-bottom: 22px;
    }

    .info-card {
      background: #ffffff;
      border-radius: 20px;
      padding: 22px 24px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
      border: 1px solid #eef2f6;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 18px;

        .head-left {
          display: flex;
          align-items: center;
          gap: 10px;

          .head-icon-circle {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: #e6f7ef;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .card-title {
            margin: 0;
            font-size: 17px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.2px;
          }
        }

        .btn-edit-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #e6f7ef;
          border: none;
          border-radius: 9999px;
          padding: 5px 14px;
          font-size: 13px;
          font-weight: 700;
          color: #059669;
          cursor: pointer;
          transition: all 0.2s;
          &:hover {
            background: #d1fae5;
          }
        }

        .btn-card-link {
          background: none;
          border: none;
          color: #059669;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          transition: color 0.2s;
          &:hover {
            color: #047857;
            text-decoration: underline;
          }
        }
      }
    }

    /* 1. Pet Information Card */
    .pet-info-card {
      .info-table {
        display: flex;
        flex-direction: column;
        gap: 10px;

        .info-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 6px;
          border-bottom: 1px solid #f8fafc;
          font-size: 13.5px;

          .info-label {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            color: #475569;

            .row-icon {
              width: 16px;
              height: 16px;
            }
          }

          .info-val {
            font-weight: 700;
            color: #0f172a;

            .info-gender-icon {
              width: 18px;
              height: 18px;
              object-fit: contain;
              vertical-align: middle;
              margin-left: 6px;
              display: inline-block;
            }
          }
        }
      }
    }

    /* 2. Health Summary Card */
    .health-summary-card {
      .health-summary-body {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 6px 0;

        .donut-column {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;

          .donut-chart-wrap {
            position: relative;
            width: 110px;
            height: 110px;

            .donut-svg {
              width: 100%;
              height: 100%;
            }

            .donut-center-heart {
              position: absolute;
              inset: 0;
              display: flex;
              align-items: center;
              justify-content: center;
            }
          }

          .donut-bottom-label {
            margin-top: 10px;
            text-align: center;

            .donut-sub-text {
              display: block;
              font-size: 12px;
              font-weight: 600;
              color: #64748b;
            }

            .donut-main-text {
              display: block;
              font-size: 20px;
              font-weight: 800;
              color: #059669;
              line-height: 1.1;
            }
          }
        }

        .health-checklist {
          display: flex;
          flex-direction: column;
          gap: 14px;
          flex: 1;
          padding-left: 8px;

          .health-check-item {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 13.5px;
            font-weight: 600;
            color: #1e293b;

            .green-check-dot {
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: #059669;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }
          }
        }
      }
    }

    /* 3. Next Visit Card */
    .next-visit-card {
      position: relative;

      .watermark-stethoscope {
        position: absolute;
        right: 16px;
        top: 12px;
        width: 80px;
        height: 80px;
        pointer-events: none;
      }

      .visit-content-row {
        display: flex;
        align-items: center;
        gap: 16px;
        margin: 12px 0 20px;

        .visit-date-badge {
          width: 68px;
          height: 68px;
          border-radius: 16px;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          .date-month {
            font-size: 12px;
            font-weight: 800;
            color: #059669;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }

          .date-day {
            font-size: 26px;
            font-weight: 900;
            color: #0f172a;
            line-height: 1;
          }
        }

        .visit-meta {
          flex: 1;

          .visit-type {
            margin: 0 0 4px;
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
          }

          .visit-time {
            margin: 0 0 4px;
            font-size: 13px;
            font-weight: 600;
            color: #64748b;
            display: flex;
            align-items: center;
            gap: 5px;
          }

          .visit-doctor {
            margin: 0;
            font-size: 13px;
            font-weight: 600;
            color: #64748b;
            display: flex;
            align-items: center;
            gap: 5px;
          }
        }
      }

      .btn-add-calendar {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: #059669;
        color: #ffffff;
        border: none;
        border-radius: 12px;
        padding: 12px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
        &:hover {
          background: #047857;
        }
      }
    }

    /* Bottom 2-Column Grid (50% / 50% split) */
    .bottom-grid-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 22px;
    }

    /* 4. Vaccination History Card */
    .vaccination-history-card {
      .vac-history-table {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .vac-history-row {
          display: grid;
          grid-template-columns: 2fr 1.2fr 1.2fr;
          align-items: center;
          padding: 11px 14px;
          background: #f8fafc;
          border-radius: 12px;
          font-size: 13.5px;

          .vac-col-name {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 700;
            color: #0f172a;

            .vac-check-circle {
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: #059669;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }
          }

          .vac-col-date {
            color: #475569;
            font-weight: 500;
          }

          .vac-col-valid {
            color: #64748b;
            font-weight: 500;
            text-align: right;
          }
        }
      }
    }

    /* 5. Medical History Card */
    .medical-history-card {
      position: relative;

      .watermark-paw {
        position: absolute;
        right: 18px;
        top: 8px;
        width: 68px;
        pointer-events: none;

        .card-watermark-paw {
          width: 100%;
          height: auto;
          opacity: 0.22;
          transform: rotate(16deg);
          display: block;
        }
      }

      .med-history-list {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .med-history-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 14px;
          background: #f8fafc;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          &:hover {
            background: #f1f5f9;
          }

          .med-date-badge {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;

            .med-date-month {
              font-size: 11px;
              font-weight: 800;
              color: #64748b;
              text-transform: uppercase;
            }

            .med-date-day {
              font-size: 17px;
              font-weight: 900;
              color: #0f172a;
              line-height: 1;
            }
          }

          .med-info-content {
            flex: 1;

            .med-title {
              margin: 0 0 2px;
              font-size: 14.5px;
              font-weight: 700;
              color: #0f172a;
            }

            .med-subtitle {
              margin: 0;
              font-size: 12.5px;
              color: #64748b;
            }
          }

          .med-chevron {
            color: #94a3b8;
            display: flex;
            align-items: center;
          }
        }
      }
    }

    /* Backend Feature Containers (Vaccinations, Consultations, Authorizations, Eligibility) */
    .feature-tab-container {
      background: #ffffff;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
      border: 1px solid #eef2f6;

      .tab-top-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;

        .tab-main-title {
          margin: 0 0 4px;
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
        }

        .tab-sub-title {
          margin: 0;
          font-size: 13.5px;
          color: #64748b;
        }

        .btn-primary-action {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #059669;
          color: #ffffff;
          border: none;
          border-radius: 12px;
          padding: 10px 18px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          &:hover { background: #047857; }
        }

        .btn-refresh-eligibility {
          background: #e6f7ef;
          color: #059669;
          border: 1px solid rgba(5, 150, 105, 0.2);
          border-radius: 12px;
          padding: 10px 18px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          &:hover { background: #d1fae5; }
        }
      }

      .cards-list-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;

        .item-feature-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 18px;

          .card-badge-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;

            .vaccine-icon-circle {
              width: 34px;
              height: 34px;
              border-radius: 8px;
              background: #e6f7ef;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .status-tag {
              font-size: 12px;
              font-weight: 700;
              padding: 4px 10px;
              border-radius: 9999px;
              &.success { background: #dcfce7; color: #15803d; }
            }
          }

          .item-title {
            margin: 0 0 12px;
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
          }

          .item-meta-grid {
            display: flex;
            flex-direction: column;
            gap: 6px;
            font-size: 13px;

            .meta-row {
              display: flex;
              justify-content: space-between;
              .meta-k { color: #64748b; }
              .meta-v { font-weight: 600; color: #0f172a; }
              .text-highlight { color: #059669; font-weight: 700; }
              .mono { font-family: monospace; }
            }
          }
        }
      }

      .records-full-list {
        display: flex;
        flex-direction: column;
        gap: 16px;

        .consultation-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px;

          .consultation-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 14px;

            .consult-date-badge {
              font-size: 12px;
              font-weight: 700;
              color: #059669;
              background: #e6f7ef;
              padding: 3px 10px;
              border-radius: 9999px;
            }

            .consult-diag {
              margin: 6px 0 0;
              font-size: 17px;
              font-weight: 800;
              color: #0f172a;
            }

            .consult-vet-badge {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              font-size: 13px;
              font-weight: 600;
              color: #475569;
            }
          }

          .consult-details {
            display: flex;
            flex-direction: column;
            gap: 10px;

            .detail-block {
              .detail-label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; }
              .detail-text { margin: 2px 0 0; font-size: 14px; color: #1e293b; }
            }
          }
        }
      }

      .auth-table-card {
        overflow-x: auto;

        .auth-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;

          th {
            text-align: left;
            padding: 12px 14px;
            color: #64748b;
            font-weight: 700;
            border-bottom: 1px solid #e2e8f0;
          }

          td {
            padding: 14px;
            border-bottom: 1px solid #f1f5f9;
            color: #1e293b;

            &.col-vet {
              display: flex;
              align-items: center;
              gap: 10px;

              .vet-avatar-small {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: #e6f7ef;
                color: #059669;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 800;
                font-size: 12px;
              }

              .vet-text {
                display: flex;
                flex-direction: column;
                .vet-name { font-weight: 700; color: #0f172a; }
                .vet-clinic { font-size: 12px; color: #64748b; }
              }
            }

            .scope-pill {
              font-size: 12px;
              font-weight: 700;
              padding: 4px 10px;
              border-radius: 9999px;
              background: #f1f5f9;
              color: #475569;
              &.full_access { background: #dcfce7; color: #15803d; }
              &.read_only { background: #e0f2fe; color: #0369a1; }
            }

            .status-indicator {
              font-weight: 700;
              color: #64748b;
              &.active { color: #059669; }
            }

            .btn-revoke {
              background: #fee2e2;
              color: #b91c1c;
              border: none;
              padding: 6px 12px;
              border-radius: 8px;
              font-weight: 700;
              font-size: 12px;
              cursor: pointer;
            }

            .revoked-label { color: #94a3b8; font-size: 12px; }
          }
        }
      }

      .eligibility-content {
        .status-banner {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 20px 24px;
          border-radius: 16px;
          margin-bottom: 24px;
          &.eligible { background: #ecfdf5; border: 1.5px solid #a7f3d0; }
          &.not-eligible { background: #fef2f2; border: 1.5px solid #fecaca; }

          .status-banner-heading { margin: 0 0 4px; font-size: 18px; font-weight: 800; color: #0f172a; }
          .status-banner-sub { margin: 0; font-size: 13.5px; color: #475569; }
        }

        .checklist-section {
          background: #f8fafc;
          border-radius: 16px;
          padding: 20px;

          .checklist-title { margin: 0 0 14px; font-size: 15px; font-weight: 800; color: #0f172a; }
          .criteria-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 10px;

            .criteria-item {
              display: flex;
              align-items: center;
              gap: 10px;
              font-size: 14px;
              font-weight: 600;
              color: #1e293b;

              .check-bullet {
                width: 22px;
                height: 22px;
                border-radius: 50%;
                background: #059669;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 800;
              }
            }
          }
        }
      }
    }

    /* Modals */
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

    .modal-card {
      background: #ffffff;
      border-radius: 20px;
      width: 100%;
      max-width: 520px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      overflow: hidden;

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid #f1f5f9;

        .modal-title { margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; }
        .btn-modal-close { background: none; border: none; font-size: 18px; cursor: pointer; color: #64748b; }
      }

      .modal-body {
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;

          .form-label { font-size: 13px; font-weight: 700; color: #334155; }
          .form-input, .form-select, .form-textarea {
            padding: 10px 14px;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            font-size: 14px;
            outline: none;
            font-family: inherit;
            &:focus { border-color: #059669; box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12); }
          }
        }

        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 16px 24px;
        background: #f8fafc;
        border-top: 1px solid #f1f5f9;

        .btn-cancel {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 8px 16px;
          font-size: 13.5px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
        }

        .btn-submit {
          background: #059669;
          border: none;
          border-radius: 10px;
          padding: 8px 18px;
          font-size: 13.5px;
          font-weight: 700;
          color: white;
          cursor: pointer;
          &:hover { background: #047857; }
        }
      }
    }
  `]
})
export class PetPassViewComponent {
  private readonly petPassService = inject(PetPassService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  readonly searchService = inject(SearchService);
  readonly images = DETAIL_IMAGES;

  back = output<void>();

  // Current active tab (default to medical_record as in mockup)
  activeTab: 'medical_record' | 'vaccinations' | 'visits' | 'medications' | 'documents' | 'more' | 'authorizations' | 'eligibility' | 'records' | 'overview' = 'medical_record';
  showMoreMenu = false;

  // Modals visibility state
  showVaccineModal = false;
  showConsultationModal = false;
  showAuthModal = false;
  showAddMedicationModal = false;

  newMedicationForm = {
    name: '',
    dosage: '',
    startDate: new Date().toISOString().slice(0, 10),
    nextDoseDate: '',
    status: 'En cours',
    veterinarianName: 'Dr. Sarah Ben Ali'
  };

  // Form Models
  newVaccine = {
    name: '',
    batch: '',
    injectionDate: new Date().toISOString().slice(0, 10),
    nextDueDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  };

  newConsultation = {
    diagnosis: '',
    treatment: '',
    notes: ''
  };

  newAuth: {
    veterinarianId: number;
    accessScope: AccessScope;
    expiresAt: string;
  } = {
      veterinarianId: 1,
      accessScope: 'FULL_ACCESS',
      expiresAt: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().slice(0, 10)
    };

  readonly currentPet = computed<Animal>(() => {
    const selected = this.petPassService.selectedAnimal();
    if (selected) return selected;
    const list = this.petPassService.animals();
    if (list.length > 0) return list[0];
    return {
      id: 1,
      name: 'Micha',
      species: 'CHAT',
      breed: 'Domestic Shorthair',
      birthDate: '2025-01-15',
      microchipNumber: '985141000123456',
      microchipStatus: 'VERIFIED',
      ownerId: 1,
      weightKg: 4.5,
      gender: 'F',
      isEligibleForAdoption: true
    };
  });

  readonly currentPetAvatar = computed(() => {
    const pet = this.currentPet();
    if (pet.photoUrl && pet.photoUrl.trim().length > 0) {
      const clean = pet.photoUrl.split('#')[0].trim();
      if (clean.length > 0) return clean;
    }
    if (pet.species === 'CHAT' || pet.name.toLowerCase() === 'micha') {
      return 'assets/images/luna-pet-avatar.png';
    }
    return this.images.buddyAvatar;
  });

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = (this.currentPet().species === 'CHAT' || this.currentPet().name.toLowerCase() === 'micha')
        ? 'assets/images/luna-pet-avatar.png'
        : this.images.buddyAvatar;
    }
  }

  readonly heroSubtitle = computed(() => {
    const pet = this.currentPet();
    const species = pet.species === 'CHIEN' ? 'Dog' : 'Cat';
    const age = this.petAgeText();
    const gender = pet.gender === 'F' ? 'Female' : 'Male';
    return `${species} • ${age} • ${gender}`;
  });

  readonly petAgeText = computed(() => {
    const pet = this.currentPet();
    if (!pet.birthDate) return '1 year old';
    const birth = new Date(pet.birthDate);
    const diffYears = Math.max(1, new Date().getFullYear() - birth.getFullYear());
    return `${diffYears} ${diffYears > 1 ? 'years old' : 'year old'}`;
  });

  readonly vaccinations = computed(() => {
    return this.petPassService.currentHistory()?.vaccinations || [];
  });

  readonly consultations = computed(() => {
    return this.petPassService.currentHistory()?.consultations || [];
  });

  readonly medications = computed(() => {
    return this.petPassService.currentMedications();
  });

  displaySpecies(species: string): string {
    if (!species) return 'Cat';
    const s = species.toUpperCase();
    if (s === 'CHIEN') return 'Dog';
    if (s === 'CHAT') return 'Cat';
    if (s === 'NAC') return 'Rabbit';
    if (s === 'RONGEUR') return 'Rodent';
    return species;
  }

  readonly nextVisitRecord = computed(() => {
    const list = this.consultations();
    const found = list.find(c => c.diagnosis && c.diagnosis.toLowerCase().includes('annual checkup')) || (list.length > 0 ? list[0] : null);
    if (found && found.consultationDate) {
      const d = new Date(found.consultationDate);
      let title = 'Annual Checkup';
      if (found.diagnosis) {
        title = found.diagnosis.split(':')[0].trim();
      }
      return {
        date: d,
        title: title,
        time: '9:00 AM',
        doctor: 'Dr. Sarah Ben Ali'
      };
    }
    return {
      date: new Date('2025-04-30T09:00:00'),
      title: 'Annual Checkup',
      time: '9:00 AM',
      doctor: 'Dr. Sarah Ben Ali'
    };
  });

  readonly nextVisitMonth = computed(() => {
    return this.nextVisitRecord().date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  });

  readonly nextVisitDay = computed(() => {
    return this.nextVisitRecord().date.getDate().toString();
  });

  readonly nextVisitTitle = computed(() => {
    return this.nextVisitRecord().title;
  });

  readonly nextVisitTime = computed(() => {
    return this.nextVisitRecord().time;
  });

  readonly nextVisitDoctor = computed(() => {
    return this.nextVisitRecord().doctor;
  });

  readonly overallHealthStatus = computed(() => {
    const vacs = this.vaccinations();
    if (vacs && vacs.length > 0) {
      return this.isEligible() ? 'Excellent' : 'Attention requise';
    }
    return 'Attention requise';
  });

  readonly healthStatusNote = computed(() => {
    const vacs = this.vaccinations();
    if (vacs && vacs.length > 0 && this.isEligible()) {
      return 'Everything looks good!';
    }
    return 'Vaccins ou bilan à prévoir';
  });

  readonly displayVaccines = computed(() => {
    const q = this.searchService.query().trim().toLowerCase();
    const list = this.vaccinations();
    if (list && list.length > 0) {
      const filtered = q ? list.filter(v => v.vaccineName?.toLowerCase().includes(q)) : list;
      return filtered.slice(0, 3).map(v => {
        const d = v.injectionDate || v.administeredDate;
        let formattedDate = 'Jan 15, 2026';
        if (d) {
          const parts = String(d).split('-');
          if (parts.length === 3) {
            const yr = parts[0];
            const mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parseInt(parts[1], 10) - 1];
            const da = parseInt(parts[2], 10);
            formattedDate = `${mo} ${da}, ${yr}`;
          } else {
            formattedDate = new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          }
        }
        const next = v.nextDueDate || v.nextBoosterDate;
        const validYear = next ? new Date(next).getFullYear() : '2027';
        return {
          name: v.vaccineName,
          date: formattedDate,
          validUntil: `Valid until ${validYear}`
        };
      });
    }
    return [];
  });

  readonly displayMedicalHistory = computed(() => {
    const q = this.searchService.query().trim().toLowerCase();
    const list = this.consultations();
    if (list && list.length > 0) {
      let pastList = list.filter(c => !c.diagnosis || !c.diagnosis.toLowerCase().includes('annual checkup'));
      if (q) {
        pastList = pastList.filter(c => 
          c.diagnosis?.toLowerCase().includes(q) || 
          c.notes?.toLowerCase().includes(q) || 
          c.treatment?.toLowerCase().includes(q)
        );
      }
      const toShow = pastList.length > 0 ? pastList : (q ? [] : list);
      return toShow.slice(0, 2).map(c => {
        const d = c.consultationDate ? new Date(c.consultationDate) : new Date();
        const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const day = d.getDate();
        let title = c.diagnosis || 'Routine Checkup';
        let subtitle = c.notes || c.treatment || 'General checkup, all good!';
        if (title.includes(':')) {
          const parts = title.split(':');
          title = parts[0].trim();
          subtitle = parts.slice(1).join(':').trim();
        }
        return {
          month,
          day,
          title,
          subtitle
        };
      });
    }
    return [];
  });

  readonly authorizations = computed(() => {
    return this.petPassService.currentAuthorizations();
  });

  readonly eligibility = computed(() => {
    return this.petPassService.currentEligibility();
  });

  readonly isEligible = computed(() => {
    const el = this.eligibility();
    return el ? (el.status === 'ELIGIBLE' || Boolean(el.eligible)) : true;
  });

  readonly eligibilityReasons = computed(() => {
    const el = this.eligibility();
    if (el && el.reasons && el.reasons.length > 0) {
      return el.reasons;
    }
    return [
      'Puce électronique 15 chiffres validée via registre SOAP',
      'Vaccinations obligatoires à jour (Rage, DHPP)',
      'Examen clinique vétérinaire conforme',
      'Aucune contre-indication médicale identifiée'
    ];
  });

  setTab(tab: any): void {
    this.activeTab = tab;
    this.showMoreMenu = false;
    const petId = this.currentPet().id;
    if (tab === 'authorizations') {
      this.petPassService.loadAuthorizations(petId);
    } else if (tab === 'eligibility') {
      this.petPassService.loadEligibility(petId);
    }
  }

  toggleMoreMenu(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.showMoreMenu = !this.showMoreMenu;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.showMoreMenu && target && !target.closest('.more-tab-container')) {
      this.showMoreMenu = false;
    }
  }

  goBack(): void {
    this.back.emit();
  }

  notifyCalendar(): void {
    const v = this.nextVisitRecord();
    this.toast.show(`Rendez-vous "${v.title}" du ${v.date.toLocaleDateString('fr-FR')} synchronisé avec succès !`, 'success');
  }

  showEditPetModal = false;
  editPetForm = {
    name: '',
    species: 'CHAT',
    breed: '',
    birthDate: '',
    microchipNumber: '',
    gender: 'F',
    weightKg: 4.5
  };

  openEditPetModal(): void {
    const pet = this.currentPet();
    this.editPetForm = {
      name: pet.name || '',
      species: pet.species || 'CHAT',
      breed: pet.breed || '',
      birthDate: pet.birthDate || '',
      microchipNumber: pet.microchipNumber || '',
      gender: pet.gender || 'F',
      weightKg: pet.weightKg || 4.5
    };
    this.showEditPetModal = true;
  }

  savePetDetails(): void {
    if (!this.editPetForm.name.trim()) {
      this.toast.show('Le nom de l\'animal est obligatoire', 'error');
      return;
    }
    const pet = this.currentPet();
    this.petPassService.updateAnimalDetails(pet.id, {
      name: this.editPetForm.name.trim(),
      species: this.editPetForm.species as Species,
      breed: this.editPetForm.breed.trim(),
      birthDate: this.editPetForm.birthDate,
      microchipNumber: this.editPetForm.microchipNumber.trim(),
      gender: this.editPetForm.gender as 'M' | 'F',
      weightKg: Number(this.editPetForm.weightKg) || 4.5
    }).subscribe({
      next: () => {
        this.showEditPetModal = false;
        this.toast.show(`Informations de ${this.editPetForm.name} mises à jour avec succès !`, 'success');
      },
      error: (err: any) => {
        console.error('Erreur mise à jour:', err);
        this.toast.show('Erreur lors de la mise à jour des informations', 'error');
      }
    });
  }

  // --- Modal actions ---
  openAddVaccineModal(): void {
    this.newVaccine.name = '';
    this.newVaccine.batch = `LOT-${Math.floor(10000 + Math.random() * 90000)}`;
    this.showVaccineModal = true;
  }

  submitVaccination(): void {
    if (!this.newVaccine.name.trim()) {
      this.toast.show('Le nom du vaccin est obligatoire', 'error');
      return;
    }

    const petId = this.currentPet().id;
    this.petPassService.addVaccination(petId, {
      vaccineName: this.newVaccine.name,
      batchNumber: this.newVaccine.batch,
      injectionDate: this.newVaccine.injectionDate,
      nextDueDate: this.newVaccine.nextDueDate
    }).subscribe({
      next: () => {
        this.toast.show(`Vaccination "${this.newVaccine.name}" enregistrée avec succès !`, 'success');
        this.showVaccineModal = false;
      },
      error: () => {
        this.toast.show('Erreur lors de l\'enregistrement du vaccin', 'error');
      }
    });
  }

  openAddConsultationModal(): void {
    this.newConsultation.diagnosis = '';
    this.newConsultation.treatment = '';
    this.newConsultation.notes = '';
    this.showConsultationModal = true;
  }

  submitConsultation(): void {
    if (!this.newConsultation.diagnosis.trim()) {
      this.toast.show('Le diagnostic médical est obligatoire', 'error');
      return;
    }

    const petId = this.currentPet().id;
    this.petPassService.addConsultation(petId, {
      diagnosis: this.newConsultation.diagnosis,
      treatment: this.newConsultation.treatment,
      notes: this.newConsultation.notes,
      consultationDate: new Date().toISOString()
    }).subscribe({
      next: () => {
        this.toast.show('Consultation enregistrée et archivée au dossier !', 'success');
        this.showConsultationModal = false;
      },
      error: () => {
        this.toast.show('Erreur lors de l\'enregistrement de la consultation', 'error');
      }
    });
  }

  openAddMedicationModal(): void {
    this.newMedicationForm = {
      name: '',
      dosage: '',
      startDate: new Date().toISOString().slice(0, 10),
      nextDoseDate: '',
      status: 'En cours',
      veterinarianName: 'Dr. Sarah Ben Ali'
    };
    this.showAddMedicationModal = true;
  }

  submitMedication(): void {
    if (!this.newMedicationForm.name.trim()) {
      this.toast.show('Le nom du médicament est obligatoire', 'error');
      return;
    }
    const petId = this.currentPet().id;
    this.petPassService.addMedication(petId, {
      animalId: petId,
      name: this.newMedicationForm.name.trim(),
      dosage: this.newMedicationForm.dosage.trim() || 'Selon prescription',
      startDate: this.newMedicationForm.startDate || new Date().toISOString().slice(0, 10),
      nextDoseDate: this.newMedicationForm.nextDoseDate || null,
      status: this.newMedicationForm.status,
      veterinarianName: this.newMedicationForm.veterinarianName.trim() || 'Dr. Sarah Ben Ali'
    }).subscribe({
      next: () => {
        this.toast.show(`Médicament "${this.newMedicationForm.name}" enregistré avec succès !`, 'success');
        this.showAddMedicationModal = false;
      },
      error: () => {
        this.toast.show('Erreur lors de l\'enregistrement du médicament', 'error');
      }
    });
  }

  openGrantAccessModal(): void {
    this.showAuthModal = true;
  }

  submitAuthorization(): void {
    const petId = this.currentPet().id;
    const expiresDateTime = `${this.newAuth.expiresAt}T23:59:59`;

    this.petPassService.grantAccess(petId, {
      veterinarianId: Number(this.newAuth.veterinarianId),
      accessScope: this.newAuth.accessScope,
      expiresAt: expiresDateTime
    }).subscribe({
      next: () => {
        this.toast.show('Autorisation vétérinaire accordée avec succès !', 'success');
        this.showAuthModal = false;
      },
      error: () => {
        this.toast.show('Erreur lors de l\'octroi de l\'autorisation', 'error');
      }
    });
  }

  revokeAccess(authId: number): void {
    const petId = this.currentPet().id;
    this.petPassService.revokeAccess(petId, authId).subscribe({
      next: () => {
        this.toast.show('Autorisation révoquée avec succès', 'info');
      }
    });
  }

  refreshEligibility(): void {
    const petId = this.currentPet().id;
    this.petPassService.loadEligibility(petId);
    this.toast.show('Contrôle d\'éligibilité actualisé', 'info');
  }

  isUpdatingPhoto = signal<boolean>(false);

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    if (file.size > 5 * 1024 * 1024) {
      this.toast.show('L\'image dépasse la taille maximale autorisée (5 Mo)', 'error');
      return;
    }

    this.isUpdatingPhoto.set(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      const pet = this.currentPet();

      // Mise à jour immédiate réactive du signal local pour feedback instantané
      this.petPassService.selectedAnimal.update(p => p ? { ...p, photoUrl: base64Data } : p);
      this.petPassService.animals.update(list => list.map(a => a.id === pet.id ? { ...a, photoUrl: base64Data } : a));

      this.petPassService.updateAnimalPhoto(pet.id, base64Data, pet.gender).subscribe({
        next: () => {
          this.isUpdatingPhoto.set(false);
          this.toast.show(`Photo de ${pet.name} mise à jour avec succès !`, 'success');
        },
        error: (err) => {
          this.isUpdatingPhoto.set(false);
          console.error('Erreur mise à jour photo:', err);
          this.toast.show('Erreur lors de la mise à jour de l\'image dans la base de données', 'error');
        }
      });
    };
    reader.onerror = () => {
      this.isUpdatingPhoto.set(false);
      this.toast.show('Impossible de lire le fichier image sélectionné', 'error');
    };
    reader.readAsDataURL(file);
    input.value = '';
  }
}
