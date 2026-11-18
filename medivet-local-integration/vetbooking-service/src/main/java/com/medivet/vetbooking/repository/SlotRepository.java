package com.medivet.vetbooking.repository;

import com.medivet.vetbooking.entity.Slot;
import com.medivet.vetbooking.entity.Vet;
import com.medivet.vetbooking.enums.SlotStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SlotRepository extends JpaRepository<Slot, Long> {

    List<Slot> findByVet(Vet vet);

    List<Slot> findByVetAndStatus(Vet vet, SlotStatus status);

    /** Available slots for a vet in a given time window — used by the booking flow. */
    @Query("""
        SELECT s FROM Slot s
        WHERE s.vet = :vet
          AND s.status = 'AVAILABLE'
          AND s.startTime >= :from
          AND s.startTime < :to
        ORDER BY s.startTime
        """)
    List<Slot> findAvailableByVetAndWindow(
            @Param("vet") Vet vet,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    /**
     * Acquire a pessimistic write lock on the slot to prevent concurrent booking (RM06).
     * Used inside a transaction before changing slot status.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Slot s WHERE s.id = :id")
    Optional<Slot> findByIdWithLock(@Param("id") Long id);

    /** Detect duplicate slot (same vet, overlapping time) before creation. */
    @Query("""
        SELECT COUNT(s) > 0 FROM Slot s
        WHERE s.vet = :vet
          AND s.startTime < :endTime
          AND s.endTime > :startTime
        """)
    boolean existsOverlappingSlot(
            @Param("vet") Vet vet,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
}
