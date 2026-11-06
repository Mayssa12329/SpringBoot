package tn.medivet.adoptanimal.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import tn.medivet.adoptanimal.dto.CandidatureRequest;
import tn.medivet.adoptanimal.dto.CandidatureResponse;
import tn.medivet.adoptanimal.dto.StatutCandidatureRequest;
import tn.medivet.adoptanimal.entity.Candidature;
import tn.medivet.adoptanimal.service.CandidatureService;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class CandidatureController {

    private final CandidatureService candidatureService;

    @PostMapping("/annonces/{annonceId}/candidatures")
    public ResponseEntity<CandidatureResponse> soumettre(
            @PathVariable Long annonceId,
            @Valid @RequestBody CandidatureRequest request) {
        Candidature candidature = candidatureService.soumettre(annonceId, request);
        URI location = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/v1/candidatures/{id}").buildAndExpand(candidature.getId()).toUri();
        return ResponseEntity.created(location).body(CandidatureResponse.from(candidature));
    }

    @GetMapping("/annonces/{annonceId}/candidatures")
    public List<CandidatureResponse> lister(@PathVariable Long annonceId) {
        return candidatureService.lister(annonceId).stream().map(CandidatureResponse::from).toList();
    }

    @PutMapping("/candidatures/{id}/statut")
    public CandidatureResponse changerStatut(
            @PathVariable Long id,
            @Valid @RequestBody StatutCandidatureRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long acteurId) {
        return CandidatureResponse.from(
                candidatureService.changerStatut(id, request.statut(), request.commentaire(), acteurId));
    }
}
