package tn.medivet.adoptanimal.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import tn.medivet.adoptanimal.dto.RencontreRequest;
import tn.medivet.adoptanimal.dto.RencontreResponse;
import tn.medivet.adoptanimal.dto.StatutRencontreRequest;
import tn.medivet.adoptanimal.entity.Rencontre;
import tn.medivet.adoptanimal.service.RencontreService;

import java.net.URI;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class RencontreController {

    private final RencontreService rencontreService;

    @PostMapping("/candidatures/{candidatureId}/rencontres")
    public ResponseEntity<RencontreResponse> planifier(
            @PathVariable Long candidatureId,
            @Valid @RequestBody RencontreRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long acteurId) {
        Rencontre rencontre = rencontreService.planifier(candidatureId, request.dateRencontre(), acteurId);
        URI location = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/v1/rencontres/{id}").buildAndExpand(rencontre.getId()).toUri();
        return ResponseEntity.created(location).body(RencontreResponse.from(rencontre));
    }

    @PutMapping("/rencontres/{id}/statut")
    public RencontreResponse changerStatut(
            @PathVariable Long id,
            @Valid @RequestBody StatutRencontreRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long acteurId) {
        return RencontreResponse.from(rencontreService.changerStatut(id, request.statut(), acteurId));
    }
}
