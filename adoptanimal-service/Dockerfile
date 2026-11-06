# ============ Étape 1 : build ============
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src/main/resources/xsd ./src/main/resources/xsd
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B package -DskipTests

# ============ Étape 2 : exécution ============
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/target/*.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
