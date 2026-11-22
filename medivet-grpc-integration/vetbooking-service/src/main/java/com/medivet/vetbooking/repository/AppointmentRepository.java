package com.medivet.vetbooking.repository;

import com.medivet.vetbooking.entity.Appointment;
import com.medivet.vetbooking.entity.Slot;
import com.medivet.vetbooking.enums.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    Optional<Appointment> findBySlot(Slot slot);

    /** All appointments belonging to a given owner — US15, US16. */
    List<Appointment> findByOwnerId(Long ownerId);

    /** All appointments for a vet (via slot join) — US14. */
    @Query("""
        SELECT a FROM Appointment a
        JOIN a.slot s
        WHERE s.vet.id = :vetId
        ORDER BY s.startTime
        """)
    List<Appointment> findByVetId(@Param("vetId") Long vetId);

    /** All appointments for a vet filtered by status. */
    @Query("""
        SELECT a FROM Appointment a
        JOIN a.slot s
        WHERE s.vet.id = :vetId
          AND a.status = :status
        ORDER BY s.startTime
        """)
    List<Appointment> findByVetIdAndStatus(
            @Param("vetId") Long vetId,
            @Param("status") AppointmentStatus status);

    /** Check whether a CONFIRMED appointment already exists for a slot (RM06). */
    @Query("""
        SELECT COUNT(a) > 0 FROM Appointment a
        WHERE a.slot = :slot
          AND a.status = 'CONFIRMED'
        """)
    boolean existsConfirmedForSlot(@Param("slot") Slot slot);
}
