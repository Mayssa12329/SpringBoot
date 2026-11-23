package com.medivet.vetbooking.service;

import com.medivet.vetbooking.dto.VetBookingMapper;
import com.medivet.vetbooking.entity.Slot;
import com.medivet.vetbooking.entity.Vet;
import com.medivet.vetbooking.entity.WaitingListEntry;
import com.medivet.vetbooking.enums.ConsultationType;
import com.medivet.vetbooking.enums.NotificationType;
import com.medivet.vetbooking.enums.WaitingListStatus;
import com.medivet.vetbooking.event.NotificationEvent;
import com.medivet.vetbooking.repository.AppointmentRepository;
import com.medivet.vetbooking.repository.SlotRepository;
import com.medivet.vetbooking.repository.WaitingListRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests that WaitingListService.processNextInQueue() publishes
 * a WAITING_LIST_OFFER notification event (US17 / RM08).
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("WaitingListService — publication WAITING_LIST_OFFER (US17)")
class WaitingListNotificationTest {

    @Mock private WaitingListRepository waitingListRepository;
    @Mock private SlotRepository slotRepository;
    @Mock private AppointmentRepository appointmentRepository;
    @Mock private VetBookingMapper mapper;
    @Mock private ApplicationEventPublisher eventPublisher;

    private WaitingListService waitingListService;

    private Vet vet;
    private Slot slot;
    private WaitingListEntry waitingEntry;

    @BeforeEach
    void setUp() {
        waitingListService = new WaitingListService(
                waitingListRepository, slotRepository,
                appointmentRepository, mapper, eventPublisher);

        vet = new Vet();
        setId(vet, 1L);
        vet.setFirstName("Sarah");
        vet.setLastName("Ben Ali");
        vet.setEmail("sarah@medivet.tn");
        vet.setClinicName("Clinique Tunis");
        vet.setConsultationType(ConsultationType.GENERAL);

        slot = new Slot(vet,
                LocalDateTime.now().plusDays(1),
                LocalDateTime.now().plusDays(1).plusMinutes(30));
        setId(slot, 10L);

        waitingEntry = new WaitingListEntry();
        setId(waitingEntry, 5L);
        waitingEntry.setSlot(slot);
        waitingEntry.setOwnerId(7L);
        waitingEntry.setConsultationType(ConsultationType.GENERAL);
        waitingEntry.setStatus(WaitingListStatus.WAITING);
    }

    // ── SC4 : offre liste d'attente → WAITING_LIST_OFFER ──────────────────────

    @Test
    @DisplayName("SC4 — processNextInQueue() publie WAITING_LIST_OFFER au premier en attente")
    void processNextInQueue_publishes_WAITING_LIST_OFFER() {
        when(waitingListRepository.findFirstWaitingForSlot(slot))
                .thenReturn(Optional.of(waitingEntry));
        when(waitingListRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        waitingListService.processNextInQueue(slot);

        // Verify entry transitioned to OFFERED
        assertThat(waitingEntry.getStatus()).isEqualTo(WaitingListStatus.OFFERED);
        assertThat(waitingEntry.getOfferExpiresAt()).isNotNull();
        assertThat(waitingEntry.getOfferExpiresAt())
                .isAfter(LocalDateTime.now().plusMinutes(29));

        // Verify notification event published
        ArgumentCaptor<NotificationEvent> captor =
                ArgumentCaptor.forClass(NotificationEvent.class);
        verify(eventPublisher).publishEvent(captor.capture());

        NotificationEvent event = captor.getValue();
        assertThat(event.getType()).isEqualTo(NotificationType.WAITING_LIST_OFFER);
        assertThat(event.getRecipientId()).isEqualTo(7L);
        assertThat(event.getMessage()).contains("30 minutes");
    }

    @Test
    @DisplayName("processNextInQueue() ne publie rien s'il n'y a personne en attente")
    void processNextInQueue_publishes_nothing_when_queue_empty() {
        when(waitingListRepository.findFirstWaitingForSlot(slot))
                .thenReturn(Optional.empty());

        waitingListService.processNextInQueue(slot);

        verify(eventPublisher, never()).publishEvent(any());
        verify(waitingListRepository, never()).save(any());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void setId(Object entity, Long id) {
        try {
            var field = entity.getClass().getDeclaredField("id");
            field.setAccessible(true);
            field.set(entity, id);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
