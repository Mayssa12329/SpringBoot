import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  LucideAngularModule,
  UserRound,
  Stethoscope,
  ShieldCheck,
  Clock,
  PawPrint,
  ArrowRight,
  Mail,
  Phone,
  LockKeyhole,
  Eye,
  EyeOff,
  CircleCheck,
  Crown,
  Users,
  FileText,
  Search,
  X,
  Inbox,
  UserRoundCog,
  RefreshCw,
  UserPlus
} from 'lucide-angular';

import { routes } from './router/routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    importProvidersFrom(
      LucideAngularModule.pick({
        UserRound,
        Stethoscope,
        ShieldCheck,
        Clock,
        PawPrint,
        ArrowRight,
        Mail,
        Phone,
        LockKeyhole,
        Eye,
        EyeOff,
        CircleCheck,
        Crown,
        Users,
        FileText,
        Search,
        X,
        Inbox,
        UserRoundCog,
        RefreshCw,
        UserPlus
      })
    )
  ]
};
