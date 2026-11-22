package com.medivet.vetbooking.controller;

import com.medivet.vetbooking.dto.response.NotificationResponse;
import com.medivet.vetbooking.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST endpoints for the notification system (US17).
 *
 * Base path: /api/v1/notifications
 */
@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notifications", description = "Consultation et gestion des notifications (US17)")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    // ── GET all notifications for a user ──────────────────────────────────────

    @Operation(summary = "Toutes les notifications d'un utilisateur (US17)")
    @ApiResponse(responseCode = "200", description = "Liste des notifications, plus récente en premier")
    @GetMapping("/user/{recipientId}")
    public ResponseEntity<List<NotificationResponse>> getByRecipient(
            @Parameter(description = "ID de l'utilisateur") @PathVariable Long recipientId) {
        return ResponseEntity.ok(notificationService.getByRecipient(recipientId));
    }

    // ── GET unread only ───────────────────────────────────────────────────────

    @Operation(summary = "Notifications non lues d'un utilisateur")
    @ApiResponse(responseCode = "200", description = "Notifications UNREAD")
    @GetMapping("/user/{recipientId}/unread")
    public ResponseEntity<List<NotificationResponse>> getUnread(
            @PathVariable Long recipientId) {
        return ResponseEntity.ok(notificationService.getUnreadByRecipient(recipientId));
    }

    // ── GET unread count (pour le badge frontend) ─────────────────────────────

    @Operation(summary = "Nombre de notifications non lues (badge)")
    @ApiResponse(responseCode = "200", description = "Compteur")
    @GetMapping("/user/{recipientId}/unread/count")
    public ResponseEntity<Map<String, Long>> countUnread(
            @PathVariable Long recipientId) {
        long count = notificationService.countUnread(recipientId);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    // ── PATCH mark single as read ─────────────────────────────────────────────

    @Operation(summary = "Marquer une notification comme lue")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Notification marquée lue"),
        @ApiResponse(responseCode = "404", description = "Notification introuvable", content = @Content),
        @ApiResponse(responseCode = "422",
                description = "La notification n'appartient pas à cet utilisateur", content = @Content)
    })
    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markRead(
            @PathVariable Long id,
            @Parameter(description = "ID du destinataire (contrôle d'accès)")
            @RequestParam Long recipientId) {
        return ResponseEntity.ok(notificationService.markRead(id, recipientId));
    }

    // ── PATCH mark all read ───────────────────────────────────────────────────

    @Operation(summary = "Marquer toutes les notifications d'un utilisateur comme lues")
    @ApiResponse(responseCode = "200", description = "Nombre de notifications mises à jour")
    @PatchMapping("/user/{recipientId}/read-all")
    public ResponseEntity<Map<String, Integer>> markAllRead(
            @PathVariable Long recipientId) {
        int updated = notificationService.markAllRead(recipientId);
        return ResponseEntity.ok(Map.of("updated", updated));
    }
}
