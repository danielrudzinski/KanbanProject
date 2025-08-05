package pl.myproject.kanbanproject2.file;

public record FileUploadResponse(Long id, String name, String contentType, long size, String downloadUrl) {
}

