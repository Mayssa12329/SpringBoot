package tn.medivet.adoptanimal.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import tn.medivet.adoptanimal.dto.AnnonceRequest;
import tn.medivet.adoptanimal.dto.AnnonceResponse;
import tn.medivet.adoptanimal.entity.Annonce;
import tn.medivet.adoptanimal.service.AnnonceService;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/annonces")
@RequiredArgsConstructor
public class AnnonceController {

    private final AnnonceService annonceService;

    @PostMapping
    public ResponseEntity<AnnonceResponse> publier(
            @Valid @RequestBody AnnonceRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long acteurId) {
        Annonce annonce = annonceService.publier(request, acteurId);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(annonce.getId()).toUri();
        return ResponseEntity.created(location).body(AnnonceResponse.from(annonce));
    }

    @GetMapping
    public List<AnnonceResponse> rechercher(
            @RequestParam(required = false) String espece,
            @RequestParam(required = false) String localisation,
            @RequestParam(required = false) Integer ageMax) {
        return annonceService.rechercher(espece, localisation, ageMax).stream()
                .map(AnnonceResponse::from).toList();
    }

    @GetMapping("/{id}")
    public AnnonceResponse trouver(@PathVariable Long id) {
        return AnnonceResponse.from(annonceService.trouver(id));
    }

    /** Relance la vérification d'une annonce restée en VERIFICATION_EN_ATTENTE (après une panne). */
    @PostMapping("/{id}/verifications")
    public AnnonceResponse reverifier(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long acteurId) {
        return AnnonceResponse.from(annonceService.reverifier(id, acteurId));
    }
}
