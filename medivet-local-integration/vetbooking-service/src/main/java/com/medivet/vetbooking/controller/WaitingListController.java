package com.medivet.vetbooking.controller;

import com.medivet.vetbooking.dto.request.WaitingListRequest;
import com.medivet.vetbooking.dto.response.WaitingListResponse;
import com.medivet.vetbooking.service.WaitingListService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST endpoints for the waiting list.
 * Covers US18 (join waiting list, offer acceptance).
 *
 * Business rules: RM08 — FIFO order, 30-minute offer window.
 */
@RestController
@RequestMapping("/api/v1/waiting-list")
@Tag(name = "Waiting List", description = "Waiting list management for fully-booked slots (US18)")
public class WaitingListController {

    private final WaitingListService waitingListService;

    public WaitingListController(WaitingListService waitingListService) {
        this.waitingListService = waitingListService;
    }

    // ── Join (US18) ──────────────────────────────────────────────────────────

    @Operation(
        summary = "Join the waiting list for a slot (US18)",
        description = """
            Registers the owner on the FIFO waiting list for the requested slot (RM08).
            Returns 409 if the owner already has an active entry for this slot.
            """
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Waiting-list entry created"),
        @ApiResponse(responseCode = "404", description = "Slot not found", content = @Content),
        @ApiResponse(responseCode = "409",
                description = "Owner already on waiting list for this slot", content = @Content)
    })
    @PostMapping
    public ResponseEntity<WaitingListResponse> join(@Valid @RequestBody WaitingListRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(waitingListService.join(request));
    }

    // ── Accept an offer ──────────────────────────────────────────────────────

    @Operation(
        summary = "Accept a waiting-list offer (US18)",
        description = """
            Accepts the slot offer while the 30-minute window is still open (RM08).
            Returns 422 if the offer has already expired.
            """
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Offer accepted"),
        @ApiResponse(responseCode = "404", description = "Entry not found", content = @Content),
        @ApiResponse(responseCode = "422",
                description = "Entry not in OFFERED state or offer expired", content = @Content)
    })
    @PatchMapping("/{id}/accept")
    public ResponseEntity<WaitingListResponse> accept(@PathVariable Long id) {
        return ResponseEntity.ok(waitingListService.acceptOffer(id));
    }

    // ── Cancel an entry ──────────────────────────────────────────────────────

    @Operation(summary = "Cancel a waiting-list entry")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Entry cancelled"),
        @ApiResponse(responseCode = "404", description = "Entry not found", content = @Content),
        @ApiResponse(responseCode = "422",
                description = "Entry cannot be cancelled in its current state", content = @Content)
    })
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<WaitingListResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(waitingListService.cancel(id));
    }

    // ── Query ────────────────────────────────────────────────────────────────

    @Operation(summary = "List all waiting-list entries for an owner")
    @ApiResponse(responseCode = "200", description = "List of entries")
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<WaitingListResponse>> getByOwner(
            @Parameter(description = "ID of the owner") @PathVariable Long ownerId) {
        return ResponseEntity.ok(waitingListService.getByOwner(ownerId));
    }

    @Operation(summary = "List all waiting-list entries for a slot (vet view)")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "List of entries ordered FIFO"),
        @ApiResponse(responseCode = "404", description = "Slot not found", content = @Content)
    })
    @GetMapping("/slot/{slotId}")
    public ResponseEntity<List<WaitingListResponse>> getBySlot(
            @Parameter(description = "ID of the slot") @PathVariable Long slotId) {
        return ResponseEntity.ok(waitingListService.getBySlot(slotId));
    }
}
