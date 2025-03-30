package pl.myproject.kanbanproject2.repository;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.EmbeddedDatabaseConnection;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import pl.myproject.kanbanproject2.model.Column;
import java.util.ArrayList;
@DataJpaTest
@AutoConfigureTestDatabase(connection = EmbeddedDatabaseConnection.H2) // używa H2 zamiast PostgreSQL
class ColumnRepositoryTest {

    @Autowired
    private ColumnRepository columnRepository;

    @Test
    void columnRepositorySaveAllReturnSavedColumns() {
        Column column = new Column();
        column.setName("name");
        column.setPosition(1);
        column.setTasks(new ArrayList<>());
        column.setWipLimit(2);

        Column savedColumn = columnRepository.save(column);

        Assertions.assertThat(savedColumn).isNotNull();
        Assertions.assertThat(savedColumn.getId()).isNotNull(); // ID generowane przez bazę
    }
}

