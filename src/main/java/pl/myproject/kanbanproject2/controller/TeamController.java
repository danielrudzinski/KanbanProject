package pl.myproject.kanbanproject2.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.myproject.kanbanproject2.model.Team;
import pl.myproject.kanbanproject2.model.User;
import pl.myproject.kanbanproject2.service.TeamService;

@RestController
@RequestMapping("/teams")
public class TeamController {
    private TeamService teamService;
    @Autowired
    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }
    @GetMapping()
    public ResponseEntity<Iterable<Team>> getAllTeams(){
        return teamService.getAllTeams();
    }
    @PostMapping()
    public ResponseEntity<Team> addTeam(@RequestBody Team team){
        return teamService.addTeam(team);
    }
    @DeleteMapping
    public ResponseEntity<Void> deleteTeam(@PathVariable Integer id){
        return teamService.deleteTeam(id);


    }
}
