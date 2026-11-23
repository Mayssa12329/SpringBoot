package com.medivet.helpanimal.controller;

import java.util.List;

import com.medivet.helpanimal.model.ReportStatus;
import com.medivet.helpanimal.security.CurrentUserResolver;
import com.medivet.helpanimal.service.AcceptMissionService;
import com.medivet.helpanimal.service.MissionReassignmentService;
import com.medivet.helpanimal.service.ReportService;
import com.medivet.helpanimal.dto.DeclineRequest;
import com.medivet.helpanimal.dto.LocationUpdateRequest;
import com.medivet.helpanimal.dto.ReportCreateRequest;
import com.medivet.helpanimal.dto.ReportDetailResponse;
import com.medivet.helpanimal.dto.ReportSummaryResponse;
import com.medivet.helpanimal.dto.StatusChangeRequest;
import com.medivet.helpanimal.dto.StatusHistoryResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** API REST des signalements (US19 a US24). Toutes les routes demandent un jeton UserService. */
@RestController
@RequestMapping("/api/v1/reports")
@PreAuthorize("isAuthenticated()")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "HelpAnimal - Signalements", description = "Signalement, carte, proximite, mission et suivi (US19 a US24)")
public class ReportController {

    private final ReportService reportService;
    private final AcceptMissionService acceptMissionService;
    private final MissionReassignmentService reassignmentService;
    private final CurrentUserResolver currentUser;

    public ReportController(ReportService reportService, AcceptMissionService acceptMissionService,
                            CurrentUserResolver currentUser,
                            MissionReassignmentService reassignmentService) {
        this.reportService = reportService;
        this.acceptMissionService = acceptMissionService;
        this.reassignmentService = reassignmentService;
        this.currentUser = currentUser;
    }

    /**
     * US19 + US20 : creer un signalement (multipart/form-data).
     * Champs : species, category, description, severity, latitude, longitude ; fichier : photo.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Signaler un animal en detresse avec photo et position (US19, US20)")
    public ReportDetailResponse create(@Valid @ParameterObject @ModelAttribute ReportCreateRequest request,
                                       @RequestPart(value = "photo", required = false) MultipartFile photo,
                                       Authentication authentication) {
        return reportService.create(request, photo, currentUser.resolve(authentication));
    }

    @PatchMapping("/{id}/location")
    @Operation(summary = "Corriger la position (auteur uniquement, US20)")
    public ReportDetailResponse updateLocation(@PathVariable Long id,
                                               @Valid @RequestBody LocationUpdateRequest request,
                                               Authentication authentication) {
        return reportService.updateLocation(id, request, currentUser.resolve(authentication));
    }

    /** Exemple : /api/v1/reports?status=NOUVEAU&status=QUALIFIE&species=chien&bbox=36.75,10.10,36.85,10.25 */
    @GetMapping
    @Operation(summary = "Signalements pour la carte, tries par priorite (US21, RM01)")
    public List<ReportSummaryResponse> listForMap(@RequestParam(required = false) List<ReportStatus> status,
                                                  @RequestParam(required = false) String species,
                                                  @RequestParam(required = false) String bbox) {
        return reportService.listForMap(status, species, bbox);
    }

    @GetMapping("/mine")
    @Operation(summary = "Signalements crees par l'utilisateur connecte")
    public List<ReportSummaryResponse> mine(Authentication authentication) {
        return reportService.listMine(currentUser.resolve(authentication));
    }

    @GetMapping("/nearby")
    @PreAuthorize("hasAnyRole('VETERINAIRE', 'ADMINISTRATEUR')")
    @Operation(summary = "Signalements proches, filtres par distance et statut (US22)")
    public List<ReportSummaryResponse> nearby(@RequestParam double lat,
                                              @RequestParam double lng,
                                              @RequestParam(required = false) Double radiusKm,
                                              @RequestParam(required = false) ReportStatus status) {
        return reportService.nearby(lat, lng, radiusKm, status);
    }

    @PostMapping("/{id}/accept")
    @PreAuthorize("hasRole('VETERINAIRE')")
    @Operation(summary = "Accepter la mission de sauvetage, via RescueCoordination en gRPC (US23, RM04)")
    public ReportDetailResponse accept(@PathVariable Long id, Authentication authentication) {
        return acceptMissionService.accept(id, currentUser.resolve(authentication));
    }

    @PostMapping("/{id}/decline")
    @PreAuthorize("hasRole('VETERINAIRE')")
    @Operation(summary = "Se desister d'une mission attribuee : RescueCoordination la rediffuse (US46, RM05)")
    public ReportDetailResponse decline(@PathVariable Long id,
                                        @Valid @RequestBody(required = false) DeclineRequest request,
                                        Authentication authentication) {
        return reassignmentService.decline(id, request == null ? null : request.reason(),
            currentUser.resolve(authentication));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Faire avancer l'etat : Qualifie, En cours, Termine, Rejete (US24, RM03)")
    public ReportDetailResponse changeStatus(@PathVariable Long id,
                                             @Valid @RequestBody StatusChangeRequest request,
                                             Authentication authentication) {
        return reportService.changeStatus(id, request, currentUser.resolve(authentication));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detail ; l'historique n'est inclus que pour les personnes autorisees (US24)")
    public ReportDetailResponse get(@PathVariable Long id, Authentication authentication) {
        return reportService.getDetail(id, currentUser.resolve(authentication));
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Historique des changements d'etat (US24)")
    public List<StatusHistoryResponse> history(@PathVariable Long id, Authentication authentication) {
        return reportService.getHistory(id, currentUser.resolve(authentication));
    }
}
