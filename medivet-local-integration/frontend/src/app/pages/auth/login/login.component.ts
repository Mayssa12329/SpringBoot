import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService, LoginResponse } from '../../../services/auth.service';
import { LucideAngularModule } from 'lucide-angular';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  // Onglet actif : 'login' pour Connexion, 'register' pour Inscription
  public activeTab: 'login' | 'register' = 'login';
  // Vue active dans l'onglet login : 'login' ou 'forgot'
  public loginView: 'login' | 'forgot' = 'login';

  // Forgot password
  public forgotEmail = '';
  public forgotStep = 1;
  public forgotNewPassword = '';
  public forgotLoading = false;
  public forgotToken = '';

  // Login
  public loginEmail = '';
  public loginPassword = '';
  public showPassword = false;
  public rememberMe = false;

  // Inscription
  public selectedRole: 'PARTICULIER' | 'VETERINAIRE' = 'PARTICULIER';
  public isVet = false;
  public proRegistrationSuccess = false;
  public regNom = '';
  public regPrenom = '';
  public regEmail = '';
  public regPassword = '';
  public regTelephone = '';

  // Inscription Professionnelle Vétérinaire
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
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Si la route courante est /register, activer l'onglet inscription directement
    if (this.router.url.includes('register')) {
      this.activeTab = 'register';
    }

    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.loginEmail = params['email'];
      }
    });
    // Écouter le retour de redirection OAuth Google
    this.handleGoogleOAuthCallback();
  }

  setTab(tab: 'login' | 'register'): void {
    this.activeTab = tab;
    this.proRegistrationSuccess = false;
    this.clearAlert();
  }

  toggleShowPassword(): void {
    this.showPassword = !this.showPassword;
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

  onLogin(): void {
    const email = this.loginEmail?.trim();
    const password = this.loginPassword;

    if (!email || !password) {
      this.showAlert('Veuillez renseigner votre email et mot de passe.', 'error');
      return;
    }
    if (this.isLoading) return;

    this.isLoading = true;
    this.authService.login(email, password).subscribe({
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
        this.showAlert(`Bienvenue ${user.prenom || user.email} !`, 'success');
        if (user.role === 'ADMINISTRATEUR') {
          this.router.navigate(['/admin-roles']);
        } else {
          this.router.navigate(['/pets']);
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        const msg = err?.error?.message || err?.error || 'Email ou mot de passe incorrect.';
        this.showAlert(typeof msg === 'string' ? msg : 'Email ou mot de passe incorrect.', 'error');
      }
    });
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

  onRegisterUser(): void {
    const nom = this.regNom?.trim();
    const prenom = this.regPrenom?.trim();
    const email = this.regEmail?.trim();
    const motDePasse = this.regPassword;
    const telephone = this.regTelephone?.trim();

    if (!nom || !prenom || !email || !motDePasse || !telephone) {
      this.showAlert('Veuillez remplir tous les champs obligatoires.', 'error');
      return;
    }
    if (this.isLoading) return;

    this.isLoading = true;
    this.authService.register({
      nom,
      prenom,
      email,
      motDePasse,
      telephone
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.showAlert('Compte créé avec succès ! Redirection vers la connexion...', 'success');
        setTimeout(() => {
          this.activeTab = 'login';
          this.loginEmail = email;
          this.loginPassword = '';
          this.clearAlert();
        }, 1200);
      },
      error: (err: any) => {
        this.isLoading = false;
        let msg = 'Erreur lors de la création du compte.';
        if (typeof err?.error === 'string') {
          try {
            const parsed = JSON.parse(err.error);
            msg = parsed.message || err.error;
          } catch {
            msg = err.error;
          }
        } else if (err?.error?.message) {
          msg = err.error.message;
        }
        this.showAlert(msg, 'error');
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
    if (this.isLoading) return;

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
    this.activeTab = 'login';
    this.loginEmail = this.proEmail;
  }

  onSocialLogin(provider: 'Google' | 'Microsoft'): void {
    if (provider === 'Google') {
      this.redirectToGoogleOAuth();
    } else {
      this.showAlert(`Connexion avec ${provider} non configurée.`, 'info');
    }
  }

  redirectToGoogleOAuth(): void {
    if (typeof window === 'undefined') return;

    const redirectUri = window.location.origin + '/login';
    const stored = localStorage.getItem('google_client_id');
    const clientId = (stored && !stored.includes('YOUR_') && !stored.includes('undefined')) 
      ? stored.trim() 
      : '776964320214-noticvn7h94ru8getp1qbbfsd48ce3gq.apps.googleusercontent.com';
    console.log('[Google OAuth] Client ID utilisé:', clientId);
    const state = 'google_oauth_' + Math.random().toString(36).substring(2);
    const nonce = Math.random().toString(36).substring(2);

    localStorage.setItem('medivet_google_oauth_pending', 'true');
    localStorage.setItem('medivet_google_oauth_state', state);

    // Redirection directe vers Google OAuth (affiche l'écran de sélection de compte Google)
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

    // Fragment d'URL renvoyé par Google OAuth (ex: #access_token=...&id_token=...)
    const hash = window.location.hash ? window.location.hash.substring(1) : '';
    const search = window.location.search ? window.location.search.substring(1) : '';
    const params = new URLSearchParams(hash || search);

    const idToken = params.get('id_token');
    const accessToken = params.get('access_token');
    const error = params.get('error');

    if (error) {
      this.showAlert(`Authentification Google annulée (${error}).`, 'error');
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

    // Support paramètre direct google_email (ex: ?google_email=mayssa.benamr@gmail.com)
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
        this.showAlert(`Connecté avec succès avec votre compte Google (${user.email}) ! Redirection vers PetPass...`, 'success');
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

  onForgotRequest(): void {
    if (!this.forgotEmail) {
      this.showAlert('Veuillez saisir votre adresse email.', 'error');
      return;
    }
    this.forgotLoading = true;
    this.authService.forgotPassword(this.forgotEmail).subscribe({
      next: (res: string) => {
        this.forgotLoading = false;
        if (res && res.includes('Token de réinitialisation : ')) {
          this.forgotToken = res.replace('Token de réinitialisation : ', '').trim();
          this.showAlert('Code de vérification généré avec succès. Saisissez votre nouveau mot de passe.', 'success');
        } else {
          this.forgotToken = 'token-auth-temp';
          this.showAlert(res || 'Code de vérification généré avec succès.', 'info');
        }
        this.forgotStep = 2;
      },
      error: (err: any) => {
        this.forgotLoading = false;
        const msg = err?.error?.message || err?.error || 'Erreur lors de la demande de réinitialisation.';
        this.showAlert(typeof msg === 'string' ? msg : 'Erreur lors de la demande de réinitialisation.', 'error');
      }
    });
  }

  onForgotReset(): void {
    if (!this.forgotNewPassword) {
      this.showAlert('Veuillez saisir votre nouveau mot de passe.', 'error');
      return;
    }
    this.forgotLoading = true;
    this.authService.resetPassword(this.forgotToken, this.forgotNewPassword).subscribe({
      next: () => {
        this.forgotLoading = false;
        this.showAlert('Mot de passe réinitialisé avec succès ! Redirection...', 'success');
        setTimeout(() => {
          this.loginView = 'login';
          this.forgotStep = 1;
          this.loginEmail = this.forgotEmail;
        }, 1500);
      },
      error: (err: any) => {
        this.forgotLoading = false;
        const msg = err?.error?.message || err?.error || 'Erreur lors de la réinitialisation.';
        this.showAlert(typeof msg === 'string' ? msg : 'Erreur lors de la réinitialisation.', 'error');
      }
    });
  }
}
