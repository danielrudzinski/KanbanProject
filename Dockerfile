# Stage 1: Build frontend
FROM node:24.6.0-alpine3.22 AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps
COPY frontend/ ./
ARG VITE_RECAPTCHA_SITE_KEY
RUN VITE_RECAPTCHA_SITE_KEY="$VITE_RECAPTCHA_SITE_KEY"
RUN npm run build

# Stage 2: Build and run the application
FROM eclipse-temurin:23-jdk
WORKDIR /app

# Copy the frontend build output
COPY --from=frontend-build /frontend/dist/ /app/src/main/resources/static/

# Copy the backend source code and build files
COPY backend/pom.xml ./
COPY backend/src ./src/
    
# Build and run the application
COPY backend/mvnw ./
COPY backend/.mvn ./.mvn/
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw
RUN ./mvnw package -Dmaven.test.skip=true
EXPOSE 8080
CMD ["java", "-jar", "target/KanbanProject2-0.0.1-SNAPSHOT.jar"]