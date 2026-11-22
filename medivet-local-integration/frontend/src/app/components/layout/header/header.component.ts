import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, AppNotification } from '../../../services/auth.service';
import { SearchService } from '../../../services/search.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-top-header">
      <!-- Search Input -->
      <div class="top-search-wrap">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          type="text" 
          placeholder="Rechercher..." 
          class="top-search-input" 
          [ngModel]="searchService.query()" 
          (ngModelChange)="searchService.setQuery($event)" 
        />
        @if (searchService.query()) {
          <button type="button" class="btn-clear-search" (click)="searchService.clear()" title="Effacer la recherche">
            ✕
          </button>
        }
      </div>

      <!-- Right Actions: Notifications + User Profile Pill -->
      <div class="top-header-right">
        <!-- Notification Bell with Dropdown -->
        <div class="notifications-container" (click)="$event.stopPropagation()">
          <button 
            type="button" 
            class="btn-notif-bell" 
            (click)="toggleNotifications()" 
            [class.active]="isNotificationsOpen()"
            title="Notifications"
          >
            <svg class="bell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            @if (unreadCount() > 0) {
              <span class="bell-badge">{{ unreadCount() }}</span>
            }
          </button>

          <!-- Notifications Dropdown Menu -->
          @if (isNotificationsOpen()) {
            <div class="notifications-dropdown-menu">
              <div class="notif-dropdown-header">
                <div class="header-left">
                  <span class="header-title">Notifications</span>
                  @if (unreadCount() > 0) {
                    <span class="unread-pill">{{ unreadCount() }} nouvelle{{ unreadCount() > 1 ? 's' : '' }}</span>
                  }
                </div>
                @if (unreadCount() > 0) {
                  <button type="button" class="btn-mark-all-read" (click)="markAllAsRead()">
                    Tout marquer comme lu
                  </button>
                }
              </div>

              <div class="notif-list">
                @if (notifications().length === 0) {
                  <div class="notif-empty">
                    <span class="empty-icon">🐾</span>
                    <p class="empty-text">Aucune notification pour le moment</p>
                  </div>
                } @else {
                  @for (n of notifications(); track n.id) {
                    <div class="notif-item" [class.unread]="!n.lu" (click)="markAsRead(n)">
                      <div class="notif-icon-wrap" [ngClass]="getNotifIconClass(n.type)">
                        <span>{{ getNotifIcon(n.type) }}</span>
                      </div>
                      <div class="notif-content">
                        <div class="notif-title-row">
                          <span class="notif-item-title">{{ n.titre }}</span>
                          @if (!n.lu) {
                            <span class="unread-dot" title="Non lu"></span>
                          }
                        </div>
                        <p class="notif-item-message">{{ n.message }}</p>
                        <span class="notif-item-date">{{ formatNotifDate(n.dateCreation) }}</span>
                      </div>
                    </div>
                  }
                }
              </div>

              <div class="notif-dropdown-footer">
                <span>MediVet Connect • Alertes en temps réel</span>
              </div>
            </div>
          }
        </div>

        <!-- User Profile Pill & Dropdown -->
        <div class="user-pill-container" (click)="$event.stopPropagation()">
          <div class="user-pill-btn" (click)="toggleDropdown()">
            <img 
              [src]="userAvatar()" 
              [alt]="userName()" 
              class="user-avatar-img"
              (error)="onAvatarError($event)"
            />
            <span class="user-pill-name">{{ userName() }}</span>
            <svg class="chevron-icon" [class.rotated]="isDropdownOpen()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          <!-- Dropdown Menu -->
          @if (isDropdownOpen()) {
            <div class="user-dropdown-menu">
              <button type="button" class="dropdown-item" (click)="goToProfile()">
                <svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>Mon Profil</span>
              </button>

              <div class="dropdown-divider"></div>

              <button type="button" class="dropdown-item dropdown-logout" (click)="logout()">
                <svg class="item-icon logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>Déconnexion</span>
              </button>
            </div>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    .app-top-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      max-width: 1360px;
      margin: 0 auto 16px auto;
      padding: 0 4px;
      box-sizing: border-box;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
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

      .btn-clear-search {
        background: transparent;
        border: none;
        color: #94a3b8;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s;

        &:hover {
          color: #ef4444;
          background: #fee2e2;
        }
      }
    }

    .top-header-right {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .notifications-container {
      position: relative;
    }

    .btn-notif-bell {
      position: relative;
      background: transparent;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 7px;
      border-radius: 50%;
      transition: background 0.15s ease;

      &:hover, &.active {
        background: #f1f5f9;
      }

      .bell-icon {
        width: 22px;
        height: 22px;
        color: #334155;
      }

      .bell-badge {
        position: absolute;
        top: 2px;
        right: 2px;
        min-width: 17px;
        height: 17px;
        background: #ef4444;
        color: #ffffff;
        font-size: 0.68rem;
        font-weight: 800;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 3px;
        border: 2px solid #ffffff;
        box-shadow: 0 2px 5px rgba(239, 68, 68, 0.35);
      }
    }

    /* ── Notifications Dropdown ────────────────────────────── */
    .notifications-dropdown-menu {
      position: absolute;
      top: calc(100% + 10px);
      right: -60px;
      width: clamp(320px, 42vw, 380px);
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.04);
      z-index: 1000;
      overflow: hidden;
      animation: dropdownFadeIn 0.18s ease-out;

      .notif-dropdown-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 18px 12px;
        border-bottom: 1px solid #f1f5f9;
        background: #fcfdfd;

        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;

          .header-title {
            font-size: 0.96rem;
            font-weight: 800;
            color: #0f172a;
          }

          .unread-pill {
            background: #def7ec;
            color: #03543f;
            font-size: 0.72rem;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 9999px;
          }
        }

        .btn-mark-all-read {
          background: transparent;
          border: none;
          color: #059669;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          transition: color 0.15s ease;

          &:hover {
            color: #047857;
            text-decoration: underline;
          }
        }
      }

      .notif-list {
        max-height: 380px;
        overflow-y: auto;
        padding: 6px 0;

        .notif-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 34px 20px;
          text-align: center;

          .empty-icon {
            font-size: 2rem;
            margin-bottom: 8px;
            opacity: 0.6;
          }

          .empty-text {
            font-size: 0.88rem;
            color: #64748b;
            font-weight: 600;
            margin: 0;
          }
        }

        .notif-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 18px;
          cursor: pointer;
          transition: background 0.15s ease;
          border-left: 3px solid transparent;

          &:hover {
            background: #f8fafc;
          }

          &.unread {
            background: #f0fdf4;
            border-left-color: #10b981;

            &:hover {
              background: #e6f9ee;
            }
          }

          .notif-icon-wrap {
            width: 38px;
            height: 38px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.1rem;
            flex-shrink: 0;
            margin-top: 2px;

            &.type-rdv {
              background: #dbeafe;
            }
            &.type-vaccin {
              background: #d1fae5;
            }
            &.type-adoption {
              background: #fef3c7;
            }
            &.type-urgence {
              background: #fee2e2;
            }
            &.type-pharma {
              background: #ede9fe;
            }
            &.type-admin {
              background: #e0e7ff;
            }
          }

          .notif-content {
            flex: 1;
            min-width: 0;

            .notif-title-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 8px;
              margin-bottom: 2px;

              .notif-item-title {
                font-size: 0.88rem;
                font-weight: 700;
                color: #0f172a;
                line-height: 1.3;
              }

              .unread-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #10b981;
                flex-shrink: 0;
              }
            }

            .notif-item-message {
              font-size: 0.8rem;
              color: #475569;
              line-height: 1.4;
              margin: 2px 0 4px 0;
            }

            .notif-item-date {
              font-size: 0.72rem;
              color: #94a3b8;
              font-weight: 600;
            }
          }
        }
      }

      .notif-dropdown-footer {
        padding: 9px 18px;
        background: #f8fafc;
        border-top: 1px solid #f1f5f9;
        text-align: center;

        span {
          font-size: 0.72rem;
          color: #94a3b8;
          font-weight: 600;
        }
      }
    }

    /* ── User Pill ─────────────────────────────────────────── */
    .user-pill-container {
      position: relative;
    }

    .user-pill-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 14px 4px 4px;
      background: transparent;
      border: none;
      border-radius: 9999px;
      cursor: pointer;
      transition: background 0.15s ease;
      user-select: none;

      &:hover {
        background: rgba(0, 0, 0, 0.04);
      }

      .user-avatar-img {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        object-fit: cover;
        background: #e2e8f0;
        border: 1.5px solid #10b981;
        flex-shrink: 0;
      }

      .user-pill-name {
        font-size: 0.92rem;
        font-weight: 700;
        color: #0f172a;
        white-space: nowrap;
      }

      .chevron-icon {
        width: 16px;
        height: 16px;
        color: #64748b;
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
      width: 200px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.04);
      padding: 8px;
      z-index: 1000;
      animation: dropdownFadeIn 0.15s ease-out;

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
          background: #f1f5f9;
          color: #0f172a;
        }

        .item-icon {
          width: 17px;
          height: 17px;
          color: #64748b;
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

      .dropdown-divider {
        height: 1px;
        background: #f1f5f9;
        margin: 6px 0;
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
  `]
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly searchService = inject(SearchService);

  public searchQuery = '';
  public isDropdownOpen = signal<boolean>(false);
  public isNotificationsOpen = signal<boolean>(false);

  readonly userName = this.authService.userName;
  readonly userAvatar = this.authService.userAvatar;
  readonly notifications = this.authService.notifications;
  readonly unreadCount = this.authService.unreadNotificationsCount;

  toggleDropdown(): void {
    this.isNotificationsOpen.set(false);
    this.isDropdownOpen.update(v => !v);
  }

  toggleNotifications(): void {
    this.isDropdownOpen.set(false);
    this.isNotificationsOpen.update(v => !v);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.isDropdownOpen.set(false);
    this.isNotificationsOpen.set(false);
  }

  markAsRead(notif: AppNotification): void {
    if (!notif.lu) {
      this.authService.markNotificationAsRead(notif.id);
    }
  }

  markAllAsRead(): void {
    this.authService.markAllNotificationsAsRead();
  }

  goToProfile(): void {
    this.isDropdownOpen.set(false);
    this.isNotificationsOpen.set(false);
    this.router.navigate(['/profile']);
  }

  logout(): void {
    this.isDropdownOpen.set(false);
    this.isNotificationsOpen.set(false);
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = AuthService.EMPTY_AVATAR_PLACEHOLDER;
  }

  getNotifIcon(type: string): string {
    switch (type) {
      case 'RENDEZ_VOUS': return '🩺';
      case 'VACCINATION': return '💉';
      case 'ADOPTION': return '🐾';
      case 'URGENCE': return '🚨';
      case 'PHARMACIE': return '💊';
      case 'ADMIN': return '🛡️';
      default: return '🔔';
    }
  }

  getNotifIconClass(type: string): string {
    switch (type) {
      case 'RENDEZ_VOUS': return 'type-rdv';
      case 'VACCINATION': return 'type-vaccin';
      case 'ADOPTION': return 'type-adoption';
      case 'URGENCE': return 'type-urgence';
      case 'PHARMACIE': return 'type-pharma';
      case 'ADMIN': return 'type-admin';
      default: return '';
    }
  }

  formatNotifDate(dateStr: string): string {
    if (!dateStr) return 'Récemment';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'À l\'instant';
      if (diffMins < 60) return `Il y a ${diffMins} min`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Il y a ${diffHours} h`;
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch {
      return 'Récemment';
    }
  }
}
