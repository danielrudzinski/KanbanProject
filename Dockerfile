# Stage 1: Build frontend
FROM node:20-slim AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build and run the application
FROM openjdk:23-jdk-slim
WORKDIR /app

# Copy the frontend build output
COPY --from=frontend-build /frontend/dist/ /app/src/main/resources/static/

# Copy the backend source code and build files
COPY pom.xml ./
COPY src ./src/
    
# Build and run the application
COPY mvnw ./
COPY .mvn ./.mvn/
RUN chmod +x mvnw
RUN ./mvnw package -DskipTests
EXPOSE 8080
CMD ["java", "-jar", "target/KanbanProject2-0.0.1-SNAPSHOT.jar"]