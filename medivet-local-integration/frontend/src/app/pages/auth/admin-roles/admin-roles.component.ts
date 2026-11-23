import { Component, OnInit, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService, User, LoginResponse } from '../../../services/auth.service';
import { SearchService } from '../../../services/search.service';
import { forkJoin, timeout } from 'rxjs';

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './admin-roles.component.html',
  styleUrls: ['./admin-roles.component.css']
})
export class AdminRolesComponent implements OnInit {
  public allUsers: User[] = [];
  public pendingVets: User[] = [];
  public currentTab: 'roles' | 'vets' = 'roles';

  public searchQuery = '';
  public roleFilter = 'TOUS';
  public updatingUserId: number | null = null;
  public isLoading = false;

  public alertMessage: string | null = null;
  public alertType: 'success' | 'error' | 'info' = 'info';

  constructor(
    public authService: AuthService, 
    private router: Router,
    public searchService: SearchService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (!user || user.role !== 'ADMINISTRATEUR') {
      this.router.navigate(['/login']);
      return;
    }
    // Charger le cache immédiatement pour éviter l'écran vide
    const cached = sessionStorage.getItem('admin_users');
    if (cached) {
      try {
        this.allUsers = JSON.parse(cached);
      } catch {
        sessionStorage.removeItem('admin_users');
      }
    }
    this.loadData();
  }

  get currentUser(): LoginResponse | null {
    return this.authService.currentUser();
  }

  showAlert(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.alertMessage = message;
    this.alertType = type;
  }

  clearAlert(): void {
    this.alertMessage = null;
  }

  loadData(showSpinner = true): void {
    // Spinner uniquement si aucune donnée n'est encore affichée
    if (showSpinner && this.allUsers.length === 0) {
      this.isLoading = true;
    }

    forkJoin({
      users: this.authService.getAllUsers(),
      vets: this.authService.getPendingVets()
    }).pipe(
      timeout(10000) // abandon après 10 secondes
    ).subscribe({
      next: ({ users, vets }) => {
        this.allUsers = users;
        this.pendingVets = vets;
        this.isLoading = false;
        sessionStorage.setItem('admin_users', JSON.stringify(users));
      },
      error: (err) => {
        this.isLoading = false;
        // Si on a du cache, on garde l'affichage existant sans message d'erreur bloquant
        if (this.allUsers.length === 0) {
          this.showAlert('Impossible de charger les données. Vérifiez votre connexion.', 'error');
        }
      }
    });
  }

  get filteredUsers(): User[] {
    return this.allUsers.filter((u) => {
      const q = (this.searchService.query() || this.searchQuery).trim().toLowerCase();
      const matchQuery =
        !q ||
        `${u.nom} ${u.prenom} ${u.email} ${u.telephone}`
          .toLowerCase()
          .includes(q);

      const matchRole =
        this.roleFilter === 'TOUS' || u.role === this.roleFilter;

      return matchQuery && matchRole;
    });
  }

  changeUserRole(user: User, newRole: 'UTILISATEUR' | 'VETERINAIRE' | 'ADMINISTRATEUR'): void {
    if (!user.id) return;
    if (user.role === newRole) return;

    this.updatingUserId = user.id;
    this.authService.assignRole(user.id, newRole).subscribe({
      next: () => {
        this.updatingUserId = null;
        user.role = newRole;
        sessionStorage.setItem('admin_users', JSON.stringify(this.allUsers));
        this.showAlert(`Rôle de ${user.prenom} ${user.nom} mis à jour : ${newRole}.`, 'success');
        this.loadData(false); // refresh silencieux, pas de spinner
      },
      error: (err: any) => {
        this.updatingUserId = null;
        this.showAlert(err?.error || 'Erreur lors de la modification du rôle.', 'error');
      }
    });
  }

  approveVet(user: User): void {
    if (!user.id) return;
    this.authService.assignRole(user.id, 'VETERINAIRE').subscribe({
      next: () => {
        this.showAlert(`${user.prenom} ${user.nom} est maintenant promu Vétérinaire officiel !`, 'success');
        sessionStorage.removeItem('admin_users');
        this.loadData(false); // refresh silencieux
      },
      error: (err: any) => {
        this.showAlert(err?.error || 'Erreur lors de la validation du vétérinaire.', 'error');
      }
    });
  }
}
