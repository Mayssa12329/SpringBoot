import { Component, input, output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

export type NavTab = 
  | 'dashboard' 
  | 'petpass' 
  | 'perfil' 
  | 'vetbooking' 
  | 'helpanimal' 
  | 'adoptanimal' 
  | 'vetpharma' 
  | 'rescuecoordination' 
  | 'notifications' 
  | 'settings';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="app-sidebar">
      <div class="sidebar-top-section">
        <!-- Sidebar Brand: Medivet Connect -->
        <div class="sidebar-brand-top" (click)="onBrandClick()">
          <div class="brand-logo-wrap">
            <img 
              src="/medivet-logo-icon.png" 
              alt="Medivet Connect" 
              class="medivet-logo-img" 
            />
          </div>
          <div class="brand-title-wrap">
            <span class="brand-title">Medivet</span>
            <span class="brand-subtitle">Connect</span>
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="nav-menu">
          <!-- Dashboard -->
          <button 
            type="button"
            class="nav-item" 
            [class.active]="activeTab() === 'dashboard'" 
            (click)="selectTab('dashboard')"
            title="Dashboard"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span class="nav-label">Dashboard</span>
          </button>

          <!-- 2. PetPass -->
          <button 
            type="button"
            class="nav-item highlight-petpass" 
            [class.active]="activeTab() === 'petpass'" 
            (click)="selectTab('petpass')"
            title="PetPass"
          >
            <svg class="nav-icon paw-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 11c-1.8 0-3.3 1.5-3.3 3.8 0 2.3 1.5 4.2 3.3 4.2s3.3-1.9 3.3-4.2c0-2.3-1.5-3.8-3.3-3.8zM7 9.5C5.9 9.5 5 10.4 5 11.5S5.9 13.5 7 13.5s2-.9 2-2S8.1 9.5 7 9.5zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM4.5 14C3.7 14 3 14.7 3 15.5S3.7 17 4.5 17 6 16.3 6 15.5 5.3 14 4.5 14zm15 0c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5 1.5-.7 1.5-1.5-.7-1.5-1.5-1.5z"/>
            </svg>
            <span class="nav-label">PetPass</span>
          </button>

          <!-- 4. VetBooking -->
          <button 
            type="button"
            class="nav-item" 
            [class.active]="activeTab() === 'vetbooking'" 
            (click)="selectTab('vetbooking')"
            title="VetBooking"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
              <circle cx="8" cy="14" r="0.9" fill="currentColor"></circle>
              <circle cx="12" cy="14" r="0.9" fill="currentColor"></circle>
              <circle cx="16" cy="14" r="0.9" fill="currentColor"></circle>
            </svg>
            <span class="nav-label">VetBooking</span>
          </button>

          <!-- 5. HelpAnimal -->
          <button 
            type="button"
            class="nav-item" 
            [class.active]="activeTab() === 'helpanimal'" 
            (click)="selectTab('helpanimal')"
            title="HelpAnimal"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <span class="nav-label">HelpAnimal</span>
          </button>

          <!-- 6. AdoptAnimal -->
          <button 
            type="button"
            class="nav-item" 
            [class.active]="activeTab() === 'adoptanimal'" 
            (click)="selectTab('adoptanimal')"
            title="AdoptAnimal"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span class="nav-label">AdoptAnimal</span>
          </button>

          <!-- 7. VetPharma -->
          <button 
            type="button"
            class="nav-item" 
            [class.active]="activeTab() === 'vetpharma'" 
            (click)="selectTab('vetpharma')"
            title="VetPharma"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="8.5" y1="15.5" x2="15.5" y2="8.5"></line>
              <path d="M10.5 4.5l-6 6a5 5 0 0 0 7.07 7.07l6-6a5 5 0 0 0-7.07-7.07z"></path>
            </svg>
            <span class="nav-label">VetPharma</span>
          </button>

          <!-- 8. RescueCoordination -->
          <button 
            type="button"
            class="nav-item" 
            [class.active]="activeTab() === 'rescuecoordination'" 
            (click)="selectTab('rescuecoordination')"
            title="RescueCoordination"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="9"></circle>
              <circle cx="12" cy="12" r="3.5"></circle>
              <line x1="4.93" y1="4.93" x2="9.5" y2="9.5"></line>
              <line x1="14.5" y1="14.5" x2="19.07" y2="19.07"></line>
              <line x1="14.5" y1="9.5" x2="19.07" y2="4.93"></line>
              <line x1="4.93" y1="19.07" x2="9.5" y2="14.5"></line>
            </svg>
            <span class="nav-label">RescueCoordination</span>
          </button>

          <!-- 9. Notifications -->
          <button 
            type="button"
            class="nav-item" 
            [class.active]="activeTab() === 'notifications'" 
            (click)="selectTab('notifications')"
            title="Notifications"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span class="nav-label">Notifications</span>
          </button>

          <!-- Profil -->
          <button 
            type="button"
            class="nav-item" 
            [class.active]="activeTab() === 'perfil'" 
            (click)="selectTab('perfil')"
            title="Profil"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span class="nav-label">Profil</span>
          </button>

          <!-- 11. Déconnexion -->
          <button 
            type="button"
            class="nav-item btn-logout-nav" 
            (click)="logout()"
            title="Déconnexion"
          >
            <svg class="nav-icon logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span class="nav-label">Déconnexion</span>
          </button>
        </nav>
      </div>

      <!-- Bottom Card: Healthy Pets, Happy Lives -->
      <div class="sidebar-promo-wrap">
        <img
          [src]="promoImage()"
          alt="Healthy Pets, Happy Lives"
          class="sidebar-promo-img"
        />
      </div>
    </aside>
  `,
  styles: [`
    :host {
      display: block;
      flex: 0 0 230px;
      width: 230px;
      min-height: 100vh;
      align-self: stretch;
    }

    .app-sidebar {
      width: 230px;
      min-height: 100vh;
      background: #ffffff;
      border-right: 1px solid #edf2f7;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 16px 14px 18px 14px;
      flex-shrink: 0;
      box-sizing: border-box;
      user-select: none;
      position: relative;
      height: 100%;
      overflow: visible;
      z-index: 40;
    }

    .sidebar-top-section {
      display: flex;
      flex-direction: column;
    }

    .sidebar-brand-top {
      padding: 6px 10px 14px 10px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: opacity 0.2s ease;

      &:hover {
        opacity: 0.85;
      }
    }

    .brand-logo-wrap {
      width: 46px;
      height: 46px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .medivet-logo-img {
      width: 46px;
      height: 46px;
      object-fit: contain;
    }

    .brand-title-wrap {
      display: flex;
      flex-direction: column;
      line-height: 1.15;
    }

    .brand-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0b3b2c;
      letter-spacing: -0.3px;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    }

    .brand-subtitle {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0b3b2c;
      letter-spacing: -0.3px;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    }

    .nav-menu {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 9px 16px;
      border-radius: 9999px;
      border: none;
      background: transparent;
      color: #334155;
      font-size: 0.92rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;
      box-sizing: border-box;

      &:hover {
        background: #f8fafc;
        color: #0f172a;

        .nav-icon {
          color: #0f172a;
        }
      }

      &.active {
        background: #e8f8f0;
        color: #059669;
        font-weight: 700;

        .nav-icon {
          color: #059669;
        }
      }

      .nav-icon {
        width: 18px;
        height: 18px;
        color: #475569;
        transition: color 0.2s ease;
        flex-shrink: 0;
      }

      .paw-icon {
        width: 19px;
        height: 19px;
      }

      .nav-label {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .btn-logout-nav {
      margin-top: 6px;
      color: #dc2626 !important;

      .logout-icon {
        color: #dc2626 !important;
      }

      &:hover {
        background: #fef2f2 !important;
        color: #b91c1c !important;
      }
    }

    .sidebar-promo-wrap {
      margin-top: auto;
      padding-top: 16px;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;

      .sidebar-promo-img {
        width: 100%;
        height: auto;
        border-radius: 18px;
        display: block;
        box-shadow: 0 4px 16px rgba(16, 185, 129, 0.1);
        transition: transform 0.25s ease, box-shadow 0.25s ease;
        object-fit: cover;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(16, 185, 129, 0.16);
        }
      }
    }
  `]
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  activeTab = input<NavTab>('petpass');
  promoImage = input<string>('assets/images/sidebar-healthy-pets.jpg');
  tabChanged = output<NavTab>();

  user = computed(() => this.authService.currentUser());

  readonly isVet = computed(() => {
    const role = (this.user()?.role || this.authService.userRole() || '').toUpperCase();
    return role === 'VETERINAIRE' || role === 'VET' || role === 'ADMINISTRATEUR';
  });

  onBrandClick(): void {
    this.selectTab(this.isVet() ? 'dashboard' : 'petpass');
  }

  selectTab(tab: NavTab): void {
    this.tabChanged.emit(tab);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
