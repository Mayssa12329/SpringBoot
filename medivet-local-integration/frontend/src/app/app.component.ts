import { Component, ViewChild, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { HeaderComponent } from './components/layout/header/header.component';
import { NavTab, SidebarComponent } from './components/layout/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  private readonly router = inject(Router);
  @ViewChild(HeaderComponent) private header?: HeaderComponent;

  readonly showAppShell = signal(false);
  readonly activeTab = signal<NavTab>('petpass');

  constructor() {
    this.updateRouteState();
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.updateRouteState());
  }

  onSidebarTabChanged(tab: NavTab): void {
    if (tab === 'notifications') {
      this.header?.toggleNotifications();
      return;
    }

    const routes: Partial<Record<NavTab, string>> = {
      dashboard: '/dashboard',
      petpass: '/pets',
      vetbooking: '/booking',
      helpanimal: '/helpanimal',
      rescuecoordination: '/helpanimal',
      adoptanimal: '/adoptanimal',
      vetpharma: '/vetpharma',
      perfil: '/profile',
      settings: '/profile'
    };

    const route = routes[tab];
    if (route) {
      this.router.navigateByUrl(route);
    }
  }

  private updateRouteState(): void {
    const path = this.router.url.split('?')[0].split('#')[0] || '/';
    const publicPaths = ['/', '/login', '/register', '/auth/login', '/auth/register'];
    this.showAppShell.set(!publicPaths.includes(path));

    const tabsByPath: Record<string, NavTab> = {
      '/dashboard': 'dashboard',
      '/pets': 'petpass',
      '/booking': 'vetbooking',
      '/helpanimal': 'helpanimal',
      '/adoptanimal': 'adoptanimal',
      '/vetpharma': 'vetpharma',
      '/profile': 'perfil'
    };
    this.activeTab.set(tabsByPath[path] || 'petpass');
  }
}
