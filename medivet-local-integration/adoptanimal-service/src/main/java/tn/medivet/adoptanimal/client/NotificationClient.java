package tn.medivet.adoptanimal.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Émet un événement de notification sans jamais bloquer ni faire échouer l'appelant (RM14).
 * Désactivé par défaut (notification.enabled=false) tant que NotificationService n'existe pas.
 * L'eventId sert de clé de déduplication côté NotificationService.
 */
@Slf4j
@Component
public class NotificationClient {

    private final RestClient restClient;
    private final boolean enabled;

    public NotificationClient(@Qualifier("notificationRestClient") RestClient restClient,
                              @Value("${notification.enabled:false}") boolean enabled) {
        this.restClient = restClient;
        this.enabled = enabled;
    }

    public void notifier(String type, Long entiteId, Long destinataireId, String message) {
        String eventId = type + ":" + entiteId + ":" + destinataireId;
        log.info("EVENT type={} eventId={} destinataire={} message={}", type, eventId, destinataireId, message);
        if (!enabled) {
            return;
        }
        try {
            restClient.post()
                    .uri("/api/v1/notifications")
                    .body(Map.of("eventId", eventId, "type", type,
                            "destinataireId", destinataireId, "message", message))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.warn("Notification {} non envoyée (sera à reprendre) : {}", eventId, e.toString());
        }
    }
}
