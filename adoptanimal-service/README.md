# AdoptAnimalService

Service REST de MediVet Connect : annonces d'adoption, candidatures, rencontres et adoption finalisée (RM12).
Java 21, Spring Boot 3.4, PostgreSQL + Flyway, Resilience4j.

## Appels sortants
| Vers | Protocole | Usage | Résilience |
|---|---|---|---|
| PetPass | REST (`RestClient`) | éligibilité médicale de l'animal | timeout 3 s, 2 reprises, circuit breaker, repli |
| VetInterop | SOAP (`WebServiceTemplate`) | vérification d'identité (`VerifyAnimalIdentity`) | idem ; Fault client sans reprise |
| NotificationService | REST (événement) | décisions d'adoption | non bloquant, désactivé par défaut |

Si PetPass ou VetInterop est en panne, l'annonce est créée en `VERIFICATION_EN_ATTENTE` (RM13), puis revérifiée via
`POST /api/v1/annonces/{id}/verifications`.

## Lancement local
```bash
# 1. base PostgreSQL (port 5436) - ou via docker-compose.override.yml
docker run -d --name adopt-db -p 5436:5432 -e POSTGRES_USER=medivet \
  -e POSTGRES_PASSWORD=changeme -e POSTGRES_DB=adoptanimal postgres:16-alpine

# 2. service avec PetPass et VetInterop simulés (profil stub)
SPRING_PROFILES_ACTIVE=stub mvn spring-boot:run
```
PowerShell : `$env:SPRING_PROFILES_ACTIVE="stub"; mvn spring-boot:run`

Profil `stub` : puce commençant par `999` = inconnue (422), `888` = registre en panne (annonce en attente) ;
animal `999` = non éligible (422), `888` = PetPass en panne.
Sans le profil `stub`, les vrais services sont appelés (`PETPASS_URL`, `VETINTEROP_URL`).

## Tests
```bash
mvn test      # unitaires et contrôleur (sans Docker)
mvn verify    # + test d'intégration de concurrence (Testcontainers, Docker requis)
```

## API (`/api/v1`) - OpenAPI : `/v3/api-docs`, interface : `/swagger-ui.html`
| Méthode et URI | Rôle | Codes |
|---|---|---|
| `POST /annonces` | publier (US27) | 201, 400, 422 |
| `GET /annonces?espece=&localisation=&ageMax=` | rechercher les annonces actives (US28) | 200 |
| `GET /annonces/{id}` | consulter | 200, 404 |
| `POST /annonces/{id}/verifications` | relancer la vérification | 200, 409, 422 |
| `POST /annonces/{id}/candidatures` | candidater (US29) | 201, 409 |
| `GET /annonces/{id}/candidatures` | lister | 200, 404 |
| `PUT /candidatures/{id}/statut` | examiner / accepter / refuser (US30) | 200, 409 |
| `POST /candidatures/{id}/rencontres` | planifier (US31) | 201, 409 |
| `PUT /rencontres/{id}/statut` | marquer effectuée / annulée | 200, 409 |
| `POST /annonces/{id}/adoption` | finaliser (US32) | 201, 409, 422 |

L'identité de l'acteur vient de l'en-tête optionnel `X-User-Id` (à injecter depuis le JWT à la gateway).

## Scénario de démo (curl)
```bash
H='Content-Type: application/json'; U=http://localhost:8085/api/v1   # 8085 via Compose, 8080 en local

# 1. publier
curl -s -X POST $U/annonces -H "$H" -d '{"animalId":1,"puce":"250268500123456","nom":"Rex","espece":"CHIEN","ageEstime":3,"localisation":"Tunis","refugeId":10}'
# 2. deux candidatures
curl -s -X POST $U/annonces/1/candidatures -H "$H" -d '{"candidatId":100}'
curl -s -X POST $U/annonces/1/candidatures -H "$H" -d '{"candidatId":101}'
# 3. examiner puis accepter la candidature 1
curl -s -X PUT $U/candidatures/1/statut -H "$H" -d '{"statut":"EN_EXAMEN"}'
curl -s -X PUT $U/candidatures/1/statut -H "$H" -d '{"statut":"ACCEPTEE"}'
# 4. rencontre planifiée puis effectuée
curl -s -X POST $U/candidatures/1/rencontres -H "$H" -d '{"dateRencontre":"2030-01-15T10:00:00"}'
curl -s -X PUT $U/rencontres/1/statut -H "$H" -d '{"statut":"EFFECTUEE"}'
# 5. finaliser (la candidature 2 est refusée automatiquement) ; un second appel donne 409
curl -s -X POST $U/annonces/1/adoption -H "$H" -d '{"candidatureId":1}'
```

## Contrat SOAP
`src/main/resources/xsd/vetinterop.xsd` est un contrat PROVISOIRE. Remplacez-le par le XSD officiel de VetInterop :
les classes JAXB sont régénérées au build (`target/generated-sources`, non commité).

## Contrat attendu de PetPass (provisoire, à valider avec son responsable)
`GET /api/v1/animals/{id}/eligibilite` -> `{"statut":"ELIGIBLE"|"NOT_ELIGIBLE","motifs":["..."]}` (404 si animal inconnu).
