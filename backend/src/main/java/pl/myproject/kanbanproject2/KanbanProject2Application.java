package pl.myproject.kanbanproject2;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import io.github.cdimascio.dotenv.Dotenv;

public class KanbanProject2Application {
    public static void main(String[] args) {
        // Załaduj zmienne środowiskowe z pliku .env
        Dotenv dotenv = Dotenv.load();

        // Opcjonalnie, ustaw zmienne środowiskowe, jeśli nie są automatycznie rozpoznawane
        System.setProperty("SPRING_DATASOURCE_URL", dotenv.get("SPRING_DATASOURCE_URL"));
        System.setProperty("SPRING_DATASOURCE_USERNAME", dotenv.get("SPRING_DATASOURCE_USERNAME"));
        System.setProperty("SPRING_DATASOURCE_PASSWORD", dotenv.get("SPRING_DATASOURCE_PASSWORD"));

        // Uruchom aplikację Spring Boot
        SpringApplication.run(KanbanProject2Application.class, args);
    }
}

