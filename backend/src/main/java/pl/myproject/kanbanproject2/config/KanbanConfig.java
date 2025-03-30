package pl.myproject.kanbanproject2.config;

import io.github.cdimascio.dotenv.Dotenv;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class KanbanConfig {
    private static final Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();

    @Bean
    public String dataSourceUrl() {
        return dotenv.get("SPRING_DATASOURCE_URL");
    }

    @Bean
    public String dataSourceUsername() {
        return dotenv.get("SPRING_DATASOURCE_USERNAME");
    }

    @Bean
    public String dataSourcePassword() {
        return dotenv.get("SPRING_DATASOURCE_PASSWORD");
    }
}
