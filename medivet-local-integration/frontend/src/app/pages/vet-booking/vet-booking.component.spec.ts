import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { VetBookingComponent } from './vet-booking.component';
import { Vet, ConsultationType } from '../../models/vet.model';
import { APP_CONFIG } from '../../config/app-config';

/** Builds a minimal Vet fixture for a given specialty. */
function makeVet(id: number, type: ConsultationType, city = 'Tunis'): Vet {
  return {
    id, firstName: 'Dr', lastName: `Vet${id}`,
    email: `vet${id}@test.tn`, clinicName: 'Clinic',
    city, consultationType: type, active: true
  };
}

describe('VetBookingComponent — US13 filters', () => {
  let component: VetBookingComponent;
  let fixture: ComponentFixture<VetBookingComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VetBookingComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture   = TestBed.createComponent(VetBookingComponent);
    component = fixture.componentInstance;
    httpMock  = TestBed.inject(HttpTestingController);

    // Flush the initial loadVets() call triggered by ngOnInit
    fixture.detectChanges();
    httpMock.expectOne((req) => req.url.includes('/api/v1/vets')).flush([]);
  });

  afterEach(() => httpMock.verify());

  // ── 1. Filtres présents ───────────────────────────────────────────────────

  it('should expose all 9 filter entries (ALL + 8 specialties)', () => {
    expect(component.filters.length).toBe(9);
  });

  it('should contain ALL 8 ConsultationType values', () => {
    const types = component.filters.map(f => f.value);
    const expected: (ConsultationType | 'ALL')[] = [
      'ALL', 'GENERAL', 'SURGERY', 'DERMATOLOGY', 'CARDIOLOGY',
      'ORTHOPEDICS', 'OPHTHALMOLOGY', 'DENTISTRY', 'EMERGENCY'
    ];
    expected.forEach(t => expect(types).toContain(t));
  });

  // ── 2. Valeurs envoyées à l'API ───────────────────────────────────────────

  it('should send consultationType=OPHTHALMOLOGY to the API when that filter is selected', () => {
    component.setFilter('OPHTHALMOLOGY');
    const req = httpMock.expectOne(r =>
      r.url.includes('/api/v1/vets') &&
      r.params.get('consultationType') === 'OPHTHALMOLOGY'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should send consultationType=EMERGENCY to the API', () => {
    component.setFilter('EMERGENCY');
    const reqs = httpMock.match(r =>
      r.url.includes('/api/v1/vets') &&
      r.params.get('consultationType') === 'EMERGENCY'
    );
    expect(reqs.length).toBe(1);
    expect(reqs[0].request.method).toBe('GET');
    reqs[0].flush([]);
  });

  it('should send consultationType=ORTHOPEDICS to the API', () => {
    component.setFilter('ORTHOPEDICS');
    const reqs = httpMock.match(r =>
      r.url.includes('/api/v1/vets') &&
      r.params.get('consultationType') === 'ORTHOPEDICS'
    );
    expect(reqs.length).toBe(1);
    reqs[0].flush([]);
  });

  it('should send consultationType=DENTISTRY to the API', () => {
    component.setFilter('DENTISTRY');
    const reqs = httpMock.match(r =>
      r.url.includes('/api/v1/vets') &&
      r.params.get('consultationType') === 'DENTISTRY'
    );
    expect(reqs.length).toBe(1);
    reqs[0].flush([]);
  });

  it('should NOT send consultationType param when filter is ALL', () => {
    component.setFilter('ALL');
    const req = httpMock.expectOne(r => r.url.includes('/api/v1/vets'));
    expect(req.request.params.has('consultationType')).toBeFalse();
    req.flush([]);
  });

  // ── 3. Filtre combiné ville + spécialité ─────────────────────────────────

  it('should send both city and consultationType when both filters are active', () => {
    component.setFilter('CARDIOLOGY');
    httpMock.expectOne(r => r.url.includes('/api/v1/vets')).flush([]);

    component.setCity('Sousse');
    const req = httpMock.expectOne(r =>
      r.params.get('city') === 'Sousse' &&
      r.params.get('consultationType') === 'CARDIOLOGY'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should NOT send city param when "All Cities" is selected', () => {
    component.setCity('All Cities');
    const req = httpMock.expectOne(r => r.url.includes('/api/v1/vets'));
    expect(req.request.params.has('city')).toBeFalse();
    req.flush([]);
  });

  // ── 4. applyFilter — filtre local côté client ────────────────────────────

  it('applyFilter() shows only vets matching the active ConsultationType', () => {
    component.vets = [
      makeVet(1, 'GENERAL'),
      makeVet(2, 'OPHTHALMOLOGY'),
      makeVet(3, 'EMERGENCY'),
    ];
    component.activeFilter = 'OPHTHALMOLOGY';
    component.applyFilter();
    expect(component.filteredVets.length).toBe(1);
    expect(component.filteredVets[0].consultationType).toBe('OPHTHALMOLOGY');
  });

  it('applyFilter() shows all vets when filter is ALL', () => {
    component.vets = [
      makeVet(1, 'GENERAL'),
      makeVet(2, 'OPHTHALMOLOGY'),
      makeVet(3, 'DENTISTRY'),
    ];
    component.activeFilter = 'ALL';
    component.applyFilter();
    expect(component.filteredVets.length).toBe(3);
  });

  it('applyFilter() combines city and specialty correctly', () => {
    component.vets = [
      makeVet(1, 'EMERGENCY', 'Tunis'),
      makeVet(2, 'EMERGENCY', 'Sfax'),
      makeVet(3, 'GENERAL',   'Tunis'),
    ];
    component.activeFilter = 'EMERGENCY';
    component.selectedCity = 'Tunis';
    component.applyFilter();
    expect(component.filteredVets.length).toBe(1);
    expect(component.filteredVets[0].city).toBe('Tunis');
  });

  it('applyFilter() shows empty list when no vet matches', () => {
    component.vets = [makeVet(1, 'GENERAL')];
    component.activeFilter = 'ORTHOPEDICS';
    component.applyFilter();
    expect(component.filteredVets.length).toBe(0);
  });

  // ── 5. getSpecialtyLabel — libellés des nouvelles spécialités ────────────

  it('getSpecialtyLabel returns correct label for OPHTHALMOLOGY', () => {
    expect(component.getSpecialtyLabel('OPHTHALMOLOGY')).toBe('Ophthalmologist');
  });

  it('getSpecialtyLabel returns correct label for EMERGENCY', () => {
    expect(component.getSpecialtyLabel('EMERGENCY')).toBe('Emergency Vet');
  });

  it('getSpecialtyLabel returns correct label for ORTHOPEDICS', () => {
    expect(component.getSpecialtyLabel('ORTHOPEDICS')).toBe('Orthopedist');
  });

  it('getSpecialtyLabel returns correct label for DENTISTRY', () => {
    expect(component.getSpecialtyLabel('DENTISTRY')).toBe('Dentist');
  });

  // ── 6. cities contient Bizerte ────────────────────────────────────────────

  it('cities list should include Bizerte (present in DB seed)', () => {
    expect(component.cities).toContain('Bizerte');
  });

  it('cities list should contain exactly 6 entries', () => {
    expect(component.cities.length).toBe(6); // All Cities + 5 cities
  });

  // ── 7. APP_CONFIG — identifiants temporaires (Option B US01) ─────────────

  it('APP_CONFIG.currentUserId is a positive number (temporary placeholder)', () => {
    expect(APP_CONFIG.currentUserId).toBeGreaterThan(0);
    // TODO (US01): this test will be removed when AuthService is integrated
  });

  it('confirmBooking() uses APP_CONFIG.currentUserId as ownerId', () => {
    // Verify the component reads from APP_CONFIG and not from a literal 1
    component.selectedVet = makeVet(1, 'GENERAL');

    // Simulate a selected slot
    (component as any).selectedSlot = {
      id: 42, vetId: 1, vetFullName: 'Dr Test',
      startTime: '2026-11-10T09:00:00', endTime: '2026-11-10T09:30:00',
      status: 'AVAILABLE' as const
    };

    component.confirmBooking();

    const req = httpMock.expectOne(r => r.url.includes('/appointments'));
    expect(req.request.body.ownerId).toBe(APP_CONFIG.currentUserId);
    req.flush({ id: 1 });

    // Flush the slot reload
    httpMock.expectOne(r => r.url.includes('/slots')).flush([]);
  });
});
