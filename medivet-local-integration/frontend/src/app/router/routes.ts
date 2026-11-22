import { Routes } from '@angular/router';
import { LoginComponent } from '../pages/auth/login/login.component';
import { RegisterComponent } from '../pages/auth/register/register.component';
import { ForgotPasswordComponent } from '../pages/auth/forgot-password/forgot-password.component';
import { ProfileComponent } from '../pages/auth/profile/profile.component';
import { AdminRolesComponent } from '../pages/auth/admin-roles/admin-roles.component';
import { DashboardComponent } from '../pages/dashboard/dashboard.component';
import { PetsComponent } from '../pages/pets/pets.component';
import { BookingComponent } from '../pages/booking/booking.component';
import { AdoptAnimalComponent } from '../pages/adoptanimal/adoptanimal.component';
import { HelpAnimalComponent } from '../pages/helpanimal/helpanimal.component';
import { VetPharmaComponent } from '../pages/vetpharma/vetpharma.component';
import { authGuard } from '../guards/auth.guard';

export const routes: Routes = [
  // Pages Publiques (Authentification)
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },

  // Pages Privées protégées par authGuard
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'admin-roles', component: AdminRolesComponent, canActivate: [authGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'pets', component: PetsComponent, canActivate: [authGuard] },
  { path: 'petpass', redirectTo: 'pets', pathMatch: 'full' },
  { path: 'booking', component: BookingComponent, canActivate: [authGuard] },
  { path: 'vetbooking', redirectTo: 'booking', pathMatch: 'full' },
  { path: 'adoptanimal', component: AdoptAnimalComponent, canActivate: [authGuard] },
  { path: 'helpanimal', component: HelpAnimalComponent, canActivate: [authGuard] },
  { path: 'vetpharma', component: VetPharmaComponent, canActivate: [authGuard] },

  // Redirections par défaut
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
