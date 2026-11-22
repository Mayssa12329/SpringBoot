package com.medivet.vetbooking.repository;

import com.medivet.vetbooking.entity.Slot;
import com.medivet.vetbooking.entity.WaitingListEntry;
import com.medivet.vetbooking.enums.WaitingListStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface WaitingListRepository extends JpaRepository<WaitingListEntry, Long> {

    /** All entries for a slot ordered FIFO (RM08). */
    List<WaitingListEntry> findBySlotOrderByRegisteredAtAsc(Slot slot);

    /** Entries for a slot with a specific status, FIFO order. */
    List<WaitingListEntry> findBySlotAndStatusOrderByRegisteredAtAsc(Slot slot, WaitingListStatus status);

    /**
     * First WAITING entry for a slot (FIFO head — RM08).
     * Used when a slot becomes free to make an offer.
     */
    @Query("""
        SELECT w FROM WaitingListEntry w
        WHERE w.slot = :slot
          AND w.status = 'WAITING'
        ORDER BY w.registeredAt ASC
        LIMIT 1
        """)
    Optional<WaitingListEntry> findFirstWaitingForSlot(@Param("slot") Slot slot);

    /** Entries currently in OFFERED state whose offer window has expired (RM08 — scheduled task). */
    @Query("""
        SELECT w FROM WaitingListEntry w
        WHERE w.status = 'OFFERED'
          AND w.offerExpiresAt < :now
        """)
    List<WaitingListEntry> findExpiredOffers(@Param("now") LocalDateTime now);

    /** Check if an owner already has a WAITING/OFFERED entry for a slot (avoid duplicates). */
    @Query("""
        SELECT COUNT(w) > 0 FROM WaitingListEntry w
        WHERE w.slot = :slot
          AND w.ownerId = :ownerId
          AND w.status IN ('WAITING', 'OFFERED')
        """)
    boolean existsActiveEntryForOwnerAndSlot(
            @Param("slot") Slot slot,
            @Param("ownerId") Long ownerId);

    /** All waiting-list entries for a given owner. */
    List<WaitingListEntry> findByOwnerId(Long ownerId);
}
