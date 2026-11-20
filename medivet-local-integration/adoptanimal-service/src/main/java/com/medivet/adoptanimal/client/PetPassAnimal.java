package com.medivet.adoptanimal.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** Extrait de la fiche animal renvoyée par PetPass (GET /api/v1/animals/{id}) : seuls les champs utiles. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record PetPassAnimal(Long id, String name, String microchipId,
                            String vaccinationStatus, String healthStatus) {
}
