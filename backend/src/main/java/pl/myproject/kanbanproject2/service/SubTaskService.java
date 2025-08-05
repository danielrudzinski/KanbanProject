package pl.myproject.kanbanproject2.service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import pl.myproject.kanbanproject2.dto.SubTaskDTO;
import pl.myproject.kanbanproject2.mapper.SubTaskMapper;
import pl.myproject.kanbanproject2.model.SubTask;
import pl.myproject.kanbanproject2.model.Task;
import pl.myproject.kanbanproject2.repository.SubTaskRepository;
import pl.myproject.kanbanproject2.repository.TaskRepository;

import java.util.List;
import java.util.stream.Collectors;

@Transactional
@Service
public class SubTaskService {

    private final SubTaskRepository subTaskRepository;
    private final TaskRepository taskRepository;
    private final SubTaskMapper subTaskMapper;

    @Autowired
    public SubTaskService(SubTaskRepository subTaskRepository,
                          TaskRepository taskRepository,
                          SubTaskMapper subTaskMapper) {
        this.subTaskRepository = subTaskRepository;
        this.taskRepository = taskRepository;
        this.subTaskMapper = subTaskMapper;
    }

    public SubTask addSubTask(SubTask subTask) {

        if (subTask.getPosition() == null) {
            long count = subTaskRepository.count();
            subTask.setPosition((int) count + 1);
        }
        return subTaskRepository.save(subTask);
    }

    public List<SubTaskDTO> getAllSubTasks() {
        List<SubTaskDTO> subTaskDTOS = subTaskRepository.findAll().stream()
                .map(subTaskMapper::toDto)
                .collect(Collectors.toList());
        return subTaskDTOS;
    }

    public void deleteSubTask(Integer id) {
        try {
            if (!subTaskRepository.existsById(id)) {
                throw new EntityNotFoundException("Nie ma podzadania o takim id");
            }
            subTaskRepository.deleteById(id);
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    public SubTaskDTO getSubTaskById(Integer id) {
        try {
            return subTaskRepository.findById(id)
                    .map(subTaskMapper::toDto)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma podzadania o takim id"));
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    public SubTaskDTO patchSubTask(Integer id, SubTask subTask) {
        try {
            SubTask existingSubTask = subTaskRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma podzadania o takim id"));

            if (subTask.getTitle() != null) {
                existingSubTask.setTitle(subTask.getTitle());
            }

            if (subTask.getDescription() != null) {
                existingSubTask.setDescription(subTask.getDescription());
            }

            // Można zmienić status completed
            existingSubTask.setCompleted(subTask.isCompleted());

            if (subTask.getTask() != null) {
                existingSubTask.setTask(subTask.getTask());
            }

            if (subTask.getPosition() != null) {
                existingSubTask.setPosition(subTask.getPosition());
            }
            if(subTask.getDescription() != null){
                existingSubTask.setDescription(subTask.getDescription());
            }

            var  savedSubTask = subTaskRepository.save(existingSubTask);
            return subTaskMapper.toDto(savedSubTask);
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    public SubTaskDTO assignTaskToSubTask(Integer subTaskId, Integer taskId) {
        try {
            var  subTask = subTaskRepository.findById(subTaskId)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma podzadania o takim id"));

            var  task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma zadania o takim id"));

            subTask.setTask(task);
            task.getSubTasks().add(subTask);

            taskRepository.save(task);
            var  updatedSubTask = subTaskRepository.save(subTask);

            return subTaskMapper.toDto(updatedSubTask);
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    public List<SubTaskDTO> getSubTasksByTaskId(Integer taskId) {
        try {
            var  task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma zadania o takim id"));

            return task.getSubTasks().stream()
                    .map(subTaskMapper::toDto)
                    .collect(Collectors.toList());
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    public SubTaskDTO toggleSubTaskCompletion(Integer id) {
        try {
            var  subTask = subTaskRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma podzadania o takim id"));

            subTask.setCompleted(!subTask.isCompleted());

            var  updatedSubTask = subTaskRepository.save(subTask);
            return subTaskMapper.toDto(updatedSubTask);
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    public SubTaskDTO updateSubTaskPosition(Integer id, Integer position) {
        try {
            var subTask = subTaskRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma podzadania o takim id"));
            subTask.setPosition(position);
            var updatedSubTask = subTaskRepository.save(subTask);
            return subTaskMapper.toDto(updatedSubTask);
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }
}