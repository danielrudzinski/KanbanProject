package pl.myproject.kanbanproject2.dto;
import lombok.Getter;
import lombok.Setter;
import jakarta.validation.constraints.NotBlank;

@Getter
@Setter
public class RegisterUserDto {
    private String email;
    private String password;
    private String username;
    @NotBlank
    private String captchaToken;
}
