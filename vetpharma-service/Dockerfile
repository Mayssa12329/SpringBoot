# ============================================================
# Dockerfile : Microservice VetPharma (vetpharma-service)
# ============================================================

# ── Étape 1 : build Maven ────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copie le POM et télécharge les dépendances en cache
COPY pom.xml .
RUN mvn -B dependency:go-offline

# Copie les sources et compile (les stubs gRPC sont générés ici)
COPY src ./src
RUN mvn -B clean package -DskipTests

# ── Étape 2 : image d'exécution légère ───────────────────────
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Port gRPC exposé
EXPOSE 9091

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
