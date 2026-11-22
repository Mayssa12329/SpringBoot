package com.medivet.helpanimal.service;

/** Un sauvetage vient de passer a Termine : l'animal doit etre enregistre dans PetPass. */
public record RescueCompletedEvent(Long reportId) {
}
