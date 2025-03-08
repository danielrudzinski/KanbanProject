package pl.myproject.kanbanproject2.service;

import org.apache.coyote.Response;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import pl.myproject.kanbanproject2.model.Team;
import pl.myproject.kanbanproject2.repository.TeamRepository;

@Service
public class TeamService {
    private final TeamRepository teamRepository;

    @Autowired
    public TeamService(TeamRepository teamRepository) {
        this.teamRepository = teamRepository;
    }

    public ResponseEntity<Iterable<Team>> getAllTeams() {
        return ResponseEntity.ok(teamRepository.findAll());
    }

    public ResponseEntity<Team> addTeam(@RequestBody Team team) {
        Team savedTeam = teamRepository.save(team);
        return ResponseEntity.ok(savedTeam);
    }

    public ResponseEntity<Team> updateWipLimit(@PathVariable Integer id, @RequestBody Team team) {
        return teamRepository.findById(id)
                .map(existingTeam -> {
                    if (team.getWipLimit() != null) {
                        existingTeam.setWipLimit(team.getWipLimit());
                    }
                    return teamRepository.save(existingTeam);
                })
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
    public ResponseEntity<Void> deleteTeam(@PathVariable Integer id) {
        if (teamRepository.existsById(id)) {
            teamRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        else return ResponseEntity.notFound().build();

    }
}
