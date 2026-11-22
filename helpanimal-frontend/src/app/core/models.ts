/** Contrat de l'API HelpAnimalService (voir les DTO Java de web/dto). */

export type ReportStatus =
  'NOUVEAU' | 'QUALIFIE' | 'ATTRIBUE' | 'EN_COURS' | 'TERMINE' | 'REJETE' | 'MASQUE';

export type ReportCategory = 'BLESSE' | 'MALADE' | 'ABANDONNE' | 'PERDU' | 'MALTRAITE' | 'AUTRE';

/** Roles de UserService : VETERINAIRE joue le benevole et l'intervenant de HelpAnimal. */
export type Role = 'UTILISATEUR' | 'VETERINAIRE' | 'ADMINISTRATEUR';

export interface ReportSummary {
  id: number;
  species: string;
  category: ReportCategory;
  severity: number;
  status: ReportStatus;
  latitude: number;
  longitude: number;
  photoUrl: string;
  createdAt: string;
  priorityScore: number;
  distanceMeters?: number;
}

export interface StatusHistory {
  fromStatus: ReportStatus | null;
  toStatus: ReportStatus;
  actorId: number;
  comment: string | null;
  changedAt: string;
}

export interface ReportDetail {
  id: number;
  species: string;
  category: ReportCategory;
  description: string;
  severity: number;
  photoUrl: string;
  latitude: number;
  longitude: number;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  takenChargeAt?: string | null;
  priorityScore: number;
  /** Absents de la vue publique : reserves a l'auteur, l'intervenant attribue et l'admin. */
  reporterId?: number | null;
  assigneeId?: number | null;
  /** Animal cree dans PetPass a la fin du sauvetage. */
  petpassAnimalId?: number | null;
  history?: StatusHistory[] | null;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Session {
  userId: number;
  role: Role;
  token: string;
  name: string;
  email: string;
}

export const CATEGORY_LABELS: Record<ReportCategory, string> = {
  BLESSE: 'Animal blessé',
  MALADE: 'Animal malade',
  ABANDONNE: 'Animal abandonné',
  PERDU: 'Animal perdu',
  MALTRAITE: 'Animal maltraité',
  AUTRE: 'Autre situation',
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  NOUVEAU: 'Nouveau',
  QUALIFIE: 'Qualifié',
  ATTRIBUE: 'Attribué',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  REJETE: 'Rejeté',
  MASQUE: 'Masqué',
};

export const ROLE_LABELS: Record<Role, string> = {
  UTILISATEUR: 'Citoyen',
  VETERINAIRE: 'Vétérinaire / intervenant',
  ADMINISTRATEUR: 'Administrateur',
};

/** Etats qu'un signalement peut avoir sur la carte (Masque n'est jamais public). */
export const VISIBLE_STATUSES: ReportStatus[] = [
  'NOUVEAU',
  'QUALIFIE',
  'ATTRIBUE',
  'EN_COURS',
  'TERMINE',
  'REJETE',
];
