package com.medivet.rescue.grpc;

import java.util.List;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Consumer;

import com.medivet.rescue.service.MissionNotification;
import io.grpc.stub.ServerCallStreamObserver;
import io.grpc.stub.StreamObserver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Server streaming (US46, US47) : pousse chaque evenement de mission aux clients abonnes
 * a WatchMissions, et aux canaux de dispatch bidirectionnels. Un evenement n'est diffuse qu'apres la validation de sa transaction :
 * un abonne ne recoit jamais un etat annule.
 */
@Component
public class MissionEventBroadcaster {

    private static final Logger log = LoggerFactory.getLogger(MissionEventBroadcaster.class);

    private final List<Subscriber> subscribers = new CopyOnWriteArrayList<>();

    /** Canaux de dispatch (flux bidirectionnels) a l'ecoute des missions. */
    private final List<Consumer<MissionNotification>> listeners = new CopyOnWriteArrayList<>();

    /** Un StreamObserver n'est pas thread-safe : chaque envoi est synchronise sur son abonne. */
    private record Subscriber(ServerCallStreamObserver<com.medivet.rescue.grpc.MissionEvent> observer,
                              Set<MissionEventType> types) {

        boolean wants(MissionEventType type) {
            return types.isEmpty() || types.contains(type);
        }
    }

    public void subscribe(StreamObserver<com.medivet.rescue.grpc.MissionEvent> observer, Set<MissionEventType> types) {
        ServerCallStreamObserver<com.medivet.rescue.grpc.MissionEvent> serverObserver =
            (ServerCallStreamObserver<com.medivet.rescue.grpc.MissionEvent>) observer;
        Subscriber subscriber = new Subscriber(serverObserver, types);
        serverObserver.setOnCancelHandler(() -> subscribers.remove(subscriber));
        subscribers.add(subscriber);
        log.info("Nouvel abonne au flux des missions ({} au total)", subscribers.size());
    }

    /** Inscrit un auditeur ; le Runnable renvoye le desinscrit. */
    public Runnable addListener(Consumer<MissionNotification> listener) {
        listeners.add(listener);
        return () -> listeners.remove(listener);
    }

    public int listenerCount() {
        return listeners.size();
    }

    public int subscriberCount() {
        return subscribers.size();
    }

    @TransactionalEventListener(fallbackExecution = true)
    public void onMissionChanged(MissionNotification notification) {
        com.medivet.rescue.grpc.MissionEvent event = MissionMapper.toProto(notification);
        for (Subscriber subscriber : subscribers) {
            if (!subscriber.wants(event.getType())) {
                continue;
            }
            synchronized (subscriber) {
                try {
                    if (subscriber.observer().isCancelled()) {
                        subscribers.remove(subscriber);
                    } else {
                        subscriber.observer().onNext(event);
                    }
                } catch (RuntimeException e) {
                    log.warn("Abonne deconnecte, retire du flux : {}", e.getMessage());
                    subscribers.remove(subscriber);
                }
            }
        }
        for (Consumer<MissionNotification> listener : listeners) {
            try {
                listener.accept(notification);
            } catch (RuntimeException e) {
                log.warn("Canal de dispatch en erreur : {}", e.getMessage());
            }
        }
    }
}
