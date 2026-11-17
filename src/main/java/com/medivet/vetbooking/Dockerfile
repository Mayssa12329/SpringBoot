# ============================================================
# Dockerfile : Microservice VetBooking (Rendez-vous Vétérinaires)
# Emplacement : src/main/java/com/medivet/vetbooking/Dockerfile
# Build depuis la racine :
#   docker build -f src/main/java/com/medivet/vetbooking/Dockerfile -t medivet-vetbooking .
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
LABEL service="vetbooking-service"
LABEL description="Microservice VetBooking - Praticiens, créneaux, RDV et file d'attente FIFO"

WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

ENV SERVER_PORT=8083 \
    SPRING_PROFILES_ACTIVE=prod

EXPOSE 8083

ENTRYPOINT ["java", "-jar", "app.jar"]
