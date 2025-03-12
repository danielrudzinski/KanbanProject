package pl.myproject.kanbanproject2.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String email;
    private String password;
    private String name;

    @ManyToMany(mappedBy = "users")
    @JsonBackReference
    private Set<Task> tasks = new HashSet<>();

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "avatar_id")
    private FileEntity avatar;

    public User() {}

    public User(Integer id, String password, String name, String email, Set<Task> tasks) {
        this.id = id;
        this.password = password;
        this.name = name;
        this.email = email;
        this.tasks = tasks;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public FileEntity getAvatar() {
        return avatar;
    }

    public void setAvatar(FileEntity avatar) {
        this.avatar = avatar;
    }

    public Set<Task> getTasks() {
        return tasks;
    }

    public void setTasks(Set<Task> tasks) {
        this.tasks = tasks;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}