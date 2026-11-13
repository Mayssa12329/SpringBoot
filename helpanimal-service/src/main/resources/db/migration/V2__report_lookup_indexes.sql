-- US25 : chaque requete sur /photos/** retrouve le statut du signalement par sa photo.
-- Chaque photo a un nom UUID : elle appartient a un seul signalement.
CREATE UNIQUE INDEX uk_report_photo_url ON report (photo_url);

-- Onglet "Mes signalements"
CREATE INDEX idx_report_reporter ON report (reporter_id);
