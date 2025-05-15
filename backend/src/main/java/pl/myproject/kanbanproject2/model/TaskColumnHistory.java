package pl.myproject.kanbanproject2.model;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
@Entity
@Table(name = "task_column_history")
public class TaskColumnHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @ManyToOne
    @JoinColumn(name = "column_id", nullable = false)
    private Column column;

    private String columnName;

    @jakarta.persistence.Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;

    public TaskColumnHistory(Task task, Column column) {
        this.task = task;
        this.column = column;
        this.columnName = column.getName();
        this.changedAt = LocalDateTime.now();
    }
}
