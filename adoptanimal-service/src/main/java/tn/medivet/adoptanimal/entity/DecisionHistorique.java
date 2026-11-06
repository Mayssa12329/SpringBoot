package tn.medivet.adoptanimal.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "decision_historique")
@Getter
@Setter
@NoArgsConstructor
public class DecisionHistorique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String entite;

    @Column(nullable = false)
    private Long entiteId;

    @Column(nullable = false)
    private String decision;

    private Long acteurId;
    private String motif;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
