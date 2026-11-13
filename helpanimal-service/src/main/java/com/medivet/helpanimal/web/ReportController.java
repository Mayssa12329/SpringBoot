package com.medivet.helpanimal.web;

import java.util.List;

import com.medivet.helpanimal.domain.ReportStatus;
import com.medivet.helpanimal.security.CurrentUser;
import com.medivet.helpanimal.service.AcceptMissionService;
import com.medivet.helpanimal.service.ReportService;
import com.medivet.helpanimal.web.dto.LocationUpdateRequest;
import com.medivet.helpanimal.web.dto.ReportCreateRequest;
import com.medivet.helpanimal.web.dto.ReportDetailResponse;
import com.medivet.helpanimal.web.dto.ReportSummaryResponse;
import com.medivet.helpanimal.web.dto.StatusChangeRequest;
import com.medivet.helpanimal.web.dto.StatusHistoryResponse;
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

/** API REST des signalements (US19 a US24). */
@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;
    private final AcceptMissionService acceptMissionService;

    public ReportController(ReportService reportService, AcceptMissionService acceptMissionService) {
        this.reportService = reportService;
        this.acceptMissionService = acceptMissionService;
    }

    /**
     * US19 + US20 : creer un signalement (multipart/form-data).
     * Champs : species, category, description, severity, latitude, longitude ; fichier : photo.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ReportDetailResponse create(@Valid @ParameterObject @ModelAttribute ReportCreateRequest request,
                                       @RequestPart(value = "photo", required = false) MultipartFile photo,
                                       Authentication authentication) {
        return reportService.create(request, photo, CurrentUser.from(authentication));
    }

    /** US20 : corriger la position a la main (auteur uniquement). */
    @PatchMapping("/{id}/location")
    public ReportDetailResponse updateLocation(@PathVariable Long id,
                                               @Valid @RequestBody LocationUpdateRequest request,
                                               Authentication authentication) {
        return reportService.updateLocation(id, request, CurrentUser.from(authentication));
    }

    /**
     * US21 : signalements pour la carte, tries par priorite (RM01).
     * Exemple : /api/reports?status=NOUVEAU&status=QUALIFIE&species=chien&bbox=48.80,2.25,48.90,2.42
     */
    @GetMapping
    public List<ReportSummaryResponse> listForMap(@RequestParam(required = false) List<ReportStatus> status,
                                                  @RequestParam(required = false) String species,
                                                  @RequestParam(required = false) String bbox) {
        return reportService.listForMap(status, species, bbox);
    }

    /** Signalements crees par l'utilisateur connecte. */
    @GetMapping("/mine")
    public List<ReportSummaryResponse> mine(Authentication authentication) {
        return reportService.listMine(CurrentUser.from(authentication));
    }

    /** US22 : signalements proches, filtres par distance et statut. */
    @GetMapping("/nearby")
    @PreAuthorize("hasAnyRole('BENEVOLE', 'INTERVENANT', 'ADMIN')")
    public List<ReportSummaryResponse> nearby(@RequestParam double lat,
                                              @RequestParam double lng,
                                              @RequestParam(required = false) Double radiusKm,
                                              @RequestParam(required = false) ReportStatus status) {
        return reportService.nearby(lat, lng, radiusKm, status);
    }

    /** US23 : un intervenant accepte la mission. */
    @PostMapping("/{id}/accept")
    @PreAuthorize("hasRole('INTERVENANT')")
    public ReportDetailResponse accept(@PathVariable Long id, Authentication authentication) {
        return acceptMissionService.accept(id, CurrentUser.from(authentication));
    }

    /** US24 : faire avancer l'etat (Qualifie, En cours, Termine, Rejete). */
    @PatchMapping("/{id}/status")
    public ReportDetailResponse changeStatus(@PathVariable Long id,
                                             @Valid @RequestBody StatusChangeRequest request,
                                             Authentication authentication) {
        return reportService.changeStatus(id, request, CurrentUser.from(authentication));
    }

    /** US24 : detail ; l'historique n'est inclus que pour les personnes autorisees. */
    @GetMapping("/{id}")
    public ReportDetailResponse get(@PathVariable Long id, Authentication authentication) {
        return reportService.getDetail(id, CurrentUser.from(authentication));
    }

    /** US24 : historique des changements d'etat. */
    @GetMapping("/{id}/history")
    public List<StatusHistoryResponse> history(@PathVariable Long id, Authentication authentication) {
        return reportService.getHistory(id, CurrentUser.from(authentication));
    }
}
