# 🐾 MediVet Connect

Plateforme distribuée et cloud-native pour la santé animale, la prise de rendez-vous vétérinaires, les urgences de sauvetage, l'adoption et la gestion pharmaceutique.

Projet réalisé par une équipe de **6 ingénieurs** selon la méthodologie **Agile/Scrum** (Spring Boot 3.4.x, Java 21 LTS, PostgreSQL 16, Docker).

---

## 🏛️ 1. Architecture Globale du Système

Le système repose sur une architecture **microservices polyglotte en protocoles** (REST, gRPC, SOAP) où chaque service est strictement propriétaire de ses données et de ses règles métier.

```
                              ┌────────────────────────┐
                              │  Client Web / Mobile   │
                              └───────────┬────────────┘
                                          │  HTTP / REST
                                          ▼
                         ┌─────────────────────────────────┐
                         │   API Gateway (Spring Cloud)    │
                         │   Routage /api/v1, Sécurité JWT │
                         └────┬───────────┬───────────┬────┘
                              │           │           │
       ┌──────────────────────┼───────────┼───────────┼──────────────────────┐
       │ (REST)               │ (REST)    │ (REST)    │ (REST)               │ (REST)
       ▼                      ▼           ▼           ▼                      ▼
┌──────────────┐     ┌─────────────┐ ┌─────────┐ ┌─────────────┐     ┌──────────────┐
│ UserService  │     │ PetPass     │ │ Vet-    │ │ HelpAnimal  │     │ AdoptAnimal  │
│ Auth / JWT   │     │ Dossier Méd.│ │ Booking │ │ Signalements│     │ Annonces &   │
└──────────────┘     └──────┬──────┘ └────┬────┘ └──────┬──────┘     │ Candidatures │
                            │             │             │            └──────┬───────┘
                     (SOAP) │             │ (Événements)│ (gRPC)            │ (REST)
                            ▼             │             ▼                   ▼
                     ┌─────────────┐      │      ┌─────────────┐     ┌──────────────┐
                     │ VetInterop  │      │      │ Rescue-     │     │ Notification │
                     │ Registre Ext│      │      │ Coordination│     │ Service      │
                     └─────────────┘      │      └──────┬──────┘     └──────────────┘
                                          │ (Événements)│ (Événements)
                                          ▼             ▼
                                  ┌─────────────────────────────┐
                                  │     NotificationService     │
                                  └─────────────────────────────┘
                                                 ▲
                                          (gRPC) │
                                  ┌──────────────┴──────────────┐
                                  │      VetPharmaService       │
                                  │ Stocks & Réservations gRPC  │
                                  └─────────────────────────────┘
```

---

## 📦 2. Services Métier & Composants Transverses

### A. Les 8 Services Métier

| Service | Protocole exposé | Données propres (Ressources) | Décisions & Règles clés | Appels sortants |
| :--- | :--- | :--- | :--- | :--- |
| **UserService** | REST | Compte, rôle, session JWT | Authentification, RBAC, hachage mdp (RM16) | — |
| **PetPassService** | REST + client SOAP | Animal, carnet médical, vaccins, accès | Chronologie des actes, éligibilité médicale (RM09) | → VetInterop (SOAP)<br>→ NotificationService |
| **VetBookingService**| REST | Disponibilités, créneaux, RDV, file d'attente | Créneau unique (RM06), compatibilité acte (RM07), FIFO (RM08) | → NotificationService |
| **HelpAnimalService**| REST | Signalements, photos, GPS, statuts | Priorité (RM01), doublons 100m/2h (RM02), cycle de vie (RM03) | → RescueCoordination (gRPC)<br>→ PetPass (REST) |
| **RescueCoordinationService** | gRPC (unaire + stream) | Missions de sauvetage, affectation intervenant | Verrou optimiste (RM04), réattribution 15 min (RM05) | → NotificationService |
| **VetPharmaService**| gRPC (unaire + stream) | Produits, pharmacies, stocks, réservations | Stock dispo, réservation 15 min, idempotence (RM11) | — |
| **VetInteropService**| SOAP (XSD/WSDL) | Registre national simulé (puce 15 chiffres) | Verdict (VERIFIED, NOT_FOUND), SOAP Fault (RM10) | — |
| **AdoptAnimalService**| REST | Annonces d'adoption, candidatures, visites | Éligibilité médicale, adoption finale unique (RM12) | → PetPass (REST)<br>→ VetInterop (SOAP)<br>→ NotificationService |

### B. Composants Transverses

| Composant | Protocole | Rôle |
| :--- | :--- | :--- |
| **API Gateway** | REST (entrée unique) | Routage `/api/v1`, validation centralisée des JWT, rate limiting (RM16) |
| **NotificationService**| Événements / REST | Envoi dédupliqué par clé unique, rappels J-7, retries (RM14) |
| **AdminService** | REST | Tableaux de bord, modération, journal d'audit centralisé (RM15) |

---

## 🔌 3. Interopérabilité et Protocoles

Le projet répond strictement aux critères d'architecture avancée :

1. **REST (OpenAPI v3 / Swagger)** :
   * Préfixe d'API unique : `/api/v1/`
   * Gestion centralisée des erreurs via `@RestControllerAdvice` (HTTP 401, 403, 404, 409, 422).
2. **gRPC (Protocol Buffers)** :
   * **RPC unaire** : Recherche de produits pharmaceutiques, affectation d'une mission de sauvetage.
   * **RPC streaming (Server Streaming)** : Flux en direct des disponibilités des pharmacies, diffusion continue des nouvelles missions d'urgence aux intervenants connectés.
   * Gestion des statuts gRPC (`NOT_FOUND`, `INVALID_ARGUMENT`, `FAILED_PRECONDITION`, `DEADLINE_EXCEEDED`).
3. **SOAP (Contract-First)** :
   * Schéma XSD rédigé avant le code, exposant les opérations : `VerifyAnimalIdentity`, `GetAnimalIdentification`, `CheckMicrochipStatus`.
   * Distinction stricte entre résultat métier (`NOT_FOUND`) et erreur protocolaire (`SOAP Fault`).
4. **Appels Inter-Services Hétérogènes** :
   * `PetPassService` (REST) ➔ `VetInteropService` (SOAP) avec client `WebServiceTemplate` résilient.
   * `HelpAnimalService` (REST) ➔ `RescueCoordinationService` (gRPC) avec timeout et circuit breaker (Resilience4j).

---

## 🗄️ 4. Architecture de Données (PostgreSQL 16)

Conformément au pattern **Database-per-Service**, chaque domaine est cloisonné dans un schéma PostgreSQL dédié hébergé sur une instance commune :

* `users_schema` : Comptes, mots de passe hashés, rôles.
* `petpass_schema` : Profils animaux, dossiers médicaux, vaccins, consentements.
* `booking_schema` : Créneaux d'ouverture, rendez-vous confirmés, file d'attente FIFO.
* `helpanimal_schema` : Signalements géolocalisés, photos, historique d'états.
* `rescue_schema` : Missions de secours, intervenants, verrous de concurrence.
* `pharma_schema` : Catalogues produits, niveaux de stock, réservations avec clé d'idempotence.
* `adopt_schema` : Annonces refuges, candidatures, formalisation des adoptions.
* `notification_schema` : Historique des notifications, déduplication, préférences.
* `admin_schema` : Journaux d'audit de sécurité et statistiques.

---

