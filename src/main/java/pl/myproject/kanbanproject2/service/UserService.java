package pl.myproject.kanbanproject2.service;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import org.springframework.web.util.UriComponents;
import pl.myproject.kanbanproject2.dto.UserDTO;
import pl.myproject.kanbanproject2.mapper.UserMapper;
import pl.myproject.kanbanproject2.model.FileEntity;
import pl.myproject.kanbanproject2.model.User;
import pl.myproject.kanbanproject2.repository.FileRepository;
import pl.myproject.kanbanproject2.repository.UserRepository;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Transactional
@Service
public class UserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final FileRepository fileRepository;
    @Autowired
    public UserService(UserRepository userRepository, UserMapper userMapper,FileRepository fileRepository ) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.fileRepository = fileRepository;


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
    public ResponseEntity<String> uploadAvatar(Integer id, MultipartFile file) {
        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = optionalUser.get();
        try {
            FileEntity avatar = new FileEntity();
            avatar.setName(file.getOriginalFilename());  // Ustawiamy nazwę pliku
            avatar.setType(file.getContentType());      // Ustawiamy typ pliku (np. image/png)
            avatar.setData(file.getBytes());            // Ustawiamy dane pliku jako byte[]

            fileRepository.save(avatar);  // Zapisujemy plik w bazie danych
            user.setAvatar(avatar);       // Ustawiamy awatar dla użytkownika
            userRepository.save(user);    // Zapisujemy użytkownika z awatarem

            return ResponseEntity.ok("Avatar uploaded successfully!");
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error uploading avatar");
        }
    }

    //  Pobieranie awatara
    public ResponseEntity<byte[]> getAvatar(Integer userId) {
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        User user = userOptional.get();
        FileEntity avatar = user.getAvatar();
        if (avatar == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        // Zwrócenie pliku w odpowiedzi jako dane binarne
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, avatar.getType())
                .body(avatar.getData());
    }
    //  Usuwanie awatara
    public ResponseEntity<String> deleteAvatar(Integer id) {
        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isEmpty() || optionalUser.get().getAvatar() == null) {
            return ResponseEntity.notFound().build();
        }

        User user = optionalUser.get();
        FileEntity avatar = user.getAvatar();

        user.setAvatar(null);   // Usuwamy awatar z użytkownika
        userRepository.save(user);  // Zapisujemy użytkownika
        fileRepository.delete(avatar);  // Usuwamy plik z bazy danych

        return ResponseEntity.ok("Avatar deleted successfully!");
    }

}
