package com.medivet.helpanimal.controller;

import java.util.List;

import com.medivet.helpanimal.security.CurrentUserResolver;
import com.medivet.helpanimal.service.AuditService;
import com.medivet.helpanimal.service.ModerationService;
import com.medivet.helpanimal.dto.AuditLogResponse;
import com.medivet.helpanimal.dto.HideRequest;
import com.medivet.helpanimal.dto.ReportDetailResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** US25 : moderation des signalements (administrateur). */
@RestController
@RequestMapping("/api/v1/admin/reports")
@PreAuthorize("hasRole('ADMINISTRATEUR')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "HelpAnimal - Moderation", description = "Masquage motive et journal d'audit (US25, RM15)")
public class AdminReportController {

    private final ModerationService moderationService;
    private final AuditService auditService;
    private final CurrentUserResolver currentUser;

    public AdminReportController(ModerationService moderationService, AuditService auditService,
                                 CurrentUserResolver currentUser) {
        this.moderationService = moderationService;
        this.auditService = auditService;
        this.currentUser = currentUser;
    }

    @PatchMapping("/{id}/hide")
    @Operation(summary = "Masquer un signalement abusif, avec un motif obligatoire (US25)")
    public ReportDetailResponse hide(@PathVariable Long id,
                                     @Valid @RequestBody HideRequest request,
                                     Authentication authentication) {
        return moderationService.hide(id, request.reason(), currentUser.resolve(authentication));
    }

    @GetMapping("/audit-logs")
    @Operation(summary = "Journal d'audit des actions sensibles de HelpAnimal (RM15)")
    public List<AuditLogResponse> auditLogs() {
        return auditService.findAll().stream().map(AuditLogResponse::from).toList();
    }
}
