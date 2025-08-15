package pl.myproject.kanbanproject2.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

@Service
public class CaptchaService {

    private static final Logger log = LoggerFactory.getLogger(CaptchaService.class);

    private final boolean captchaEnabled;
    private final String secret;
    private final String verifyUrl;
    private final RestTemplate restTemplate;

    public CaptchaService(
            @Value("${captcha.enabled:true}") boolean captchaEnabled,
            @Value("${captcha.secret:}") String secret,
            @Value("${captcha.verify-url:https://www.google.com/recaptcha/api/siteverify}") String verifyUrl,
            RestTemplateBuilder restTemplateBuilder) {
        this.captchaEnabled = captchaEnabled;
        this.secret = secret;
        this.verifyUrl = verifyUrl;
        this.restTemplate = restTemplateBuilder.build();
    }

    public boolean validateCaptcha(String token) {
        if (!captchaEnabled) {
            return true;
        }
        if (token == null || token.isBlank()) {
            log.debug("Captcha validation: received null/blank token, captcha enabled: {}", captchaEnabled);
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
            if (resp == null) {
                log.warn("Captcha verify endpoint returned null response");
                return false;
            }
            Object successObj = resp.get("success");
            boolean result = Boolean.TRUE.equals(successObj);
            log.debug("Captcha validation result: {}", result);
            return result;
        } catch (RestClientException e) {
            log.warn("Captcha validation exception (http client): {}", e.getMessage(), e);
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
            log.debug("Captcha validation skipped (recently verified user)");
            return;
        }
        verifyOrThrow(token);
        }
}
