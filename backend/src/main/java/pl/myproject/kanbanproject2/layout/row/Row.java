package pl.myproject.kanbanproject2.layout.row;

import jakarta.persistence.*;
import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pl.myproject.kanbanproject2.task.Task;

import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
@Entity
@Table(name = "rows")
public class Row {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;
    @Column(name = "name")
    private String name;
    private Integer position;
    @Column(name = "wip_limit")
    private Integer wipLimit;
    @OneToMany(mappedBy = "row", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    List<Task> tasks;

}
