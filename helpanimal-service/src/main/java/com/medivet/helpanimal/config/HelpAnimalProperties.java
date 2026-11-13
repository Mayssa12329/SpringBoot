package com.medivet.helpanimal.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Parametres metier lus dans application.yml (prefixe "helpanimal"). */
@ConfigurationProperties(prefix = "helpanimal")
public record HelpAnimalProperties(Storage storage, Photo photo, Duplicate duplicate, Nearby nearby) {

    /** Dossier ou sont stockees les photos. */
    public record Storage(String directory) { }

    /** Taille max d'une photo en octets. */
    public record Photo(long maxSizeBytes) { }

    /** RM02 : rayon (m) et fenetre (min) de detection de doublon. */
    public record Duplicate(double radiusMeters, long windowMinutes) { }

    /** US22 : rayon par defaut et rayon max (km) pour les signalements proches. */
    public record Nearby(double defaultRadiusKm, double maxRadiusKm) { }
}
