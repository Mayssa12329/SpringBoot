# HelpAnimal Frontend (Angular)

Interface de HelpAnimalService (MediVet Connect, epic E04) : signalement avec photo et GPS, carte, signalements proches, acceptation de mission, suivi et modération.

Le backend est l'application MediVet Connect de l'équipe (dépôt `SpringBoot`), dans laquelle HelpAnimal est intégré sous `com.medivet.helpanimal`. Le front communique avec elle uniquement par l'API REST.

## Lancer

L'application MediVet doit tourner (port 8081 en local).

```bash
npm install
npm start
```

Puis ouvrir http://localhost:4200. Le proxy (`proxy.conf.mjs`) envoie `/api` et `/helpanimal` (photos) au backend, donc aucune configuration CORS n'est nécessaire en développement.

Backend à une autre adresse, par exemple le conteneur `helpanimal-service` de docker-compose (PowerShell) :

```powershell
$env:BACKEND_URL = 'http://localhost:8084'; npm start
```

## Se connecter

Le menu en haut à droite se connecte avec un compte de UserService (`POST /api/auth/connexion`).

| Rôle UserService | Dans HelpAnimal |
|---|---|
| `UTILISATEUR` | Citoyen : signale, suit ses signalements |
| `VETERINAIRE` | Bénévole et intervenant : qualifie, voit les signalements proches, accepte et mène la mission |
| `ADMINISTRATEUR` | Modère (masquage) et consulte le journal d'audit |

Compte administrateur créé au démarrage : `admin@medivet.com` / `Admin1234!`. Les autres comptes se créent avec `POST /api/auth/inscription`, puis l'administrateur attribue le rôle `VETERINAIRE` avec `PUT /api/utilisateurs/{id}/role`.

## Structure

```
src/app
├── core         modèles, appels API, authentification, géolocalisation
├── shared       icônes, ligne de signalement
├── help-animal  page, formulaire, carte, listes, panneau de détail
└── app.*        menu latéral et barre du haut
```

## Tests et build

```bash
npm test
npm run build
```
