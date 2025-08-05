package pl.myproject.kanbanproject2.exception;

public record ErrorResponse(String code, String message) {

    public static ErrorResponse from(GlobalException ex) {
        return new ErrorResponse(ex.getIdentifier().name(), ex.getMessage());
    }

    public static ErrorResponse of(String code, String message) {
        return new ErrorResponse(code, message);
    }
}
