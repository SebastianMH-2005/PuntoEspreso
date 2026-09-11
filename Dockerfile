# Etapa 1: compilar el proyecto con Gradle
FROM eclipse-temurin:25-jdk AS build
WORKDIR /app
COPY . .
RUN chmod +x gradlew && ./gradlew clean build -x test

# Etapa 2: imagen final, liviana, solo con el JRE y el .jar ya compilado
FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=build /app/build/libs/puntoEspresso-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
