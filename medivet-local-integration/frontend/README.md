# 🐾 MediVet Connect — Frontend Unifié (Angular 21)

Ce projet regroupe l'ensemble des modules front-end de la plateforme **MediVet Connect** au sein d'une **architecture Angular 21 unique, lisible et performante** (sans microfrontends séparés). 

Les trois services métiers essentiels sont assemblés et interconnectés de manière transparente :
- **🔐 Auth** : Authentification JWT, inscription (propriétaire & pro vétérinaire avec diplôme), mot de passe oublié, profil utilisateur et administration des rôles.
- **🐕 PetPass** : Passeport numérique de l'animal, carnet médical complet, calendrier vaccinal, historique des visites et gestion des autorisations d'accès vétérinaires (RM03).
- **📅 VetBooking** : Recherche de vétérinaires spécialisés, filtrage multi-critères, sélection de créneaux sur calendrier interactif et confirmation de rendez-vous.
- **📊 Dashboard** : Tableau de bord centralisé affichant les indicateurs clés (KPI), prochains rendez-vous et aperçu de santé des patients.

---

## 📁 Architecture du Projet

```text
frontend/
├── src/
│   ├── index.html                 # Point d'entrée HTML
│   ├── main.ts                    # Bootstrap Angular (provideRouter, provideHttpClient, Lucide icons)
│   ├── styles.scss                # Styles globaux, variables SCSS et reset
│   ├── assets/                    # Ressources visuelles et illustrations
│   │   └── images/                # Badges, avatars animaux, logos et icônes
│   └── app/
│       ├── app.ts                 # Composant racine avec sélecteur app-root
│       ├── app.html               # Layout principal (Navbar unifiée + router-outlet)
│       ├── app.scss               # Styles de mise en page réactifs
│       ├── app.config.ts          # Fournisseurs globaux (Router, HTTP avec fetch, Icônes Lucide)
│       ├── router/
│       │   └── routes.ts          # Définition des routes Angular unifiées
│       ├── pages/
│       │   ├── auth/              # Authentification & Utilisateurs
│       │   │   ├── login/         # Connexion avec redirection selon rôle
│       │   │   ├── register/      # Inscription simple & candidature pro vétérinaire
│       │   │   ├── forgot-password/# Réinitialisation du mot de passe
│       │   │   ├── profile/       # Gestion du profil connecté
│       │   │   └── admin-roles/   # Validation praticiens et gestion des rôles
│       │   ├── dashboard/         # Tableau de bord principal (Welcome hero, metrics, RDV)
│       │   ├── pets/              # PetPass (accueil interactif & carnet de santé)
│       │   │   ├── pets.component.ts         # Coordinateur accueil / carnet
│       │   │   ├── petpass-home.component.ts # Vue d'accueil et liste des animaux
│       │   │   └── petpass-view.component.ts # Carnet médical détaillé et passeport
│       │   └── booking/           # VetBooking
│       │       ├── booking.component.ts      # Logique de réservation & filtres praticiens
│       │       ├── booking.component.html    # Grille 2 colonnes (praticiens + calendrier)
│       │       └── booking.component.scss    # Styles SCSS dédiés
│       ├── components/
│       │   ├── layout/            # Composants structurels
│       │   │   ├── header/        # Header d'en-tête
│       │   │   ├── sidebar/       # Barre latérale avec navigation contextuelle
│       │   │   └── navbar/        # Barre de navigation globale avec statut de session
│       │   └── ui/                # Composants d'interface réutilisables
│       │       ├── metric-card/   # Cartes KPI avec indicateur de tendance
│       │       └── toast/         # Service et affichage des notifications toast
│       ├── services/              # Services Angular avec signaux réactifs
│       │   ├── auth.service.ts        # Gestion JWT, profil, rôles et persistance
│       │   ├── petpass.service.ts     # CRUD animaux, consultations, vaccins
│       │   └── appointment.service.ts # Données de rendez-vous et métriques
│       ├── models/                # Interfaces TypeScript fortement typées
│       │   ├── animal.model.ts        # Modèle de l'animal et espèce
│       │   ├── appointment.model.ts   # Rendez-vous et données KPI
│       │   ├── medical-record.model.ts# Dossier médical et vaccins
│       │   ├── slot.model.ts          # Créneaux horaires
│       │   ├── user.model.ts          # Utilisateur, profil et réponse de connexion
│       │   ├── vet.model.ts           # Fiche praticien vétérinaire
│       │   └── vet-authorization.model.ts # Droits d'accès praticiens
│       └── utils/
│           ├── config/
│           │   └── endpoints.config.ts # Configuration des points de terminaison
│           └── constants/
│               ├── detail-images.ts    # Constantes d'images
│               ├── overview-icons.ts   # Icônes SVG pour la santé et le statut
│               └── pet-avatars.ts      # Avatars prédéfinis pour animaux
├── public/                        # Fichiers statiques publics (favicon, assets)
├── angular.json                   # Configuration Angular CLI v21
├── package.json                   # Scripts et dépendances du projet
├── proxy.conf.json                # Proxy de développement vers les microservices Spring Boot
├── tsconfig.json                  # Configuration TypeScript
└── README.md                      # Documentation du projet
```

---

## 🚀 Démarrage Rapide

### 1. Installation des dépendances
```bash
npm install
```

### 2. Lancement en mode développement
```bash
npm start
```
L'application démarre sur **http://localhost:4200** avec le proxy automatique configuré vers les microservices Spring Boot (Auth :8081, PetPass :8082, VetBooking :8083).

### 3. Compilation pour la production
```bash
npm run build
```
Les fichiers compilés et optimisés sont générés dans le dossier `dist/frontend`.

---

## 🗺️ Tableau des Routes

| Route | Composant | Description |
| :--- | :--- | :--- |
| `/dashboard` | `DashboardComponent` | Tableau de bord avec métriques de santé et prochains RDV |
| `/pets` | `PetsComponent` | Espace PetPass (vue d'accueil et carnet de santé complet) |
| `/booking` | `BookingComponent` | Prise de rendez-vous en ligne avec choix de créneau |
| `/login` | `LoginComponent` | Page de connexion avec pré-remplissage démo (Admin, Vétérinaire, Propriétaire) |
| `/register` | `RegisterComponent` | Inscription utilisateur et dépôt de candidature vétérinaire |
| `/forgot-password`| `ForgotPasswordComponent`| Réinitialisation de mot de passe par jeton |
| `/profile` | `ProfileComponent` | Consultation et mise à jour des coordonnées personnelles |
| `/admin-roles` | `AdminRolesComponent` | Espace réservé administrateur (attribution de rôles & validation de diplômes) |

---

## 🔌 Interconnexion avec les Microservices Backend

Le fichier `proxy.conf.json` assure la liaison directe avec les serveurs backend :
- `/api/auth` et `/api/utilisateurs` ➔ **auth-service** (`http://localhost:8081`)
- `/api/v1/animals` et `/api/v1/medical-records` ➔ **petpass-service** (`http://localhost:8082`)
- `/api/v1/vets`, `/api/v1/slots`, `/api/v1/appointments` ➔ **vetbooking-service** (`http://localhost:8083`)
- `/api/v1/urgences` et `/api/v1/missions` ➔ **helpanimal-service** (`http://localhost:8084`)
- `/api/v1/annonces`, `/api/v1/candidatures`, `/api/v1/rencontres` ➔ **adoptanimal-service** (`http://localhost:8085`)

Chaque service intègre également un mode de démonstration fluide avec données de repli (*fallback*), garantissant une expérience utilisateur complète et interactive même hors ligne.
