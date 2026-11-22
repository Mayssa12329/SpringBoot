import { ReportDetail, ReportStatus, Role, Session } from './models';
import { availableActions } from './report-actions';

const report = (status: ReportStatus, extra: Partial<ReportDetail> = {}): ReportDetail => ({
  id: 1,
  species: 'chien',
  category: 'BLESSE',
  description: 'd',
  severity: 3,
  photoUrl: '/helpanimal/photos/a.png',
  latitude: 36,
  longitude: 10,
  status,
  createdAt: '',
  updatedAt: '',
  priorityScore: 1,
  ...extra,
});

const as = (role: Role, userId = 5): Session => ({
  role,
  userId,
  token: 't',
  name: 'Test',
  email: 't@medivet.test',
});

describe('availableActions', () => {
  it('un citoyen ne peut que corriger la position de son signalement', () => {
    const actions = availableActions(report('NOUVEAU', { reporterId: 5 }), as('UTILISATEUR'));
    expect(actions.relocate).toBe(true);
    expect(actions.qualify || actions.reject || actions.accept || actions.hide).toBe(false);
  });

  it("un citoyen ne corrige pas le signalement d'un autre", () => {
    const actions = availableActions(report('NOUVEAU', { reporterId: 6 }), as('UTILISATEUR'));
    expect(actions.relocate).toBe(false);
  });

  it('seul un veterinaire (intervenant) accepte une mission qualifiee', () => {
    expect(availableActions(report('QUALIFIE'), as('VETERINAIRE')).accept).toBe(true);
    expect(availableActions(report('NOUVEAU'), as('VETERINAIRE')).accept).toBe(false);
    expect(availableActions(report('QUALIFIE'), as('UTILISATEUR')).accept).toBe(false);
    expect(availableActions(report('QUALIFIE'), as('ADMINISTRATEUR')).accept).toBe(false);
  });

  it("seul l'intervenant attribue fait avancer le sauvetage", () => {
    const own = report('ATTRIBUE', { assigneeId: 5 });
    expect(availableActions(own, as('VETERINAIRE')).start).toBe(true);
    expect(availableActions(report('ATTRIBUE', { assigneeId: 9 }), as('VETERINAIRE')).start).toBe(
      false,
    );
    expect(availableActions(report('EN_COURS', { assigneeId: 5 }), as('VETERINAIRE')).finish).toBe(
      true,
    );
  });

  it("le masquage est reserve a l'admin, avant attribution (RM03)", () => {
    expect(availableActions(report('QUALIFIE'), as('ADMINISTRATEUR')).hide).toBe(true);
    expect(availableActions(report('ATTRIBUE'), as('ADMINISTRATEUR')).hide).toBe(false);
    expect(availableActions(report('NOUVEAU'), as('VETERINAIRE')).hide).toBe(false);
  });
});
