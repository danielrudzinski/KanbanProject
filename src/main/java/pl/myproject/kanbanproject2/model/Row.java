package pl.myproject.kanbanproject2.model;

import jakarta.persistence.*;
import jakarta.persistence.Column;
import lombok.*;

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
    @Column(name = "wip_limit")
    private Integer wipLimit;
    @OneToMany(mappedBy = "row", cascade = CascadeType.MERGE)
    List<Task> tasks;

}
