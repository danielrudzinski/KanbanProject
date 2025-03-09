package pl.myproject.kanbanproject2.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.myproject.kanbanproject2.model.User;
import pl.myproject.kanbanproject2.service.UserService;

@RestController
@RequestMapping("/users")
public class UserController {
    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }
    @GetMapping()
    public ResponseEntity<Iterable<User>> getAllUsers(){
        return userService.getAllUsers();
    }
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Integer id){
        return userService.getUserById(id);
    }

    @PostMapping()
    public ResponseEntity<User> addUser(@RequestBody User user){
        return userService.addUser(user);
    }
    @DeleteMapping("{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer id){
        return userService.deleteUser(id);
    }
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Integer id, @RequestBody User user){
        return userService.updateUser(id, user);
    }
    @PatchMapping("/{id}")
    public ResponseEntity<User> patchUser(@PathVariable Integer id, @RequestBody User user){
        return userService.patchUser(id, user);
    }
  

}
