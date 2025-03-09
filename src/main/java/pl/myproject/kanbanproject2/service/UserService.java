package pl.myproject.kanbanproject2.service;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import org.springframework.web.util.UriComponents;
import pl.myproject.kanbanproject2.dto.UserDTO;
import pl.myproject.kanbanproject2.mapper.UserMapper;
import pl.myproject.kanbanproject2.model.User;
import pl.myproject.kanbanproject2.repository.UserRepository;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;


@Service
public class UserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    public UserService(UserRepository userRepository, UserMapper userMapper ) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;


    }

    public ResponseEntity<List<UserDTO>> getAllUsers(){
        List<UserDTO> userDTOS = StreamSupport.stream(userRepository.findAll().spliterator(), false)
                .map(userMapper)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userDTOS);
    }

    public ResponseEntity<UserDTO> getUserById (@PathVariable Integer id) {
        return userRepository.findById(id)
                .map(userMapper)
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

}
