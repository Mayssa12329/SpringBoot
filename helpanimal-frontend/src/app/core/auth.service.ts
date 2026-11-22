import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { ROLE_LABELS, Role, Session } from './models';

const STORAGE_KEY = 'medivet.session';

/** Reponse de POST /api/auth/connexion (LoginResponse de UserService). */
interface LoginResponse {
  id: number;
  token: string;
  email: string;
  role: string;
  nom: string;
  prenom: string;
}

/** Connexion par UserService (module authentification de l'equipe). */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly sessionState = signal<Session | null>(null);

  readonly session = this.sessionState.asReadonly();
  /** US22 : benevole et intervenant (role VETERINAIRE) et administrateur. */
  readonly canSeeNearby = computed(() => {
    const role = this.sessionState()?.role;
    return role === 'VETERINAIRE' || role === 'ADMINISTRATEUR';
  });

  /** Au demarrage : reprend la session de l'onglet (le jeton reste valable 24 h). */
  restore(): void {
    try {
      const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null') as Session | null;
      if (stored?.token && Number.isInteger(stored.userId) && stored.role in ROLE_LABELS) {
        this.sessionState.set(stored);
      }
    } catch {
      // Valeur illisible : l'utilisateur se reconnecte
    }
  }

  async login(email: string, password: string): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<LoginResponse>('/api/auth/connexion', { email, motDePasse: password }),
    );
    const role: Role = response.role in ROLE_LABELS ? (response.role as Role) : 'UTILISATEUR';
    this.save({
      userId: response.id,
      role,
      token: response.token,
      name: `${response.prenom} ${response.nom}`.trim(),
      email: response.email,
    });
  }

  logout(): void {
    this.save(null);
  }

  private save(session: Session | null): void {
    this.sessionState.set(session);
    try {
      if (session) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Stockage indisponible : la session reste valable jusqu'au rechargement
    }
  }
}

/** Ajoute le jeton aux appels de l'API ; un jeton refuse (expire) deconnecte l'utilisateur. */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.session()?.token;
  const isApi = request.url.startsWith('/api/');
  return next(
    token && isApi ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request,
  ).pipe(
    catchError((error: unknown) => {
      if (token && isApi && error instanceof HttpErrorResponse && error.status === 401) {
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};
