package pl.myproject.kanbanproject2.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import pl.myproject.kanbanproject2.exception.ExceptionIdentifier;
import pl.myproject.kanbanproject2.exception.GlobalException;
import pl.myproject.kanbanproject2.file.File;
import pl.myproject.kanbanproject2.file.FileRepository;
import pl.myproject.kanbanproject2.user.User;
import pl.myproject.kanbanproject2.user.UserRepository;

import java.io.IOException;

@RequiredArgsConstructor
@Transactional
@Service
public class AvatarService {

    private static final long MAX_AVATAR_SIZE = 1024 * 1024;

    private final FileRepository fileRepository;
    private final UserRepository userRepository;

    public void uploadAvatar(Integer userId, MultipartFile file) {
        if (file.isEmpty() || file.getContentType() == null || !file.getContentType().startsWith("image/")) {
            throw new GlobalException(ExceptionIdentifier.INVALID_AVATAR_FILE_TYPE);
        }
        if (file.getSize() > MAX_AVATAR_SIZE) {
            throw new GlobalException(ExceptionIdentifier.AVATAR_FILE_TOO_LARGE);
        }

        var user = findUser(userId);

        if (user.getAvatar() != null) {
            fileRepository.delete(user.getAvatar());
        }

        try {
            var newAvatar = new File(file.getOriginalFilename(), file.getContentType(), file.getBytes());
            fileRepository.save(newAvatar);
            user.setAvatar(newAvatar);
            userRepository.save(user);
        } catch (IOException e) {
            throw new GlobalException(ExceptionIdentifier.FILE_UPLOAD_FAILED, e);
        }
    }

    public byte[] getAvatar(Integer userId) {
        var user = findUser(userId);
        if (user.getAvatar() == null || user.getAvatar().getData() == null) {
            throw new GlobalException(ExceptionIdentifier.AVATAR_NOT_FOUND);
        }
        return user.getAvatar().getData();
    }

    public String getAvatarContentType(Integer userId) {
        var user = findUser(userId);
        if (user.getAvatar() == null) {
            throw new GlobalException(ExceptionIdentifier.AVATAR_NOT_FOUND);
        }
        return user.getAvatar().getType();
    }

    public void deleteAvatar(Integer userId) {
        var user = findUser(userId);
        if (user.getAvatar() == null) {
            throw new GlobalException(ExceptionIdentifier.AVATAR_NOT_FOUND);
        }

        var avatarToDelete = user.getAvatar();
        user.setAvatar(null);
        userRepository.save(user);
        fileRepository.delete(avatarToDelete);
    }

    private User findUser(Integer userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new GlobalException(ExceptionIdentifier.USER_NOT_FOUND,
                        "User not found with id: " + userId));
    }
}
