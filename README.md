# MediVet Connect 🐾

> **Soigner, secourir, adopter : un seul réseau unifié pour les animaux**

MediVet Connect est une plateforme distribuée basée sur une **architecture microservices** moderne. Elle facilite la collaboration entre propriétaires d'animaux, vétérinaires, bénévoles, refuges et services de secours.

---

## 🏗️ Architecture Globale du Projet

Le projet suit le pattern **Database-per-Service**, garantissant l'indépendance, la résilience et la scalabilité de chaque domaine métier. Aucun microservice n'accède directement à la base de données d'un autre ; toutes les communications inter-services s'effectuent via **REST**, **SOAP**, et propagation de jetons de sécurité **JWT**.

```text
medivet-local-integration/
├── pom.xml                                  # Parent Aggregator POM multi-modules
├── docker-compose.yml                       # Orchestration complète (5 microservices + 5 bases PostgreSQL)
├── README.md                                # Documentation générale
├── docs/                                    # Documentation d'architecture & rapports
├── postman/                                 # Collections de tests Postman automatisés
│
├── auth-service/                            # Microservice 1 : Authentification & Utilisateurs
│   ├── Dockerfile                           # Port 8081 | DB: 5431 (auth_db)
│   ├── contract/openapi.yml
│   └── src/main/java/com/medivet/authentification/
│
├── petpass-service/                         # Microservice 2 : PetPass - Santé Animale & Carnet Médical
│   ├── Dockerfile                           # Port 8082 | DB: 5432 (petpass_db)
│   ├── contract/openapi.yml
│   └── src/main/java/com/medivet/petpass/
│
├── vetbooking-service/                      # Microservice 3 : VetBooking - Prise de Rendez-vous
│   ├── Dockerfile                           # Port 8083 | DB: 5433 (vetbooking_db)
│   ├── contract/openapi.yml
│   └── src/main/java/com/medivet/vetbooking/
│
├── helpanimal-service/                      # Microservice 4 : HelpAnimal - Signalement & Secours
│   ├── Dockerfile                           # Port 8084 | DB: 5434 (helpanimal_db)
│   ├── contract/openapi.yml
│   └── src/main/java/com/medivet/helpanimal/
│
└── adoptanimal-service/                     # Microservice 5 : AdoptAnimal - Adoptions & Candidatures
    ├── Dockerfile                           # Port 8085 | DB: 5435 (adoptanimal_db)
    ├── contract/openapi.yml
    └── src/main/java/com/medivet/adoptanimal/
│
└── vetinterop-service/                      # Microservice 6 : VetInterop - Registre des puces (SOAP)
    ├── Dockerfile                           # Port 8087 | DB: 5436 (vetinterop_db)
    ├── contract/vetinterop.xsd              # Contrat SOAP (XSD)
    └── src/main/java/com/medivet/vetinterop/
```

---

## 📊 Matrice des Microservices & Ports

| Microservice | Port HTTP | Port PostgreSQL | Base de Données | Rôle Principal |
| :--- | :---: | :---: | :--- | :--- |
| **`auth-service`** | `8081` | `5431` | `auth_db` | Inscription, connexion, émission JWT, gestion des profils & rôles |
| **`petpass-service`** | `8082` | `5432` | `petpass_db` | Carnet de santé numérique, actes médicaux, vaccins, autorisations d'accès |
| **`vetbooking-service`** | `8083` | `5433` | `vetbooking_db` | Gestion des créneaux, prise de RDV, annulation, liste d'attente (FIFO) |
| **`helpanimal-service`** | `8084` | `5434` | `helpanimal_db` | Signalement d'animaux blessés avec photo et géolocalisation, suivi |
| **`adoptanimal-service`** | `8085` | `5435` | `adoptanimal_db` | Publication d'annonces d'adoption, candidatures, vérification d'éligibilité |
| **`vetinterop-service`** | `8087` | `5436` | `vetinterop_db` | Service SOAP : vérification d'identité des puces (RM10) |

---

## 🔗 Interconnexions Inter-services & Règles Métier

```
                    ┌───────────────────────────┐
                    │       auth-service        │
                    │         (Port 8081)       │
                    └───────────┬───┬───────────┘
     JWT / Moi Animaux (REST)   │   │  JWT / Moi RDV (REST)
             ┌──────────────────┘   └──────────────────┐
             ▼                                         ▼
┌───────────────────────────┐         ┌───────────────────────────┐
│      petpass-service      │◄────────┤    vetbooking-service     │
│        (Port 8082)        │ Valide  │        (Port 8083)        │
└──────▲─────────────▲──────┘ petId   └───────────────────────────┘
       │             │
       │             │ Éligibilité médicale
       │             │ (Vaccination + Santé)
       │             │
┌──────┴────────────┐└─────────────────────────────────┐
│ helpanimal-service│         ┌────────────────────────┴──┐
│    (Port 8084)    │         │    adoptanimal-service    │
│ Sauvetage terminé │         │        (Port 8085)        │
│ crée animal/actes │         └────────────────┬──────────┘
└───────────────────┘                          │
                                               │ Vérifie puce (SOAP)
                                               ▼
                                      ┌───────────────────┐
                                      │ vetinterop-service│
                                      │ (SOAP / Simulée)  │
                                      └───────────────────┘
```

1. **`auth-service` ➔ `petpass-service` & `vetbooking-service` (REST + JWT)** :
   * L'endpoint centralisé `/api/utilisateurs/moi/animaux` agrège en temps réel les animaux du propriétaire connecté depuis PetPass.
   * L'endpoint `/api/utilisateurs/moi/rendez-vous` agrège ses rendez-vous depuis VetBooking.
2. **`vetbooking-service` ➔ `petpass-service` (REST + JWT)** :
   * Lors de la prise de RDV (`POST /api/v1/appointments`), VetBooking vérifie obligatoirement que le `petId` existe dans PetPass (`404` si introuvable).
   * À la réservation, il crée automatiquement une autorisation vétérinaire d'accès (`/vet-authorizations`).
   * À la complétion du RDV, il enregistre l'acte dans le carnet médical PetPass (`/medical-records`).
3. **`helpanimal-service` ➔ `petpass-service` (REST)** :
   * Dès qu'un sauvetage passe au statut `TERMINE`, HelpAnimal crée automatiquement l'animal secouru et ouvre un dossier médical dans PetPass (**Scénario SC3**).
4. **`adoptanimal-service` ➔ `petpass-service` (REST + JWT)** :
   * Avant de publier une annonce d'adoption, vérifie que l'animal a ses vaccins à jour et un état de santé favorable (**Règle RM12**).
5. **`adoptanimal-service` ➔ `vetinterop-service` (SOAP / WSDL / XML)** :
   * Vérification de la puce d'identification via l'opération SOAP `VerifyAnimalIdentity` avec gestion des pannes et circuit breaker Resilience4j (**Règles RM10 & RM13**).

---

## 🚀 Guide de Démarrage Rapide

### Prérequis
* **Docker & Docker Compose** (version 20+)
* **Java 17 (JDK 17)**
* **Maven 3.9+**

### 1. Démarrage de tous les services avec Docker Compose
Pour démarrer les 5 microservices et leurs 5 bases de données isolées en une seule commande :

```bash
docker compose up -d --build
```

Pour vérifier que tous les conteneurs sont sains et actifs :
```bash
docker compose ps
```

### 2. Démarrage individuel en local (Maven)
Vous pouvez également démarrer un microservice spécifique en ligne de commande :

```bash
# Exemple pour Auth Service
mvn spring-boot:run -pl auth-service

# Exemple pour PetPass Service
mvn spring-boot:run -pl petpass-service
```

### 3. Compilation globale et tests
```bash
mvn clean test-compile
```

---

## 📖 Swagger UI & Documentation OpenAPI

Après démarrage des conteneurs, les documentations interactives Swagger UI sont immédiatement accessibles :

* 🔐 **Auth Service** : [http://localhost:8081/swagger-ui/index.html](http://localhost:8081/swagger-ui/index.html)
* 🐶 **PetPass Service** : [http://localhost:8082/swagger-ui/index.html](http://localhost:8082/swagger-ui/index.html)
* 📅 **VetBooking Service** : [http://localhost:8083/swagger-ui/index.html](http://localhost:8083/swagger-ui/index.html)
* 🚑 **HelpAnimal Service** : [http://localhost:8084/swagger-ui/index.html](http://localhost:8084/swagger-ui/index.html)
* 🔎 **VetInterop (SOAP)** : WSDL [http://localhost:8087/ws/vetinterop.wsdl](http://localhost:8087/ws/vetinterop.wsdl)
* 🏡 **AdoptAnimal Service** : [http://localhost:8085/swagger-ui/index.html](http://localhost:8085/swagger-ui/index.html)

Pour chaque service, le bouton **Authorize** permet d'injecter le jeton `Bearer <token>` pour tester les routes sécurisées.

---

## 🧪 Scénario de Test de Bout en Bout

### 1. Connexion & Récupération du JWT
```bash
curl -X POST http://localhost:8081/api/auth/connexion \
  -H "Content-Type: application/json" \
  -d '{"email":"jean.dupont@test.com","motDePasse":"Password123!"}'
```
*Copiez le `token` reçu dans la réponse.*

### 2. Consultation des animaux de l'utilisateur connecté (Agrégation inter-services)
```bash
curl -X GET http://localhost:8081/api/utilisateurs/moi/animaux \
  -H "Authorization: Bearer <VOTRE_TOKEN>"
```

### 3. Réservation d'un rendez-vous avec vérification d'animal
```bash
curl -X POST http://localhost:8083/api/v1/appointments \
  -H "Authorization: Bearer <VOTRE_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"slotId":1,"ownerId":1,"petId":1,"consultationType":"GENERAL","reason":"Visite de contrôle"}'
```
