import { Component, OnInit, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, LoginResponse } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  public selectedRole: 'PARTICULIER' | 'VETERINAIRE' = 'PARTICULIER';
  public isVet = false;
  public proRegistrationSuccess = false;

  // Form Fields
  public regNom = '';
  public regPrenom = '';
  public regEmail = '';
  public regPassword = '';
  public regTelephone = '';
  public regAdresse = '';

  // Register Pro Veterinarian
  public proNom = '';
  public proPrenom = '';
  public proEmail = '';
  public proPassword = '';
  public proTelephone = '';
  public selectedDiplomeFile: File | null = null;
  public diplomePreviewUrl: string | null = null;

  public isLoading = false;
  public alertMessage: string | null = null;
  public alertType: 'success' | 'error' | 'info' = 'info';

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.handleGoogleOAuthCallback();
  }

  onRoleChange(): void {
    this.isVet = (this.selectedRole === 'VETERINAIRE');
  }

  onRegisterSubmit(): void {
    if (this.selectedRole === 'VETERINAIRE') {
      this.proNom = this.regNom;
      this.proPrenom = this.regPrenom;
      this.proEmail = this.regEmail;
      this.proPassword = this.regPassword;
      this.proTelephone = this.regTelephone;
      this.onRegisterPro();
    } else {
      this.onRegisterUser();
    }
  }

  showAlert(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.alertMessage = message;
    this.alertType = type;
  }

  clearAlert(): void {
    this.alertMessage = null;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedDiplomeFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.diplomePreviewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onRegisterUser(): void {
    if (!this.regNom || !this.regPrenom || !this.regEmail || !this.regPassword || !this.regTelephone) {
      this.showAlert('Veuillez remplir tous les champs obligatoires.', 'error');
      return;
    }
    if (this.isLoading) return; // anti double-submit

    this.isLoading = true;
    this.clearAlert();

    this.authService.register({
      nom: this.regNom,
      prenom: this.regPrenom,
      email: this.regEmail,
      motDePasse: this.regPassword,
      telephone: this.regTelephone,
      adresse: this.regAdresse
    }).subscribe({
      next: (response) => {
        console.log('Inscription réussie:', response);
        this.isLoading = false;
        this.showAlert('Compte créé avec succès ! Redirection vers la connexion...', 'success');
        
        // Redirection après 1 seconde
        setTimeout(() => {
          this.router.navigate(['/login'], { queryParams: { email: this.regEmail } });
        }, 1000);
      },
      error: (err: any) => {
        console.error('Erreur inscription:', err);
        this.isLoading = false;
        
        let msg = 'Erreur lors de la création du compte.';
        if (err?.status === 409) {
          msg = 'Un compte avec cet email existe déjà.';
        } else if (err?.error) {
          msg = typeof err.error === 'string' ? err.error : (err?.error?.message || msg);
        }
        
        this.showAlert(msg, 'error');
      },
      complete: () => {
        // S'assurer que isLoading est false même si next/error ne sont pas appelés
        setTimeout(() => {
          if (this.isLoading) {
            this.isLoading = false;
          }
        }, 5000);
      }
    });
  }

  onRegisterPro(): void {
    if (!this.proNom || !this.proPrenom || !this.proEmail || !this.proPassword || !this.proTelephone) {
      this.showAlert('Veuillez renseigner toutes vos informations professionnelles.', 'error');
      return;
    }
    if (!this.selectedDiplomeFile) {
      this.showAlert('Veuillez joindre une image ou un scan de votre diplôme vétérinaire.', 'error');
      return;
    }
    if (this.isLoading) return; // anti double-submit

    this.isLoading = true;
    const formData = new FormData();
    formData.append('nom', this.proNom);
    formData.append('prenom', this.proPrenom);
    formData.append('email', this.proEmail);
    formData.append('motDePasse', this.proPassword);
    formData.append('telephone', this.proTelephone);
    formData.append('diplome', this.selectedDiplomeFile);

    this.authService.registerPro(formData).subscribe({
      next: () => {
        this.isLoading = false;
        this.proRegistrationSuccess = true;
        this.clearAlert();
      },
      error: (err: any) => {
        this.isLoading = false;
        const msg = err?.error?.message || err?.error || 'Erreur lors de l’inscription professionnelle.';
        this.showAlert(typeof msg === 'string' ? msg : 'Erreur lors de l’inscription professionnelle.', 'error');
      }
    });
  }

  closeProSuccess(): void {
    this.proRegistrationSuccess = false;
    this.router.navigate(['/login']);
  }

  onSocialLogin(provider: 'Google' | 'Microsoft'): void {
    if (provider === 'Google') {
      this.redirectToGoogleOAuth();
    } else {
      this.showAlert(`Inscription avec ${provider} non configurée.`, 'info');
    }
  }

  redirectToGoogleOAuth(): void {
    if (typeof window === 'undefined') return;

    const redirectUri = window.location.origin + '/register';
    const stored = localStorage.getItem('google_client_id');
    const clientId = (stored && !stored.includes('YOUR_') && !stored.includes('undefined')) 
      ? stored.trim() 
      : '776964320214-noticvn7h94ru8getp1qbbfsd48ce3gq.apps.googleusercontent.com';
    console.log('[Google OAuth Register] Client ID utilisé:', clientId);
    const state = 'google_oauth_reg_' + Math.random().toString(36).substring(2);
    const nonce = Math.random().toString(36).substring(2);

    localStorage.setItem('medivet_google_oauth_pending', 'true');
    localStorage.setItem('medivet_google_oauth_state', state);

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=token%20id_token&` +
      `scope=${encodeURIComponent('openid email profile')}&` +
      `prompt=select_account&` +
      `state=${encodeURIComponent(state)}&` +
      `nonce=${encodeURIComponent(nonce)}`;

    window.location.href = googleAuthUrl;
  }

  private handleGoogleOAuthCallback(): void {
    if (typeof window === 'undefined') return;

    const hash = window.location.hash ? window.location.hash.substring(1) : '';
    const search = window.location.search ? window.location.search.substring(1) : '';
    const params = new URLSearchParams(hash || search);

    const idToken = params.get('id_token');
    const accessToken = params.get('access_token');
    const error = params.get('error');

    if (error) {
      this.showAlert(`Inscription Google annulée (${error}).`, 'error');
      localStorage.removeItem('medivet_google_oauth_pending');
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (idToken) {
      try {
        const payload = this.decodeJwt(idToken);
        if (payload && payload.email) {
          this.processGoogleSuccess({
            email: payload.email,
            nom: payload.family_name || payload.name || 'Google',
            prenom: payload.given_name || 'Utilisateur',
            googleId: payload.sub,
            avatarUrl: payload.picture
          });
          return;
        }
      } catch (err) {
        console.error('Erreur décodage token Google:', err);
      }
    }

    if (accessToken) {
      this.http.get<any>('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }).subscribe({
        next: (userInfo) => {
          this.processGoogleSuccess({
            email: userInfo.email,
            nom: userInfo.family_name || userInfo.name || 'Google',
            prenom: userInfo.given_name || 'Utilisateur',
            googleId: userInfo.sub,
            avatarUrl: userInfo.picture
          });
        },
        error: () => {
          this.showAlert('Erreur lors de la récupération des données Google.', 'error');
        }
      });
      return;
    }

    const directEmail = params.get('google_email') || params.get('email');
    if (directEmail && localStorage.getItem('medivet_google_oauth_pending')) {
      const parts = directEmail.split('@')[0].split('.');
      const prenom = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Google';
      const nom = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'Utilisateur';
      this.processGoogleSuccess({ email: directEmail, nom, prenom });
    }
  }

  private decodeJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  private processGoogleSuccess(googleData: { email: string; nom?: string; prenom?: string; googleId?: string; avatarUrl?: string }): void {
    this.isLoading = true;
    window.history.replaceState({}, document.title, window.location.pathname);
    localStorage.removeItem('medivet_google_oauth_pending');

    this.authService.loginWithGoogle(googleData).subscribe({
      next: (user: LoginResponse) => {
        this.isLoading = false;
        sessionStorage.setItem('profile_data', JSON.stringify({
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          telephone: '',
          role: user.role,
          demandeVeterinaire: user.demandeVeterinaire
        }));
        this.showAlert(`Compte Google créé et connecté avec succès (${user.email}) ! Redirection vers PetPass...`, 'success');
        setTimeout(() => {
          this.router.navigate(['/pets']);
        }, 500);
      },
      error: () => {
        this.isLoading = false;
        this.router.navigate(['/pets']);
      }
    });
  }
}
