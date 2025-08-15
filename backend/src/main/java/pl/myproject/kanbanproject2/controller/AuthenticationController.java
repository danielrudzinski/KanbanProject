package pl.myproject.kanbanproject2.controller;
import pl.myproject.kanbanproject2.dto.LoginUserDto;
import pl.myproject.kanbanproject2.dto.RegisterUserDto;
import pl.myproject.kanbanproject2.dto.VerifyUserDto;
import pl.myproject.kanbanproject2.model.User;
import pl.myproject.kanbanproject2.response.LoginResponse;
import pl.myproject.kanbanproject2.service.AuthenticationService;
import pl.myproject.kanbanproject2.service.JwtService;
import pl.myproject.kanbanproject2.service.CaptchaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RequestMapping("/auth")
@RestController
public class AuthenticationController {
    private final JwtService jwtService;

    private final AuthenticationService authenticationService;
    private final CaptchaService captchaService;

    public AuthenticationController(JwtService jwtService, AuthenticationService authenticationService, CaptchaService captchaService) {
        this.jwtService = jwtService;
        this.authenticationService = authenticationService;
        this.captchaService = captchaService;
    }

    @PostMapping("/signup")
    public ResponseEntity<User> register(@RequestBody RegisterUserDto registerUserDto) {
        captchaService.verifyOrThrow(registerUserDto.getCaptchaToken());
        User registeredUser = authenticationService.signup(registerUserDto);
        return ResponseEntity.ok(registeredUser);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginUserDto loginDto) {
        captchaService.verifyOrThrow(loginDto.getCaptchaToken());
        return ResponseEntity.ok(authenticationService.login(loginDto));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyUser(@RequestBody VerifyUserDto verifyUserDto) {
        try {
            LoginResponse loginResponse = authenticationService.verifyUser(verifyUserDto);
            return ResponseEntity.ok(loginResponse);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/resend")
    public ResponseEntity<?> resendVerificationCode(@RequestParam String email) {
        try {
            authenticationService.resendVerificationCode(email);
            return ResponseEntity.ok("Verification code sent");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}