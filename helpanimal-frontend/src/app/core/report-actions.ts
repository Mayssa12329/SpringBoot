import { ReportDetail, Session } from './models';

export interface ReportActions {
  qualify: boolean;
  reject: boolean;
  accept: boolean;
  start: boolean;
  finish: boolean;
  hide: boolean;
  relocate: boolean;
}

/**
 * Boutons a proposer : memes regles que ReportService.checkStatusPermission (RM03).
 * VETERINAIRE joue le benevole (qualifier, rejeter) et l'intervenant (accepter, faire avancer).
 * Simple confort d'affichage, le backend reste le seul a decider.
 */
export function availableActions(report: ReportDetail, session: Session | null): ReportActions {
  const role = session?.role;
  const userId = session?.userId;
  const isAdmin = role === 'ADMINISTRATEUR';
  const isRescuer = role === 'VETERINAIRE';
  const canQualify = isAdmin || isRescuer;
  const canAdvance = isAdmin || (userId !== undefined && report.assigneeId === userId);
  const beforeAssignment = report.status === 'NOUVEAU' || report.status === 'QUALIFIE';

  return {
    qualify: canQualify && report.status === 'NOUVEAU',
    reject: canQualify && beforeAssignment,
    accept: isRescuer && report.status === 'QUALIFIE',
    start: canAdvance && report.status === 'ATTRIBUE',
    finish: canAdvance && report.status === 'EN_COURS',
    hide: isAdmin && beforeAssignment,
    relocate:
      beforeAssignment && (isAdmin || (userId !== undefined && report.reporterId === userId)),
  };
}
