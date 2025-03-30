
package pl.myproject.kanbanproject2;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import io.github.cdimascio.dotenv.Dotenv;

@SpringBootApplication
public class KanbanProject2Application {

    public static void main(String[] args) {
        String url = System.getenv("SPRING_DATASOURCE_URL");
        String username = System.getenv("SPRING_DATASOURCE_USERNAME");
        String password = System.getenv("SPRING_DATASOURCE_PASSWORD");

        if (url == null || username == null || password == null) {
            System.out.println("Environment variables not found. Loading from .env...");
            Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();

            url = dotenv.get("SPRING_DATASOURCE_URL");
            username = dotenv.get("SPRING_DATASOURCE_USERNAME");
            password = dotenv.get("SPRING_DATASOURCE_PASSWORD");
        }

        System.out.println("SPRING_DATASOURCE_URL: " + url);
        System.out.println("SPRING_DATASOURCE_USERNAME: " + username);
        System.out.println("SPRING_DATASOURCE_PASSWORD: " + password);

        SpringApplication.run(KanbanProject2Application.class, args);
    }
}