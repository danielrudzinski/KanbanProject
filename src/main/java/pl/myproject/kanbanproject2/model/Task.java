package pl.myproject.kanbanproject2.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Entity
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String title;

    @ManyToOne
    @JoinColumn(name = "column_id")
    private Column column;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;


    public Task() {
    }


    public Task(Integer id, Column column, String title, User user) {
        this.id = id;
        this.column = column;
        this.title = title;
        this.user = user;
    }


    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Column getColumn() {
        return column;
    }

    public void setColumn(Column column) {
        this.column = column;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }
}
