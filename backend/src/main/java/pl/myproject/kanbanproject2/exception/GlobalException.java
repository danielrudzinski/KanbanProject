package pl.myproject.kanbanproject2.exception;

import lombok.Getter;

@Getter
public class GlobalException extends RuntimeException {

    private final ExceptionIdentifier identifier;

    public GlobalException(ExceptionIdentifier identifier) {
        super(identifier.getDefaultMessage());
        this.identifier = identifier;
    }

    public GlobalException(ExceptionIdentifier identifier, String message) {
        super(message);
        this.identifier = identifier;
    }

    public GlobalException(ExceptionIdentifier identifier, String message, Throwable cause) {
        super(message, cause);
        this.identifier = identifier;
    }

    public GlobalException(ExceptionIdentifier identifier, Throwable cause) {
        super(identifier.getDefaultMessage(), cause);
        this.identifier = identifier;
    }
}
