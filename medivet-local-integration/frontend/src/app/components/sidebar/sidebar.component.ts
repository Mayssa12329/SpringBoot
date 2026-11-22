import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass, NgFor, NgIf, NgSwitch, NgSwitchCase } from '@angular/common';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass, NgFor, NgIf, NgSwitch, NgSwitchCase],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  navItems: NavItem[] = [
    { label: 'Dashboard',          icon: 'grid',          route: '/dashboard' },
    { label: 'PetPass',            icon: 'paw',           route: '/petpass' },
    { label: 'VetBooking',         icon: 'calendar',      route: '/vet-booking' },
    { label: 'My Appointments',    icon: 'list',          route: '/my-appointments' },
    { label: 'Waiting List',       icon: 'clock',         route: '/waiting-list' },
    { label: 'My Availability',    icon: 'available',     route: '/vet-dashboard' },
    { label: 'HelpAnimal',         icon: 'heart',         route: '/help-animal' },
    { label: 'AdoptAnimal',        icon: 'home',          route: '/adopt-animal' },
    { label: 'VetPharma',          icon: 'pill',          route: '/vet-pharma' },
    { label: 'RescueCoordination', icon: 'shield',        route: '/rescue' },
    { label: 'Notifications',      icon: 'bell',          route: '/notifications', badge: 3 },
    { label: 'Settings',           icon: 'settings',      route: '/settings' },
  ];
}
