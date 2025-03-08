package pl.myproject.kanbanproject2.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Entity
@Table(name = "columns")
public class Column {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String name;
    @jakarta.persistence.Column(name = "wip_limit")
    private Integer wipLimit;
    @OneToMany(mappedBy = "column",cascade = CascadeType.ALL)

    List<Task> tasks;

    public Column() {
    }

    public Column(Integer id, List<Task> tasks, String name, Integer wipLimit) {
        this.id = id;
        this.tasks = tasks;
        this.name = name;
        this.wipLimit = wipLimit;
    }

    public List<Task> getTasks() {
        return tasks;
    }

    public void setTasks(List<Task> tasks) {
        this.tasks = tasks;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getWipLimit() {
        return wipLimit;
    }

    public void setWipLimit(Integer wipLimit) {
        this.wipLimit = wipLimit;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }
}
