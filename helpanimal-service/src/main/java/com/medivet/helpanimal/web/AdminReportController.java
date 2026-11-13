package com.medivet.helpanimal.web;

import java.util.List;

import com.medivet.helpanimal.security.CurrentUser;
import com.medivet.helpanimal.service.AuditService;
import com.medivet.helpanimal.service.ModerationService;
import com.medivet.helpanimal.web.dto.AuditLogResponse;
import com.medivet.helpanimal.web.dto.HideRequest;
import com.medivet.helpanimal.web.dto.ReportDetailResponse;
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
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportController {

    private final ModerationService moderationService;
    private final AuditService auditService;

    public AdminReportController(ModerationService moderationService, AuditService auditService) {
        this.moderationService = moderationService;
        this.auditService = auditService;
    }

    /** Masquer un signalement abusif, avec un motif obligatoire. */
    @PatchMapping("/reports/{id}/hide")
    public ReportDetailResponse hide(@PathVariable Long id,
                                     @Valid @RequestBody HideRequest request,
                                     Authentication authentication) {
        return moderationService.hide(id, request.reason(), CurrentUser.from(authentication));
    }

    /** RM15 : consulter le journal d'audit. */
    @GetMapping("/audit-logs")
    public List<AuditLogResponse> auditLogs() {
        return auditService.findAll().stream().map(AuditLogResponse::from).toList();
    }
}
