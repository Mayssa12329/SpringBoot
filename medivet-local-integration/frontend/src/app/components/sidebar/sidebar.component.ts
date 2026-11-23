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
    { label: 'PetPass',            icon: 'paw',           route: '/pets' },
    { label: 'VetBooking',         icon: 'calendar',      route: '/booking' },
    { label: 'HelpAnimal',         icon: 'heart',         route: '/helpanimal' },
    { label: 'AdoptAnimal',        icon: 'home',          route: '/adoptanimal' },
    { label: 'VetPharma',          icon: 'pill',          route: '/vetpharma' },
  ];
}
