package com.medivet.vetbooking.controller;

import com.medivet.vetbooking.dto.request.SlotRequest;
import com.medivet.vetbooking.dto.request.VetRequest;
import com.medivet.vetbooking.dto.response.SlotResponse;
import com.medivet.vetbooking.dto.response.VetResponse;
import com.medivet.vetbooking.enums.ConsultationType;
import com.medivet.vetbooking.service.VetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDate;
import java.util.List;

/**
 * REST endpoints for veterinarian search and availability management.
 * Covers US13 (search by specialty) and US14 (manage availabilities).
 */
@RestController
@RequestMapping("/api/v1/vets")
@Tag(name = "Vets", description = "Veterinarian profiles and slot management")
public class VetController {

    private final VetService vetService;

    public VetController(VetService vetService) {
        this.vetService = vetService;
    }

    // ── Vet CRUD ─────────────────────────────────────────────────────────────

    @Operation(summary = "Register a new veterinarian")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Vet created"),
        @ApiResponse(responseCode = "409", description = "Email already in use", content = @Content)
    })
    @PostMapping
    public ResponseEntity<VetResponse> createVet(@Valid @RequestBody VetRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(vetService.createVet(request));
    }

    @Operation(summary = "Get a veterinarian by ID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Vet found"),
        @ApiResponse(responseCode = "404", description = "Vet not found", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<VetResponse> getVet(@PathVariable Long id) {
        return ResponseEntity.ok(vetService.getVet(id));
    }

    /**
     * Search vets by city and/or consultation type — US13 / RM07.
     * Both filters are optional; omitting both returns all active vets.
     */
    @Operation(summary = "Search veterinarians by city and/or consultation type (US13)")
    @ApiResponse(responseCode = "200", description = "List of matching vets")
    @GetMapping
    public ResponseEntity<List<VetResponse>> searchVets(
            @Parameter(description = "Filter by city (case-insensitive)")
            @RequestParam(required = false) String city,
            @Parameter(description = "Filter by supported consultation type")
            @RequestParam(required = false) ConsultationType consultationType) {
        return ResponseEntity.ok(vetService.searchVets(city, consultationType));
    }

    @Operation(summary = "Update a veterinarian's profile")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Vet updated"),
        @ApiResponse(responseCode = "404", description = "Vet not found", content = @Content),
        @ApiResponse(responseCode = "409", description = "Email already in use", content = @Content)
    })
    @PutMapping("/{id}")
    public ResponseEntity<VetResponse> updateVet(
            @PathVariable Long id,
            @Valid @RequestBody VetRequest request) {
        return ResponseEntity.ok(vetService.updateVet(id, request));
    }

    @Operation(summary = "Deactivate a veterinarian (soft delete)")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Vet deactivated"),
        @ApiResponse(responseCode = "404", description = "Vet not found", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivateVet(@PathVariable Long id) {
        vetService.deactivateVet(id);
        return ResponseEntity.noContent().build();
    }

    // ── Slot management (US14) ───────────────────────────────────────────────

    @Operation(summary = "Create a time slot for a vet (US14)")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Slot created"),
        @ApiResponse(responseCode = "404", description = "Vet not found", content = @Content),
        @ApiResponse(responseCode = "409", description = "Overlapping slot exists", content = @Content)
    })
    @PostMapping("/{vetId}/slots")
    public ResponseEntity<SlotResponse> createSlot(
            @PathVariable Long vetId,
            @Valid @RequestBody SlotRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(vetService.createSlot(vetId, request));
    }

    @Operation(summary = "List all slots for a vet")
    @GetMapping("/{vetId}/slots")
    public ResponseEntity<List<SlotResponse>> getSlots(@PathVariable Long vetId) {
        return ResponseEntity.ok(vetService.getSlotsByVet(vetId));
    }

    @Operation(summary = "List available slots for a vet")
    @GetMapping("/{vetId}/slots/available")
public ResponseEntity<List<SlotResponse>> getAvailableSlots(
        @PathVariable Long vetId,
        @RequestParam
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

    return ResponseEntity.ok(vetService.getAvailableSlotsByVet(vetId, date));
}

    @Operation(summary = "Block (close) a slot — US14")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Slot blocked"),
        @ApiResponse(responseCode = "404", description = "Slot not found", content = @Content),
        @ApiResponse(responseCode = "422", description = "Slot is currently BOOKED — cancel the appointment first",
                content = @Content)
    })
    @PatchMapping("/slots/{slotId}/block")
    public ResponseEntity<SlotResponse> blockSlot(@PathVariable Long slotId) {
        return ResponseEntity.ok(vetService.blockSlot(slotId));
    }

    @Operation(summary = "Re-open a previously blocked slot")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Slot opened"),
        @ApiResponse(responseCode = "404", description = "Slot not found", content = @Content)
    })
    @PatchMapping("/slots/{slotId}/open")
    public ResponseEntity<SlotResponse> openSlot(@PathVariable Long slotId) {
        return ResponseEntity.ok(vetService.openSlot(slotId));
    }
}
