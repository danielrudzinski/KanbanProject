# Stage 1: Build frontend
FROM node:18 AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
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

# Install curl
RUN apt-get update && \
    apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/*
    
# Build and run the application
COPY mvnw ./
COPY .mvn ./.mvn/
RUN chmod +x mvnw
RUN ./mvnw package -DskipTests
EXPOSE 8080
CMD ["java", "-jar", "target/KanbanProject2-0.0.1-SNAPSHOT.jar"]