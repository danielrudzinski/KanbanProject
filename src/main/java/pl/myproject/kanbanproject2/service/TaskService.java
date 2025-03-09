package pl.myproject.kanbanproject2.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import org.springframework.web.util.UriComponents;
import pl.myproject.kanbanproject2.dto.TaskDTO;
import pl.myproject.kanbanproject2.mapper.TaskMapper;
import pl.myproject.kanbanproject2.model.Task;
import pl.myproject.kanbanproject2.repository.TaskRepository;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Service
public class TaskService {
    private final TaskRepository taskRepository;
    private final TaskMapper taskMapper;
    @Autowired
    public TaskService(TaskRepository taskRepository, TaskMapper taskMapper) {
        this.taskRepository = taskRepository;
        this.taskMapper = taskMapper;
    }

    public ResponseEntity<Task>addTask(@RequestBody Task task){
        Task savedTask = taskRepository.save(task);

        UriComponents uriComponents = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}")
                .buildAndExpand(savedTask.getId());
        return ResponseEntity.created(uriComponents.toUri()).body(savedTask);
    }
    public ResponseEntity<List<TaskDTO>> getAllTasks(){
        List<TaskDTO> taskDTOS = StreamSupport.stream(taskRepository.findAll().spliterator(), false)
                .map(taskMapper)
                .collect(Collectors.toList());
        return ResponseEntity.ok(taskDTOS);
    }
    public ResponseEntity<Void> deleteTask(@PathVariable Integer id){
        if(!taskRepository.existsById(id)){
            return ResponseEntity.notFound().build();
        }
        taskRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
    public ResponseEntity<TaskDTO> getTaskById(@PathVariable Integer id) {
        return taskRepository.findById(id)
                .map(taskMapper)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    public ResponseEntity<Task> patchTask(@PathVariable Integer id, @RequestBody Task task) {
        return taskRepository.findById(id)
                .map(existingTask -> {
                    if (task.getTitle() != null) {
                        existingTask.setTitle(task.getTitle());
                    }
                    if (task.getColumn() != null) {
                        existingTask.setColumn(task.getColumn());
                    }

                    return taskRepository.save(existingTask);
                })
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}