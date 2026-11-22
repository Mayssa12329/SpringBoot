package com.medivet.vetbooking.service;

import com.medivet.vetbooking.dto.response.NotificationResponse;
import com.medivet.vetbooking.entity.Notification;
import com.medivet.vetbooking.enums.NotificationStatus;
import com.medivet.vetbooking.enums.NotificationType;
import com.medivet.vetbooking.event.NotificationEvent;
import com.medivet.vetbooking.exception.InvalidOperationException;
import com.medivet.vetbooking.exception.ResourceNotFoundException;
import com.medivet.vetbooking.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationService — tests unitaires")
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationService notificationService;

    private NotificationEvent buildEvent(NotificationType type, Long recipientId,
                                          Long referenceId) {
        return NotificationEvent.builder(this)
                .type(type)
                .recipientId(recipientId)
                .referenceId(referenceId)
                .message("Test message for " + type)
                .autoKey()
                .build();
    }

    // ── onNotificationEvent ───────────────────────────────────────────────────

    @Test
    @DisplayName("persiste une notification quand la clé n'existe pas encore (RM14)")
    void onNotificationEvent_persists_when_key_is_new() {
        NotificationEvent event = buildEvent(
                NotificationType.APPOINTMENT_CONFIRMED, 7L, 42L);

        when(notificationRepository.existsByIdempotencyKey(event.getIdempotencyKey()))
                .thenReturn(false);

        notificationService.onNotificationEvent(event);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());

        Notification saved = captor.getValue();
        assertThat(saved.getRecipientId()).isEqualTo(7L);
        assertThat(saved.getType()).isEqualTo(NotificationType.APPOINTMENT_CONFIRMED);
        assertThat(saved.getStatus()).isEqualTo(NotificationStatus.UNREAD);
        assertThat(saved.getIdempotencyKey()).isEqualTo(event.getIdempotencyKey());
        assertThat(saved.getMessage()).isEqualTo("Test message for APPOINTMENT_CONFIRMED");
    }

    @Test
    @DisplayName("ignore un doublon — idempotence RM14")
    void onNotificationEvent_skips_duplicate_key() {
        NotificationEvent event = buildEvent(
                NotificationType.APPOINTMENT_CONFIRMED, 7L, 42L);

        when(notificationRepository.existsByIdempotencyKey(event.getIdempotencyKey()))
                .thenReturn(true);

        notificationService.onNotificationEvent(event);

        verify(notificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("n'écrase pas la transaction appelante si la persistance échoue (RM14)")
    void onNotificationEvent_swallows_persistence_exception() {
        NotificationEvent event = buildEvent(
                NotificationType.APPOINTMENT_CANCELLED, 7L, 42L);

        when(notificationRepository.existsByIdempotencyKey(anyString())).thenReturn(false);
        when(notificationRepository.save(any())).thenThrow(new RuntimeException("DB down"));

        // Must NOT propagate — business flow must continue
        assertThatNoException().isThrownBy(() -> notificationService.onNotificationEvent(event));
    }

    // ── getByRecipient ────────────────────────────────────────────────────────

    @Test
    @DisplayName("retourne toutes les notifications d'un utilisateur dans l'ordre")
    void getByRecipient_returns_all_notifications() {
        Notification n1 = buildNotification(1L, NotificationType.APPOINTMENT_CONFIRMED,
                NotificationStatus.UNREAD, 7L, 10L);
        Notification n2 = buildNotification(2L, NotificationType.APPOINTMENT_CANCELLED,
                NotificationStatus.READ, 7L, 11L);

        when(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(7L))
                .thenReturn(List.of(n1, n2));

        List<NotificationResponse> result = notificationService.getByRecipient(7L);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getType()).isEqualTo(NotificationType.APPOINTMENT_CONFIRMED);
        assertThat(result.get(1).getType()).isEqualTo(NotificationType.APPOINTMENT_CANCELLED);
    }

    // ── countUnread ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("compte les notifications non lues")
    void countUnread_returns_correct_count() {
        when(notificationRepository.countByRecipientIdAndStatus(7L, NotificationStatus.UNREAD))
                .thenReturn(3L);

        assertThat(notificationService.countUnread(7L)).isEqualTo(3L);
    }

    // ── markRead ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("marque une notification comme lue")
    void markRead_sets_status_READ_and_readAt() {
        Notification n = buildNotification(1L, NotificationType.APPOINTMENT_CONFIRMED,
                NotificationStatus.UNREAD, 7L, 42L);

        when(notificationRepository.findById(1L)).thenReturn(Optional.of(n));
        when(notificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        NotificationResponse result = notificationService.markRead(1L, 7L);

        assertThat(result.getStatus()).isEqualTo(NotificationStatus.READ);
        assertThat(n.getReadAt()).isNotNull();
    }

    @Test
    @DisplayName("rejette markRead si notification introuvable → 404")
    void markRead_throws_404_when_not_found() {
        when(notificationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.markRead(99L, 7L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("rejette markRead si la notification appartient à un autre utilisateur → 422")
    void markRead_throws_422_when_wrong_recipient() {
        Notification n = buildNotification(1L, NotificationType.APPOINTMENT_CONFIRMED,
                NotificationStatus.UNREAD, 99L /* different owner */, 42L);

        when(notificationRepository.findById(1L)).thenReturn(Optional.of(n));

        assertThatThrownBy(() -> notificationService.markRead(1L, 7L))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("does not belong to recipient");
    }

    @Test
    @DisplayName("markRead est idempotent si déjà lue")
    void markRead_is_idempotent_when_already_read() {
        Notification n = buildNotification(1L, NotificationType.APPOINTMENT_CONFIRMED,
                NotificationStatus.READ, 7L, 42L);
        n.setReadAt(LocalDateTime.now().minusMinutes(5));

        when(notificationRepository.findById(1L)).thenReturn(Optional.of(n));
        // No save stub needed — service skips save when status is already READ

        NotificationResponse result = notificationService.markRead(1L, 7L);
        assertThat(result.getStatus()).isEqualTo(NotificationStatus.READ);
    }

    // ── markAllRead ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("markAllRead délègue au repository et retourne le compte")
    void markAllRead_delegates_to_repository() {
        when(notificationRepository.markAllReadForRecipient(7L)).thenReturn(5);

        int updated = notificationService.markAllRead(7L);

        assertThat(updated).isEqualTo(5);
        verify(notificationRepository).markAllReadForRecipient(7L);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Notification buildNotification(Long id, NotificationType type,
                                            NotificationStatus status,
                                            Long recipientId, Long referenceId) {
        Notification n = new Notification();
        // Use reflection to set the generated id field
        try {
            var field = Notification.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(n, id);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        n.setRecipientId(recipientId);
        n.setType(type);
        n.setStatus(status);
        n.setMessage("msg");
        n.setReferenceId(referenceId);
        n.setIdempotencyKey(type.name() + "-" + referenceId + "-" + recipientId);
        return n;
    }
}
