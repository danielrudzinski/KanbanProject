package pl.myproject.kanbanproject2.service;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import org.springframework.web.util.UriComponents;
import pl.myproject.kanbanproject2.model.User;
import pl.myproject.kanbanproject2.repository.TeamRepository;
import pl.myproject.kanbanproject2.repository.UserRepository;


@Service
public class UserService {
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    public UserService(UserRepository userRepository, TeamRepository teamRepository ) {
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
    }

    public ResponseEntity<Iterable<User>> getAllUsers(){
        Iterable<User> users = userRepository.findAll();
        return ResponseEntity.ok(users);
    }

    public ResponseEntity<User> getUserById(@PathVariable Integer id ){
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    public ResponseEntity<User>addUser(@RequestBody User user  ){
        User savedUser = userRepository.save(user);

        UriComponents uriComponents = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}")
                .buildAndExpand(savedUser.getId());
        return ResponseEntity.created(uriComponents.toUri()).body(savedUser);
    }
    public ResponseEntity<Void>deleteUser(@PathVariable Integer id ){
        if(!userRepository.existsById(id)){
            return ResponseEntity.notFound().build();
        }

        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();

    }
    public ResponseEntity<User> updateUser(@PathVariable Integer id, @RequestBody User user) {
        return userRepository.findById(id)
                .map(existingUser -> {
                    if (user.getEmail() != null) {
                        existingUser.setEmail(user.getEmail());
                    }
                    if (user.getName() != null) {
                        existingUser.setName(user.getName());
                    }

                    return userRepository.save(existingUser);
                })
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    public ResponseEntity<User> patchUser(@PathVariable Integer id, @RequestBody User user) {
        return userRepository.findById(id)
                .map(existingUser -> {
                    if (user.getEmail() != null) {
                        existingUser.setEmail(user.getEmail());
                    }
                    if (user.getName() != null) {
                        existingUser.setName(user.getName());
                    }

                    return userRepository.save(existingUser);
                })
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
    public ResponseEntity<User> assignUserToTeam(@PathVariable Integer userId, @PathVariable Integer teamId) {
        return userRepository.findById(userId)
                .map(user -> {
                    return teamRepository.findById(teamId)
                            .map(team -> {
                                user.setTeam(team);
                                return userRepository.save(user);
                            })
                            .map(ResponseEntity::ok)
                            .orElseGet(() -> ResponseEntity.notFound().build());
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }




}
