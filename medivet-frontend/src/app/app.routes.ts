import { Routes } from '@angular/router';
import { VetBookingComponent } from './pages/vet-booking/vet-booking.component';
import { VetDashboardComponent } from './pages/vet-dashboard/vet-dashboard.component';
import { MyAppointmentsComponent } from './pages/my-appointments/my-appointments.component';
import { WaitingListComponent } from './pages/waiting-list/waiting-list.component';

export const routes: Routes = [
  { path: '',                redirectTo: 'vet-booking', pathMatch: 'full' },
  { path: 'vet-booking',     component: VetBookingComponent },
  { path: 'vet-dashboard',   component: VetDashboardComponent },
  { path: 'my-appointments', component: MyAppointmentsComponent },
  { path: 'waiting-list',    component: WaitingListComponent },
  { path: '**',              redirectTo: 'vet-booking' }
];
