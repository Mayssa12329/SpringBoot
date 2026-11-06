package tn.medivet.adoptanimal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record AnnonceRequest(
        @NotNull Long animalId,
        @NotBlank @Pattern(regexp = "\\d{15}", message = "la puce doit contenir exactement 15 chiffres") String puce,
        @NotBlank @Size(max = 100) String nom,
        @NotBlank @Size(max = 50) String espece,
        @PositiveOrZero Integer ageEstime,
        @Size(max = 150) String localisation,
        @Size(max = 1000) String description,
        @Size(max = 500) String photoUrl,
        @NotNull Long refugeId) {
}
