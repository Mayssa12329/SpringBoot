# MediVet Connect

Plateforme distribuée de gestion vétérinaire et de santé animale.

## 📁 Architecture du Projet

```text
medivet-connect/
├── docker-compose.yml             # Orchestration complète avec Database-per-Service
├── .env.example                   # Gabarit de configuration
├── .gitignore
├── README.md
├── docs/
│   ├── architecture.md            # Spécification détaillée de l'architecture
│   ├── rapport/                   # Dossier pour les livrables de soutenance
│   └── templates/
│       └── service-template/      # Modèle de base Spring Boot (version 1)
├── postman/
│   └── medivet-connect.postman_collection.json # Collection de tests d'intégration
│
├── auth-service/                  # Microservice 1 : Authentification & Utilisateurs (Port 8081)
│   ├── Dockerfile
│   ├── pom.xml
│   ├── openapi.yml
│   └── src/
│
├── petpass-service/               # Microservice 2 : PetPass - Santé Animale (Port 8082)
│   ├── Dockerfile
│   ├── pom.xml
│   ├── openapi.yml
│   └── src/
│
└── vetbooking-service/            # Microservice 3 : VetBooking - Rendez-vous (Port 8083)
    ├── Dockerfile
    ├── pom.xml
    ├── openapi.yml
    └── src/
```

---

## 🗄️ Architecture des Données (Database-per-Service)

Chaque microservice dispose de sa **propre base de données PostgreSQL isolée** :
* **Auth Service** : `auth-db` (Port `5431`, DB: `auth_db`)
* **PetPass Service** : `petpass-db` (Port `5432`, DB: `petpass_db`)
* **VetBooking Service** : `vetbooking-db` (Port `5433`, DB: `vetbooking_db`)

---

## 🚀 Démarrage Rapide

### 1. Prérequis
* Docker & Docker Compose
* Java 17 & Maven 3.9+ (si exécution locale)

### 2. Lancement avec Docker Compose
Pour compiler et démarrer l'ensemble des conteneurs (services + bases dédiées) :

```bash
docker compose up --build -d
```

### 3. Vérification du statut
```bash
docker compose ps
```

---

## 📖 Contrats d'API & Swagger

Après démarrage, les documentations interactives Swagger sont accessibles sur :
* **Auth Service** : `http://localhost:8081/swagger-ui/index.html`
* **PetPass Service** : `http://localhost:8082/swagger-ui/index.html`
* **VetBooking Service** : `http://localhost:8083/swagger-ui/index.html`

Les spécifications OpenAPI 3.0 officielles se trouvent dans chaque microservice :
* `auth-service/openapi.yml`
* `petpass-service/openapi.yml`
* `vetbooking-service/openapi.yml`
