# HelpAnimalService (View 4 / E04)

Microservice Spring Boot de MediVet Connect : signalement d'animaux en détresse avec photo et GPS, carte, signalements proches, acceptation de mission en gRPC, suivi et modération.

| US | Ce qui est fait | Où |
|---|---|---|
| US19 | Signalement avec photo contrôlée (JPEG/PNG, 5 Mo, image lisible), état Nouveau, doublon refusé | `ReportService.create`, `PhotoValidator`, `DuplicateDetector` |
| US20 | Position GPS validée, correction manuelle par l'auteur, doublon refusé aussi au déplacement | `PATCH /api/reports/{id}/location` |
| US21 | Carte : signalements actifs, filtres statut / espèce / zone, tri par priorité | `GET /api/reports`, page `index.html` |
| US22 | Signalements proches (bénévole, intervenant), distance + statut | `GET /api/reports/nearby` |
| US23 | Acceptation de mission via gRPC, timeout 3 s, 2 reprises, circuit breaker, verrou optimiste | `AcceptMissionService`, `RescueCoordinationClient` |
| US24 | Machine à états, 409 si transition invalide, historique selon les droits | `ReportStateMachine`, `GET /api/reports/{id}/history` |
| US25 | Masquage motivé par l'admin, avant attribution, journalisé ; photo masquée en 404 sauf pour l'admin | `PATCH /api/admin/reports/{id}/hide`, `AuditService`, `PhotoAccessInterceptor` |

L'interface Angular est un projet séparé, dans le dossier voisin `../helpanimal-frontend` (voir son README). La page servie par ce backend sur http://localhost:8084 reste une simple page de test.

Règles métier : RM01 (`PriorityCalculator`), RM02 (`DuplicateDetector`), RM03 (`ReportStateMachine`), RM04 (`@Version` + stub), RM13 (`RescueCoordinationClient`), RM15 (`AuditService`).

## Prérequis

- JDK 17 ou plus récent
- IntelliJ IDEA (Maven est intégré, rien d'autre à installer)
- Docker, seulement si tu veux PostgreSQL (sinon H2 en mémoire)

## Ouvrir dans IntelliJ

1. IntelliJ : **File > Open** puis choisir le dossier `helpanimal-service` (celui qui contient `pom.xml`). Accepter « Open as Project » / « Trust Project ».
2. Attendre que Maven télécharge les dépendances (barre en bas à droite).
3. Générer les classes gRPC : panneau **Maven** (à droite) > `helpanimal-service` > **Lifecycle** > double-clic sur `compile`.
   Les classes `com.medivet.rescue.grpc.*` apparaissent dans `target/generated-sources/protobuf`. Si IntelliJ les souligne encore en rouge : panneau Maven > bouton **Reload All Maven Projects**.
4. Vérifier le JDK : **File > Project Structure > Project > SDK** = 17 ou plus.

## Lancer

Ouvrir `HelpAnimalApplication.java` et cliquer sur la flèche verte. Le service démarre sur **http://localhost:8084** avec :

- une base H2 en mémoire (console : http://localhost:8084/h2-console, URL `jdbc:h2:mem:helpanimal`, user `sa`)
- le stub gRPC de RescueCoordination sur le port 9090
- Swagger : http://localhost:8084/swagger-ui.html
- la page de test avec carte : http://localhost:8084

### Avec PostgreSQL

```bash
docker compose up -d
```
Puis dans IntelliJ : **Run > Edit Configurations > Active profiles** = `postgres`.

## Tester à la main

La page http://localhost:8084 permet de tout faire : obtenir un jeton, signaler (clic sur la carte pour la position), qualifier, accepter, faire avancer, voir l'historique, masquer.

Scénario de démo SC2 :
1. Jeton `CITOYEN` (id 1) : créer un signalement avec photo.
2. Jeton `BENEVOLE` (id 7) : cliquer sur le marqueur, **Qualifier**.
3. Jeton `INTERVENANT` (id 20) : **Accepter la mission** puis **En cours** puis **Terminer**.
4. Jeton `INTERVENANT` (id 21) : **Accepter** sur la même mission donne 409 « Mission deja attribuee ».
5. Jeton `CITOYEN` (id 1) : **Historique** montre les 5 étapes.

Avec curl :

```bash
TOKEN=$(curl -s "http://localhost:8084/api/dev/token?userId=1&roles=CITOYEN" | jq -r .token)

curl -X POST http://localhost:8084/api/reports \
  -H "Authorization: Bearer $TOKEN" \
  -F species=chien -F category=BLESSE -F "description=Chien blesse" -F severity=4 \
  -F latitude=48.8566 -F longitude=2.3522 -F photo=@chien.jpg
```

## Lancer les tests

Panneau Maven > Lifecycle > `test`, ou clic droit sur `src/test/java` > **Run 'All Tests'**.

- `ReportStateMachineTest` : les 49 paires d'états (RM03)
- `PriorityCalculatorTest` : RM01
- `GeoUtilsTest` : distances
- `RescueCoordinationClientTest` : RM13 (service lent = 3 essais puis 503, service arrêté)
- `ReportApiIntegrationTest` : toutes les US de bout en bout, dont RM02, RM04 (deux acceptations simultanées) et RM15

## Endpoints

| Méthode | Route | US | Rôle |
|---|---|---|---|
| POST | `/api/reports` (multipart) | US19, US20 | connecté |
| PATCH | `/api/reports/{id}/location` | US20 | auteur |
| GET | `/api/reports?status=&species=&bbox=minLat,minLng,maxLat,maxLng` | US21 | connecté |
| GET | `/api/reports/mine` | front | connecté |
| GET | `/api/reports/nearby?lat=&lng=&radiusKm=&status=` | US22 | BENEVOLE, INTERVENANT, ADMIN |
| POST | `/api/reports/{id}/accept` | US23 | INTERVENANT |
| PATCH | `/api/reports/{id}/status` `{"status":"QUALIFIE","comment":"..."}` | US24 | selon la transition |
| GET | `/api/reports/{id}` et `/api/reports/{id}/history` | US24 | selon les droits |
| PATCH | `/api/admin/reports/{id}/hide` `{"reason":"..."}` | US25 | ADMIN |
| GET | `/api/admin/audit-logs` | RM15 | ADMIN |
| GET | `/api/dev/token?userId=1&roles=CITOYEN` | dev | public |

Qui peut changer l'état : `QUALIFIE` / `REJETE` = bénévole, intervenant ou admin ; `EN_COURS` / `TERMINE` = l'intervenant attribué ou admin ; `ATTRIBUE` seulement via `/accept` ; `MASQUE` seulement via `/admin/.../hide`.

## Intégration avec les autres services

- **UserService (E01)** : les jetons doivent être signés en HS256 avec le même secret (`security.jwt.secret`), le `sub` = id utilisateur, le claim `roles` = liste de rôles. En production, mettre `security.dev-tokens.enabled=false`.
- **RescueCoordinationService (E08, S5)** : le contrat est dans `src/main/proto/rescue_coordination.proto`, à partager avec l'Ingénieur qui le code. Quand il est livré : `rescue.stub.enabled=false` et `rescue.grpc.host/port` vers le vrai service.
- **PetPassService (E02)** : à la fin d'un sauvetage, `PetPassClient` appelle `POST /api/care-files`. Désactivé par défaut (`petpass.enabled=false`), le chemin est à aligner avec l'équipe PetPass.

## Structure

```
src/main/java/com/medivet/helpanimal
├── config        propriétés, sécurité JWT, horloge, service des photos
├── domain        entités + règles (états, priorité, doublon, géo)
├── exception     exceptions métier -> codes HTTP
├── grpc          client gRPC résilient + stub RescueCoordination
├── repository    accès base (Spring Data JPA)
├── security      utilisateur courant et rôles
├── service       logique des US
└── web           contrôleurs REST, DTO, gestion des erreurs
src/main/proto    contrat gRPC
src/main/resources/db/migration   schéma SQL (Flyway)
src/main/resources/static         page de test avec carte Leaflet
```
