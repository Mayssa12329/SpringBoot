import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService, LoginResponse, User } from '../../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  public pendingCount = 0;

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (this.currentUser?.role === 'ADMINISTRATEUR') {
      const cached = sessionStorage.getItem('pending_vets_count');
      if (cached) {
        this.pendingCount = parseInt(cached, 10) || 0;
      }
      this.refreshPending();
    }
  }

  get currentUser(): LoginResponse | null {
    return this.authService.currentUser();
  }

  refreshPending(): void {
    this.authService.getPendingVets().subscribe({
      next: (vets: User[]) => {
        this.pendingCount = vets.length;
        sessionStorage.setItem('pending_vets_count', String(vets.length));
      },
      error: () => {
        this.pendingCount = 0;
      }
    });
  }

  onLogout(): void {
    sessionStorage.removeItem('admin_users');
    sessionStorage.removeItem('pending_vets_count');
    sessionStorage.removeItem('profile_data');
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
