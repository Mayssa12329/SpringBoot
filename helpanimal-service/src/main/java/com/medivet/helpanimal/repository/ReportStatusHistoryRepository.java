package com.medivet.helpanimal.repository;

import java.util.List;

import com.medivet.helpanimal.domain.ReportStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportStatusHistoryRepository extends JpaRepository<ReportStatusHistory, Long> {

    List<ReportStatusHistory> findByReportIdOrderByChangedAtAscIdAsc(Long reportId);
}
