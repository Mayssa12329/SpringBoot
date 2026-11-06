package tn.medivet.adoptanimal.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "annonce")
@Getter
@Setter
@NoArgsConstructor
public class Annonce {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long animalId;

    @Column(nullable = false, length = 15)
    private String puce;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String espece;

    private Integer ageEstime;
    private String localisation;
    private String description;
    private String photoUrl;

    @Column(nullable = false)
    private Long refugeId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutAnnonce statut = StatutAnnonce.ACTIVE;

    /** Verrou optimiste : deux finalisations concurrentes ne peuvent pas réussir ensemble. */
    @Version
    private Long version;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
