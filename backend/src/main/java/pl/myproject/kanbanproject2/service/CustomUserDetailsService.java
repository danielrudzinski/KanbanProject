package pl.myproject.kanbanproject2.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import pl.myproject.kanbanproject2.model.Token;
import pl.myproject.kanbanproject2.model.User;
import pl.myproject.kanbanproject2.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final EmailService emailService;

    public CustomUserDetailsService(UserRepository userRepository, PasswordEncoder passwordEncoder, TokenService tokenService, EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.emailService = emailService;

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

        Token confirmationToken = new Token(
                UUID.randomUUID().toString(),
                LocalDateTime.now(),
                LocalDateTime.now().plusMinutes(15),
                user
        );
        tokenService.save(confirmationToken);
        emailService.send(user.getEmail(),confirmationToken.getToken());

    }
    public void confirmToken(String token){
        Token confirmedToken = tokenService.findByToken(token)
                .orElseThrow(
                        () -> new IllegalStateException("Token not found")
                );

        if(confirmedToken.getConfirmedAt() != null){
            throw new IllegalStateException("Token already confirmed");
        }

        LocalDateTime expiresAt = confirmedToken.getExpiresAt();
        if(expiresAt.isBefore(LocalDateTime.now())){
            throw new IllegalStateException("Token expired");
        }

        confirmedToken.setConfirmedAt(LocalDateTime.now());
        tokenService.save(confirmedToken);

        // Update user's enabled status
        enableUser (confirmedToken.getUser());

    }

    private void enableUser(User user) {
        user.setEnabled(true);
        userRepository.save(user);
    }
}
