import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MyAppointmentsComponent } from './my-appointments.component';
import { AppointmentResponse, AppointmentStatus } from '../../models/appointment.model';
import { APP_CONFIG } from '../../config/app-config';
import { routes } from '../../app.routes';

/** Factory for test appointments */
function makeAppt(id: number, status: AppointmentStatus, vetId = 1): AppointmentResponse {
  return {
    id, slotId: id * 10, slotStartTime: '2026-11-10T09:00:00',
    slotEndTime: '2026-11-10T09:30:00',
    vetId, vetFullName: 'Dr Sarah Ben Ali',
    ownerId: APP_CONFIG.currentUserId, consultationType: 'GENERAL',
    status, createdAt: '2026-11-01T10:00:00'
  };
}

describe('MyAppointmentsComponent — US16', () => {
  let component: MyAppointmentsComponent;
  let fixture: ComponentFixture<MyAppointmentsComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyAppointmentsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(routes)
      ]
    }).compileComponents();

    fixture   = TestBed.createComponent(MyAppointmentsComponent);
    component = fixture.componentInstance;
    http      = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
    // Flush the initial loadAppointments() call
    http.expectOne(r => r.url.includes(`/appointments/owner/${APP_CONFIG.currentUserId}`)).flush([]);
  });

  afterEach(() => http.verify());

  // ── 1. APP_CONFIG ─────────────────────────────────────────────────────────

  it('ownerId comes from APP_CONFIG.currentUserId (not hardcoded)', () => {
    expect(component.ownerId).toBe(APP_CONFIG.currentUserId);
    // TODO (US01): when AuthService is ready, this will use authService.getCurrentUserId()
  });

  it('loadAppointments() calls GET /appointments/owner/{currentUserId}', () => {
    component.loadAppointments();
    const req = http.expectOne(r =>
      r.url.includes(`/appointments/owner/${APP_CONFIG.currentUserId}`)
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  // ── 2. Load ───────────────────────────────────────────────────────────────

  it('loads and displays appointments on init', () => {
    component.loadAppointments();
    const appts = [makeAppt(1,'CONFIRMED'), makeAppt(2,'CANCELLED')];
    http.expectOne(r => r.url.includes('/appointments/owner')).flush(appts);
    expect(component.appointments.length).toBe(2);
  });

  it('shows error when server unreachable', () => {
    component.loadAppointments();
    http.expectOne(r => r.url.includes('/appointments/owner'))
        .error(new ProgressEvent('error'), { status: 0 });
    expect(component.errorMsg).toContain('Cannot reach');
  });

  it('shows server error message on 500', () => {
    component.loadAppointments();
    http.expectOne(r => r.url.includes('/appointments/owner'))
        .flush({ message: 'Internal error' }, { status: 500, statusText: 'Error' });
    expect(component.errorMsg).toContain('500');
  });

  // ── 3. Filter ─────────────────────────────────────────────────────────────

  it('setFilter(ALL) shows all appointments', () => {
    component.appointments = [makeAppt(1,'CONFIRMED'), makeAppt(2,'CANCELLED'), makeAppt(3,'COMPLETED')];
    component.setFilter('ALL');
    expect(component.filteredAppointments.length).toBe(3);
  });

  it('setFilter(CONFIRMED) shows only CONFIRMED', () => {
    component.appointments = [makeAppt(1,'CONFIRMED'), makeAppt(2,'CANCELLED')];
    component.setFilter('CONFIRMED');
    expect(component.filteredAppointments.length).toBe(1);
    expect(component.filteredAppointments[0].status).toBe('CONFIRMED');
  });

  it('setFilter(CANCELLED) shows only CANCELLED', () => {
    component.appointments = [makeAppt(1,'CONFIRMED'), makeAppt(2,'CANCELLED'), makeAppt(3,'LATE_CANCELLED')];
    component.setFilter('CANCELLED');
    expect(component.filteredAppointments.length).toBe(1);
  });

  // ── 4. counts ─────────────────────────────────────────────────────────────

  it('counts returns correct numbers', () => {
    component.appointments = [
      makeAppt(1,'CONFIRMED'), makeAppt(2,'CONFIRMED'),
      makeAppt(3,'CANCELLED'), makeAppt(4,'COMPLETED')
    ];
    expect(component.counts['ALL']).toBe(4);
    expect(component.counts['CONFIRMED']).toBe(2);
    expect(component.counts['CANCELLED']).toBe(1);
    expect(component.counts['COMPLETED']).toBe(1);
  });

  // ── 5. isModifiable ───────────────────────────────────────────────────────

  it('isModifiable returns true for CONFIRMED', () => {
    expect(component.isModifiable(makeAppt(1,'CONFIRMED'))).toBeTrue();
  });

  it('isModifiable returns true for PENDING', () => {
    expect(component.isModifiable(makeAppt(1,'PENDING'))).toBeTrue();
  });

  it('isModifiable returns false for CANCELLED', () => {
    expect(component.isModifiable(makeAppt(1,'CANCELLED'))).toBeFalse();
  });

  it('isModifiable returns false for COMPLETED', () => {
    expect(component.isModifiable(makeAppt(1,'COMPLETED'))).toBeFalse();
  });

  // ── 6. Cancel flow ────────────────────────────────────────────────────────

  it('askCancel() sets confirmCancelId', () => {
    component.askCancel(42);
    expect(component.confirmCancelId).toBe(42);
  });

  it('dismissCancel() clears confirmCancelId', () => {
    component.confirmCancelId = 42;
    component.dismissCancel();
    expect(component.confirmCancelId).toBeNull();
  });

  it('confirmCancel() PATCHes /appointments/{id}/cancel (US17 trigger)', fakeAsync(() => {
    component.confirmCancelId = 5;
    component.confirmCancel();

    http.expectOne(r => r.url.includes('/appointments/5/cancel') && r.method === 'PATCH')
        .flush(makeAppt(5, 'CANCELLED'));

    http.expectOne(r => r.url.includes('/appointments/owner')).flush([]);

    expect(component.successMsg).toContain('cancelled');
    expect(component.successMsg).toContain('US17');
    tick(4000);
  }));

  it('confirmCancel() shows error on 422', fakeAsync(() => {
    component.confirmCancelId = 5;
    component.confirmCancel();
    http.expectOne(r => r.url.includes('/appointments/5/cancel'))
        .flush({ message: 'Cannot cancel completed' }, { status: 422, statusText: 'Error' });
    expect(component.errorMsg).toContain('Cannot cancel');
  }));

  // ── 7. Reschedule flow ────────────────────────────────────────────────────

  it('startReschedule() sets reschedulingId and loads available slots', () => {
    const appt = makeAppt(10, 'CONFIRMED');
    component.startReschedule(appt);

    expect(component.reschedulingId).toBe(10);
    http.expectOne(r => r.url.includes('/slots/available')).flush([]);
  });

  it('submitReschedule() shows error when no slot selected', () => {
    component.reschedulingId = 10;
    component.selectedNewSlotId = null;
    component.submitReschedule(10);
    expect(component.rescheduleError).toContain('select');
  });

  it('submitReschedule() PATCHes /appointments/{id} with newSlotId (US17 trigger)', fakeAsync(() => {
    component.reschedulingId = 10;
    component.selectedNewSlotId = 55;
    component.submitReschedule(10);

    const req = http.expectOne(r => r.url.includes('/appointments/10') && r.method === 'PATCH');
    expect(req.request.body.newSlotId).toBe(55);
    req.flush(makeAppt(10, 'CONFIRMED'));

    http.expectOne(r => r.url.includes('/appointments/owner')).flush([]);
    expect(component.reschedulingId).toBeNull();
    expect(component.successMsg).toContain('rescheduled');
    expect(component.successMsg).toContain('US17');
    tick(4000);
  }));

  it('cancelReschedule() clears reschedulingId', () => {
    component.reschedulingId = 10;
    component.cancelReschedule();
    expect(component.reschedulingId).toBeNull();
  });

  // ── 8. Notes update ───────────────────────────────────────────────────────

  it('startEditNotes() sets editingNotesId and populates editNotes', () => {
    const appt = { ...makeAppt(3,'CONFIRMED'), notes: 'Check ear infection' };
    component.startEditNotes(appt);
    expect(component.editingNotesId).toBe(3);
    expect(component.editNotes).toBe('Check ear infection');
  });

  it('submitNotes() PATCHes /appointments/{id} with notes (US17 trigger)', fakeAsync(() => {
    component.editingNotesId = 3;
    component.editNotes = 'Follow-up needed';
    component.submitNotes(3);

    const req = http.expectOne(r => r.url.includes('/appointments/3') && r.method === 'PATCH');
    expect(req.request.body.notes).toBe('Follow-up needed');
    req.flush(makeAppt(3, 'CONFIRMED'));

    http.expectOne(r => r.url.includes('/appointments/owner')).flush([]);
    expect(component.editingNotesId).toBeNull();
    expect(component.successMsg).toContain('US17');
    tick(4000);
  }));

  it('cancelEditNotes() clears editingNotesId', () => {
    component.editingNotesId = 3;
    component.cancelEditNotes();
    expect(component.editingNotesId).toBeNull();
  });

  // ── 9. Helpers ────────────────────────────────────────────────────────────

  it('statusLabel returns correct labels', () => {
    expect(component.statusLabel('CONFIRMED')).toBe('Confirmed');
    expect(component.statusLabel('CANCELLED')).toBe('Cancelled');
    expect(component.statusLabel('LATE_CANCELLED')).toBe('Late Cancel');
    expect(component.statusLabel('COMPLETED')).toBe('Completed');
    expect(component.statusLabel('PENDING')).toBe('Pending');
  });

  it('statusClass returns correct CSS classes', () => {
    expect(component.statusClass('CONFIRMED')).toBe('badge-confirmed');
    expect(component.statusClass('CANCELLED')).toBe('badge-cancelled');
    expect(component.statusClass('LATE_CANCELLED')).toBe('badge-late');
    expect(component.statusClass('COMPLETED')).toBe('badge-completed');
  });

  it('formatTime extracts HH:mm from ISO', () => {
    expect(component.formatTime('2026-11-10T14:30:00')).toBe('14:30');
  });
});
