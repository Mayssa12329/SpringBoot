package com.medivet.vetbooking.controller;

import com.medivet.vetbooking.dto.request.AppointmentModifyRequest;
import com.medivet.vetbooking.dto.request.AppointmentRequest;
import com.medivet.vetbooking.dto.response.AppointmentResponse;
import com.medivet.vetbooking.service.AppointmentService;
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
 * REST endpoints for appointment booking, modification and cancellation.
 * Covers US15 (book), US16 (cancel/modify), US17 (notifications are fired via service layer).
 */
@RestController
@RequestMapping("/api/v1/appointments")
@Tag(name = "Appointments", description = "Booking, cancellation and status management")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    // ── Book an appointment (US15) ───────────────────────────────────────────

    @Operation(
        summary = "Book an appointment on a slot (US15)",
        description = """
            Acquires a pessimistic lock on the slot to prevent double-booking (RM06).
            Returns 409 if the slot is already taken.
            Returns 422 if the vet does not support the requested consultation type (RM07).
            """
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Appointment confirmed"),
        @ApiResponse(responseCode = "404", description = "Slot not found", content = @Content),
        @ApiResponse(responseCode = "409", description = "Slot already booked (RM06)", content = @Content),
        @ApiResponse(responseCode = "422",
                description = "Vet incompatible with consultation type (RM07)", content = @Content)
    })
    @PostMapping
    public ResponseEntity<AppointmentResponse> book(@Valid @RequestBody AppointmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(appointmentService.book(request));
    }

    // ── Get appointments ─────────────────────────────────────────────────────

    @Operation(summary = "Get a single appointment by ID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Appointment found"),
        @ApiResponse(responseCode = "404", description = "Appointment not found", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<AppointmentResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.getById(id));
    }

    @Operation(summary = "List all appointments for an owner")
    @ApiResponse(responseCode = "200", description = "List of appointments")
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<AppointmentResponse>> getByOwner(
            @Parameter(description = "ID of the owner") @PathVariable Long ownerId) {
        return ResponseEntity.ok(appointmentService.getByOwner(ownerId));
    }

    @Operation(summary = "List all appointments for a vet")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "List of appointments"),
        @ApiResponse(responseCode = "404", description = "Vet not found", content = @Content)
    })
    @GetMapping("/vet/{vetId}")
    public ResponseEntity<List<AppointmentResponse>> getByVet(
            @Parameter(description = "ID of the vet") @PathVariable Long vetId) {
        return ResponseEntity.ok(appointmentService.getByVet(vetId));
    }

    // ── Modify an appointment (US16) ─────────────────────────────────────────

    @Operation(
        summary = "Modify an appointment — reschedule or update notes (US16)",
        description = """
            Modifies a CONFIRMED appointment.

            **Reschedule** (newSlotId provided):
            - Frees the old slot and triggers waiting-list (RM08).
            - Moves the appointment to the new slot (must be AVAILABLE on the same vet).
            - Returns 409 if the new slot is already booked (RM06).
            - Returns 422 if the new slot belongs to a different vet.

            **Notes-only update** (newSlotId omitted):
            - Only updates the notes field. No slot change.
            """
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Appointment modified"),
        @ApiResponse(responseCode = "404", description = "Appointment or new slot not found",
                content = @Content),
        @ApiResponse(responseCode = "409", description = "New slot already booked (RM06)",
                content = @Content),
        @ApiResponse(responseCode = "422",
                description = "Not CONFIRMED / same slot / different vet", content = @Content)
    })
    @PatchMapping("/{id}")
    public ResponseEntity<AppointmentResponse> modify(
            @PathVariable Long id,
            @Valid @RequestBody AppointmentModifyRequest request) {
        return ResponseEntity.ok(appointmentService.modify(id, request));
    }

    // ── Cancel an appointment (US16) ─────────────────────────────────────────

    @Operation(
        summary = "Cancel an appointment (US16)",
        description = """
            Frees the slot and triggers waiting-list processing (RM08).
            Cancellations within 2 hours of the slot start are marked LATE_CANCELLED (RM07).
            """
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Appointment cancelled"),
        @ApiResponse(responseCode = "404", description = "Appointment not found", content = @Content),
        @ApiResponse(responseCode = "422",
                description = "Appointment already cancelled or completed", content = @Content)
    })
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<AppointmentResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.cancel(id));
    }

    // ── Complete an appointment ──────────────────────────────────────────────

    @Operation(summary = "Mark an appointment as completed (post-visit)")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Appointment completed"),
        @ApiResponse(responseCode = "404", description = "Appointment not found", content = @Content),
        @ApiResponse(responseCode = "422",
                description = "Appointment is not in CONFIRMED state", content = @Content)
    })
    @PatchMapping("/{id}/complete")
    public ResponseEntity<AppointmentResponse> complete(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.complete(id));
    }
}
