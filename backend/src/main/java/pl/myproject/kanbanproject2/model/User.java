package pl.myproject.kanbanproject2.model;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.persistence.Column;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String email;
    private String password;
    private String name;
    @Column(name = "enabled")
    private Boolean enabled = false;
    private Integer wipLimit;
    @ManyToMany(mappedBy = "users")
    @JsonIgnore
    private Set<Task> tasks = new HashSet<>();
    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "avatar_id")
    private File avatar;


    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        SimpleGrantedAuthority simpleGrantedAuthority = new SimpleGrantedAuthority("ROLE_USER");
        return List.of(simpleGrantedAuthority);
    }

    @Override
    public String getUsername() {
        return name;
    }
    @Override
    public boolean isEnabled() {
        return enabled;
    }
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
}