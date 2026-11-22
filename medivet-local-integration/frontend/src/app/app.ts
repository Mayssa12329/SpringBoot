import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { SidebarComponent, NavTab } from './components/layout/sidebar/sidebar.component';
import { HeaderComponent } from './components/layout/header/header.component';
import { SearchService } from './services/search.service';
import { AuthService } from './services/auth.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = 'MediVet Connect';
  private router = inject(Router);
  private searchService = inject(SearchService);
  private authService = inject(AuthService);
  public isAuthPage = true;
  public currentTab: NavTab = 'petpass';

  constructor() {
    this.updateRoute(this.router.url);
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((e) => {
      this.updateRoute(e.urlAfterRedirects || e.url);
    });
  }

  private updateRoute(url: string): void {
    const path = (url || '').split('?')[0].split('#')[0];
    this.isAuthPage = !path || path === '/' || path === '/login' || path === '/register' || path === '/forgot-password';

    if (path.includes('pets') || path.includes('petpass')) {
      this.currentTab = 'petpass';
    } else if (path.includes('booking') || path.includes('vetbooking')) {
      this.currentTab = 'vetbooking';
    } else if (path.includes('adoptanimal')) {
      this.currentTab = 'adoptanimal';
    } else if (path.includes('helpanimal')) {
      this.currentTab = 'helpanimal';
    } else if (path.includes('dashboard')) {
      this.currentTab = 'dashboard';
    } else if (path.includes('profile')) {
      this.currentTab = 'perfil';
    } else if (path.includes('vetpharma')) {
      this.currentTab = 'vetpharma';
    }
  }

  onTabChanged(tab: NavTab): void {
    this.searchService.clear();
    this.currentTab = tab;
    switch (tab) {
      case 'dashboard':
        const role = (this.authService.userRole() || '').toUpperCase();
        if (role === 'VETERINAIRE' || role === 'VET' || role === 'ADMINISTRATEUR') {
          this.router.navigate(['/dashboard']);
        } else {
          this.currentTab = 'petpass';
          this.router.navigate(['/pets']);
        }
        break;
      case 'petpass':
        this.router.navigate(['/pets']);
        break;
      case 'vetbooking':
        this.router.navigate(['/booking']);
        break;
      case 'adoptanimal':
        this.router.navigate(['/adoptanimal']);
        break;
      case 'helpanimal':
        this.router.navigate(['/helpanimal']);
        break;
      case 'perfil':
        this.router.navigate(['/profile']);
        break;
      case 'vetpharma':
        this.router.navigate(['/vetpharma']);
        break;
      default:
        break;
    }
  }
}
