package tn.medivet.adoptanimal.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "adoption")
@Getter
@Setter
@NoArgsConstructor
public class Adoption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long annonceId;

    @Column(nullable = false)
    private Long candidatureId;

    @Column(nullable = false)
    private LocalDateTime finaliseeLe = LocalDateTime.now();
}
