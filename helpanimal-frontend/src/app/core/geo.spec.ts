import { distanceMeters, formatDistance, parseCoordinates, timeAgo } from './geo';

describe('geo', () => {
  it('calcule une distance connue (1 degre de latitude, environ 111 km)', () => {
    const d = distanceMeters({ lat: 36, lng: 10 }, { lat: 37, lng: 10 });
    expect(d).toBeGreaterThan(110_000);
    expect(d).toBeLessThan(112_000);
  });

  it('formate les distances', () => {
    expect(formatDistance(420)).toBe('420 m');
    expect(formatDistance(1234)).toBe('1.2 km');
  });

  it('lit les coordonnees saisies a la main', () => {
    expect(parseCoordinates('36.8065, 10.1815')).toEqual({ lat: 36.8065, lng: 10.1815 });
    expect(parseCoordinates('36,8 ; 10,1')).toEqual({ lat: 36.8, lng: 10.1 });
    expect(parseCoordinates('-12 45')).toEqual({ lat: -12, lng: 45 });
  });

  it('refuse les positions invalides', () => {
    expect(parseCoordinates('Tunis')).toBeNull();
    expect(parseCoordinates('120, 10')).toBeNull();
    expect(parseCoordinates('10, 200')).toBeNull();
  });

  it("exprime l'anciennete", () => {
    const now = Date.parse('2026-01-01T12:00:00Z');
    expect(timeAgo('2026-01-01T11:59:50Z', now)).toBe("à l'instant");
    expect(timeAgo('2026-01-01T11:30:00Z', now)).toBe('il y a 30 minutes');
    expect(timeAgo('2026-01-01T09:00:00Z', now)).toBe('il y a 3 heures');
  });
});
