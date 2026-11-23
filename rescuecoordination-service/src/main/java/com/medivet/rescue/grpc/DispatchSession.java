package com.medivet.rescue.grpc;

import java.util.List;
import java.util.function.Consumer;

import com.medivet.rescue.model.Mission;
import com.medivet.rescue.service.MissionNotFoundException;
import com.medivet.rescue.service.MissionNotification;
import com.medivet.rescue.service.MissionService;
import com.medivet.rescue.service.MissionStateException;
import io.grpc.stub.ServerCallStreamObserver;
import io.grpc.stub.StreamObserver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Flux bidirectionnel Dispatch : canal d'un intervenant connecte.
 * <ul>
 *   <li>Intervenant -> serveur : CONNECT (d'abord), puis ACCEPT, DECLINE, START.</li>
 *   <li>Serveur -> intervenant : OFFER (mission a prendre, y compris celles deja ouvertes a la connexion),
 *       WITHDRAWN (prise par un autre ou en escalade), et une reponse CONFIRMED ou REFUSED a chaque commande.</li>
 * </ul>
 * Les regles sont celles des appels unaires (MissionService) : RM04, RM05, US46.
 * Un refus metier ne ferme pas le canal ; l'intervenant peut continuer.
 * Les envois viennent de deux fils (commandes de l'intervenant, evenements des autres missions) :
 * ils sont synchronises, un StreamObserver n'etant pas thread-safe.
 */
final class DispatchSession implements StreamObserver<DispatchCommand>, Consumer<MissionNotification> {

    private static final Logger log = LoggerFactory.getLogger(DispatchSession.class);

    private final MissionService missions;
    private final MissionEventBroadcaster broadcaster;
    private final ServerCallStreamObserver<DispatchEvent> out;
    private volatile Long intervenantId;
    private volatile Runnable unregister;
    private volatile boolean closed;

    DispatchSession(MissionService missions, MissionEventBroadcaster broadcaster, ServerCallStreamObserver<DispatchEvent> out) {
        this.missions = missions;
        this.broadcaster = broadcaster;
        this.out = out;
        out.setOnCancelHandler(this::close);
    }

    // ---------------------------------------------------------------- commandes de l'intervenant

    @Override
    public void onNext(DispatchCommand command) {
        try {
            switch (command.getAction()) {
                case CONNECT -> connect(command);
                case ACCEPT -> acceptMission(command);
                case DECLINE -> decline(command);
                case START -> start(command);
                default -> throw new IllegalArgumentException("Action inconnue");
            }
        } catch (IllegalArgumentException | MissionNotFoundException | MissionStateException e) {
            send(answer(DispatchEvent.Kind.REFUSED, command).setMessage(e.getMessage()).build());
        } catch (RuntimeException e) {
            log.error("Erreur dans le canal de dispatch", e);
            send(answer(DispatchEvent.Kind.REFUSED, command).setMessage("Erreur interne").build());
        }
    }

    private void connect(DispatchCommand command) {
        if (intervenantId != null) {
            throw new IllegalArgumentException("Intervenant deja connecte sur ce canal");
        }
        intervenantId = RescueCoordinationGrpcService.id(command.getIntervenantId(), "intervenant_id");
        // Inscription avant la lecture des missions ouvertes : aucune diffusion ne peut etre perdue
        unregister = broadcaster.addListener(this);
        List<Mission> open = missions.openMissions();
        open.forEach(mission -> send(withMission(DispatchEvent.newBuilder().setKind(DispatchEvent.Kind.OFFER), mission)
            .setMessage("Mission a prendre").build()));
        send(answer(DispatchEvent.Kind.CONFIRMED, command)
            .setMessage("Intervenant " + intervenantId + " connecte, " + open.size() + " mission(s) ouverte(s)").build());
        log.info("Intervenant {} connecte au dispatch", intervenantId);
    }

    private void acceptMission(DispatchCommand command) {
        Long reportId = reportId(command);
        Long me = connected();
        Mission mission = missions.find(reportId);
        MissionService.AssignOutcome outcome = missions.assign(reportId, me, mission.getLatitude(),
            mission.getLongitude(), mission.getSeverity());
        boolean won = outcome.result() == MissionService.AssignResult.ASSIGNED;
        send(withMission(answer(won ? DispatchEvent.Kind.CONFIRMED : DispatchEvent.Kind.REFUSED, command),
            missions.find(reportId)).setMessage(outcome.message()).build());
    }

    private void decline(DispatchCommand command) {
        Mission mission = missions.decline(reportId(command), connected(), command.getReason());
        send(withMission(answer(DispatchEvent.Kind.CONFIRMED, command), mission)
            .setMessage("Desistement enregistre").build());
    }

    private void start(DispatchCommand command) {
        Mission mission = missions.updateStatus(reportId(command), connected(),
            com.medivet.rescue.model.MissionStatus.IN_PROGRESS);
        send(withMission(answer(DispatchEvent.Kind.CONFIRMED, command), mission)
            .setMessage("Intervention demarree").build());
    }

    private Long connected() {
        Long id = intervenantId;
        if (id == null) {
            throw new IllegalArgumentException("Envoyer d'abord CONNECT avec l'identifiant de l'intervenant");
        }
        return id;
    }

    private static Long reportId(DispatchCommand command) {
        return RescueCoordinationGrpcService.id(command.getReportId(), "report_id");
    }

    // ---------------------------------------------------------------- evenements des missions

    /** Appele par MissionEventBroadcaster apres la validation en base de chaque evenement. */
    @Override
    public void accept(MissionNotification notification) {
        DispatchEvent.Kind kind = switch (notification.type()) {
            case PUBLISHED, REASSIGNED -> DispatchEvent.Kind.OFFER;
            // Sa propre acceptation est deja confirmee par la reponse a ACCEPT
            case ASSIGNED -> notification.intervenantId() != null && notification.intervenantId().equals(intervenantId)
                ? null : DispatchEvent.Kind.WITHDRAWN;
            case ESCALATED -> DispatchEvent.Kind.WITHDRAWN;
            default -> null;
        };
        if (kind == null) {
            return;
        }
        send(DispatchEvent.newBuilder()
            .setKind(kind)
            .setMissionId(notification.missionId())
            .setReportId(String.valueOf(notification.reportId()))
            .setStatus(MissionMapper.toProto(notification.status()))
            .setLatitude(notification.latitude())
            .setLongitude(notification.longitude())
            .setSeverity(notification.severity())
            .setSpecies(notification.species() == null ? "" : notification.species())
            .setMessage(notification.message())
            .build());
    }

    // ---------------------------------------------------------------- fin du canal

    @Override
    public void onError(Throwable error) {
        close();
    }

    @Override
    public void onCompleted() {
        close();
        synchronized (this) {
            if (!out.isCancelled()) {
                out.onCompleted();
            }
        }
    }

    private void close() {
        closed = true;
        Runnable remove = unregister;
        if (remove != null) {
            unregister = null;
            remove.run();
            log.info("Intervenant {} deconnecte du dispatch", intervenantId);
        }
    }

    private synchronized void send(DispatchEvent event) {
        if (closed || out.isCancelled()) {
            return;
        }
        try {
            out.onNext(event);
        } catch (RuntimeException e) {
            log.warn("Canal de dispatch ferme : {}", e.getMessage());
            close();
        }
    }

    // ---------------------------------------------------------------- construction des messages

    private static DispatchEvent.Builder answer(DispatchEvent.Kind kind, DispatchCommand command) {
        return DispatchEvent.newBuilder().setKind(kind).setAction(command.getAction()).setReportId(command.getReportId());
    }

    private static DispatchEvent.Builder withMission(DispatchEvent.Builder event, Mission mission) {
        return event.setMissionId(mission.getMissionId())
            .setReportId(String.valueOf(mission.getReportId()))
            .setStatus(MissionMapper.toProto(mission.getStatus()))
            .setLatitude(mission.getLatitude())
            .setLongitude(mission.getLongitude())
            .setSeverity(mission.getSeverity())
            .setSpecies(mission.getSpecies() == null ? "" : mission.getSpecies());
    }
}
