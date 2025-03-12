package pl.myproject.kanbanproject2.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String title;

    @ManyToOne
    @JoinColumn(name = "column_id")
    private Column column;

    @ManyToMany
    @JoinTable(
            name = "user_task",
            joinColumns = @JoinColumn(name = "task_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @JsonManagedReference
    private Set<User> users = new HashSet<>();

    public Task() {}

    public Task(Integer id, String title, Column column, Set<User> users) {
        this.id = id;
        this.title = title;
        this.column = column;
        this.users = users;
    }

    // Gettery i settery
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Column getColumn() {
        return column;
    }

    public void setColumn(Column column) {
        this.column = column;
    }

    public Set<User> getUsers() {
        return users;
    }

    public void setUsers(Set<User> users) {
        this.users = users;
    }
}