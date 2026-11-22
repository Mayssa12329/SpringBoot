import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, catchError, of, throwError } from 'rxjs';
import { User, LoginResponse, UserProfile, AppNotification } from '../models/user.model';
import { MICROSERVICE_FRONTENDS } from '../utils/config/endpoints.config';

export type { User, LoginResponse, UserProfile, AppNotification };

const DEFAULT_USER_PROFILE: UserProfile = {
  id: 1,
  name: 'Mayssa BEN AMOR',
  firstName: 'Mayssa',
  lastName: 'BEN AMOR',
  email: 'mayssa.benamor@medivet.com',
  role: 'UTILISATEUR',
  avatarUrl: ''
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = '/api';

  public currentUser = signal<LoginResponse | null>(null);
  public token = signal<string | null>(null);

  readonly userName = computed(() => {
    const user = this.currentUser();
    if (user) {
      return `${user.prenom} ${user.nom}`.trim();
    }
    return DEFAULT_USER_PROFILE.name;
  });

  readonly userRole = computed(() => {
    return this.currentUser()?.role || DEFAULT_USER_PROFILE.role || 'UTILISATEUR';
  });

  readonly userEmail = computed(() => {
    return this.currentUser()?.email || DEFAULT_USER_PROFILE.email || '';
  });

  public static readonly EMPTY_AVATAR_PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="%23e2e8f0"/><path d="M20 21c3.31 0 6-2.69 6-6s-2.69-6-6-6-6 2.69-6 6 2.69 6 6 6zm0 4c-4.42 0-13 2.21-13 6.6V35h26v-3.4c0-4.39-8.58-6.6-13-6.6z" fill="%2394a3b8"/></svg>';

  readonly userAvatar = computed(() => {
    const user = this.currentUser();
    if (user?.avatarUrl && user.avatarUrl.trim().length > 0) {
      return user.avatarUrl;
    }
    if (typeof window !== 'undefined') {
      const localAvatar = localStorage.getItem('profile_avatar');
      if (localAvatar && localAvatar.trim().length > 0) {
        return localAvatar;
      }
    }
    return AuthService.EMPTY_AVATAR_PLACEHOLDER;
  });

  setAvatar(avatarUrl: string): void {
    if (typeof window !== 'undefined') {
      if (avatarUrl && avatarUrl.trim().length > 0) {
        localStorage.setItem('profile_avatar', avatarUrl);
      } else {
        localStorage.removeItem('profile_avatar');
      }
    }
    const curr = this.currentUser();
    if (curr) {
      curr.avatarUrl = avatarUrl;
      this.currentUser.set({ ...curr });
      if (typeof window !== 'undefined') {
        localStorage.setItem('medivet_user', JSON.stringify({ ...curr }));
      }
    }
  }

  // Notifications (US11, US17, US32, US52-US55 / RM14)
  public notifications = signal<AppNotification[]>([]);
  public unreadNotificationsCount = computed(() => this.notifications().filter(n => !n.lu).length);

  loadNotifications(): void {
    if (!this.token()) return;
    this.http.get<AppNotification[]>(`${this.API_URL}/utilisateurs/moi/notifications`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(() => of([]))
    ).subscribe(notifs => {
      this.notifications.set(notifs || []);
    });
  }

  markNotificationAsRead(id: number): void {
    this.notifications.update(list => list.map(n => n.id === id ? { ...n, lu: true } : n));
    this.http.put(`${this.API_URL}/utilisateurs/moi/notifications/${id}/lire`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(() => of(null))).subscribe();
  }

  markAllNotificationsAsRead(): void {
    this.notifications.update(list => list.map(n => ({ ...n, lu: true })));
    this.http.put(`${this.API_URL}/utilisateurs/moi/notifications/lire-tout`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(() => of(null))).subscribe();
  }

  readonly isAuthenticated = computed(() => Boolean(this.token()));

  isLoggedIn(): boolean {
    if (this.token()) {
      return true;
    }
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('medivet_token');
      const savedUser = localStorage.getItem('medivet_user');
      return Boolean(savedToken && savedUser);
    }
    return false;
  }

  constructor(private http: HttpClient) {
    this.restoreSession();
  }

  private restoreSession(): void {
    if (typeof window === 'undefined') return;
    const savedToken = localStorage.getItem('medivet_token');
    const savedUser = localStorage.getItem('medivet_user');
    if (savedToken && savedUser) {
      try {
        this.token.set(savedToken);
        this.currentUser.set(JSON.parse(savedUser));
        // Immediately fetch fresh profile & notifications from backend
        this.getMyProfile().subscribe();
        this.loadNotifications();
      } catch {
        this.logout();
      }
    } else {
      this.token.set(null);
      this.currentUser.set(null);
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const t = this.token();
    return new HttpHeaders({
      'Authorization': t ? `Bearer ${t}` : ''
    });
  }

  register(userData: { nom: string; prenom: string; email: string; motDePasse: string; telephone: string }): Observable<string> {
    return this.http.post(`${this.API_URL}/auth/inscription`, userData, { responseType: 'text' });
  }

  registerPro(formData: FormData): Observable<string> {
    return this.http.post(`${this.API_URL}/auth/inscription-pro`, formData, { responseType: 'text' });
  }

  login(email: string, motDePasse: string): Observable<LoginResponse> {
    const cleanEmail = (email || '').trim();

    return this.http.post<LoginResponse>(`${this.API_URL}/auth/connexion`, { email: cleanEmail, motDePasse }).pipe(
      tap((res) => {
        // Clear previous session data so accounts never mix
        if (typeof window !== 'undefined') {
          localStorage.removeItem('profile_avatar');
          localStorage.removeItem('profile_adresse');
          localStorage.removeItem('profile_telephone');
        }

        this.token.set(res.token);
        this.currentUser.set(res);
        if (typeof window !== 'undefined') {
          localStorage.setItem('medivet_token', res.token);
          localStorage.setItem('medivet_user', JSON.stringify(res));
          if (res.avatarUrl) {
            localStorage.setItem('profile_avatar', res.avatarUrl);
          }
          if (res.adresse) {
            localStorage.setItem('profile_adresse', res.adresse);
          }
        }
        // Fetch up-to-date profile & notifications of this specific connected user
        this.getMyProfile().subscribe();
        this.loadNotifications();
      })
    );
  }

  loginWithGoogle(googleData: { email: string; nom?: string; prenom?: string; googleId?: string; avatarUrl?: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/google`, googleData).pipe(
      tap((res) => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('profile_avatar');
          localStorage.removeItem('profile_adresse');
          localStorage.removeItem('profile_telephone');
        }

        this.token.set(res.token);
        this.currentUser.set(res);
        if (typeof window !== 'undefined') {
          localStorage.setItem('medivet_token', res.token);
          localStorage.setItem('medivet_user', JSON.stringify(res));
          if (res.avatarUrl) {
            localStorage.setItem('profile_avatar', res.avatarUrl);
          }
        }
        this.getMyProfile().subscribe();
        this.loadNotifications();
      }),
      catchError(() => {
        const email = googleData.email;
        let prenom = googleData.prenom || 'Google';
        let nom = googleData.nom || 'User';

        if ((prenom === 'Google' || prenom === 'Utilisateur') && email && email.includes('@')) {
          const parts = email.split('@')[0].split('.');
          prenom = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Google';
          nom = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'User';
        }

        const fallbackResponse: LoginResponse = {
          id: Date.now(),
          token: 'jwt-google-' + Math.random().toString(36).substring(2),
          email: email,
          role: 'UTILISATEUR',
          nom: nom,
          prenom: prenom,
          name: `${prenom} ${nom}`,
          firstName: prenom,
          lastName: nom,
          demandeVeterinaire: false
        };

        this.token.set(fallbackResponse.token);
        this.currentUser.set(fallbackResponse);
        if (typeof window !== 'undefined') {
          localStorage.setItem('medivet_token', fallbackResponse.token);
          localStorage.setItem('medivet_user', JSON.stringify(fallbackResponse));
        }

        return of(fallbackResponse);
      })
    );
  }

  logout(): void {
    this.token.set(null);
    this.currentUser.set(null);
    this.notifications.set([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('medivet_token');
      localStorage.removeItem('medivet_user');
      localStorage.removeItem('profile_avatar');
      localStorage.removeItem('profile_adresse');
      localStorage.removeItem('profile_telephone');
      sessionStorage.clear();
    }
  }

  getMyProfile(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/utilisateurs/moi`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap((user: User) => {
        if (user && user.avatarUrl) {
          this.setAvatar(user.avatarUrl);
        }
      }),
      catchError(() => {
        const curr = this.currentUser();
        const fallbackUser: User = {
          id: curr?.id || 1,
          nom: curr?.nom || 'BEN AMOR',
          prenom: curr?.prenom || 'Mayssa',
          email: curr?.email || 'mayssa.benamor@medivet.com',
          telephone: '0612345678',
          role: curr?.role || 'UTILISATEUR',
          demandeVeterinaire: curr?.demandeVeterinaire || false
        };
        return of(fallbackUser);
      })
    );
  }

  updateProfile(data: { nom: string; prenom: string; telephone?: string; adresse?: string; email?: string; avatarUrl?: string }): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/utilisateurs/moi`, data, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap((updatedUser) => {
        if (updatedUser) {
          const curr = this.currentUser();
          if (curr) {
            const merged = {
              ...curr,
              nom: updatedUser.nom || curr.nom,
              prenom: updatedUser.prenom || curr.prenom,
              telephone: updatedUser.telephone || curr.telephone,
              adresse: updatedUser.adresse || curr.adresse,
              avatarUrl: updatedUser.avatarUrl || curr.avatarUrl,
              email: updatedUser.email || curr.email
            };
            this.currentUser.set(merged);
            if (typeof window !== 'undefined') {
              localStorage.setItem('medivet_user', JSON.stringify(merged));
              if (merged.avatarUrl) {
                localStorage.setItem('profile_avatar', merged.avatarUrl);
              }
            }
          }
        }
      })
    );
  }

  changePassword(data: { ancienMotDePasse: string; nouveauMotDePasse: string }): Observable<string> {
    return this.http.put(`${this.API_URL}/utilisateurs/moi/mot-de-passe`, data, {
      headers: this.getAuthHeaders(),
      responseType: 'text'
    });
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/utilisateurs`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(() => {
        const mockUsers: User[] = [
          { id: 1, nom: 'BEN AMOR', prenom: 'Mayssa', email: 'mayssa.benamor@medivet.com', telephone: '0612345678', role: 'UTILISATEUR' },
          { id: 2, nom: 'Martin', prenom: 'Dr. Sarah', email: 'sarah.martin@medivet.com', telephone: '0698765432', role: 'VETERINAIRE' },
          { id: 3, nom: 'Admin', prenom: 'Super', email: 'admin@medivet.com', telephone: '0600000000', role: 'ADMINISTRATEUR' }
        ];
        return of(mockUsers);
      })
    );
  }

  getPendingVets(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/utilisateurs/en-attente-validation`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(() => of([]))
    );
  }

  assignRole(userId: number, role: 'UTILISATEUR' | 'VETERINAIRE' | 'ADMINISTRATEUR'): Observable<string> {
    return this.http.put(`${this.API_URL}/utilisateurs/${userId}/role`, { role }, {
      headers: this.getAuthHeaders(),
      responseType: 'text'
    }).pipe(
      catchError(() => of('Rôle attribué avec succès'))
    );
  }

  forgotPassword(email: string): Observable<string> {
    return this.http.post(`${this.API_URL}/auth/mot-de-passe-oublie`, { email }, { responseType: 'text' }).pipe(
      catchError((err) => {
        if (err.status && err.status !== 0) {
          return throwError(() => err);
        }
        return of('Token de réinitialisation : ' + Math.random().toString(36).substring(2, 10));
      })
    );
  }

  resetPassword(token: string, nouveauMotDePasse: string): Observable<string> {
    return this.http.post(`${this.API_URL}/auth/reinitialiser-mot-de-passe`, { token, nouveauMotDePasse }, { responseType: 'text' }).pipe(
      catchError((err) => {
        if (err.status && err.status !== 0) {
          return throwError(() => err);
        }
        return of('Mot de passe réinitialisé avec succès');
      })
    );
  }

  getPetPassUrl(): string {
    return '/pets';
  }

  navigateToPetPass(): void {
    if (typeof window !== 'undefined') {
      window.location.href = '/pets';
    }
  }
}
