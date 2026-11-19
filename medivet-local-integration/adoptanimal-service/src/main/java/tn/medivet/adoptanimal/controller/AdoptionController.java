package tn.medivet.adoptanimal.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.medivet.adoptanimal.dto.AdoptionRequest;
import tn.medivet.adoptanimal.dto.AdoptionResponse;
import tn.medivet.adoptanimal.service.AdoptionService;

@RestController
@RequestMapping("/api/v1/annonces")
@RequiredArgsConstructor
public class AdoptionController {

    private final AdoptionService adoptionService;

    @PostMapping("/{annonceId}/adoption")
    public ResponseEntity<AdoptionResponse> finaliser(
            @PathVariable Long annonceId,
            @Valid @RequestBody AdoptionRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long acteurId) {
        var adoption = adoptionService.finaliser(annonceId, request.candidatureId(), acteurId);
        return ResponseEntity.status(HttpStatus.CREATED).body(AdoptionResponse.from(adoption));
    }
}
