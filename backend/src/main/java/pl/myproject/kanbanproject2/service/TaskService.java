package pl.myproject.kanbanproject2.service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import pl.myproject.kanbanproject2.dto.TaskDTO;
import pl.myproject.kanbanproject2.mapper.TaskMapper;
import pl.myproject.kanbanproject2.model.Task;
import pl.myproject.kanbanproject2.model.User;
import pl.myproject.kanbanproject2.repository.TaskRepository;
import pl.myproject.kanbanproject2.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Transactional
@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final TaskMapper taskMapper;
    private final UserService userService;

    @Autowired
    public TaskService(TaskRepository taskRepository, UserRepository userRepository, TaskMapper taskMapper, UserService userService) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.taskMapper = taskMapper;
        this.userService = userService;
    }

    public Task addTask(Task task) {

        if (task.getPosition() == null) {
            long count = taskRepository.count();
            task.setPosition((int) count + 1);
        }


        if (task.getLabels() == null) {
            task.setLabels(new HashSet<>());
        }

        return taskRepository.save(task);
    }

    public List<TaskDTO> getAllTasks() {
        List<TaskDTO> taskDTOS = taskRepository.findAll().stream()
                .map(taskMapper::apply)
                .sorted(Comparator.comparing(TaskDTO::position))
                .collect(Collectors.toList());
        return taskDTOS;
    }

    public void deleteTask(Integer id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Nie ma zadania o takim id"));


        if (task.getChildTasks() != null && !task.getChildTasks().isEmpty()) {
            for (Task child : task.getChildTasks()) {
                child.setParentTask(null);
                taskRepository.save(child);
            }
            task.getChildTasks().clear();
        }
        
        taskRepository.delete(task);
    }


    public TaskDTO getTaskById(Integer id) {
        try {
            return taskRepository.findById(id)
                    .map(taskMapper::apply)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma zadania o takim id"));
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    public TaskDTO patchTask(Integer id, Task task) {
        try {
            Task existingTask = taskRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma zadania o takim id"));

            if (task.getTitle() != null) {
                existingTask.setTitle(task.getTitle());
            }
            if (task.getColumn() != null) {
                existingTask.setColumn(task.getColumn());
            }
            if (task.getUsers() != null) {
                existingTask.setUsers(task.getUsers());
            }
            if (task.getPosition() != null) {
                existingTask.setPosition(task.getPosition());
            }
            if (task.getRow() != null) {
                existingTask.setRow(task.getRow());
            }
            if (task.getLabels() != null) {
                existingTask.setLabels(task.getLabels());
            }
            if (task.getDescription() != null) {
                existingTask.setDescription(task.getDescription());
            }
            if (task.getPosition() != null) {
                existingTask.setPosition(task.getPosition());
            }

            Task savedTask = taskRepository.save(existingTask);
            return taskMapper.apply(savedTask);
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    public TaskDTO assignUserToTask(Integer taskId, Integer userId) {
        try {
            boolean isWithinLimit = userService.checkWipStatus(userId);

            if (!isWithinLimit) {
                throw new RuntimeException("Nie można przypisać użytkownika.");
            }

            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma zadania o takim id"));

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma użytkownika o takim id"));

            task.getUsers().add(user);
            user.getTasks().add(task);

            userRepository.save(user);
            Task updatedTask = taskRepository.save(task);

            return taskMapper.apply(updatedTask);
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }
    }

    public TaskDTO removeUserFromTask(Integer taskId, Integer userId) {
        try {
            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma zadania o takim id"));

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma użytkownika o takim id"));

            task.getUsers().remove(user);
            user.getTasks().remove(task);

            userRepository.save(user);
            Task updatedTask = taskRepository.save(task);

            return taskMapper.apply(updatedTask);
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    public TaskDTO updateTaskPosition(Integer id, Integer position) {
        try {
            Task task = taskRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma zadania o takim id"));
            task.setPosition(position);
            Task updatedTask = taskRepository.save(task);
            return taskMapper.apply(updatedTask);
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    public TaskDTO addLabelToTask(Integer taskId, String label) {
        try {
            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma zadania o takim id"));

            if (task.getLabels() == null) {
                task.setLabels(new HashSet<>());
            }

            task.getLabels().add(label);
            Task updatedTask = taskRepository.save(task);
            return taskMapper.apply(updatedTask);
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    public TaskDTO removeLabelFromTask(Integer taskId, String label) {
        try {
            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma zadania o takim id"));

            if (task.getLabels() != null) {
                task.getLabels().remove(label);
                Task updatedTask = taskRepository.save(task);
                return taskMapper.apply(updatedTask);
            }

            return taskMapper.apply(task);
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    public TaskDTO updateTaskLabels(Integer taskId, Set<String> labels) {
        try {
            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma zadania o takim id"));

            task.setLabels(labels);
            Task updatedTask = taskRepository.save(task);
            return taskMapper.apply(updatedTask);
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    public Set<String> getAllLabels() {
        try {
            List<Task> allTasks = taskRepository.findAll();
            return allTasks.stream()
                    .filter(task -> task.getLabels() != null)
                    .flatMap(task -> task.getLabels().stream())
                    .collect(Collectors.toSet());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error retrieving labels", e);
        }
    }
    public TaskDTO assignParentTask(Integer childTaskId, Integer parentTaskId) {
        try {
            Task childTask = taskRepository.findById(childTaskId)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma zadania o takim id"));

            Task parentTask = taskRepository.findById(parentTaskId)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma zadania nadrzędnego o takim id"));

            // Sprawdzenie czy nie tworzymy cyklu (rodzic nie może być jednocześnie dzieckiem)
            if (isTaskInHierarchy(childTask, parentTask)) {
                throw new RuntimeException("Zależność tworzyłaby cykl, co jest niedozwolone");
            }

            childTask.setParentTask(parentTask);
            parentTask.getChildTasks().add(childTask);

            Task updatedTask = taskRepository.save(childTask);
            taskRepository.save(parentTask);

            return taskMapper.apply(updatedTask);
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }
    }

    public TaskDTO removeParentTask(Integer childTaskId) {
        try {
            Task childTask = taskRepository.findById(childTaskId)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma zadania o takim id"));

            if (childTask.getParentTask() != null) {
                Task parentTask = childTask.getParentTask();
                parentTask.getChildTasks().remove(childTask);
                childTask.setParentTask(null);

                taskRepository.save(parentTask);
            }

            Task updatedTask = taskRepository.save(childTask);
            return taskMapper.apply(updatedTask);
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    public List<TaskDTO> getChildTasks(Integer taskId) {
        try {
            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma zadania o takim id"));

            return task.getChildTasks().stream()
                    .map(taskMapper::apply)
                    .collect(Collectors.toList());
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    public TaskDTO getParentTask(Integer taskId) {
        try {
            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma zadania o takim id"));

            if (task.getParentTask() == null) {
                throw new EntityNotFoundException("Zadanie nie ma zadania nadrzędnego");
            }

            return taskMapper.apply(task.getParentTask());
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }


    private boolean isTaskInHierarchy(Task potentialParent, Task task) {
        if (potentialParent.getId().equals(task.getId())) {
            return true;
        }

        return task.getChildTasks().stream()
                .anyMatch(childTask -> isTaskInHierarchy(potentialParent, childTask));
    }


    public boolean canTaskBeCompleted(Integer taskId) {
        try {
            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma zadania o takim id"));

            // Jeśli zadanie ma rodzica i rodzic nie jest zakończony, zwracamy false
            if (task.getParentTask() != null && !task.getParentTask().isCompleted()) {
                return false;
            }

            return true;
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }


    public TaskDTO updateTaskCompletion(Integer taskId, boolean completed) {
        try {
            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma zadania o takim id"));

            if (completed && !canTaskBeCompleted(taskId)) {
                throw new RuntimeException("Nie można zakończyć zadania przed zakończeniem zadań nadrzędnych");
            }

            task.setCompleted(completed);


            if (!completed) {
                updateDependentTasksCompletion(task);
            }

            Task updatedTask = taskRepository.save(task);
            return taskMapper.apply(updatedTask);
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }
    }


    private void updateDependentTasksCompletion(Task parentTask) {
        parentTask.getChildTasks().forEach(childTask -> {
            if (childTask.isCompleted()) {
                childTask.setCompleted(false);
                taskRepository.save(childTask);
                updateDependentTasksCompletion(childTask);
            }
        });
    }



    @Scheduled(fixedRate = 1800000) // wykonywane co 30 min
    public void checkAllTasksDeadlines() {
        List<Task> tasksWithDeadline = taskRepository.findAllByDeadlineIsNotNull();
        LocalDateTime now = LocalDateTime.now();

        for (Task task : tasksWithDeadline) {
            boolean wasExpired = task.isExpired();
            boolean isExpired = task.getDeadline().isBefore(now);

            if (wasExpired != isExpired) {
                task.setExpired(isExpired);
                taskRepository.save(task);
            }
        }
    }
}