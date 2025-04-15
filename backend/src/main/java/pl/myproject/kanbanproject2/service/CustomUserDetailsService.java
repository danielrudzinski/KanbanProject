package pl.myproject.kanbanproject2.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import pl.myproject.kanbanproject2.model.User;
import pl.myproject.kanbanproject2.repository.UserRepository;
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public CustomUserDetailsService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;

    }
    @Override
    public UserDetails loadUserByUsername(String name) throws UsernameNotFoundException {
        return userRepository.findByName(name)
                .orElseThrow(() -> new UsernameNotFoundException(name));
    }

    public void registerUser(User user) {

        userRepository.findByNameOrEmail(user.getName(), user.getEmail())
                .ifPresent(
                        existingUser -> {

                            throw new IllegalStateException("User already exists");
                });
        String password = passwordEncoder.encode(user.getPassword());
        user.setPassword(password);
        userRepository.save(user);
    }
}
