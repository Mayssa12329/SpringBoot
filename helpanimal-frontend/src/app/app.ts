import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AuthService } from './core/auth.service';
import { ROLE_LABELS } from './core/models';
import { apiErrorMessage } from './core/report.service';
import { HelpAnimalPage } from './help-animal/help-animal-page';
import { HelpAnimalStore } from './help-animal/help-animal.store';
import { Icon, IconName } from './shared/icon';

/** Modules des autres ingenieurs : affiches comme sur la maquette, sans page pour l'instant. */
const NAVIGATION: { label: string; icon: IconName; active?: boolean }[] = [
  { label: 'Dashboard', icon: 'home' },
  { label: 'PetPass', icon: 'pass' },
  { label: 'VetBooking', icon: 'calendar' },
  { label: 'HelpAnimal', icon: 'paw', active: true },
  { label: 'AdoptAnimal', icon: 'heart' },
  { label: 'VetPharma', icon: 'pill' },
  { label: 'RescueCoordination', icon: 'shield' },
  { label: 'Notifications', icon: 'bell' },
  { label: 'Settings', icon: 'settings' },
];

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HelpAnimalPage, Icon],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly store = inject(HelpAnimalStore);

  protected readonly navigation = NAVIGATION;
  protected readonly roleLabels = ROLE_LABELS;

  protected readonly menuOpen = signal(false);
  protected readonly loggingIn = signal(false);
  protected readonly loginError = signal<string | null>(null);
  protected readonly initials = computed(() => {
    const name = this.auth.session()?.name ?? '';
    const letters = name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('');
    return letters.slice(0, 2).toUpperCase() || '?';
  });

  /** Connexion avec un compte de UserService (POST /api/auth/connexion). */
  protected async login(email: string, password: string): Promise<void> {
    if (!email.trim() || !password) {
      this.loginError.set("L'email et le mot de passe sont obligatoires.");
      return;
    }
    this.loggingIn.set(true);
    try {
      await this.auth.login(email.trim(), password);
      this.loginError.set(null);
      this.menuOpen.set(false);
      this.resetSelection();
    } catch (error) {
      this.loginError.set(apiErrorMessage(error));
    } finally {
      this.loggingIn.set(false);
    }
  }

  protected logout(): void {
    this.auth.logout();
    this.menuOpen.set(false);
    this.resetSelection();
  }

  private resetSelection(): void {
    this.store.selectedReportId.set(null);
    this.store.relocatingReportId.set(null);
  }
}
