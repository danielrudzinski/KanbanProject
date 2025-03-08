package pl.myproject.kanbanproject2.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "teams")
public class Team {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String name;
    private Integer wipLimit;
    @OneToMany(mappedBy = "team")
    List<User>members;

    public Team() {
    }

    public Team(Integer id, List<User> members, String name, Integer wipLimit) {
        this.id = id;
        this.members = members;
        this.name = name;
        this.wipLimit = wipLimit;
    }

    public List<User> getMembers() {
        return members;
    }

    public void setMembers(List<User> members) {
        this.members = members;
    }

    public Integer getWipLimit() {
        return wipLimit;
    }

    public void setWipLimit(Integer wipLimit) {
        this.wipLimit = wipLimit;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }
}
