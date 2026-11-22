import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { VetDashboardComponent } from './vet-dashboard.component';
import { Slot } from '../../models/slot.model';
import { APP_CONFIG } from '../../config/app-config';

/** Factory for test slots */
function makeSlot(id: number, status: Slot['status'], startHour = 9): Slot {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  return {
    id,
    vetId: 1,
    vetFullName: 'Dr Test',
    startTime: `${dateStr}T${String(startHour).padStart(2,'0')}:00:00`,
    endTime:   `${dateStr}T${String(startHour).padStart(2,'0')}:30:00`,
    status
  };
}

describe('VetDashboardComponent — US14', () => {
  let component: VetDashboardComponent;
  let fixture: ComponentFixture<VetDashboardComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VetDashboardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture   = TestBed.createComponent(VetDashboardComponent);
    component = fixture.componentInstance;
    http      = TestBed.inject(HttpTestingController);

    // Flush the initial getAllSlots() call from ngOnInit
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/slots')).flush([]);
  });

  afterEach(() => http.verify());

  // ── 1. Load & display ────────────────────────────────────────────────────

  it('should load all slots on init', () => {
    component.loadSlots();
    const slots = [makeSlot(1,'AVAILABLE'), makeSlot(2,'BOOKED'), makeSlot(3,'BLOCKED',10)];
    http.expectOne(r => r.url.includes('/slots')).flush(slots);
    expect(component.slots.length).toBe(3);
  });

  it('should group slots by date', () => {
    component.slots = [makeSlot(1,'AVAILABLE'), makeSlot(2,'BOOKED',10)];
    component.buildGroups();
    expect(component.slotGroups.length).toBe(1); // same day
    expect(component.slotGroups[0].slots.length).toBe(2);
  });

  it('should show error when server is unreachable', () => {
    component.loadSlots();
    http.expectOne(r => r.url.includes('/slots'))
        .error(new ProgressEvent('error'), { status: 0 });
    expect(component.errorMsg).toContain('Cannot reach');
  });

  it('should show error message from server on 500', () => {
    component.loadSlots();
    http.expectOne(r => r.url.includes('/slots'))
        .flush({ message: 'Internal error' }, { status: 500, statusText: 'Error' });
    expect(component.errorMsg).toContain('500');
  });

  // ── 2. Filter ─────────────────────────────────────────────────────────────

  it('setFilter(ALL) shows all slots', () => {
    component.slots = [makeSlot(1,'AVAILABLE'), makeSlot(2,'BOOKED'), makeSlot(3,'BLOCKED',10)];
    component.setFilter('ALL');
    const total = component.slotGroups.reduce((n, g) => n + g.slots.length, 0);
    expect(total).toBe(3);
  });

  it('setFilter(AVAILABLE) shows only AVAILABLE slots', () => {
    component.slots = [makeSlot(1,'AVAILABLE'), makeSlot(2,'BOOKED'), makeSlot(3,'BLOCKED',10)];
    component.setFilter('AVAILABLE');
    const total = component.slotGroups.reduce((n, g) => n + g.slots.length, 0);
    expect(total).toBe(1);
  });

  it('setFilter(BOOKED) shows only BOOKED slots', () => {
    component.slots = [makeSlot(1,'AVAILABLE'), makeSlot(2,'BOOKED'), makeSlot(3,'BLOCKED',10)];
    component.setFilter('BOOKED');
    const total = component.slotGroups.reduce((n, g) => n + g.slots.length, 0);
    expect(total).toBe(1);
  });

  it('setFilter(BLOCKED) shows only BLOCKED slots', () => {
    component.slots = [makeSlot(1,'AVAILABLE'), makeSlot(2,'BOOKED',10), makeSlot(3,'BLOCKED',11)];
    component.setFilter('BLOCKED');
    const total = component.slotGroups.reduce((n, g) => n + g.slots.length, 0);
    expect(total).toBe(1);
  });

  // ── 3. slotCounts ─────────────────────────────────────────────────────────

  it('slotCounts returns correct numbers', () => {
    component.slots = [
      makeSlot(1,'AVAILABLE'), makeSlot(2,'AVAILABLE',10),
      makeSlot(3,'BOOKED',11),
      makeSlot(4,'BLOCKED',12)
    ];
    expect(component.slotCounts['ALL']).toBe(4);
    expect(component.slotCounts['AVAILABLE']).toBe(2);
    expect(component.slotCounts['BOOKED']).toBe(1);
    expect(component.slotCounts['BLOCKED']).toBe(1);
  });

  // ── 4. Add slot form ──────────────────────────────────────────────────────

  it('toggleAddForm() shows and hides the form', () => {
    expect(component.showAddForm).toBeFalse();
    component.toggleAddForm();
    expect(component.showAddForm).toBeTrue();
    component.toggleAddForm();
    expect(component.showAddForm).toBeFalse();
  });

  it('submitNewSlot() shows formError when fields are empty', () => {
    component.newStartDate = '';
    component.newStartTime = '';
    component.newEndTime   = '';
    component.submitNewSlot();
    expect(component.formError).toContain('required');
  });

  it('submitNewSlot() shows formError when end <= start', () => {
    component.newStartDate = '2026-11-10';
    component.newStartTime = '10:00';
    component.newEndTime   = '09:00';
    component.submitNewSlot();
    expect(component.formError).toContain('after start');
  });

  it('submitNewSlot() POSTs to /vets/{vetId}/slots and reloads', fakeAsync(() => {
    component.newStartDate = '2026-11-10';
    component.newStartTime = '09:00';
    component.newEndTime   = '09:30';
    component.submitNewSlot();

    const createReq = http.expectOne(r => r.method === 'POST' && r.url.includes('/slots'));
    expect(createReq.request.body.startTime).toBe('2026-11-10T09:00:00');
    expect(createReq.request.body.endTime).toBe('2026-11-10T09:30:00');
    createReq.flush(makeSlot(99,'AVAILABLE'));

    http.expectOne(r => r.method === 'GET' && r.url.includes('/slots')).flush([]);
    expect(component.showAddForm).toBeFalse();
    expect(component.successMsg).toContain('created');
    tick(4000); // drain the setTimeout that clears successMsg
  }));

  // ── 5. Block slot ─────────────────────────────────────────────────────────

  it('blockSlot() PATCHes /vets/slots/{id}/block', fakeAsync(() => {
    const slot = makeSlot(10, 'AVAILABLE');
    component.blockSlot(slot);

    http.expectOne(r => r.url.includes('/slots/10/block')).flush({...slot, status:'BLOCKED'});
    http.expectOne(r => r.url.includes('/slots')).flush([]);
    expect(component.successMsg).toContain('blocked');
    tick(4000); // drain the setTimeout
  }));

  it('blockSlot() does nothing if slot is BOOKED', () => {
    const slot = makeSlot(10, 'BOOKED');
    component.blockSlot(slot);
    http.expectNone(r => r.url.includes('/block'));
  });

  it('blockSlot() shows error on server 422', fakeAsync(() => {
    const slot = makeSlot(10, 'AVAILABLE');
    component.blockSlot(slot);
    http.expectOne(r => r.url.includes('/block'))
        .flush({ message: 'Slot is BOOKED' }, { status: 422, statusText: 'Unprocessable' });
    expect(component.errorMsg).toContain('Slot is BOOKED');
  }));

  // ── 6. Open slot ──────────────────────────────────────────────────────────

  it('openSlot() PATCHes /vets/slots/{id}/open', fakeAsync(() => {
    const slot = makeSlot(20, 'BLOCKED');
    component.openSlot(slot);

    http.expectOne(r => r.url.includes('/slots/20/open')).flush({...slot, status:'AVAILABLE'});
    http.expectOne(r => r.url.includes('/slots')).flush([]);
    expect(component.successMsg).toContain('opened');
    tick(4000); // drain the setTimeout
  }));

  // ── 7. Helpers ────────────────────────────────────────────────────────────

  it('formatTime extracts HH:mm from ISO', () => {
    expect(component.formatTime('2026-11-10T09:30:00')).toBe('09:30');
  });

  it('statusLabel returns correct labels', () => {
    expect(component.statusLabel('AVAILABLE')).toBe('Available');
    expect(component.statusLabel('BOOKED')).toBe('Booked');
    expect(component.statusLabel('BLOCKED')).toBe('Blocked');
  });

  it('statusClass returns correct CSS classes', () => {
    expect(component.statusClass('AVAILABLE')).toBe('badge-available');
    expect(component.statusClass('BOOKED')).toBe('badge-booked');
    expect(component.statusClass('BLOCKED')).toBe('badge-blocked');
  });

  // ── 8. APP_CONFIG — identifiants temporaires (Option B US01) ─────────────

  it('APP_CONFIG.currentVetId is a positive number (temporary placeholder)', () => {
    expect(APP_CONFIG.currentVetId).toBeGreaterThan(0);
    // TODO (US01): this test will be removed when AuthService is integrated
  });

  it('component.vetId equals APP_CONFIG.currentVetId', () => {
    // Verifies the component reads from APP_CONFIG and not from a literal 1
    expect(component.vetId).toBe(APP_CONFIG.currentVetId);
  });

  it('loadSlots() calls getAllSlots with APP_CONFIG.currentVetId', () => {
    component.loadSlots();
    const req = http.expectOne(r =>
      r.url.includes(`/vets/${APP_CONFIG.currentVetId}/slots`)
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
