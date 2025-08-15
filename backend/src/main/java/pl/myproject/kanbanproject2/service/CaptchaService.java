package pl.myproject.kanbanproject2.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.Map;

@Service
public class CaptchaService {

    @Value("${captcha.enabled:true}")
    private boolean captchaEnabled;

    @Value("${captcha.secret:}")
    private String secret;

    @Value("${captcha.verify-url:https://www.google.com/recaptcha/api/siteverify}")
    private String verifyUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public boolean validateCaptcha(String token) {
        if (!captchaEnabled) {
            return true;
        }
        if (token == null || token.isBlank()) {
            System.out.println("Captcha validation: received null/blank token, captcha enabled: " + captchaEnabled);
            return false;
        }
        try {
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("secret", secret);
            body.add("response", token);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

            @SuppressWarnings("unchecked")
            Map<String, Object> resp = restTemplate.postForObject(verifyUrl, request, Map.class);
            if (resp == null) return false;
            Object successObj = resp.get("success");
            boolean result = Boolean.TRUE.equals(successObj);
            System.out.println("Captcha validation result: " + result);
            return result;
        } catch (Exception e) {
            System.out.println("Captcha validation exception: " + e.getMessage());
            return false;
        }
    }

    public void verifyOrThrow(String token) {
        if (!validateCaptcha(token)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid captcha");
        }
    }

    public void verifyOrThrowWithSkip(String token, boolean skipCaptcha) {
        if (skipCaptcha) {
            System.out.println("Captcha validation skipped (recently verified user)");
            return;
        }
        verifyOrThrow(token);
    }
}
