import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  public step = 1;
  public email = '';
  public newPassword = '';
  public isLoading = false;
  public alertMessage: string | null = null;
  public alertType: 'success' | 'error' | 'info' = 'info';

  // Le token est privé — jamais affiché dans l'interface
  private _token = '';

  constructor(private authService: AuthService, private router: Router) {}

  showAlert(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.alertMessage = message;
    this.alertType = type;
  }

  clearAlert(): void {
    this.alertMessage = null;
  }

  onRequestReset(): void {
    if (!this.email) {
      this.showAlert('Veuillez saisir votre adresse email.', 'error');
      return;
    }

    this.isLoading = true;
    this.authService.forgotPassword(this.email).subscribe({
      next: (res: string) => {
        this.isLoading = false;
        if (res && res.includes('Token de réinitialisation : ')) {
          this._token = res.replace('Token de réinitialisation : ', '').trim();
          this.showAlert('Code de vérification généré. Saisissez votre nouveau mot de passe.', 'success');
        } else {
          this._token = 'token-auth-temp';
          this.showAlert(res || 'Code de vérification généré avec succès.', 'info');
        }
        this.step = 2;
      },
      error: (err: any) => {
        this.isLoading = false;
        const msg = err?.error?.message || err?.error || 'Erreur lors de la demande de réinitialisation.';
        this.showAlert(typeof msg === 'string' ? msg : 'Erreur lors de la demande de réinitialisation.', 'error');
      }
    });
  }

  onResetPassword(): void {
    if (!this._token || !this.newPassword) {
      this.showAlert('Veuillez renseigner votre nouveau mot de passe.', 'error');
      return;
    }

    this.isLoading = true;
    this.authService.resetPassword(this._token, this.newPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.showAlert('Mot de passe changé avec succès ! Redirection vers la page de connexion...', 'success');
        setTimeout(() => this.router.navigate(['/login']), 1800);
      },
      error: (err: any) => {
        this.isLoading = false;
        const msg = err?.error?.message || err?.error || 'Erreur lors de la réinitialisation.';
        this.showAlert(typeof msg === 'string' ? msg : 'Erreur lors de la réinitialisation.', 'error');
      }
    });
  }
}
