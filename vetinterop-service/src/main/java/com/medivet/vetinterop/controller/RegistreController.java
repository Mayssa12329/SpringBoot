package com.medivet.vetinterop.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.medivet.vetinterop.entity.PuceRegistre;
import com.medivet.vetinterop.repository.PuceRegistreRepository;

/** Administration du registre (démo / tests) : ajouter ou consulter une puce. Le SOAP reste le contrat d'échange. */
@RestController
@RequestMapping("/api/v1/registre")
public class RegistreController {

    public record NouvellePuce(
            @NotBlank @Pattern(regexp = "[0-9]{15}", message = "la puce doit contenir 15 chiffres") String puce,
            String nomAnimal,
            String espece,
            @Pattern(regexp = "VERIFIE|INCOHERENT|INDETERMINE", message = "statut : VERIFIE, INCOHERENT ou INDETERMINE")
            String statut,
            String message) {
    }

    private final PuceRegistreRepository repository;

    public RegistreController(PuceRegistreRepository repository) {
        this.repository = repository;
    }

    @PostMapping
    public ResponseEntity<PuceRegistre> ajouter(@Valid @RequestBody NouvellePuce corps) {
        if (repository.existsById(corps.puce())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        String statut = corps.statut() == null ? "VERIFIE" : corps.statut();
        PuceRegistre cree = repository.save(
                new PuceRegistre(corps.puce(), corps.nomAnimal(), corps.espece(), statut, corps.message()));
        return ResponseEntity.status(HttpStatus.CREATED).body(cree);
    }

    @GetMapping("/{puce}")
    public ResponseEntity<PuceRegistre> consulter(@PathVariable String puce) {
        return repository.findById(puce).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }
}
