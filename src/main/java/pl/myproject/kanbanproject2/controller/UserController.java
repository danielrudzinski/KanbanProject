package pl.myproject.kanbanproject2.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.myproject.kanbanproject2.dto.UserDTO;
import pl.myproject.kanbanproject2.model.User;
import pl.myproject.kanbanproject2.service.UserService;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {
    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }
    @GetMapping()
    public ResponseEntity<List<UserDTO>> getAllUsers(){
        return userService.getAllUsers();
    }
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Integer id){
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
    // Upload awatara
    @PostMapping("/{id}/avatar")
    public ResponseEntity<String> uploadAvatar(@PathVariable Integer id, @RequestParam("file") MultipartFile file) {
        return userService.uploadAvatar(id, file);
    }

    //  Pobieranie awatara
    @GetMapping("/{id}/avatar")
    public ResponseEntity<byte[]> getAvatar(@PathVariable Integer id) {
        return userService.getAvatar(id);
    }

    //  Usuwanie awatara
    @DeleteMapping("/{id}/avatar")
    public ResponseEntity<String> deleteAvatar(@PathVariable Integer id) {
        return userService.deleteAvatar(id);
    }
  

}
