package pl.myproject.kanbanproject2.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
@Entity
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String title;
    private Integer position;
    private boolean completed;
    private String description;
    @ElementCollection
    @CollectionTable(name = "task_labels", joinColumns = @JoinColumn(name = "task_id"))
    @jakarta.persistence.Column(name = "label")
    private Set<String> labels;
    @ManyToOne
    @JoinColumn(name = "column_id")
    private Column column;
    @ManyToOne
    @JoinColumn(name = "row_id", nullable = true)
    private Row row;
    @ManyToMany
    @JsonIgnoreProperties("tasks")
    private Set<User> users = new HashSet<>();
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SubTask> subTasks = new ArrayList<>();
}