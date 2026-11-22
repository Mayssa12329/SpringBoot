// Redirige l'API et les photos vers l'application MediVet pendant le developpement (pas de CORS).
// Par defaut : application lancee en local (IntelliJ ou mvn spring-boot:run) sur le port 8081.
// Autre adresse, par exemple le conteneur helpanimal-service : BACKEND_URL=http://localhost:8084
const target = process.env.BACKEND_URL || 'http://localhost:8081';

export default {
  '/api': { target, secure: false },
  '/helpanimal': { target, secure: false },
};
