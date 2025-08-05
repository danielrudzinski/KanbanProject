package pl.myproject.kanbanproject2.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

import static org.springframework.http.HttpStatus.*;

@Getter
public enum ExceptionIdentifier {

    USER_NOT_FOUND(NOT_FOUND, "User not found"),
    USER_ALREADY_EXISTS(CONFLICT, "A user with the provided email address already exists"),

    AVATAR_NOT_FOUND(NOT_FOUND, "Avatar not found"),
    INVALID_AVATAR_FILE_TYPE(UNSUPPORTED_MEDIA_TYPE, "Only image files are allowed"),
    AVATAR_FILE_TOO_LARGE(PAYLOAD_TOO_LARGE, "The maximum file size is 1 MB"),
    FILE_UPLOAD_FAILED(INTERNAL_SERVER_ERROR, "A server error occurred while processing the file"),
    FILE_NOT_FOUND(NOT_FOUND, "File not found"),

    INVALID_CREDENTIALS(UNAUTHORIZED, "Invalid email or password"),
    ACCOUNT_NOT_VERIFIED(FORBIDDEN, "The account has not been verified"),
    ACCOUNT_ALREADY_VERIFIED(BAD_REQUEST, "The account has already been verified"),
    VERIFICATION_CODE_EXPIRED(BAD_REQUEST, "The verification code has expired"),
    INVALID_VERIFICATION_CODE(BAD_REQUEST, "Invalid verification code"),
    EMAIL_SEND_FAILED(INTERNAL_SERVER_ERROR, "Failed to send the email message"),

    TASK_NOT_FOUND(NOT_FOUND, "Task not found"),
    SUBTASK_NOT_FOUND(NOT_FOUND, "Subtask not found"),
    PARENT_TASK_NOT_FOUND(NOT_FOUND, "Parent task not found"),
    PARENT_TASK_NOT_SET(NOT_FOUND, "The task does not have a parent task"),
    CYCLIC_TASK_DEPENDENCY(BAD_REQUEST, "The dependency would create a cycle, which is not allowed"),
    PARENT_TASK_NOT_COMPLETED(BAD_REQUEST, "A task cannot be completed before its parent tasks are completed"),
    USER_WIP_LIMIT_EXCEEDED(BAD_REQUEST, "The user's WIP limit has been exceeded"),

    COLUMN_NOT_FOUND(NOT_FOUND, "Column not found"),
    ROW_NOT_FOUND(NOT_FOUND, "Row not found");

    private final HttpStatus status;
    private final String defaultMessage;

    ExceptionIdentifier(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }
}
