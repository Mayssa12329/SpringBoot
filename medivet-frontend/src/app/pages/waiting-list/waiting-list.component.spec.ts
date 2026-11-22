import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { WaitingListComponent } from './waiting-list.component';
import { WaitingListEntry, WaitingListStatus } from '../../models/waiting-list.model';
import { APP_CONFIG } from '../../config/app-config';
import { routes } from '../../app.routes';

function makeEntry(id: number, status: WaitingListStatus, offerExpiresAt?: string): WaitingListEntry {
  return {
    id, slotId: id * 10, slotStartTime: '2026-11-10T09:00:00',
    vetId: 1, vetFullName: 'Dr Sarah Ben Ali',
    ownerId: APP_CONFIG.currentUserId,
    consultationType: 'GENERAL', status,
    registeredAt: '2026-11-01T10:00:00',
    offerExpiresAt
  };
}

describe('WaitingListComponent — US18', () => {
  let component: WaitingListComponent;
  let fixture: ComponentFixture<WaitingListComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaitingListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(routes)
      ]
    }).compileComponents();

    fixture   = TestBed.createComponent(WaitingListComponent);
    component = fixture.componentInstance;
    http      = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
    http.expectOne(r => r.url.includes(`/waiting-list/owner/${APP_CONFIG.currentUserId}`)).flush([]);
  });

  afterEach(() => http.verify());

  // ── 1. APP_CONFIG ─────────────────────────────────────────────────────────

  it('ownerId comes from APP_CONFIG.currentUserId (not hardcoded)', () => {
    expect(component.ownerId).toBe(APP_CONFIG.currentUserId);
  });

  it('loadEntries() calls GET /waiting-list/owner/{currentUserId}', () => {
    component.loadEntries();
    const req = http.expectOne(r =>
      r.url.includes(`/waiting-list/owner/${APP_CONFIG.currentUserId}`)
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  // ── 2. Load ───────────────────────────────────────────────────────────────

  it('loads entries and sorts OFFERED first', () => {
    component.loadEntries();
    const data = [makeEntry(1,'WAITING'), makeEntry(2,'OFFERED')];
    http.expectOne(r => r.url.includes('/waiting-list/owner')).flush(data);
    expect(component.entries[0].status).toBe('OFFERED');
    expect(component.entries[1].status).toBe('WAITING');
  });

  it('shows error when server unreachable', () => {
    component.loadEntries();
    http.expectOne(r => r.url.includes('/waiting-list/owner'))
        .error(new ProgressEvent('error'), { status: 0 });
    expect(component.errorMsg).toContain('Cannot reach');
  });

  // ── 3. statusLabel / statusClass ──────────────────────────────────────────

  it('statusLabel returns correct labels', () => {
    expect(component.statusLabel('WAITING')).toBe('Waiting');
    expect(component.statusLabel('OFFERED')).toBe('Offer Available!');
    expect(component.statusLabel('ACCEPTED')).toBe('Accepted');
    expect(component.statusLabel('EXPIRED')).toBe('Expired');
    expect(component.statusLabel('CANCELLED')).toBe('Cancelled');
  });

  it('statusClass returns correct CSS classes', () => {
    expect(component.statusClass('WAITING')).toBe('badge-waiting');
    expect(component.statusClass('OFFERED')).toBe('badge-offered');
    expect(component.statusClass('ACCEPTED')).toBe('badge-accepted');
    expect(component.statusClass('EXPIRED')).toBe('badge-expired');
    expect(component.statusClass('CANCELLED')).toBe('badge-cancelled');
  });

  // ── 4. isActionable ───────────────────────────────────────────────────────

  it('isActionable returns true for WAITING', () => {
    expect(component.isActionable(makeEntry(1,'WAITING'))).toBeTrue();
  });

  it('isActionable returns true for OFFERED', () => {
    expect(component.isActionable(makeEntry(1,'OFFERED'))).toBeTrue();
  });

  it('isActionable returns false for ACCEPTED', () => {
    expect(component.isActionable(makeEntry(1,'ACCEPTED'))).toBeFalse();
  });

  it('isActionable returns false for EXPIRED', () => {
    expect(component.isActionable(makeEntry(1,'EXPIRED'))).toBeFalse();
  });

  // ── 5. minutesRemaining ───────────────────────────────────────────────────

  it('minutesRemaining returns null for WAITING (no offer expiry)', () => {
    const entry = makeEntry(1,'WAITING');
    expect(component.minutesRemaining(entry)).toBeNull();
  });

  it('minutesRemaining returns positive number for active OFFERED', () => {
    const future = new Date(Date.now() + 20 * 60_000).toISOString();
    const entry = makeEntry(1,'OFFERED', future);
    const mins = component.minutesRemaining(entry);
    expect(mins).not.toBeNull();
    expect(mins!).toBeGreaterThan(0);
    expect(mins!).toBeLessThanOrEqual(20);
  });

  it('minutesRemaining returns 0 for expired OFFERED', () => {
    const past = new Date(Date.now() - 5000).toISOString();
    const entry = makeEntry(1,'OFFERED', past);
    expect(component.minutesRemaining(entry)).toBe(0);
  });

  // ── 6. isOfferExpired ─────────────────────────────────────────────────────

  it('isOfferExpired returns false for future expiry', () => {
    const future = new Date(Date.now() + 10 * 60_000).toISOString();
    expect(component.isOfferExpired(makeEntry(1,'OFFERED', future))).toBeFalse();
  });

  it('isOfferExpired returns true for past expiry', () => {
    const past = new Date(Date.now() - 5000).toISOString();
    expect(component.isOfferExpired(makeEntry(1,'OFFERED', past))).toBeTrue();
  });

  // ── 7. Accept offer — creates appointment + US17 ──────────────────────────

  it('acceptOffer() PATCHes /waiting-list/{id}/accept', fakeAsync(() => {
    const entry = makeEntry(5,'OFFERED', new Date(Date.now() + 10*60_000).toISOString());
    component.acceptOffer(entry);

    const req = http.expectOne(r => r.url.includes('/waiting-list/5/accept') && r.method === 'PATCH');
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...entry, status: 'ACCEPTED' });

    http.expectOne(r => r.url.includes('/waiting-list/owner')).flush([]);
    expect(component.successMsg).toContain('CONFIRMED');
    expect(component.successMsg).toContain('US17');
    tick(5000); // drain setTimeout
  }));

  it('acceptOffer() shows 422 error when offer expired on server', () => {
    const entry = makeEntry(5,'OFFERED');
    component.acceptOffer(entry);
    http.expectOne(r => r.url.includes('/waiting-list/5/accept'))
        .flush({ message: 'The offer for entry 5 has expired.' },
               { status: 422, statusText: 'Unprocessable' });
    expect(component.errorMsg).toContain('expired');
  });

  // ── 8. Cancel entry ───────────────────────────────────────────────────────

  it('cancelEntry() PATCHes /waiting-list/{id}/cancel', fakeAsync(() => {
    const entry = makeEntry(3,'WAITING');
    component.cancelEntry(entry);

    http.expectOne(r => r.url.includes('/waiting-list/3/cancel')).flush({ ...entry, status: 'CANCELLED' });
    http.expectOne(r => r.url.includes('/waiting-list/owner')).flush([]);
    expect(component.successMsg).toContain('cancelled');
    tick(5000);
  }));

  it('cancelEntry() shows error on server failure', () => {
    const entry = makeEntry(3,'WAITING');
    component.cancelEntry(entry);
    http.expectOne(r => r.url.includes('/waiting-list/3/cancel'))
        .flush({ message: 'Already accepted' }, { status: 422, statusText: 'Error' });
    expect(component.errorMsg).toContain('Already accepted');
  });

  // ── 9. Helpers ────────────────────────────────────────────────────────────

  it('dismissError() clears errorMsg', () => {
    component.errorMsg = 'some error';
    component.dismissError();
    expect(component.errorMsg).toBe('');
  });

  it('formatDateTime returns a non-empty string', () => {
    const result = component.formatDateTime('2026-11-10T09:00:00');
    expect(result.length).toBeGreaterThan(5);
  });
});
