export interface User {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse?: string;
  avatarUrl?: string;
  role: 'UTILISATEUR' | 'VETERINAIRE' | 'ADMINISTRATEUR';
  demandeVeterinaire?: boolean;
  diplomeUrl?: string;
}

export interface LoginResponse {
  id: number;
  token: string;
  email: string;
  role: 'UTILISATEUR' | 'VETERINAIRE' | 'ADMINISTRATEUR';
  nom: string;
  prenom: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  telephone?: string;
  adresse?: string;
  avatarUrl?: string;
  demandeVeterinaire: boolean;
  diplomeUrl?: string;
}

export interface UserProfile {
  id?: string | number;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
  token?: string;
}

export interface AppNotification {
  id: number;
  userId: number;
  titre: string;
  message: string;
  type: 'RENDEZ_VOUS' | 'VACCINATION' | 'ADOPTION' | 'URGENCE' | 'PHARMACIE' | 'ADMIN' | string;
  lu: boolean;
  dateCreation: string;
}
