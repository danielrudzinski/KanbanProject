package pl.myproject.kanbanproject2.service;

import org.springframework.stereotype.Service;
import pl.myproject.kanbanproject2.model.Token;
import pl.myproject.kanbanproject2.repository.TokenRepository;

import java.util.Optional;

@Service
public class TokenService {

    private final TokenRepository tokenRepository;

    public TokenService(TokenRepository tokenRepository) {
        this.tokenRepository = tokenRepository;

    }
    public Optional<Token> findByToken(String token) {
        return tokenRepository.findByToken(token);
    }

    public Token save(Token token) {
        return tokenRepository.save(token);
    }

}
