# MEDIVET

Projet Spring Boot (3.4.x) avec **Java 21 LTS**, **PostgreSQL 16** et **Docker**.

## Stack Technique

| Composant | Version | Rôle |
| :--- | :--- | :--- |
| **Java JDK** | 21 LTS | Runtime & Compilation |
| **Spring Boot** | 3.4.2 | Framework backend |
| **Base de données** | PostgreSQL 16 | Stockage relationnel |
| **Outils** | Docker & Docker Compose | Conteneurisation & environnement unifié |

## Structure du projet

```
MEDIVET/
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── pom.xml
├── .gitignore
├── README.md
└── src/
    ├── main/
    │   ├── java/com/medivet/
    │   │   ├── config/
    │   │   │   └── SecurityConfig.java
    │   │   └── MedivetApplication.java
    │   └── resources/
    │       └── application.properties
    └── test/
        └── java/com/medivet/
            └── MedivetApplicationTests.java
```
## Architecture des services
                    Client (web / mobile)
                            │  HTTP REST + (JWT en bonus)
                            ▼
                ┌──────────────────────┐
                │     API Gateway      │  :8080
                │ Spring Cloud Gateway │
                └───┬──────────────┬───┘
            REST    │              │    REST
                    ▼              ▼
         ┌────────────────┐  ┌─────────────────┐
         │ PetPassService │  │HelpAnimalService│
         │   REST :8082   │  │   REST :8083    │
         └───┬────────┬───┘  └──┬───────────┬──┘
             │        │  REST   │           │
             │        │◄────────┘           │ gRPC unaire (timeout 3 s)
             │ SOAP   │ (éligibilité,       │ + streaming des missions
             │        │  dossier)           ▼
             ▼        ▼              ┌──────────────────────┐
   ┌──────────────┐ ┌──────────┐     │ RescueCoordination   │
   │VetInterop    │ │ petpass  │     │ gRPC :9090 / HTTP    │
   │SOAP :8081    │ │   -db    │     │ :8084 (actuator)     │
   │registre en   │ └──────────┘     └──────────┬───────────┘
   │mémoire       │                             ▼
   └──────────────┘   ┌──────────────┐    ┌──────────┐
                      │helpanimal-db │    │ rescue-db│
                      └──────────────┘    └──────────┘






## Démarrage rapide

### 1. Avec Docker (Recommandé pour toute l'équipe)

Aucune installation préalable de Java ou PostgreSQL n'est requise. Seul Docker est nécessaire :

```bash
docker compose up --build
```

- **Application** : `http://localhost:8080`
- **PostgreSQL** : `localhost:5432`
  - Base de données : `medivet_db`
  - Utilisateur : `medivet_user`
  - Mot de passe : `medivet_password`

Pour arrêter les conteneurs :
```bash
docker compose down
```

---

### 2. Sans Docker (Exécution locale)

#### Prérequis
- Java 21 LTS
- PostgreSQL 16 installé et démarré en local (ou lancer uniquement le conteneur DB avec `docker compose up postgres`)
- Maven 3.9+

#### Commandes utiles
- Compiler le projet :
  ```bash
  mvn clean compile
  ```
- Lancer l'application :
  ```bash
  mvn spring-boot:run
  ```
