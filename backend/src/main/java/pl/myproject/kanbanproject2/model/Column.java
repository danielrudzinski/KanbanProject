package pl.myproject.kanbanproject2.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
@Entity
@Table(name = "columns")
public class Column {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String name;
    private Integer position;
    @jakarta.persistence.Column(name = "wip_limit")
    private Integer wipLimit;
    @OneToMany(mappedBy = "column",cascade = CascadeType.ALL)
    List<Task> tasks;
}
