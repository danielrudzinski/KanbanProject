package pl.myproject.kanbanproject2.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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
    @jakarta.persistence.Column(name = "deadline")
    private LocalDateTime deadline;
    @jakarta.persistence.Column(name = "expired")
    private boolean expired = false;
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
    @JoinTable(
            name = "user_task",
            joinColumns = @JoinColumn(name = "task_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @JsonIgnoreProperties("tasks")
    private Set<User> users = new HashSet<>();

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SubTask> subTasks = new ArrayList<>();
    @ManyToOne
    @JoinColumn(name = "parent_task_id")
    @JsonIgnoreProperties("childTasks")
    private Task parentTask;

    @OneToMany(mappedBy = "parentTask", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JsonIgnoreProperties("parentTask")
    private Set<Task> childTasks = new HashSet<>();
    public boolean isExpired() {
        return expired;
    }
}
