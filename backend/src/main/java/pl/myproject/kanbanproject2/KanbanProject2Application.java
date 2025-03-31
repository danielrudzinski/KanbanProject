package pl.myproject.kanbanproject2;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import io.github.cdimascio.dotenv.Dotenv;
@SpringBootApplication
public class KanbanProject2Application {

    public static void main(String[] args) {
        Dotenv dotenv = Dotenv.load();
        System.out.println("SPRING_DATASOURCE_URL: " + dotenv.get("SPRING_DATASOURCE_URL"));
        System.out.println("SPRING_DATASOURCE_USERNAME: " + dotenv.get("SPRING_DATASOURCE_USERNAME"));
        System.out.println("SPRING_DATASOURCE_PASSWORD: " + dotenv.get("SPRING_DATASOURCE_PASSWORD"));

        SpringApplication.run(KanbanProject2Application.class, args);
    }
}