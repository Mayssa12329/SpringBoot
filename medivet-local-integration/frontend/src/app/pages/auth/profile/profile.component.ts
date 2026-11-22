import { Component, OnInit, signal, computed, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService, User } from '../../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  // Form profile
  public nomComplet = 'Mayssa Ben Amor';
  public userEmail = 'mayssa@email.com';
  public editTelephone = '+216 XX XXX XXX';
  public editAdresse = 'Sfax, Tunisie';
  public userRole = 'Propriétaire';

  // Avatar (starts with empty avatar placeholder by default if not set)
  public avatarUrl = AuthService.EMPTY_AVATAR_PLACEHOLDER;

  // Passwords
  public currentPassword = '';
  public newPassword = '';
  public confirmPassword = '';
  public showCurrentPassword = false;
  public showNewPassword = false;
  public showConfirmPassword = false;

  // Preferences Toggles (identical to mockup)
  public notifRappelsRdv = true;
  public notifAlertesSante = true;
  public notifNouvellesConseils = true;

  public prefRecommandations = true;
  public prefOffresAdoption = false;
  public prefNewsletters = true;

  // Status & feedback
  public isLoading = false;
  public isSaving = false;
  public isChangingPassword = false;
  public alertMessage: string | null = null;
  public alertType: 'success' | 'error' | 'info' = 'info';

  // Search
  public searchQuery = '';

  private readonly CACHE_KEY = 'profile_data';

  ngOnInit(): void {
    if (!this.authService.token()) {
      this.router.navigate(['/login']);
      return;
    }

    // Initialize from current user
    const curr = this.authService.currentUser();
    if (curr) {
      this.nomComplet = `${curr.prenom || ''} ${curr.nom || ''}`.trim() || 'Mayssa Ben Amor';
      this.userEmail = curr.email || 'mayssa@email.com';
      this.userRole = curr.role === 'UTILISATEUR' ? 'Propriétaire' : curr.role;
      if (curr.avatarUrl && curr.avatarUrl.trim().length > 0) {
        this.avatarUrl = curr.avatarUrl;
      }
    }

    const savedAddr = localStorage.getItem('profile_adresse');
    if (savedAddr) {
      this.editAdresse = savedAddr;
    }

    const savedPhone = localStorage.getItem('profile_telephone');
    if (savedPhone) {
      this.editTelephone = savedPhone;
    }

    const savedAvatar = localStorage.getItem('profile_avatar');
    if (savedAvatar && savedAvatar.trim().length > 0) {
      this.avatarUrl = savedAvatar;
    } else if (!curr?.avatarUrl) {
      this.avatarUrl = AuthService.EMPTY_AVATAR_PLACEHOLDER;
    }

    this.loadProfile();
  }

  showAlert(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    queueMicrotask(() => {
      this.alertMessage = message;
      this.alertType = type;
      this.cdr.detectChanges();
    });
    setTimeout(() => {
      if (this.alertMessage === message) {
        this.alertMessage = null;
        this.cdr.detectChanges();
      }
    }, 4500);
  }

  clearAlert(): void {
    this.alertMessage = null;
    this.cdr.detectChanges();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.authService.getMyProfile().subscribe({
      next: (user: User) => {
        this.isLoading = false;
        if (user.nom || user.prenom) {
          this.nomComplet = `${user.prenom || ''} ${user.nom || ''}`.trim();
        }
        if (user.email) {
          this.userEmail = user.email;
        }
        if (user.telephone) {
          this.editTelephone = user.telephone;
        }
        if (user.adresse) {
          this.editAdresse = user.adresse;
        }
        if (user.avatarUrl && user.avatarUrl.trim().length > 0) {
          this.avatarUrl = user.avatarUrl;
          this.authService.setAvatar(user.avatarUrl);
        } else {
          this.avatarUrl = this.authService.userAvatar();
        }
        if (user.role) {
          this.userRole = user.role === 'UTILISATEUR' ? 'Propriétaire' : user.role;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSaveProfile(): void {
    if (!this.nomComplet || !this.nomComplet.trim()) {
      this.showAlert('Veuillez renseigner votre nom complet.', 'error');
      return;
    }

    this.isSaving = true;
    this.cdr.detectChanges();

    // Split nom and prenom
    const parts = this.nomComplet.trim().split(' ');
    const prenom = parts[0] || '';
    const nom = parts.slice(1).join(' ') || prenom;

    this.authService.updateProfile({
      nom: nom,
      prenom: prenom,
      telephone: this.editTelephone,
      adresse: this.editAdresse,
      email: this.userEmail,
      avatarUrl: this.avatarUrl
    }).pipe(
      finalize(() => {
        this.isSaving = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (updatedUser: User) => {
        localStorage.setItem('profile_adresse', this.editAdresse);
        localStorage.setItem('profile_telephone', this.editTelephone);
        if (this.avatarUrl) {
          localStorage.setItem('profile_avatar', this.avatarUrl);
        }
        this.showAlert('Vos informations ont été enregistrées avec succès en base de données !', 'success');

        const curr = this.authService.currentUser();
        if (curr) {
          curr.nom = updatedUser.nom || nom;
          curr.prenom = updatedUser.prenom || prenom;
          curr.email = updatedUser.email || this.userEmail;
          curr.telephone = updatedUser.telephone || this.editTelephone;
          curr.adresse = updatedUser.adresse || this.editAdresse;
          curr.avatarUrl = updatedUser.avatarUrl || this.avatarUrl;
          this.authService.currentUser.set({ ...curr });
          localStorage.setItem('medivet_user', JSON.stringify({ ...curr }));
        }
      },
      error: (err) => {
        console.error('Erreur mise à jour profil:', err);
        const msg = err?.error?.message || (typeof err?.error === 'string' ? err.error : null) || 'Erreur lors de la mise à jour des informations.';
        this.showAlert(msg, 'error');
      }
    });
  }

  onChangePassword(): void {
    if (!this.currentPassword) {
      this.showAlert('Veuillez saisir votre mot de passe actuel.', 'error');
      return;
    }
    if (!this.newPassword || this.newPassword.length < 6) {
      this.showAlert('Le nouveau mot de passe doit contenir au moins 6 caractères.', 'error');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.showAlert('Les deux nouveaux mots de passe ne correspondent pas.', 'error');
      return;
    }

    this.isChangingPassword = true;
    this.cdr.detectChanges();

    this.authService.changePassword({
      ancienMotDePasse: this.currentPassword,
      nouveauMotDePasse: this.newPassword
    }).pipe(
      finalize(() => {
        this.isChangingPassword = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.showAlert('Votre mot de passe a été mis à jour avec succès en base de données !', 'success');
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (err) => {
        console.error('Erreur changement mot de passe:', err);
        const msg = err?.error?.message || (typeof err?.error === 'string' ? err.error : null) || 'Mot de passe actuel incorrect.';
        this.showAlert(msg, 'error');
      }
    });
  }

  onAvatarSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        this.showAlert('Veuillez sélectionner un fichier image valide.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const rawDataUrl = e.target.result;
        this.resizeImage(rawDataUrl, 256, 256, (resizedDataUrl) => {
          this.avatarUrl = resizedDataUrl;
          this.authService.setAvatar(resizedDataUrl);
          this.cdr.detectChanges();

          const parts = (this.nomComplet || '').trim().split(' ');
          const prenom = parts[0] || '';
          const nom = parts.slice(1).join(' ') || prenom;

          this.authService.updateProfile({
            nom: nom,
            prenom: prenom,
            telephone: this.editTelephone,
            adresse: this.editAdresse,
            email: this.userEmail,
            avatarUrl: resizedDataUrl
          }).subscribe({
            next: () => {
              this.showAlert('Photo de profil enregistrée avec succès en base de données !', 'success');
            },
            error: () => {
              this.showAlert('Photo de profil mise à jour localement !', 'info');
            }
          });
        });
      };
      reader.readAsDataURL(file);
    }
  }

  private resizeImage(dataUrl: string, maxWidth: number, maxHeight: number, callback: (resized: string) => void): void {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/jpeg', 0.85));
      } else {
        callback(dataUrl);
      }
    };
    img.onerror = () => callback(dataUrl);
    img.src = dataUrl;
  }

  goToDashboard(): void {
    this.router.navigate(['/pets']);
  }
}
