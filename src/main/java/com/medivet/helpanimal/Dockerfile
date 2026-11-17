# ============================================================
# Dockerfile : Microservice HelpAnimal (Signalements d'animaux en detresse)
# Emplacement : src/main/java/com/medivet/helpanimal/Dockerfile
# Build depuis la racine :
#   docker build -f src/main/java/com/medivet/helpanimal/Dockerfile -t medivet-helpanimal .
# ============================================================

# Etape 1 : Compilation avec Maven et Java 17 (les classes gRPC sont generees depuis src/main/proto)
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# Etape 2 : Image d'execution legere (JRE 17)
FROM eclipse-temurin:17-jre
LABEL service="helpanimal-service"
LABEL description="Microservice HelpAnimal - Signalement, carte, mission de sauvetage (gRPC) et suivi"

WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

ENV SERVER_PORT=8084 \
    SPRING_PROFILES_ACTIVE=prod \
    HELPANIMAL_PHOTOS_DIR=/app/helpanimal-photos

EXPOSE 8084

ENTRYPOINT ["java", "-jar", "app.jar"]
