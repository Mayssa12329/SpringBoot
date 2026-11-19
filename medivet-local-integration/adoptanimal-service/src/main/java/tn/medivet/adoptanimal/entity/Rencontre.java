package tn.medivet.adoptanimal.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "rencontre")
@Getter
@Setter
@NoArgsConstructor
public class Rencontre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long candidatureId;

    @Column(nullable = false)
    private LocalDateTime dateRencontre;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutRencontre statut = StatutRencontre.PLANIFIEE;
}
