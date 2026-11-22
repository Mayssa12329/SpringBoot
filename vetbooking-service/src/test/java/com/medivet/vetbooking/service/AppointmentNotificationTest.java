package com.medivet.vetbooking.service;

import com.medivet.vetbooking.dto.VetBookingMapper;
import com.medivet.vetbooking.dto.request.AppointmentRequest;
import com.medivet.vetbooking.dto.response.AppointmentResponse;
import com.medivet.vetbooking.entity.Appointment;
import com.medivet.vetbooking.entity.Slot;
import com.medivet.vetbooking.entity.Vet;
import com.medivet.vetbooking.enums.AppointmentStatus;
import com.medivet.vetbooking.enums.ConsultationType;
import com.medivet.vetbooking.enums.NotificationType;
import com.medivet.vetbooking.enums.SlotStatus;
import com.medivet.vetbooking.event.NotificationEvent;
import com.medivet.vetbooking.repository.AppointmentRepository;
import com.medivet.vetbooking.repository.SlotRepository;
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
 * Tests that AppointmentService publishes the right NotificationEvents
 * for US17 scenarios: confirmation, annulation.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AppointmentService — publication des événements US17")
class AppointmentNotificationTest {

    @Mock private AppointmentRepository appointmentRepository;
    @Mock private SlotRepository slotRepository;
    @Mock private VetService vetService;
    @Mock private WaitingListService waitingListService;
    @Mock private VetBookingMapper mapper;
    @Mock private ApplicationEventPublisher eventPublisher;

    private AppointmentService appointmentService;

    private Vet vet;
    private Slot slot;
    private Appointment appointment;

    @BeforeEach
    void setUp() {
        appointmentService = new AppointmentService(
                appointmentRepository, slotRepository,
                vetService, waitingListService, mapper, eventPublisher);

        vet = new Vet();
        setId(vet, 1L);
        vet.setFirstName("Sarah");
        vet.setLastName("Ben Ali");
        vet.setEmail("sarah@medivet.tn");
        vet.setClinicName("Clinique Tunis");
        vet.setConsultationType(ConsultationType.GENERAL);

        slot = new Slot(vet, LocalDateTime.now().plusDays(1),
                LocalDateTime.now().plusDays(1).plusMinutes(30));
        setId(slot, 10L);
        slot.setStatus(SlotStatus.AVAILABLE);

        appointment = new Appointment();
        setId(appointment, 42L);
        appointment.setSlot(slot);
        appointment.setOwnerId(7L);
        appointment.setConsultationType(ConsultationType.GENERAL);
        appointment.setStatus(AppointmentStatus.CONFIRMED);
    }

    // ── SC1 : confirmation → APPOINTMENT_CONFIRMED ────────────────────────────

    @Test
    @DisplayName("SC1 — book() publie APPOINTMENT_CONFIRMED avec le bon recipientId")
    void book_publishes_APPOINTMENT_CONFIRMED() {
        AppointmentRequest request = new AppointmentRequest();
        request.setSlotId(10L);
        request.setOwnerId(7L);
        request.setConsultationType(ConsultationType.GENERAL);

        when(slotRepository.findByIdWithLock(10L)).thenReturn(Optional.of(slot));
        when(appointmentRepository.save(any())).thenReturn(appointment);
        when(mapper.toAppointmentResponse(any())).thenReturn(new AppointmentResponse());

        appointmentService.book(request);

        ArgumentCaptor<NotificationEvent> captor =
                ArgumentCaptor.forClass(NotificationEvent.class);
        verify(eventPublisher).publishEvent(captor.capture());

        NotificationEvent event = captor.getValue();
        assertThat(event.getType()).isEqualTo(NotificationType.APPOINTMENT_CONFIRMED);
        assertThat(event.getRecipientId()).isEqualTo(7L);
        assertThat(event.getReferenceId()).isEqualTo(42L);
        assertThat(event.getIdempotencyKey())
                .isEqualTo("APPOINTMENT_CONFIRMED-42-7");
    }

    // ── SC2 : annulation → APPOINTMENT_CANCELLED ──────────────────────────────

    @Test
    @DisplayName("SC2 — cancel() publie APPOINTMENT_CANCELLED")
    void cancel_publishes_APPOINTMENT_CANCELLED() {
        when(appointmentRepository.findById(42L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any())).thenReturn(appointment);
        when(slotRepository.save(any())).thenReturn(slot);
        when(mapper.toAppointmentResponse(any())).thenReturn(new AppointmentResponse());

        appointmentService.cancel(42L);

        ArgumentCaptor<NotificationEvent> captor =
                ArgumentCaptor.forClass(NotificationEvent.class);
        verify(eventPublisher).publishEvent(captor.capture());

        NotificationEvent event = captor.getValue();
        assertThat(event.getType()).isEqualTo(NotificationType.APPOINTMENT_CANCELLED);
        assertThat(event.getRecipientId()).isEqualTo(7L);
    }

    // ── SC3 : annulation tardive → toujours APPOINTMENT_CANCELLED ─────────────

    @Test
    @DisplayName("SC3 — cancel() tardif publie aussi APPOINTMENT_CANCELLED (status = LATE_CANCELLED)")
    void cancel_late_publishes_APPOINTMENT_CANCELLED() {
        // Slot starts in 30 minutes → late cancellation
        Slot lateSlot = new Slot(vet,
                LocalDateTime.now().plusMinutes(30),
                LocalDateTime.now().plusMinutes(60));
        setId(lateSlot, 11L);
        lateSlot.setStatus(SlotStatus.BOOKED);
        appointment.setSlot(lateSlot);

        when(appointmentRepository.findById(42L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any())).thenReturn(appointment);
        when(slotRepository.save(any())).thenReturn(lateSlot);
        when(mapper.toAppointmentResponse(any())).thenReturn(new AppointmentResponse());

        appointmentService.cancel(42L);

        ArgumentCaptor<NotificationEvent> captor =
                ArgumentCaptor.forClass(NotificationEvent.class);
        verify(eventPublisher).publishEvent(captor.capture());

        // Notification type is still APPOINTMENT_CANCELLED regardless of late flag
        assertThat(captor.getValue().getType())
                .isEqualTo(NotificationType.APPOINTMENT_CANCELLED);
    }

    // ── SC4 : modification notes → APPOINTMENT_MODIFIED ──────────────────────

    @Test
    @DisplayName("SC4 — modify() notes-only publie APPOINTMENT_MODIFIED")
    void modify_notes_publishes_APPOINTMENT_MODIFIED() {
        com.medivet.vetbooking.dto.request.AppointmentModifyRequest req =
                new com.medivet.vetbooking.dto.request.AppointmentModifyRequest();
        req.setNewSlotId(null);
        req.setNotes("Updated notes");

        when(appointmentRepository.findById(42L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any())).thenReturn(appointment);
        when(mapper.toAppointmentResponse(any())).thenReturn(new AppointmentResponse());

        appointmentService.modify(42L, req);

        ArgumentCaptor<NotificationEvent> captor =
                ArgumentCaptor.forClass(NotificationEvent.class);
        verify(eventPublisher).publishEvent(captor.capture());

        assertThat(captor.getValue().getType())
                .isEqualTo(NotificationType.APPOINTMENT_MODIFIED);
        assertThat(captor.getValue().getRecipientId()).isEqualTo(7L);
    }

    // ── SC5 : reschedule → APPOINTMENT_MODIFIED ───────────────────────────────

    @Test
    @DisplayName("SC5 — modify() reschedule publie APPOINTMENT_MODIFIED avec le bon ownerId")
    void modify_reschedule_publishes_APPOINTMENT_MODIFIED() {
        Slot newSlot = new Slot(vet,
                LocalDateTime.now().plusDays(2),
                LocalDateTime.now().plusDays(2).plusMinutes(30));
        setId(newSlot, 20L);
        newSlot.setStatus(SlotStatus.AVAILABLE);

        com.medivet.vetbooking.dto.request.AppointmentModifyRequest req =
                new com.medivet.vetbooking.dto.request.AppointmentModifyRequest();
        req.setNewSlotId(20L);

        when(appointmentRepository.findById(42L)).thenReturn(Optional.of(appointment));
        when(slotRepository.findByIdWithLock(20L)).thenReturn(Optional.of(newSlot));
        when(slotRepository.save(any())).thenReturn(newSlot);
        when(appointmentRepository.save(any())).thenReturn(appointment);
        when(mapper.toAppointmentResponse(any())).thenReturn(new AppointmentResponse());

        appointmentService.modify(42L, req);

        ArgumentCaptor<NotificationEvent> captor =
                ArgumentCaptor.forClass(NotificationEvent.class);
        // 2 events: processNextInQueue on old slot (none here) + MODIFIED
        verify(eventPublisher, atLeastOnce()).publishEvent(captor.capture());

        boolean hasModified = captor.getAllValues().stream()
                .anyMatch(e -> e.getType() == NotificationType.APPOINTMENT_MODIFIED);
        assertThat(hasModified).isTrue();

        NotificationEvent modifiedEvent = captor.getAllValues().stream()
                .filter(e -> e.getType() == NotificationType.APPOINTMENT_MODIFIED)
                .findFirst().orElseThrow();
        assertThat(modifiedEvent.getRecipientId()).isEqualTo(7L);
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
