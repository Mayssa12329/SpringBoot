package com.medivet.helpanimal.service;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import com.medivet.helpanimal.config.HelpAnimalProperties;
import com.medivet.helpanimal.domain.DuplicateDetector;
import com.medivet.helpanimal.domain.GeoUtils;
import com.medivet.helpanimal.domain.PriorityCalculator;
import com.medivet.helpanimal.domain.Report;
import com.medivet.helpanimal.domain.ReportStateMachine;
import com.medivet.helpanimal.domain.ReportStatus;
import com.medivet.helpanimal.domain.ReportStatusHistory;
import com.medivet.helpanimal.exception.BadRequestException;
import com.medivet.helpanimal.exception.DuplicateReportException;
import com.medivet.helpanimal.exception.ForbiddenActionException;
import com.medivet.helpanimal.exception.InvalidTransitionException;
import com.medivet.helpanimal.exception.NotFoundException;
import com.medivet.helpanimal.repository.ReportRepository;
import com.medivet.helpanimal.repository.ReportStatusHistoryRepository;
import com.medivet.helpanimal.security.CurrentUser;
import com.medivet.helpanimal.security.Role;
import com.medivet.helpanimal.web.dto.LocationUpdateRequest;
import com.medivet.helpanimal.web.dto.ReportCreateRequest;
import com.medivet.helpanimal.web.dto.ReportDetailResponse;
import com.medivet.helpanimal.web.dto.ReportSummaryResponse;
import com.medivet.helpanimal.web.dto.StatusChangeRequest;
import com.medivet.helpanimal.web.dto.StatusHistoryResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/** Signalements : creation (US19, US20), carte (US21), proximite (US22), suivi (US24). */
@Service
public class ReportService {

    /** Etats qu'on peut afficher sur la carte. Masque n'est jamais public. */
    private static final Set<ReportStatus> MAP_VISIBLE = EnumSet.of(
        ReportStatus.NOUVEAU, ReportStatus.QUALIFIE, ReportStatus.ATTRIBUE,
        ReportStatus.EN_COURS, ReportStatus.TERMINE, ReportStatus.REJETE);

    private final ReportRepository reportRepository;
    private final ReportStatusHistoryRepository historyRepository;
    private final PhotoValidator photoValidator;
    private final StorageService storageService;
    private final DuplicateDetector duplicateDetector;
    private final ReportStateMachine stateMachine;
    private final PriorityCalculator priorityCalculator;
    private final ReportMapper mapper;
    private final AuditService auditService;
    private final PetPassClient petPassClient;
    private final HelpAnimalProperties properties;
    private final Clock clock;

    public ReportService(ReportRepository reportRepository,
                         ReportStatusHistoryRepository historyRepository,
                         PhotoValidator photoValidator,
                         StorageService storageService,
                         DuplicateDetector duplicateDetector,
                         ReportStateMachine stateMachine,
                         PriorityCalculator priorityCalculator,
                         ReportMapper mapper,
                         AuditService auditService,
                         PetPassClient petPassClient,
                         HelpAnimalProperties properties,
                         Clock clock) {
        this.reportRepository = reportRepository;
        this.historyRepository = historyRepository;
        this.photoValidator = photoValidator;
        this.storageService = storageService;
        this.duplicateDetector = duplicateDetector;
        this.stateMachine = stateMachine;
        this.priorityCalculator = priorityCalculator;
        this.mapper = mapper;
        this.auditService = auditService;
        this.petPassClient = petPassClient;
        this.properties = properties;
        this.clock = clock;
    }

    // ---------------------------------------------------------------- US19 + US20

    @Transactional
    public ReportDetailResponse create(ReportCreateRequest request, MultipartFile photo, CurrentUser user) {
        String extension = photoValidator.validate(photo);
        String species = normalizeSpecies(request.getSpecies());

        // RM02 : doublon -> creation refusee, renvoi vers le signalement existant
        duplicateDetector.findDuplicate(species, request.getLatitude(), request.getLongitude())
            .ifPresent(existing -> {
                throw new DuplicateReportException(existing.getId());
            });

        String photoUrl = storageService.store(photo, extension);
        Instant now = clock.instant();
        Report report = new Report(species, request.getCategory(), request.getDescription().trim(),
            request.getSeverity(), photoUrl, request.getLatitude(), request.getLongitude(), user.id(), now);
        report = reportRepository.save(report);

        ReportStatusHistory first = historyRepository.save(new ReportStatusHistory(
            report.getId(), null, ReportStatus.NOUVEAU, user.id(), "Signalement cree", now));
        return mapper.toFullDetail(report, List.of(first));
    }

    @Transactional
    public ReportDetailResponse updateLocation(Long id, LocationUpdateRequest request, CurrentUser user) {
        Report report = findReport(id, user);
        if (!report.getReporterId().equals(user.id()) && !user.isAdmin()) {
            throw new ForbiddenActionException("Seul l'auteur du signalement peut corriger la position");
        }
        if (report.getStatus() != ReportStatus.NOUVEAU && report.getStatus() != ReportStatus.QUALIFIE) {
            throw new InvalidTransitionException(
                "La position n'est plus modifiable une fois la mission attribuee (etat " + report.getStatus() + ")");
        }
        // RM02 : deplacer un signalement ne doit pas recreer un doublon
        duplicateDetector.findDuplicateOf(report, request.latitude(), request.longitude())
            .ifPresent(existing -> {
                throw new DuplicateReportException(existing.getId());
            });
        report.moveTo(request.latitude(), request.longitude(), clock.instant());
        return mapper.toFullDetail(report, historyRepository.findByReportIdOrderByChangedAtAscIdAsc(id));
    }

    // ---------------------------------------------------------------- US21

    /**
     * @param statuses filtre de statuts (par defaut : signalements actifs)
     * @param species  filtre d'espece (optionnel)
     * @param bbox     zone visible "minLat,minLng,maxLat,maxLng" (optionnel)
     */
    @Transactional(readOnly = true)
    public List<ReportSummaryResponse> listForMap(List<ReportStatus> statuses, String species, String bbox) {
        Set<ReportStatus> wanted = EnumSet.noneOf(ReportStatus.class);
        if (statuses == null || statuses.isEmpty()) {
            wanted.addAll(ReportStatus.ACTIVE);
        } else {
            wanted.addAll(statuses);
        }
        wanted.retainAll(MAP_VISIBLE);
        if (wanted.isEmpty()) {
            return List.of();
        }

        GeoUtils.BoundingBox box = parseBbox(bbox);
        String speciesFilter = species == null || species.isBlank() ? null : normalizeSpecies(species);

        return reportRepository.findByStatusIn(wanted).stream()
            .filter(r -> speciesFilter == null || r.getSpecies().equals(speciesFilter))
            .filter(r -> box == null || box.contains(r.getLatitude(), r.getLongitude()))
            .sorted(priorityCalculator.byPriorityDesc())
            .map(r -> mapper.toSummary(r, null))
            .toList();
    }

    // ---------------------------------------------------------------- US22

    @Transactional(readOnly = true)
    public List<ReportSummaryResponse> nearby(double lat, double lng, Double radiusKm, ReportStatus status) {
        if (!GeoUtils.isValidLatitude(lat) || !GeoUtils.isValidLongitude(lng)) {
            throw new BadRequestException("Position invalide");
        }
        double radius = radiusKm == null ? properties.nearby().defaultRadiusKm() : radiusKm;
        if (radius <= 0 || radius > properties.nearby().maxRadiusKm()) {
            throw new BadRequestException("Le rayon doit etre entre 0 et " + properties.nearby().maxRadiusKm() + " km");
        }
        if (status == ReportStatus.MASQUE) {
            throw new BadRequestException("Les signalements masques ne sont pas consultables ici");
        }
        Set<ReportStatus> statuses = status == null ? ReportStatus.ACTIVE : EnumSet.of(status);
        double radiusMeters = radius * 1000;
        GeoUtils.BoundingBox box = GeoUtils.boundingBox(lat, lng, radiusMeters);

        List<ReportWithDistance> found = new ArrayList<>();
        for (Report r : reportRepository.findByStatusInAndLatitudeBetweenAndLongitudeBetween(
                statuses, box.minLat(), box.maxLat(), box.minLng(), box.maxLng())) {
            double d = GeoUtils.distanceMeters(lat, lng, r.getLatitude(), r.getLongitude());
            if (d <= radiusMeters) {
                found.add(new ReportWithDistance(r, d));
            }
        }

        Comparator<ReportWithDistance> order = Comparator
            .comparing(ReportWithDistance::report, priorityCalculator.byPriorityDesc())
            .thenComparingDouble(ReportWithDistance::distance);

        return found.stream()
            .sorted(order)
            .map(rd -> mapper.toSummary(rd.report(), Math.round(rd.distance())))
            .toList();
    }

    private record ReportWithDistance(Report report, double distance) { }

    // ---------------------------------------------------------------- Mes signalements

    @Transactional(readOnly = true)
    public List<ReportSummaryResponse> listMine(CurrentUser user) {
        return reportRepository
            .findByReporterIdAndStatusNotOrderByCreatedAtDescIdDesc(user.id(), ReportStatus.MASQUE).stream()
            .map(r -> mapper.toSummary(r, null))
            .toList();
    }

    // ---------------------------------------------------------------- US24

    @Transactional(readOnly = true)
    public ReportDetailResponse getDetail(Long id, CurrentUser user) {
        Report report = findReport(id, user);
        if (canSeeHistory(report, user)) {
            return mapper.toFullDetail(report, historyRepository.findByReportIdOrderByChangedAtAscIdAsc(id));
        }
        return mapper.toPublicDetail(report);
    }

    @Transactional(readOnly = true)
    public List<StatusHistoryResponse> getHistory(Long id, CurrentUser user) {
        Report report = findReport(id, user);
        if (!canSeeHistory(report, user)) {
            throw new ForbiddenActionException(
                "L'historique est visible par l'auteur, l'intervenant attribue et l'administrateur");
        }
        return historyRepository.findByReportIdOrderByChangedAtAscIdAsc(id).stream()
            .map(StatusHistoryResponse::from)
            .toList();
    }

    /**
     * Changement d'etat manuel. Attribue passe par POST /accept (US23)
     * et Masque par la moderation (US25).
     */
    @Transactional
    public ReportDetailResponse changeStatus(Long id, StatusChangeRequest request, CurrentUser user) {
        Report report = findReport(id, user);
        ReportStatus target = request.status();

        if (target == ReportStatus.ATTRIBUE) {
            throw new InvalidTransitionException("Pour attribuer une mission, utiliser POST /api/reports/{id}/accept");
        }
        if (target == ReportStatus.MASQUE) {
            throw new InvalidTransitionException("Pour masquer, utiliser PATCH /api/admin/reports/{id}/hide");
        }
        checkStatusPermission(report, target, user);

        ReportStatusHistory history = stateMachine.transition(report, target, user.id(), request.comment(), clock.instant());
        historyRepository.save(history);

        if (target == ReportStatus.REJETE) {
            auditService.log(AuditService.ACTION_REPORT_REJECTED, AuditService.TARGET_REPORT,
                report.getId(), user.id(), request.comment());
        }
        if (target == ReportStatus.TERMINE) {
            petPassClient.openCareFile(report);
        }
        return mapper.toFullDetail(report, historyRepository.findByReportIdOrderByChangedAtAscIdAsc(id));
    }

    private void checkStatusPermission(Report report, ReportStatus target, CurrentUser user) {
        if (user.isAdmin()) {
            return;
        }
        switch (target) {
            case QUALIFIE, REJETE -> {
                if (!user.hasAnyRole(Role.BENEVOLE, Role.INTERVENANT)) {
                    throw new ForbiddenActionException("Seuls un benevole, un intervenant ou un admin peuvent qualifier ou rejeter");
                }
            }
            case EN_COURS, TERMINE -> {
                if (!user.id().equals(report.getAssigneeId())) {
                    throw new ForbiddenActionException("Seul l'intervenant attribue peut faire avancer le sauvetage");
                }
            }
            default -> {
                // NOUVEAU : la machine a etats refusera la transition (409)
            }
        }
    }

    // ---------------------------------------------------------------- utilitaires

    /** Un signalement masque n'existe que pour l'administrateur. */
    Report findReport(Long id, CurrentUser user) {
        Report report = reportRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Signalement " + id + " introuvable"));
        if (report.getStatus() == ReportStatus.MASQUE && !user.isAdmin()) {
            throw new NotFoundException("Signalement " + id + " introuvable");
        }
        return report;
    }

    private boolean canSeeHistory(Report report, CurrentUser user) {
        return user.isAdmin()
            || user.id().equals(report.getReporterId())
            || user.id().equals(report.getAssigneeId());
    }

    static String normalizeSpecies(String species) {
        return species.trim().toLowerCase(Locale.ROOT);
    }

    private static GeoUtils.BoundingBox parseBbox(String bbox) {
        if (bbox == null || bbox.isBlank()) {
            return null;
        }
        String[] parts = bbox.split(",");
        if (parts.length != 4) {
            throw new BadRequestException("bbox attendu : minLat,minLng,maxLat,maxLng");
        }
        try {
            double minLat = Double.parseDouble(parts[0].trim());
            double minLng = Double.parseDouble(parts[1].trim());
            double maxLat = Double.parseDouble(parts[2].trim());
            double maxLng = Double.parseDouble(parts[3].trim());
            return new GeoUtils.BoundingBox(minLat, maxLat, minLng, maxLng);
        } catch (NumberFormatException e) {
            throw new BadRequestException("bbox attendu : minLat,minLng,maxLat,maxLng");
        }
    }
}
