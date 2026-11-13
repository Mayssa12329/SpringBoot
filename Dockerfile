# Étape 1 : Compilation du projet avec Maven et Java 21
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# Étape 2 : Image d'exécution légère (JRE 21)
FROM eclipse-temurin:21-jre
WORKDIR /app

# Création du dossier pour les uploads de diplômes
RUN mkdir -p /app/uploads/diplomes

COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
