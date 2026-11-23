import { Routes } from '@angular/router';
import { LoginComponent } from './pages/auth/login/login.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import { BookingComponent } from './pages/booking/booking.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AdoptAnimalComponent } from './pages/adoptanimal/adoptanimal.component';
import { VetPharmaComponent } from './pages/vetpharma/vetpharma.component';
import { HelpAnimalComponent } from './pages/helpanimal/helpanimal.component';
import { PetsComponent } from './pages/pets/pets.component';
import { ProfileComponent } from './pages/auth/profile/profile.component';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
  { path: '',              redirectTo: '/auth/login', pathMatch: 'full' },
  { path: 'auth/login',    component: LoginComponent },
  { path: 'login',         component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },
  { path: 'register',      component: RegisterComponent },
  { path: 'pets',          component: PetsComponent, canActivate: [AuthGuard] },
  { path: 'profile',       component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'booking',       component: BookingComponent, canActivate: [AuthGuard] },
  { path: 'dashboard',     component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'adoptanimal',   component: AdoptAnimalComponent, canActivate: [AuthGuard] },
  { path: 'vetpharma',     component: VetPharmaComponent, canActivate: [AuthGuard] },
  { path: 'helpanimal',    component: HelpAnimalComponent, canActivate: [AuthGuard] },
  { path: '**',            redirectTo: '/auth/login' }
];
