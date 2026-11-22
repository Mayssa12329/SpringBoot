# Architecture Technique — MediVet Connect

## 1. Vue d'Ensemble
MediVet Connect est architecturé selon le modèle des **microservices autonomes et découplés**, appliquant le principe **Database-per-Service** (une base de données dédiée et isolée par microservice).

```
medivet-connect/
├── docker-compose.yml             # Orchestration globale
├── .env.example                   # Gabarit des variables d'environnement
├── .gitignore                     # Exclusion git
├── README.md                      # Documentation et guide de lancement
├── docs/
│   ├── architecture.md            # Spécification d'architecture
│   ├── rapport/                   # Documents et livrables de soutenance
│   └── templates/
│       └── service-template/      # Modèle de base Spring Boot (version 1)
│           ├── Dockerfile
│           ├── .dockerignore
│           ├── pom.xml
│           └── src/
├── postman/
│   └── medivet-connect.postman_collection.json # Collection de tests automatisés
│
├── auth-service/                  # Microservice 1 (Port 8081)
│   ├── Dockerfile
│   ├── pom.xml
│   ├── openapi.yml
│   └── src/
│
├── petpass-service/               # Microservice 2 (Port 8082)
│   ├── Dockerfile
│   ├── pom.xml
│   ├── openapi.yml
│   └── src/
│
└── vetbooking-service/            # Microservice 3 (Port 8083)
    ├── Dockerfile
    ├── pom.xml
    ├── openapi.yml
    └── src/
```

---

## 2. Microservices Existants & Périmètre

### Microservice 1 : Auth Service (`auth-service`)
* **Port** : `8081`
* **Base de données** : `auth_db` sur `auth-db:5432` (externe port `5431`)
* **Responsabilités** :
  * Inscription des propriétaires et praticiens (US01)
  * Authentification JWT (US02)
  * Gestion du profil utilisateur connecté (US03)
  * Administration des rôles (US04) et réinitialisation de mot de passe (US05)
* **Contrat d'API** : `auth-service/openapi.yml`

### Microservice 2 : PetPass Service (`petpass-service`)
* **Port** : `8082`
* **Base de données** : `petpass_db` sur `petpass-db:5432` (externe port `5432`)
* **Responsabilités** :
  * Passeport numérique et identification des animaux (US07, US08)
  * Fiches médicales et actes cliniques (US09)
  * Carnet de vaccination et historique (US10)
  * Consentements et autorisations d'accès vétérinaires (US12 / RM09)
* **Contrat d'API** : `petpass-service/openapi.yml`

### Microservice 3 : VetBooking Service (`vetbooking-service`)
* **Port** : `8083`
* **Base de données** : `vetbooking_db` sur `vetbooking-db:5432` (externe port `5433`)
* **Responsabilités** :
  * Référentiel des praticiens et spécialités médicales (US13)
  * Gestion des créneaux de consultation de 30 min (US14)
  * Prise de rendez-vous avec verrou d'unicité (US15 / RM06 / RM07)
  * File d'attente prioritaire FIFO (US16 / RM08)
* **Contrat d'API** : `vetbooking-service/openapi.yml`

---

## 3. Pattern Database-per-Service
Chaque microservice possède son propre conteneur PostgreSQL isolé avec son propre volume persistant. Aucun conteneur ne peut accéder directement à la table d'un autre conteneur ; toute communication inter-services se fait obligatoirement via des **appels REST HTTP** documentés.

| Microservice | Conteneur DB | Port Interne | Port Hôte | Base de Données | Utilisateur |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **Auth** | `medivet-auth-db` | `5432` | `5431` | `auth_db` | `auth_user` |
| **PetPass** | `medivet-petpass-db` | `5432` | `5432` | `petpass_db` | `petpass_user` |
| **VetBooking** | `medivet-vetbooking-db` | `5432` | `5433` | `vetbooking_db` | `vetbooking_user` |
