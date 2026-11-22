package com.medivet.vetpharma.repository;

import com.medivet.vetpharma.entity.Reservation;
import com.medivet.vetpharma.enums.StatutReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    /** Idempotence RM11 : retrouve une réservation existante par sa clé client. */
    Optional<Reservation> findByIdempotencyKey(String idempotencyKey);

    /** Réservations EN_ATTENTE dont le TTL est dépassé (pour la purge planifiée). */
    @Query("SELECT r FROM Reservation r " +
           "WHERE r.statut = 'EN_ATTENTE' AND r.expirationAt < :now")
    List<Reservation> findExpirees(@Param("now") LocalDateTime now);
}
