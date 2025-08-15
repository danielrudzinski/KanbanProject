package pl.myproject.kanbanproject2.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CaptchaDto {
    @NotBlank
    private String token;
}