package pl.myproject.kanbanproject2.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import pl.myproject.kanbanproject2.dto.UserDTO;
import pl.myproject.kanbanproject2.model.User;
import pl.myproject.kanbanproject2.service.UserService;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;

@ExtendWith(MockitoExtension.class)
public class UserControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private ObjectMapper objectMapper;
    private User testUser;
    private UserDTO testUserDTO;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController).build();
        objectMapper = new ObjectMapper();

        testUser = new User();
        testUser.setId(1);
        testUser.setName("Test User");
        testUser.setEmail("test@example.com");
        testUser.setPassword("password");
        testUser.setWipLimit(5);
        testUser.setTasks(new HashSet<>());

        testUserDTO = new UserDTO(1, "test@example.com", "Test User", new HashSet<>(), 5);
    }

    @AfterEach
    void tearDown() {
        testUser = null;
        testUserDTO = null;
    }

    @Test
    void getAllUsersShouldReturnListOfUsers() throws Exception {
        // given
        List<UserDTO> users = Arrays.asList(testUserDTO);
        Mockito.when(userService.getAllUsers()).thenReturn(users);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/users")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        List<UserDTO> returnedUsers = objectMapper.readValue(content,
                objectMapper.getTypeFactory().constructCollectionType(List.class, UserDTO.class));

        Assertions.assertEquals(1, returnedUsers.size());
        Assertions.assertEquals(testUserDTO.id(), returnedUsers.get(0).id());
        Assertions.assertEquals(testUserDTO.name(), returnedUsers.get(0).name());
        Assertions.assertEquals(testUserDTO.email(), returnedUsers.get(0).email());
        Assertions.assertEquals(testUserDTO.wipLimit(), returnedUsers.get(0).wipLimit());

        Mockito.verify(userService).getAllUsers();
    }

    @Test
    void getUserByIdShouldReturnUser() throws Exception {
        // given
        Mockito.when(userService.getUserById(1)).thenReturn(testUserDTO);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/users/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        UserDTO returnedUser = objectMapper.readValue(content, UserDTO.class);

        Assertions.assertEquals(testUserDTO.id(), returnedUser.id());
        Assertions.assertEquals(testUserDTO.name(), returnedUser.name());
        Assertions.assertEquals(testUserDTO.email(), returnedUser.email());
        Assertions.assertEquals(testUserDTO.wipLimit(), returnedUser.wipLimit());

        Mockito.verify(userService).getUserById(1);
    }

    @Test
    void getUserByIdShouldReturnNotFoundWhenUserDoesNotExist() throws Exception {
        // given
        Mockito.when(userService.getUserById(999)).thenThrow(new EntityNotFoundException("Nie ma użytkownika o takim id"));

        // when & then
        mockMvc.perform(MockMvcRequestBuilders.get("/users/999")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isNotFound());

        Mockito.verify(userService).getUserById(999);
    }

    @Test
    void addUserShouldReturnCreatedUser() throws Exception {
        // given
        Mockito.when(userService.addUser(Mockito.any(User.class))).thenReturn(testUser);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.post("/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testUser)))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        User returnedUser = objectMapper.readValue(content, User.class);

        Assertions.assertEquals(testUser.getId(), returnedUser.getId());
        Assertions.assertEquals(testUser.getName(), returnedUser.getName());
        Assertions.assertEquals(testUser.getEmail(), returnedUser.getEmail());
        Assertions.assertEquals(testUser.getWipLimit(), returnedUser.getWipLimit());

        Mockito.verify(userService).addUser(Mockito.any(User.class));
    }

    @Test
    void updateUserShouldReturnUpdatedUser() throws Exception {
        // given
        User updatedUser = new User();
        updatedUser.setId(1);
        updatedUser.setName("Updated User");
        updatedUser.setEmail("updated@example.com");
        updatedUser.setWipLimit(10);

        Mockito.when(userService.updateUser(Mockito.eq(1), Mockito.any(User.class))).thenReturn(updatedUser);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.put("/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedUser)))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        User returnedUser = objectMapper.readValue(content, User.class);

        Assertions.assertEquals(updatedUser.getId(), returnedUser.getId());
        Assertions.assertEquals(updatedUser.getName(), returnedUser.getName());
        Assertions.assertEquals(updatedUser.getEmail(), returnedUser.getEmail());
        Assertions.assertEquals(updatedUser.getWipLimit(), returnedUser.getWipLimit());

        Mockito.verify(userService).updateUser(Mockito.eq(1), Mockito.any(User.class));
    }

    @Test
    void updateUserShouldReturnNotFoundWhenUserDoesNotExist() throws Exception {
        // given
        Mockito.when(userService.updateUser(Mockito.eq(999), Mockito.any(User.class)))
                .thenThrow(new EntityNotFoundException("Nie ma użytkownika o takim id"));

        // when & then
        mockMvc.perform(MockMvcRequestBuilders.put("/users/999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testUser)))
                .andExpect(MockMvcResultMatchers.status().isNotFound());

        Mockito.verify(userService).updateUser(Mockito.eq(999), Mockito.any(User.class));
    }

    @Test
    void patchUserShouldReturnPatchedUser() throws Exception {
        // given
        UserDTO patchDTO = new UserDTO(1, "patched@example.com", "Patched User", new HashSet<>(), 7);
        Mockito.when(userService.patchUser(Mockito.any(UserDTO.class), Mockito.eq(1))).thenReturn(patchDTO);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.patch("/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patchDTO)))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        UserDTO returnedUser = objectMapper.readValue(content, UserDTO.class);

        Assertions.assertEquals(patchDTO.id(), returnedUser.id());
        Assertions.assertEquals(patchDTO.name(), returnedUser.name());
        Assertions.assertEquals(patchDTO.email(), returnedUser.email());
        Assertions.assertEquals(patchDTO.wipLimit(), returnedUser.wipLimit());

        Mockito.verify(userService).patchUser(Mockito.any(UserDTO.class), Mockito.eq(1));
    }

    @Test
    void patchUserShouldReturnNotFoundWhenUserDoesNotExist() throws Exception {
        // given
        UserDTO patchDTO = new UserDTO(999, "patched@example.com", "Patched User", new HashSet<>(), 7);
        Mockito.when(userService.patchUser(Mockito.any(UserDTO.class), Mockito.eq(999)))
                .thenThrow(new EntityNotFoundException("Nie ma użytkownika o takim id"));

        // when & then
        mockMvc.perform(MockMvcRequestBuilders.patch("/users/999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patchDTO)))
                .andExpect(MockMvcResultMatchers.status().isNotFound());

        Mockito.verify(userService).patchUser(Mockito.any(UserDTO.class), Mockito.eq(999));
    }

    @Test
    void deleteUserShouldReturnNoContent() throws Exception {
        // given
        Mockito.doNothing().when(userService).deleteUser(1);

        // when & then
        mockMvc.perform(MockMvcRequestBuilders.delete("/users/1"))
                .andExpect(MockMvcResultMatchers.status().isNoContent());

        Mockito.verify(userService).deleteUser(1);
    }

    @Test
    void deleteUserShouldReturnNotFoundWhenUserDoesNotExist() throws Exception {
        // given
        Mockito.doThrow(new EntityNotFoundException("Nie ma użytkownika o takim id"))
                .when(userService).deleteUser(999);

        // when & then
        mockMvc.perform(MockMvcRequestBuilders.delete("/users/999"))
                .andExpect(MockMvcResultMatchers.status().isNotFound());

        Mockito.verify(userService).deleteUser(999);
    }

    @Test
    void uploadAvatarShouldReturnSuccess() throws Exception {
        // given
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "avatar.jpg",
                "image/jpeg",
                "test image content".getBytes()
        );

        Mockito.doNothing().when(userService).uploadAvatar(Mockito.eq(1), Mockito.any(MockMultipartFile.class));

        // when & then
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.multipart("/users/1/avatar")
                        .file(file))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        Assertions.assertEquals("Avatar uploaded successfully!", result.getResponse().getContentAsString());
        Mockito.verify(userService).uploadAvatar(Mockito.eq(1), Mockito.any(MockMultipartFile.class));
    }

    @Test
    void uploadAvatarShouldReturnNotFoundWhenUserDoesNotExist() throws Exception {
        // given
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "avatar.jpg",
                "image/jpeg",
                "test image content".getBytes()
        );

        Mockito.doThrow(new EntityNotFoundException("Nie ma użytkownika o takim id"))
                .when(userService).uploadAvatar(Mockito.eq(999), Mockito.any(MockMultipartFile.class));

        // when & then
        mockMvc.perform(MockMvcRequestBuilders.multipart("/users/999/avatar")
                        .file(file))
                .andExpect(MockMvcResultMatchers.status().isNotFound());

        Mockito.verify(userService).uploadAvatar(Mockito.eq(999), Mockito.any(MockMultipartFile.class));
    }

    @Test
    void getAvatarShouldReturnAvatarData() throws Exception {
        // given
        byte[] avatarData = "test image content".getBytes();
        String contentType = "image/jpeg";

        Mockito.when(userService.getAvatar(1)).thenReturn(avatarData);
        Mockito.when(userService.getAvatarContentType(1)).thenReturn(contentType);

        // when & then
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/users/1/avatar"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.header().string("Content-Type", contentType))
                .andReturn();

        Assertions.assertArrayEquals(avatarData, result.getResponse().getContentAsByteArray());
        Mockito.verify(userService).getAvatar(1);
        Mockito.verify(userService).getAvatarContentType(1);
    }

    @Test
    void getAvatarShouldReturnNotFoundWhenUserDoesNotExist() throws Exception {
        // given
        Mockito.when(userService.getAvatar(999)).thenThrow(new EntityNotFoundException("Nie ma użytkownika o takim id"));

        // when & then
        mockMvc.perform(MockMvcRequestBuilders.get("/users/999/avatar"))
                .andExpect(MockMvcResultMatchers.status().isNotFound());

        Mockito.verify(userService).getAvatar(999);
    }

    @Test
    void deleteAvatarShouldReturnSuccess() throws Exception {
        // given
        Mockito.doNothing().when(userService).deleteAvatar(1);

        // when & then
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.delete("/users/1/avatar"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        Assertions.assertEquals("Avatar deleted successfully!", result.getResponse().getContentAsString());
        Mockito.verify(userService).deleteAvatar(1);
    }

    @Test
    void deleteAvatarShouldReturnNotFoundWhenUserDoesNotExist() throws Exception {
        // given
        Mockito.doThrow(new EntityNotFoundException("Nie ma użytkownika o takim id"))
                .when(userService).deleteAvatar(999);

        // when & then
        mockMvc.perform(MockMvcRequestBuilders.delete("/users/999/avatar"))
                .andExpect(MockMvcResultMatchers.status().isNotFound());

        Mockito.verify(userService).deleteAvatar(999);
    }

    @Test
    void updateWipLimitShouldReturnUpdatedUser() throws Exception {
        // given
        UserDTO updatedUserDTO = new UserDTO(1, "test@example.com", "Test User", new HashSet<>(), 10);
        Mockito.when(userService.updateWipLimit(1, 10)).thenReturn(updatedUserDTO);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.patch("/users/1/wip-limit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("10"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        UserDTO returnedUser = objectMapper.readValue(content, UserDTO.class);

        Assertions.assertEquals(updatedUserDTO.id(), returnedUser.id());
        Assertions.assertEquals(updatedUserDTO.name(), returnedUser.name());
        Assertions.assertEquals(updatedUserDTO.email(), returnedUser.email());
        Assertions.assertEquals(updatedUserDTO.wipLimit(), returnedUser.wipLimit());

        Mockito.verify(userService).updateWipLimit(1, 10);
    }

    @Test
    void checkWipStatusShouldReturnStatus() throws Exception {
        // given
        Mockito.when(userService.checkWipStatus(1)).thenReturn(true);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/users/1/wip-status")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        boolean status = objectMapper.readValue(content, Boolean.class);

        Assertions.assertTrue(status);
        Mockito.verify(userService).checkWipStatus(1);
    }
}