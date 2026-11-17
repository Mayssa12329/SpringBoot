# ============================================================
# Dockerfile : Microservice Authentification & Utilisateurs
# Emplacement : src/main/java/com/medivet/authentification/Dockerfile
# Build depuis la racine :
#   docker build -f src/main/java/com/medivet/authentification/Dockerfile -t medivet-auth .
# ============================================================

# Étape 1 : Compilation avec Maven et Java 17
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# Étape 2 : Image d'exécution légère (JRE 17)
FROM eclipse-temurin:17-jre
LABEL service="authentification-service"
LABEL description="Microservice d'authentification, gestion des utilisateurs et JWT"

WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

ENV SERVER_PORT=8081 \
    SPRING_PROFILES_ACTIVE=prod \
    JWT_SECRET=MedivetSecretKey2024SuperLongueClePourLaSecuriteJWT! \
    JWT_EXPIRATION=86400000

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]
