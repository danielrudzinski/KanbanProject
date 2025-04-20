package pl.myproject.kanbanproject2.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/me")
    public ResponseEntity<User> authenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(currentUser);
    }

        @GetMapping("/{id}")
        public ResponseEntity<UserDTO> getUserById (@PathVariable Integer id){
            UserDTO user = userService.getUserById(id);
            return ResponseEntity.ok(user);
        }

        @PostMapping
        public ResponseEntity<User> addUser (@RequestBody User user){
            return ResponseEntity.ok(userService.addUser(user));
        }

        @DeleteMapping("/{id}")
        public ResponseEntity<Void> deleteUser (@PathVariable Integer id){
            userService.deleteUser(id);
            return ResponseEntity.noContent().build();
        }

        @PutMapping("/{id}")
        public ResponseEntity<User> updateUser (@PathVariable Integer id, @RequestBody User user){
            User updatedUser = userService.updateUser(id, user);
            return ResponseEntity.ok(updatedUser);
        }

        @PatchMapping("/{id}")
        public ResponseEntity<UserDTO> patchUser (@PathVariable Integer id, @RequestBody UserDTO userDTO){
            UserDTO patchedUser = userService.patchUser(userDTO, id);
            return ResponseEntity.ok(patchedUser);
        }

        @PostMapping("/{id}/avatar")
        public ResponseEntity<String> uploadAvatar (@PathVariable Integer id, @RequestParam("file") MultipartFile file){
            userService.uploadAvatar(id, file);
            return ResponseEntity.ok("Avatar uploaded successfully!");
        }

        @GetMapping("/{id}/avatar")
        public ResponseEntity<byte[]> getAvatar (@PathVariable Integer id){
            byte[] avatarData = userService.getAvatar(id);
            String contentType = userService.getAvatarContentType(id);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .body(avatarData);
        }

        @DeleteMapping("/{id}/avatar")
        public ResponseEntity<String> deleteAvatar (@PathVariable Integer id){
            userService.deleteAvatar(id);
            return ResponseEntity.ok("Avatar deleted successfully!");
        }

        @PatchMapping("/{id}/wip-limit")
        public ResponseEntity<UserDTO> updateWipLimit (@PathVariable Integer id, @RequestBody Integer wipLimit){
            UserDTO updatedUser = userService.updateWipLimit(id, wipLimit);
            return ResponseEntity.ok(updatedUser);
        }

        @GetMapping("/{id}/wip-status")
        public ResponseEntity<Boolean> checkWipStatus (@PathVariable Integer id){
            boolean isWithinLimit = userService.checkWipStatus(id);
            return ResponseEntity.ok(isWithinLimit);
        }
    
}